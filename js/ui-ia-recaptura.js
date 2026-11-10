// StrategyOS 3.1 — Motor de Recaptura Inteligente & Blindagem Anti-Banimento WhatsApp (CRM IA + Gemini 2.5 Flash)
// Opera em 2 Etapas (1ª Msg Quebra-Gelo com Spintax Anti-Spam -> 2ª Msg Oferta + Grupo VIP) + Trava de Cooldown

const IARecaptura = {
    filtroAtual: 'todos',
    etapaAtual: 'quebra_gelo', // 'quebra_gelo' (1ª Msg Segura) | 'oferta_grupo' (2ª Msg c/ Oferta + Link Grupo)
    buscaTexto: '',
    _ultimoDisparoMs: 0,
    LIMITE_DIARIO_SEGURO: 25,
    COOLDOWN_SEGUNDOS: 35,
    LINK_GRUPO_PADRAO: 'https://chat.whatsapp.com/FcuY7wDt7u3F1LusMdlko9',

    getLinkGrupo() {
        try { return localStorage.getItem('strategyos_link_grupo_vip') || this.LINK_GRUPO_PADRAO; } catch (e) { return this.LINK_GRUPO_PADRAO; }
    },
    setLinkGrupo(url) {
        try { localStorage.setItem('strategyos_link_grupo_vip', String(url || '').trim() || this.LINK_GRUPO_PADRAO); } catch (e) {}
    },

    getDataLocalHoje() {
        return (window.dataManager && typeof dataManager.hojeLocal === 'function') ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0];
    },

    getEnviadosHoje() {
        try { return JSON.parse(localStorage.getItem('strategyos_recaptura_enviados') || '{}')[this.getDataLocalHoje()] || {}; } catch (e) { return {}; }
    },

    marcarEnviado(chaveCliente, etapa) {
        try {
            const hoje = this.getDataLocalHoje();
            const raw = JSON.parse(localStorage.getItem('strategyos_recaptura_enviados') || '{}');
            if (!raw[hoje]) raw[hoje] = {};
            raw[hoje][chaveCliente] = { hora: new Date().toISOString(), etapa: etapa || this.etapaAtual };
            localStorage.setItem('strategyos_recaptura_enviados', JSON.stringify(raw));
        } catch (e) {}
    },

    trocarEtapa(etapa) {
        this.etapaAtual = etapa;
        const host = document.getElementById('ia-recaptura-host');
        if (host) { host.innerHTML = this.renderPainelRecaptura(); this.renderListaCards(); return; }
        if (window.UI && typeof UI.renderIASugestoes === 'function') UI.renderIASugestoes();
    },

    limparTelefone(tel) {
        const num = String(tel || '').replace(/\D/g, '');
        if (num.length < 10 || /99999999|00000000|11111111/.test(num)) return '';
        return num.startsWith('55') ? num : '55' + num;
    },

    primeiroNome(nomeRaw) {
        const str = String(nomeRaw || '').replace(/\d+/g, '').trim();
        if (!str || /consumidor geral|cliente loja|nao identificado/i.test(str)) return 'Amigo(a)';
        const limpo = str.split(/\s+/)[0] || 'Amigo(a)';
        return limpo.charAt(0).toUpperCase() + limpo.slice(1).toLowerCase();
    },

    // Spintax Anti-Banimento: gera variações naturais para nunca repetir o mesmo texto seguido
    gerarMsgQuebraGelo(cli, idx, osPronta) {
        const saudacoes = [
            `Oi *${cli.primeiroNome}*, tudo bem com você?`,
            `Olá *${cli.primeiroNome}*, tudo joia por aí?`,
            `Bom dia *${cli.primeiroNome}*, tudo tranquilo?`,
            `Oi *${cli.primeiroNome}*, como você está?`
        ];
        const saud = saudacoes[idx % saudacoes.length];
        if (osPronta) {
            return `${saud} Aqui é da *Cesinha Acessórios*! Passando rapidinho pra te avisar que o seu *${osPronta.modelo.toUpperCase()}* já ficou pronto e testado aqui na bancada. Você consegue passar aqui hoje pra retirar?`;
        }
        if (cli.ultimoAparelho && !/pelicula|cabo|capa|avulso/i.test(cli.ultimoAparelho)) {
            const variacoesAp = [
                `${saud} Aqui é da equipe da *Cesinha Acessórios*! Tava vendo seu cadastro aqui no sistema... você ainda tá usando aquele *${cli.ultimoAparelho}* ou já trocou de aparelho?`,
                `${saud} Aqui é da *Cesinha Acessórios*! Tudo certinho com o seu *${cli.ultimoAparelho}*? Separei um benefício especial pro seu modelo nessa semana de Black Friday, posso te mandar aqui?`,
                `${saud} Aqui é da *Cesinha Acessórios*! Lembramos de você que é cliente nosso do *${cli.ultimoAparelho}*. Você ainda está com ele hoje?`
            ];
            return variacoesAp[idx % variacoesAp.length];
        }
        return `${saud} Aqui é da *Cesinha Acessórios*! Estamos montando a lista de clientes antigos que vão receber o cupom da nossa *Black Friday* e lembrei de você. Qual modelo de celular você está usando hoje?`;
    },

    gerarMsgOfertaGrupo(cli, osPronta) {
        const link = this.getLinkGrupo() || '[COLE_AQUI_O_LINK_DO_SEU_GRUPO_VIP]';
        const apLower = (cli.ultimoAparelho || '').toLowerCase();
        if (osPronta) {
            return `Perfeito, *${cli.primeiroNome}*! Te esperamos aqui na loja. 🎁 E como estamos na semana de *Esquenta Black Friday*, na retirada hoje você tem desconto especial pra já aplicar a *Película Hidrogel Nova* no seu *${osPronta.modelo.toUpperCase()}*!\n\nAproveita e entra no nosso *Grupo VIP de Ofertas Relâmpago* (é silencioso, só postamos 2 promoções por dia): ${link}`;
        }
        if (apLower.includes('iphone')) {
            return `Que massa, *${cli.primeiroNome}*! Olha só o que eu liberei no sistema pro seu perfil na nossa *Black Cesinha*: 🖤\n\n1️⃣ *Supervalorização na Troca (até R$ 160 OFF à vista)*: pegamos seu *${cli.ultimoAparelho}* como entrada no nosso *iPhone 13 Pro (R$ 2.537,90)*, *iPhone 13 Novo (R$ 2.037,90)* ou *iPhone 11 Pro Max (R$ 1.747,90 c/ até R$ 160 OFF)*!\n2️⃣ *Combo Proteção VIP*: Película Hidrogel Fosca/Blindagem + Capa Magsafe (R$ 19,90 levando película) ou Armon Shield (R$ 59,90 no cupom).\n\n🔥 Entra aqui no nosso *Grupo VIP da Cesinha Acessórios* pra ver as ofertas relâmpago antes de acabarem: ${link}`;
        }
        return `Show de bola, *${cli.primeiroNome}*! Olhei aqui no sistema e liberei essas oportunidades da *Black Cesinha* pra você: 🖤\n\n📱 *Troca Inteligente (até R$ 100 OFF à vista)*: aparelhos novos na caixa (*Realme 60x R$ 697,90*, *Note 70 R$ 897,90*, *Redmi 15C R$ 1.069,90*, *Realme C73 R$ 1.274,90* e *Redmi 15 R$ 1.387,90*) aceitando seu usado na troca!\n🔌 *Desova & Proteção*: Carregador Hmaston Turbo + Película Hidrogel Fosca/Completa com desconto especial.\n\n👇 Entra aqui no nosso *Grupo VIP de Ofertas Relâmpago* (sem bagunça, só promoção real): ${link}`;
    },

    gerarListaRecaptura() {
        if (!window.dataManager || !dataManager.data) return [];
        const d = dataManager.data;
        const mapa = new Map();

        const registrarOuAtualizar = (nome, telefone, itemHist) => {
            const telLimpo = this.limparTelefone(telefone);
            if (!telLimpo) return;
            if (!mapa.has(telLimpo)) {
                mapa.set(telLimpo, {
                    key: telLimpo,
                    nome: String(nome || 'Cliente').replace(/\d{5,}/g, '').trim(),
                    primeiroNome: this.primeiroNome(nome),
                    telefone: String(telefone).trim(),
                    telWhatsApp: telLimpo,
                    compras: [],
                    osList: [],
                    totalGasto: 0,
                    ultimaData: '2025-01-01',
                    ultimoAparelho: ''
                });
            }
            const cli = mapa.get(telLimpo);
            if (itemHist) {
                if (itemHist.origem === 'os') cli.osList.push(itemHist);
                else cli.compras.push(itemHist);
                cli.totalGasto += parseFloat(itemHist.valor || 0);
                if (itemHist.data && itemHist.data > cli.ultimaData) cli.ultimaData = itemHist.data;
                if (itemHist.aparelhoDetectado) cli.ultimoAparelho = itemHist.aparelhoDetectado;
            }
        };

        (d.clientes || []).forEach(c => {
            if (!c.telefone) return;
            const hist = Array.isArray(c.historico) ? c.historico : [];
            if (hist.length === 0) registrarOuAtualizar(c.nome, c.telefone, null);
            else hist.forEach(h => {
                const prod = String(h.produtoNovo || h.produto || '').trim();
                registrarOuAtualizar(c.nome, c.telefone, {
                    origem: 'compra',
                    data: String(h.data || c.dataCadastro || '2026-01-01').substring(0, 10),
                    produto: prod,
                    valor: parseFloat(h.valor || h.clientePagou || 0),
                    aparelhoDetectado: prod
                });
            });
        });

        (d.assistencia?.ordensServico || []).forEach(os => {
            if (!os.telefone) return;
            registrarOuAtualizar(os.cliente || 'Cliente OS', os.telefone, {
                origem: 'os',
                numero: os.numero,
                status: os.status,
                data: String(os.dataCriacao || '2026-08-01').substring(0, 10),
                modelo: String(os.modelo || '').trim(),
                servico: String(os.servico || '').split('\n')[0].trim(),
                valor: parseFloat(os.valorFinal || os.preco || 0),
                aparelhoDetectado: String(os.modelo || '').trim()
            });
        });

        const hojeMs = Date.now();
        const enviadosHoje = this.getEnviadosHoje();
        const listaFinal = [];
        let idx = 0;

        mapa.forEach(cli => {
            idx++;
            const diasSemVir = Math.max(1, Math.floor((hojeMs - new Date(cli.ultimaData).getTime()) / 86400000));
            const osPronta = cli.osList.find(o => o.status === 'pronto');
            const apLower = (cli.ultimoAparelho || '').toLowerCase();

            let categoria = 'combo_protecao';
            let badge = '🛡️ Combo Proteção / Acessórios';
            let corBadge = '#a855f7';
            let ofertaSugerida = 'Película Hidrogel + Carregador Turbo Hmaston (R$ 39,90) + Convite Grupo VIP';

            if (osPronta) {
                categoria = 'os_pronta';
                badge = `🚨 OS #${osPronta.numero} Pronta p/ Retirar`;
                corBadge = '#ef4444';
                ofertaSugerida = `Retirada do ${osPronta.modelo.toUpperCase()} + Película Hidrogel c/ Desconto`;
            } else if (apLower.includes('iphone')) {
                categoria = 'upgrade_iphone';
                badge = '🔄 Upgrade iPhone + Kit Magsafe';
                corBadge = '#10b981';
                ofertaSugerida = 'Troca p/ iPhone 11 Pro Max (R$ 1.399,90), iPhone 13 (R$ 1.949,90) ou 13 Pro (R$ 2.499,90)';
            } else if (apLower && !apLower.includes('pelicula') && !apLower.includes('cabo') && !apLower.includes('capa')) {
                categoria = 'upgrade_android';
                badge = '📱 Upgrade Android / Troca Black';
                corBadge = '#3b82f6';
                ofertaSugerida = 'Troca por Realme 60x (R$ 699,90), Note 70 (R$ 879,90) ou Redmi 15 (R$ 1.169,90)';
            }

            const msgQuebraGelo = this.gerarMsgQuebraGelo(cli, idx, osPronta);
            const msgOfertaGrupo = this.gerarMsgOfertaGrupo(cli, osPronta);

            listaFinal.push({
                ...cli,
                diasSemVir,
                categoria,
                badge,
                corBadge,
                ofertaSugerida,
                msgQuebraGelo,
                msgOfertaGrupo,
                mensagem: this.etapaAtual === 'oferta_grupo' ? msgOfertaGrupo : msgQuebraGelo,
                enviadoHoje: Boolean(enviadosHoje[cli.key]),
                prioridade: categoria === 'os_pronta' ? 1 : categoria === 'upgrade_iphone' ? 2 : categoria === 'upgrade_android' ? 3 : 4
            });
        });

        return listaFinal.sort((a, b) => {
            if (a.enviadoHoje !== b.enviadoHoje) return a.enviadoHoje ? 1 : -1;
            if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
            return b.totalGasto - a.totalGasto;
        });
    },

    enviarWhatsAppCliente(key, telWhatsApp) {
        const agora = Date.now();
        const segDesdeUltimo = Math.floor((agora - this._ultimoDisparoMs) / 1000);
        if (this._ultimoDisparoMs > 0 && segDesdeUltimo < this.COOLDOWN_SEGUNDOS) {
            const faltam = this.COOLDOWN_SEGUNDOS - segDesdeUltimo;
            if (window.UI) UI.toast(`🛡️ Trava Anti-Banimento: aguarde ${faltam}s antes do próximo disparo para proteger seu número!`, 'warning');
            return;
        }
        const totalHoje = Object.keys(this.getEnviadosHoje()).length;
        if (totalHoje >= this.LIMITE_DIARIO_SEGURO && !confirm(`⚠️ Você já enviou ${totalHoje} mensagens hoje (limite seguro recomendado: ${this.LIMITE_DIARIO_SEGURO}/dia para evitar banimento). Deseja enviar mesmo assim?`)) {
            return;
        }

        const txtEl = document.getElementById(`recap-msg-${key}`);
        const msg = txtEl ? txtEl.value : '';
        if (!msg) return;
        this._ultimoDisparoMs = agora;
        this.marcarEnviado(key, this.etapaAtual);
        window.open(`https://wa.me/${telWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
        if (window.UI) {
            UI.toast('📲 WhatsApp aberto com segurança! Aguarde o cliente responder antes de enviar links.', 'success');
            this.renderListaCards();
        }
    },

    async refinarComGemini(key, nome, aparelho, totalGasto) {
        const apiKey = window.IAGuardian ? IAGuardian.getApiKey() : '';
        if (!apiKey) {
            if (window.UI) UI.toast('Salve sua API Key do Gemini 2.5 Flash no topo da tela primeiro!', 'warning');
            return;
        }
        const txtEl = document.getElementById(`recap-msg-${key}`);
        if (!txtEl) return;
        const msgOriginal = txtEl.value;
        txtEl.value = '⏳ Gerando variação humana anti-spam com Gemini 2.5 Flash...';

        try {
            const regraEtapa = this.etapaAtual === 'quebra_gelo'
                ? 'Escreva APENAS uma 1ª mensagem curta de quebra-gelo (máximo 2 frases, SEM links e SEM preços), parecendo 100% digitada por humano no WhatsApp, terminando com uma pergunta simples para o cliente responder.'
                : 'Escreva a 2ª mensagem (após resposta do cliente) apresentando a oferta de Black Friday e convidando para o Grupo VIP da loja.';
            const prompt = `Loja: "Cesinha Acessórios" (Amargosa-BA). Cliente: "${nome}" (Histórico: "${aparelho || 'Acessórios'}", Gasto: R$ ${totalGasto}). ${regraEtapa} Base:\n${msgOriginal}`;
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.55, maxOutputTokens: 250 } })
            });
            const json = await resp.json();
            txtEl.value = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || msgOriginal;
        } catch (e) {
            txtEl.value = msgOriginal;
        }
    },

    renderPainelRecaptura() {
        const todos = this.gerarListaRecaptura();
        const enviados = todos.filter(c => c.enviadoHoje).length;
        const linkSalvo = this.getLinkGrupo();

        return `
        <div style="background:rgba(15,20,32,0.95);border:1.5px solid #10b981;border-radius:16px;padding:18px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                <div>
                    <h3 style="font-size:19px;margin:0;color:#00FFA3;">🛡️ CENTRAL DE RECAPTURA ANTI-BANIMENTO (MÉTODO 2 ETAPAS)</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin:4px 0 0;">
                        Trava de 35s entre cliques + Variação automática de frases (Spintax) + Limite diário seguro (${enviados}/${this.LIMITE_DIARIO_SEGURO} hoje)
                    </p>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn btn-sm ${this.etapaAtual === 'quebra_gelo' ? 'btn-primary' : 'btn-ghost'}" style="font-weight:800;" onclick="IARecaptura.trocarEtapa('quebra_gelo')">🛡️ 1ª Msg: Quebra-Gelo Seguro (Sem Link)</button>
                    <button class="btn btn-sm ${this.etapaAtual === 'oferta_grupo' ? 'btn-primary' : 'btn-ghost'}" style="font-weight:800;" onclick="IARecaptura.trocarEtapa('oferta_grupo')">🔥 2ª Msg: Oferta + Link Grupo VIP</button>
                </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;background:rgba(0,0,0,0.3);padding:10px;border-radius:10px;">
                <input type="text" id="ia-link-grupo-input" class="form-input" style="flex:1;min-width:220px;font-size:12px;padding:6px 10px;" placeholder="Cole aqui o link do seu Grupo VIP do WhatsApp (https://chat.whatsapp.com/...)" value="${linkSalvo}">
                <button class="btn btn-sm btn-ghost" onclick="IARecaptura.setLinkGrupo(document.getElementById('ia-link-grupo-input').value);UI.toast('Link do Grupo VIP salvo!','success');IARecaptura.renderListaCards();">🔗 Salvar Link do Grupo</button>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <button class="btn btn-sm ${this.filtroAtual === 'todos' ? 'btn-primary' : 'btn-ghost'}" onclick="IARecaptura.filtroAtual='todos';IARecaptura.renderListaCards()">📋 Todos (${todos.length})</button>
                <button class="btn btn-sm ${this.filtroAtual === 'os_pronta' ? 'btn-primary' : 'btn-ghost'}" onclick="IARecaptura.filtroAtual='os_pronta';IARecaptura.renderListaCards()">🚨 OS Pronta (${todos.filter(c => c.categoria === 'os_pronta').length})</button>
                <button class="btn btn-sm ${this.filtroAtual === 'upgrade_iphone' ? 'btn-primary' : 'btn-ghost'}" onclick="IARecaptura.filtroAtual='upgrade_iphone';IARecaptura.renderListaCards()">🔄 Clientes iPhone (${todos.filter(c => c.categoria === 'upgrade_iphone').length})</button>
                <button class="btn btn-sm ${this.filtroAtual === 'upgrade_android' ? 'btn-primary' : 'btn-ghost'}" onclick="IARecaptura.filtroAtual='upgrade_android';IARecaptura.renderListaCards()">📱 Clientes Android (${todos.filter(c => c.categoria === 'upgrade_android').length})</button>
                <input type="text" class="form-input" style="flex:1;min-width:160px;font-size:12px;padding:6px 10px;" placeholder="🔍 Buscar nome ou aparelho..." value="${this.buscaTexto}" oninput="IARecaptura.buscaTexto=this.value;IARecaptura.renderListaCards()">
            </div>

            <div id="ia-recaptura-cards-container" style="display:flex;flex-direction:column;gap:12px;max-height:600px;overflow-y:auto;padding-right:4px;"></div>
        </div>`;
    },

    renderListaCards() {
        const container = document.getElementById('ia-recaptura-cards-container');
        if (!container) return;
        let lista = this.gerarListaRecaptura();
        if (this.filtroAtual !== 'todos') lista = lista.filter(c => c.categoria === this.filtroAtual);
        if (this.buscaTexto.trim()) {
            const q = this.buscaTexto.toLowerCase().trim();
            lista = lista.filter(c => c.nome.toLowerCase().includes(q) || (c.ultimoAparelho || '').toLowerCase().includes(q) || c.telefone.includes(q));
        }

        const exibidos = lista.slice(0, 35);
        if (exibidos.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">Nenhum cliente neste filtro.</div>`;
            return;
        }

        container.innerHTML = exibidos.map(c => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid ${c.enviadoHoje ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'};border-left:4px solid ${c.corBadge};border-radius:12px;padding:12px;opacity:${c.enviadoHoje ? '0.65' : '1'};">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                    <div>
                        <strong style="font-size:14px;color:#fff;">👤 ${c.nome}</strong>
                        <span style="font-size:12px;color:var(--text-muted);margin-left:6px;">📞 ${c.telefone}</span>
                        <span style="font-size:11px;background:${c.corBadge}22;color:${c.corBadge};padding:2px 8px;border-radius:10px;margin-left:6px;font-weight:700;">${c.badge}</span>
                        ${c.enviadoHoje ? `<span style="font-size:11px;background:rgba(16,185,129,0.2);color:#10b981;padding:2px 8px;border-radius:10px;margin-left:6px;font-weight:800;">✅ Enviado hoje</span>` : ''}
                    </div>
                    <div style="font-size:11px;color:#FFD700;font-weight:700;">📱 ${c.ultimoAparelho || 'Cliente Loja'} | 💰 ${UI.R(c.totalGasto)}</div>
                </div>
                <textarea id="recap-msg-${c.key}" class="form-input" rows="3" style="width:100%;font-size:13px;line-height:1.4;margin-bottom:8px;background:rgba(0,0,0,0.35);">${c.mensagem}</textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <button class="btn btn-sm btn-ghost" style="font-size:11px;" onclick="IARecaptura.refinarComGemini('${c.key}', '${c.primeiroNome.replace(/'/g, '')}', '${(c.ultimoAparelho || '').replace(/'/g, '')}', ${c.totalGasto})">✨ Variação Gemini 2.5 Flash</button>
                    <button class="btn btn-sm" style="background:#10b981;color:#052e16;font-weight:900;padding:7px 16px;font-size:13px;" onclick="IARecaptura.enviarWhatsAppCliente('${c.key}', '${c.telWhatsApp}')">
                        📲 Enviar ${this.etapaAtual === 'quebra_gelo' ? '1ª Msg Segura' : '2ª Msg + Grupo'}
                    </button>
                </div>
            </div>`).join('');
    }
};

window.IARecaptura = IARecaptura;
