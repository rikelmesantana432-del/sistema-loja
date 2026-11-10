// StrategyOS 3.1 — Motor de Segmentação e Copy Black Cesinha (Recaptura 2 Etapas Anti-Ban)
// Separa lógica de base/mensagens da camada de UI (MAX_LINES <= 350).

const IARecapturaMotor = {
    LINK_GRUPO_PADRAO: 'https://chat.whatsapp.com/FcuY7wDt7u3F1LusMdlko9',

    normalizarTexto(txt) {
        return String(txt || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
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
        return /^os\s*#/i.test(txtNorm) || /\b(manutencao|manutecao|conserto|concerto|troca\s*(de)?\s*tela|trocar\s*tela|bateria|conector|software|formatacao|fomatacao|avaliacao|limpeza|sensor|recolagem|tela\s*2|segunda\s*linha)\b/i.test(txtNorm);
    },

    ehCompraCelular(txtNorm, valor = 0) {
        if (this.ehItemFogos(txtNorm) || this.ehItemAcessorio(txtNorm) || this.ehItemAssistencia(txtNorm)) return false;
        if (/\b(aparelho\s*celular|iphone|redmi|xiaomi|realme|samsung|moto\s*g|moto\s*e|motorola|poco|infinix|galaxy|note\s*\d+|a0\d|a1\d|a2\d|a3\d|a5\d)\b/i.test(txtNorm)) {
            return true;
        }
        return valor >= 450;
    },

    resumirPerfilHistorico(cli) {
        const itens = [...cli.compras, ...cli.osList];
        const ultimo = itens.slice().reverse().find(x => String(x.produto || x.modelo || x.servico || '').trim());
        if (!ultimo) return 'Cadastro sem compras registradas';
        const bruto = String(ultimo.produto || `${ultimo.modelo || ''} ${ultimo.servico || ''}`).trim();
        const limpo = bruto.replace(/^(avulso|venda avulsa):\s*/i, '').replace(/\(\d+\s*itens?\)$/i, '').replace(/\s+/g, ' ').trim();
        return limpo.length > 48 ? limpo.substring(0, 45) + '...' : limpo || 'Cliente da Loja';
    },

    classificarSegmento(cli) {
        const osPronta = cli.osList.find(o => o.status === 'pronto');
        const textosCompras = cli.compras.map(x => this.normalizarTexto(x.produto)).filter(Boolean);
        const textosOS = cli.osList.map(o => this.normalizarTexto(`OS #${o.numero || ''} ${o.modelo || ''} ${o.servico || ''}`)).filter(Boolean);
        const todosTextos = [...textosCompras, ...textosOS];
        const mencionaIphone = todosTextos.some(t => /\b(iphone|magsafe)\b/i.test(t));

        if (osPronta) {
            return {
                categoria: 'os_pronta',
                subPerfil: mencionaIphone ? 'iphone' : 'padrao',
                badge: `🚨 OS #${osPronta.numero} Pronta p/ Retirar`,
                corBadge: '#ef4444',
                prioridade: 1,
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
                osPronta: null
            };
        }

        const comprouCelular = cli.compras.some(c => this.ehCompraCelular(this.normalizarTexto(c.produto), c.valor));
        if (comprouCelular) {
            return {
                categoria: 'celular',
                subPerfil: mencionaIphone ? 'iphone' : 'android',
                badge: mencionaIphone ? '🍎 Cliente iPhone (Troca Black)' : '📱 Comprou Celular (Troca Black)',
                corBadge: '#10b981',
                prioridade: 2,
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
                osPronta: null
            };
        }

        return {
            categoria: 'sem_historico',
            subPerfil: 'padrao',
            badge: '📝 Cadastro s/ Compra Registrada',
            corBadge: '#64748b',
            prioridade: 6,
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
            if (!mapa.has(telLimpo)) {
                mapa.set(telLimpo, {
                    key: telLimpo,
                    nome: String(nomeRaw || 'Cliente Loja').replace(/\d{5,}/g, '').trim() || 'Cliente Loja',
                    primeiroNome: this.extrairPrimeiroNome(nomeRaw),
                    telefone: String(telRaw || '').trim(),
                    telWhatsApp: telLimpo,
                    compras: [],
                    osList: [],
                    totalGasto: 0,
                    ultimaData: '2025-01-01'
                });
            }
            const cli = mapa.get(telLimpo);
            cli.nome = this.escolherMelhorNome(cli.nome, nomeRaw);
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
                registrar(c.nome, c.telefone, { origem: 'compra', data: String(h.data || c.dataCadastro || '2026-01-01').substring(0, 10), produto: String(h.produtoNovo || h.produto || descDet || '').trim(), valor: parseFloat(h.valor || h.clientePagou || h.detalhes?.valor_orcado || 0) });
            });
        });

        (d.assistencia?.ordensServico || []).forEach(os => {
            const telDireto = this.limparTelefone(os.telefone);
            const telCruzado = telDireto || nomeParaTel.get(this.normalizarTexto(os.cliente)) || '';
            if (!telCruzado) {
                if (os.cliente && !this.nomeEhGenerico(os.cliente)) {
                    semTelefoneDetalhes.push({ nome: `${os.cliente} (OS #${os.numero})`, telAtual: os.telefone || 'Sem número', origem: 'Ordem de Serviço' });
                }
                return;
            }
            registrar(os.cliente || 'Cliente OS', os.telefone || telCruzado, {
                origem: 'os',
                numero: os.numero,
                status: os.status,
                data: String(os.dataCriacao || '2026-08-01').substring(0, 10),
                modelo: String(os.modelo || '').trim(),
                servico: String(os.servico || '').split('\n')[0].trim(),
                valor: parseFloat(os.valorFinal || os.preco || 0)
            });
        });

        (d.historico?.vendas || []).forEach(v => {
            const cliNome = String(v.cliente || '').trim();
            if (!cliNome || this.nomeEhGenerico(cliNome)) return;
            const telVenda = this.limparTelefone(v.telefone) || nomeParaTel.get(this.normalizarTexto(cliNome)) || '';
            if (!telVenda) {
                nomesVendasSemTel.add(cliNome);
                return;
            }
            registrar(cliNome, v.telefone || telVenda, {
                origem: 'compra',
                data: String(v.data || '2026-01-01').substring(0, 10),
                produto: String(v.produto || '').trim(),
                valor: parseFloat(v.valorVenda || v.liquido || v.valorBruto || v.valor || 0)
            });
        });

        const hojeMs = Date.now();
        const enviadosHoje = typeof getEnviadosFn === 'function' ? getEnviadosFn() : {};
        const lista = [];
        let idx = 0;

        mapa.forEach(cli => {
            idx++;
            const diasSemVir = Math.max(1, Math.floor((hojeMs - new Date(cli.ultimaData).getTime()) / 86400000));
            const seg = this.classificarSegmento(cli);
            const msgQuebraGelo = this.gerarMsgQuebraGelo(cli, idx, seg);
            const msgOfertaGrupo = this.gerarMsgOfertaGrupo(cli, seg, linkCustom);

            lista.push({
                ...cli,
                diasSemVir,
                ...seg,
                ultimoResumo: this.resumirPerfilHistorico(cli),
                msgQuebraGelo,
                msgOfertaGrupo,
                mensagem: etapaAtual === 'oferta_grupo' ? msgOfertaGrupo : msgQuebraGelo,
                enviadoHoje: Boolean(enviadosHoje[cli.key])
            });
        });

        lista.sort((a, b) => {
            if (a.enviadoHoje !== b.enviadoHoje) return a.enviadoHoje ? 1 : -1;
            if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
            return b.totalGasto - a.totalGasto;
        });

        return {
            lista,
            resumo: {
                totalWhatsAppValido: lista.length,
                semTelefoneCadastros: semTelefoneDetalhes.length,
                nomesVendasSemCadastro: nomesVendasSemTel.size,
                semTelefoneDetalhes: semTelefoneDetalhes.slice(0, 60)
            }
        };
    },

    gerarMsgQuebraGelo(cli, idx, seg) {
        const nomeSp = cli.primeiroNome ? ` *${cli.primeiroNome}*` : '';
        if (seg.categoria === 'os_pronta' && seg.osPronta) {
            const mod = (seg.osPronta.modelo || 'aparelho').toUpperCase();
            return `Olá${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando rápido pra avisar que o seu *${mod}* já ficou pronto e testado aqui na bancada. Você consegue passar aqui hoje pra retirar?`;
        }
        if (seg.categoria === 'celular') {
            const opcoesCel = [
                `Oi${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Como você já garantiu aparelho com a gente, estamos colocando os clientes da casa na frente pra receber a lista VIP da nossa *Black Cesinha* deste mês. Posso te mandar quando liberar?`,
                `Olá${nomeSp}, tudo joia por aí? Aqui é da equipe da *Cesinha Acessórios*! Vamos soltar condições especiais de *Black Friday* (bônus na troca de aparelho e acessórios) pros clientes da loja antes de postar aberto. Quer que eu te mande aqui?`,
                `Oi${nomeSp}, tudo tranquilo? 😊 Aqui é da *Cesinha Acessórios*! Tô separando o pessoal que já comprou celular aqui na loja pra mandar em primeira mão a tabela fechada da *Black Cesinha*. Posso deixar seu WhatsApp na lista?`
            ];
            return opcoesCel[idx % opcoesCel.length];
        }
        const opcoesGerais = [
            `Oi${nomeSp}, tudo bem com você? 😊 Aqui é da *Cesinha Acessórios*! Tô chamando alguns clientes da loja antes de divulgar aberto porque nossa *Black Cesinha* tá chegando com promoções fortes em acessórios, manutenção e celulares. Posso te mandar quando abrir?`,
            `Olá${nomeSp}, tudo joia? Aqui é da equipe da *Cesinha Acessórios*! A gente tá separando os clientes aqui da loja que querem receber primeiro as ofertas fechadas da *Black Cesinha* deste mês. Quer que eu te mande por aqui?`,
            `Oi${nomeSp}, tudo tranquilo por aí? 😊 Aqui é da *Cesinha Acessórios*! Como você já é cliente nosso, queria saber se posso te colocar na lista VIP da *Black Cesinha* pra ver as ofertas relâmpago antes de acabar o estoque?`,
            `Olá${nomeSp}, tudo bem? Aqui é da *Cesinha Acessórios*! Vamos liberar cupons e descontos reais de *Black Friday* primeiro no WhatsApp pros clientes da loja antes de postar no Instagram. Posso te enviar em primeira mão?`,
            `Opa${nomeSp}, tudo joia? 😊 Aqui é da *Cesinha Acessórios*! Esse mês tem condição especial na nossa *Black Cesinha* aqui na loja — posso salvar seu contato pra te mandar a lista VIP assim que abrir?`
        ];
        return opcoesGerais[idx % opcoesGerais.length];
    },

    gerarMsgOfertaGrupo(cli, seg, linkCustom) {
        const link = linkCustom || this.LINK_GRUPO_PADRAO;
        const nomeSp = cli.primeiroNome ? ` *${cli.primeiroNome}*` : '';
        if (seg.categoria === 'os_pronta' && seg.osPronta) {
            const mod = (seg.osPronta.modelo || 'aparelho').toUpperCase();
            return `Perfeito${nomeSp}! Já deixamos o seu *${mod}* separado aqui. 🎁 Na retirada hoje você ganha condição especial da *Black Cesinha* pra aplicar a *Película Hidrogel Fosca/Blindagem* nele e concorrer na nossa Urna Premiada!\n\nAproveita e entra no nosso *Grupo VIP de Ofertas Relâmpago*: ${link}`;
        }
        if (seg.subPerfil === 'iphone') {
            return `Show${nomeSp}! Olhei aqui e já liberei os destaques da *Black Cesinha* pro perfil Apple: 🖤\n\n📱 *Supervalorização na Troca (até R$ 160 OFF à vista)*: pegamos seu iPhone usado como entrada no *iPhone 13 Pro (R$ 2.537,90)*, *iPhone 13 (R$ 2.037,90)* ou *iPhone 11 Pro Max (R$ 1.747,90 c/ até R$ 160 OFF)* — parcelamos a diferença em até 18x!\n🛡️ *Proteção VIP*: Capa Magsafe por *R$ 19,90* levando película Hidrogel Fosca ou Blindagem Completa!\n\n🔥 Entra aqui no *Grupo VIP da Cesinha Acessórios* (sem bagunça, só oferta real): ${link}`;
        }
        if (seg.categoria === 'assistencia') {
            return `Perfeito${nomeSp}! Olha o que preparamos na *Black Cesinha* pra quem já cuida do aparelho com a gente: 🖤\n\n🔧 *Check-up + Cupom de R$ 20 OFF*: trazendo seu celular na loja fazemos teste grátis de conector/fonte + cupom pra tela, bateria, limpeza ou película Hidrogel Fosca/Blindagem!\n📱 *Troca Inteligente (até R$ 100 OFF à vista)*: *Realme Note 60x (R$ 697,90)*, *Note 70 (R$ 897,90)*, *Redmi 15C (R$ 1.069,90)* e *Redmi 15 (R$ 1.387,90)*!\n\n👇 Entra aqui no *Grupo VIP da Cesinha Acessórios* pra acompanhar as ofertas relâmpago: ${link}`;
        }
        if (seg.categoria === 'fogos') {
            return `Massa${nomeSp}! 🖤 Na nossa *Black Cesinha* tem muita coisa boa rolando agora: *Caixa de Som Basike IPX6*, *Fone Air Max (R$ 119,90)*, *Smartwatch S9 Ultra (R$ 159,90)*, cabos/carregadores e toda linha de celulares com desconto na troca — além da nossa linha de *Fogos* pra comemorar!\n\n👇 Entra aqui no nosso *Grupo VIP de Ofertas* pra pegar as promoções antes de acabarem: ${link}`;
        }
        return `Maravilha${nomeSp}! Dá uma olhada no que vai rolar na nossa *Black Cesinha*: 🖤\n\n🎧 *Acessórios & Proteção*: Capa Magsafe *R$ 19,90* (levando película Hidrogel), Armon Shield *R$ 59,90*, *Smartwatch S9 Ultra R$ 159,90* e *Fone Air Max R$ 119,90* + Cupom Premiado na loja!\n📱 *Celulares c/ até R$ 100 OFF à vista* (e pegamos usado na troca!): *Note 60x R$ 697,90*, *Note 70 R$ 897,90*, *Redmi 15C R$ 1.069,90*, *Realme C73 R$ 1.274,90* e *Redmi 15 R$ 1.387,90*!\n\n👇 Entra aqui no *Grupo VIP da Cesinha Acessórios* (sem spam, só oferta relâmpago): ${link}`;
    },

    montarPromptGemini(cli, etapa, msgBase, linkGrupo) {
        const nomeTxt = cli.primeiroNome || '(não citar nome)';
        if (etapa === 'quebra_gelo') {
            return `Você escreve mensagens humanas e curtas de WhatsApp para a loja "Cesinha Acessórios" (Amargosa-BA).
Reescreva a 1ª mensagem de quebra-gelo abaixo deixando-a natural, leve e simpática (máximo 2 frases, SEM links, SEM valores/preços).
REGRAS OBRIGATÓRIAS:
- NUNCA mencione termos internos como "Avulso", "Venda Avulsa", "OS #", nem pergunte se o cliente ainda está usando capinha, película, cabo ou fogos antigos.
- Seja genérico e amigável: diga que você está separando os clientes da loja para receberem antes os descontos/lista VIP da Black Cesinha e termine perguntando se pode mandar por aqui.
- Cliente: ${nomeTxt}.
Base:\n${msgBase}`;
        }
        return `Você escreve mensagens de WhatsApp para a loja "Cesinha Acessórios" (Amargosa-BA).
O cliente acabou de responder "Sim/Pode mandar" à 1ª mensagem. Melhore a 2ª mensagem abaixo mantendo EXATAMENTE o link do Grupo VIP (${linkGrupo}) e os produtos/preços oficiais informados, com tom empolgante e humano (sem parecer spam).
Base:\n${msgBase}`;
    }
};

window.IARecapturaMotor = IARecapturaMotor;
