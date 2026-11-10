// StrategyOS 3.1 — Motor de Base, Cruzamento e Segmentação WhatsApp (MAX_LINES <= 350)
// A geração de textos em 2 etapas vive em js/ia-recaptura-copy.js (IARecapturaCopy).

const IARecapturaMotor = {
    LINK_GRUPO_PADRAO: 'https://chat.whatsapp.com/FcuY7wDt7u3F1LusMdlko9',

    normalizarTexto(txt) {
        return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    },

    limparTelefone(tel) {
        const num = String(tel || '').replace(/\D/g, '');
        if (num.length < 10 || /(\d)\1{6,}/.test(num)) return '';
        return num.startsWith('55') ? num : '55' + num;
    },

    nomeEhGenerico(nomeRaw) {
        const n = this.normalizarTexto(nomeRaw).replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
        if (!n || n.length < 2) return true;
        return /^(consumidor geral|cliente loja|nao identificado|cliente|avulso|cliente b|çliente b|menina do.*|rapaz do.*|mãe de.*|mae de.*)$/i.test(n);
    },

    extrairPrimeiroNome(nomeRaw) {
        if (this.nomeEhGenerico(nomeRaw)) return '';
        const limpo = String(nomeRaw || '').replace(/\d+/g, '').trim();
        const primeira = limpo.split(/\s+/)[0] || '';
        if (!primeira || primeira.length < 2 || this.nomeEhGenerico(primeira)) return '';
        return primeira.charAt(0).toUpperCase() + primeira.slice(1).toLowerCase();
    },

    escolherMelhorNome(atual, novo) {
        const a = String(atual || '').replace(/\d{5,}/g, '').trim();
        const b = String(novo || '').replace(/\d{5,}/g, '').trim();
        if (!b || this.nomeEhGenerico(b)) return a || 'Cliente Loja';
        if (!a || this.nomeEhGenerico(a)) return b;
        return b.length > a.length ? b : a;
    },

    ehItemFogos(txtNorm) {
        return /\b(fogo|fogos|foguete|giranda|girandola|bomba|chuvinha|12\s*x\s*1|12\s*por|19\s*x\s*4|19\s*por|468)\b/i.test(txtNorm);
    },

    ehItemAcessorio(txtNorm) {
        return /\b(pelicula|capa|capinha|cabo|fonte|carregador|fone|chip|adaptador|suporte|smartwatch|relogio|caixa\s*de\s*som|basike|gimbal|air\s*max|battery|adesivo)\b/i.test(txtNorm);
    },

    ehItemAssistencia(txtNorm) {
        return /^os\s*#/i.test(txtNorm) || /\b(manutencao|manutecao|conserto|concerto|troca\s*(de)?\s*tela|trocar\s*tela|tela|display|diagnostico|bateria|conector|software|formatacao|fomatacao|avaliacao|limpeza|sensor|recolagem|tela\s*2|segunda\s*linha|botao)\b/i.test(txtNorm);
    },

    ehCompraCelular(txtNorm, valor = 0) {
        if (this.ehItemFogos(txtNorm) || this.ehItemAcessorio(txtNorm) || this.ehItemAssistencia(txtNorm)) return false;
        if (/\b(aparelho\s*celular|iphone|redmi|xiaomi|realme|samsung|moto\s*g|moto\s*e|motorola|poco|infinix|galaxy|note\s*\d+|a0\d|a1\d|a2\d|a3\d|a5\d)\b/i.test(txtNorm)) return true;
        return valor >= 450;
    },

    resumirPerfilHistorico(cli) {
        const itens = [...cli.compras, ...cli.osList];
        const ultimo = itens.slice().reverse().find(x => String(x.produto || x.modelo || x.servico || '').trim());
        if (!ultimo) return 'Cadastro sem compras registradas';
        const bruto = String(ultimo.produto || `${ultimo.modelo || ''} ${ultimo.servico || ''}`).trim();
        const limpo = window.IARecapturaCopy
            ? IARecapturaCopy.limparTextoSeguro(bruto)
            : bruto.replace(/^(avulso|venda avulsa):\s*/i, '').replace(/\(\d+\s*itens?\)$/i, '').replace(/\s+/g, ' ').trim();
        return limpo.length > 48 ? limpo.substring(0, 45) + '...' : limpo || 'Atendimento na Loja';
    },

    detectarFormaCompra(cli) {
        const todos = [...cli.compras, ...cli.osList];
        if (todos.some(x => x.formaTag === 'troca')) return 'troca';
        if (todos.some(x => x.formaTag === 'combinado')) return 'combinado';
        if (todos.some(x => x.formaTag === 'entrada')) return 'entrada';
        if (todos.length > 0 && todos.every(x => x.ehOrcamento)) return 'orcamento';
        return 'balcao';
    },

    classificarSegmento(cli) {
        const osPronta = cli.osList.find(o => o.status === 'pronto');
        const textosCompras = cli.compras.map(x => this.normalizarTexto(x.produto)).filter(Boolean);
        const textosOS = cli.osList.map(o => this.normalizarTexto(`OS #${o.numero || ''} ${o.modelo || ''} ${o.servico || ''}`)).filter(Boolean);
        const todosTextos = [...textosCompras, ...textosOS];
        const mencionaIphone = todosTextos.some(t => /\b(iphone|magsafe)\b/i.test(t));

        const todosOrc = cli.compras.length > 0 && cli.osList.length === 0 && cli.compras.every(x => x.ehOrcamento);
        const itemOrcTroca = cli.compras.find(x => x.formaTag === 'troca' && x.ehOrcamento);

        if (osPronta) {
            return {
                categoria: 'os_pronta',
                subPerfil: mencionaIphone ? 'iphone' : 'padrao',
                badge: `🚨 OS #${osPronta.numero} Pronta p/ Retirar`,
                corBadge: '#ef4444',
                prioridade: 1,
                ehOrcamentoPendente: false,
                osPronta
            };
        }

        const ehFogos = todosTextos.length > 0 && todosTextos.every(t => this.ehItemFogos(t));
        if (ehFogos) {
            return {
                categoria: 'fogos',
                subPerfil: 'fogos',
                badge: '🎇 Cliente Fogos & Eventos',
                corBadge: '#f59e0b',
                prioridade: 5,
                ehOrcamentoPendente: false,
                osPronta: null
            };
        }

        if (todosOrc) {
            return {
                categoria: itemOrcTroca ? 'celular' : 'assistencia',
                subPerfil: itemOrcTroca ? 'orcamento_troca' : 'orcamento_conserto',
                badge: itemOrcTroca ? '🔄 Orçamento de Troca' : '📝 Orçamento na Bancada',
                corBadge: '#0ea5e9',
                prioridade: 3,
                ehOrcamentoPendente: true,
                orcamentoDetalhe: itemOrcTroca?.produto || '',
                osPronta: null
            };
        }

        const comprouCelular = cli.compras.some(c => this.ehCompraCelular(this.normalizarTexto(c.produto), c.valor));
        if (comprouCelular) {
            return {
                categoria: 'celular',
                subPerfil: mencionaIphone ? 'iphone' : 'android',
                badge: mencionaIphone ? '🍎 Cliente iPhone (Pós-Venda)' : '📱 Comprou Celular (Pós-Venda)',
                corBadge: '#10b981',
                prioridade: 2,
                ehOrcamentoPendente: false,
                osPronta: null
            };
        }

        const fezAssistencia = cli.osList.length > 0 || textosCompras.some(t => this.ehItemAssistencia(t));
        if (fezAssistencia) {
            return {
                categoria: 'assistencia',
                subPerfil: mencionaIphone ? 'iphone' : 'padrao',
                badge: '🔧 Assistência / Manutenção',
                corBadge: '#3b82f6',
                prioridade: 3,
                ehOrcamentoPendente: false,
                osPronta: null
            };
        }

        if (todosTextos.length > 0) {
            return {
                categoria: 'acessorio',
                subPerfil: mencionaIphone ? 'iphone' : 'padrao',
                badge: mencionaIphone ? '🛍️ Acessórios iPhone / Capas' : '🛍️ Acessórios & Películas',
                corBadge: '#a855f7',
                prioridade: 4,
                ehOrcamentoPendente: false,
                osPronta: null
            };
        }

        return {
            categoria: 'sem_historico',
            subPerfil: 'padrao',
            badge: '📝 Cadastro s/ Compra Registrada',
            corBadge: '#64748b',
            prioridade: 6,
            ehOrcamentoPendente: false,
            osPronta: null
        };
    },

    construirBaseCompleta(d, getEnviadosFn, etapaAtual, linkCustom) {
        const mapa = new Map();
        const nomeParaTel = new Map();
        const semTelefoneDetalhes = [];
        const nomesVendasSemTel = new Set();

        const registrar = (nomeRaw, telRaw, itemHist) => {
            const telLimpo = this.limparTelefone(telRaw);
            if (!telLimpo) return false;
            const nomeLimp = window.IARecapturaCopy ? IARecapturaCopy.limparTextoSeguro(nomeRaw) : String(nomeRaw || '');
            if (!mapa.has(telLimpo)) {
                mapa.set(telLimpo, {
                    key: telLimpo,
                    nome: nomeLimp.replace(/\d{5,}/g, '').trim() || 'Cliente Loja',
                    primeiroNome: this.extrairPrimeiroNome(nomeLimp),
                    telefone: String(telRaw || '').trim(),
                    telWhatsApp: telLimpo,
                    compras: [],
                    osList: [],
                    totalGasto: 0,
                    ultimaData: '2025-01-01'
                });
            }
            const cli = mapa.get(telLimpo);
            cli.nome = this.escolherMelhorNome(cli.nome, nomeLimp);
            cli.primeiroNome = this.extrairPrimeiroNome(cli.nome);

            if (itemHist) {
                const assinatura = `${itemHist.data || ''}_${this.normalizarTexto(itemHist.produto || itemHist.modelo).substring(0, 24)}_${Math.round(itemHist.valor || 0)}`;
                const jaTem = [...cli.compras, ...cli.osList].some(x => x._sig === assinatura);
                if (!jaTem) {
                    itemHist._sig = assinatura;
                    if (itemHist.origem === 'os') cli.osList.push(itemHist);
                    else cli.compras.push(itemHist);
                    cli.totalGasto += parseFloat(itemHist.valor || 0);
                    if (itemHist.data && itemHist.data > cli.ultimaData) cli.ultimaData = itemHist.data;
                }
            }
            return true;
        };

        (d.clientes || []).forEach(c => {
            const telOk = this.limparTelefone(c.telefone);
            const nNorm = this.normalizarTexto(c.nome);
            if (!telOk) {
                if (!this.nomeEhGenerico(c.nome)) semTelefoneDetalhes.push({ nome: c.nome, telAtual: c.telefone || 'Sem número', origem: 'Cadastro de Clientes' });
                return;
            }
            if (nNorm && !this.nomeEhGenerico(c.nome)) nomeParaTel.set(nNorm, telOk);
            const hist = Array.isArray(c.historico) ? c.historico : [];
            if (hist.length === 0) registrar(c.nome, c.telefone, null);
            else hist.forEach(h => {
                const descDet = h.detalhes ? `${h.detalhes.aparelho || ''} ${h.detalhes.servico || ''}`.trim() : '';
                const descOrcTroca = (h.celularUsado || h.produtoNovo) ? `${h.celularUsado || ''} pro ${h.produtoNovo || ''}`.trim() : '';
                const prodRaw = String(h.produtoNovo || h.produto || descDet || `${h.modelo || ''} ${h.servico || ''}`).trim();
                const ehOrc = String(h.tipo || '').startsWith('orcamento') || String(h.status || '').includes('nao_finalizado');
                const formaTag = (h.celularUsado || h.tipo === 'orcamento_troca') ? 'troca'
                    : (h.entrada > 0 && h.restante > 0) ? 'entrada'
                    : (String(h.produto || '').includes(' + ') ? 'combinado' : '');
                registrar(c.nome, c.telefone, {
                    origem: 'compra',
                    data: String(h.data || c.dataCadastro || '2026-01-01').substring(0, 10),
                    produto: (ehOrc && descOrcTroca) ? descOrcTroca : prodRaw,
                    valor: parseFloat(h.valor || h.clientePagou || h.detalhes?.valor_orcado || 0),
                    ehOrcamento: ehOrc,
                    formaTag
                });
            });
        });

        (d.assistencia?.ordensServico || []).forEach(os => {
            const telDireto = this.limparTelefone(os.telefone);
            const telCruzado = telDireto || nomeParaTel.get(this.normalizarTexto(os.cliente)) || '';
            if (!telCruzado) {
                if (os.cliente && !this.nomeEhGenerico(os.cliente)) semTelefoneDetalhes.push({ nome: `${os.cliente} (OS #${os.numero})`, telAtual: os.telefone || 'Sem número', origem: 'Ordem de Serviço' });
                return;
            }
            registrar(os.cliente || 'Cliente OS', os.telefone || telCruzado, {
                origem: 'os',
                numero: os.numero,
                status: os.status,
                data: String(os.dataCriacao || '2026-08-01').substring(0, 10),
                modelo: String(os.modelo || '').trim(),
                servico: String(os.servico || '').split('\n')[0].trim(),
                valor: parseFloat(os.valorFinal || os.preco || 0),
                formaTag: (os.valorSinal > 0 && os.valorSinal < (os.valorFinal || os.preco || 0)) ? 'entrada' : ''
            });
        });

        (d.historico?.vendas || []).forEach(v => {
            const cliNome = String(v.cliente || '').trim();
            if (!cliNome || this.nomeEhGenerico(cliNome)) return;
            const telVenda = this.limparTelefone(v.telefone) || nomeParaTel.get(this.normalizarTexto(cliNome)) || '';
            if (!telVenda) { nomesVendasSemTel.add(cliNome); return; }
            const formaTag = (v.pagamentoCombinado || v.pagamentoDivisao || String(v.produto || '').includes(' + ')) ? 'combinado'
                : (v.valorEntrada > 0 && v.valorRestante > 0) ? 'entrada' : '';
            registrar(cliNome, v.telefone || telVenda, {
                origem: 'compra',
                data: String(v.data || '2026-01-01').substring(0, 10),
                produto: String(v.produto || '').trim(),
                valor: parseFloat(v.valorVenda || v.liquido || v.valorBruto || v.valor || 0),
                formaTag
            });
        });

        const hojeMs = Date.now();
        const enviadosHoje = typeof getEnviadosFn === 'function' ? getEnviadosFn() : {};
        const lista = [];
        let idx = 0;

        mapa.forEach(cli => {
            idx++;
            cli.formaCompra = this.detectarFormaCompra(cli);
            const seg = this.classificarSegmento(cli);
            cli.ultimoResumo = this.resumirPerfilHistorico(cli);
            const msgQuebraGelo = this.gerarMsgQuebraGelo(cli, idx, seg);
            const msgOfertaGrupo = this.gerarMsgOfertaGrupo(cli, seg, linkCustom);

            lista.push({
                ...cli,
                diasSemVir: Math.max(1, Math.floor((hojeMs - new Date(cli.ultimaData).getTime()) / 86400000)),
                ...seg,
                msgQuebraGelo,
                msgOfertaGrupo,
                mensagem: etapaAtual === 'oferta_grupo' ? msgOfertaGrupo : msgQuebraGelo,
                enviadoHoje: Boolean(enviadosHoje[cli.key])
            });
        });

        lista.sort((a, b) => (a.enviadoHoje !== b.enviadoHoje) ? (a.enviadoHoje ? 1 : -1) : (a.prioridade !== b.prioridade ? a.prioridade - b.prioridade : b.totalGasto - a.totalGasto));

        return {
            lista,
            resumo: { totalWhatsAppValido: lista.length, semTelefoneCadastros: semTelefoneDetalhes.length, nomesVendasSemCadastro: nomesVendasSemTel.size, semTelefoneDetalhes: semTelefoneDetalhes.slice(0, 60) }
        };
    },

    gerarMsgQuebraGelo(cli, idx, seg) {
        if (window.IARecapturaCopy) return IARecapturaCopy.gerarPrimeiraMsg(cli, idx, seg, this.normalizarTexto.bind(this));
        const nomeSp = cli.primeiroNome ? ` *${cli.primeiroNome}*` : '';
        return `Oi${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando pra saber se deu tudo certo com a sua compra e o atendimento aqui na loja.`;
    },

    gerarMsgOfertaGrupo(cli, seg, linkCustom) {
        if (window.IARecapturaCopy) return IARecapturaCopy.gerarSegundaMsgGrupo(cli, seg, linkCustom);
        const link = linkCustom || this.LINK_GRUPO_PADRAO;
        return `Que bom saber disso! 🙌 Quero te convidar pro nosso *Grupo VIP da Cesinha Acessórios* com as ofertas da *Black Cesinha*: ${link}`;
    },

    montarPromptGemini(cli, etapa, msgBase, linkGrupo) {
        if (window.IARecapturaCopy) return IARecapturaCopy.montarPromptGemini(cli, etapa, msgBase, linkGrupo);
        return `Melhore de forma curta e humana para WhatsApp sem citar códigos internos:\n${msgBase}`;
    }
};

window.IARecapturaMotor = IARecapturaMotor;
