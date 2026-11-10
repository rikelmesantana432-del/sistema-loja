// StrategyOS 3.1 — UI da Central de Recaptura WhatsApp (2 Etapas Anti-Ban + Google Gemini)
// Lógica de segmentação e copy vive em js/ia-recaptura-mensagens.js (IARecapturaMotor).

const IARecaptura = {
    filtroAtual: 'todos',
    etapaAtual: 'quebra_gelo', // 'quebra_gelo' | 'oferta_grupo'
    buscaTexto: '',
    ocultarEnviadosHoje: false,
    mostrarSemTelefone: false,
    limiteExibicao: 40,
    _ultimoDisparoMs: 0,
    _cacheLista: [],
    ultimoResumoBase: { totalWhatsAppValido: 0, semTelefoneCadastros: 0, nomesVendasSemCadastro: 0, semTelefoneDetalhes: [] },
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

    limparTelefone(tel) {
        return window.IARecapturaMotor ? IARecapturaMotor.limparTelefone(tel) : String(tel || '').replace(/\D/g, '');
    },
    primeiroNome(nomeRaw) {
        return window.IARecapturaMotor ? IARecapturaMotor.extrairPrimeiroNome(nomeRaw) : String(nomeRaw || '').split(/\s+/)[0];
    },

    trocarEtapa(etapa) {
        this.etapaAtual = etapa;
        const host = document.getElementById('ia-recaptura-host');
        if (host) {
            host.innerHTML = this.renderPainelRecaptura();
            this.renderListaCards();
            return;
        }
        if (window.UI && typeof UI.renderIASugestoes === 'function') UI.renderIASugestoes();
    },

    trocarFiltro(cat) {
        this.filtroAtual = cat;
        this.limiteExibicao = 40;
        const host = document.getElementById('ia-recaptura-host');
        if (host) {
            host.innerHTML = this.renderPainelRecaptura();
            this.renderListaCards();
        } else {
            this.renderListaCards();
        }
    },

    carregarMais(qtd) {
        this.limiteExibicao = qtd === 'todos' ? 9999 : (this.limiteExibicao + Number(qtd || 50));
        this.renderListaCards();
    },

    gerarListaRecaptura() {
        if (!window.dataManager || !dataManager.data || !window.IARecapturaMotor) return [];
        const base = IARecapturaMotor.construirBaseCompleta(
            dataManager.data,
            () => this.getEnviadosHoje(),
            this.etapaAtual,
            this.getLinkGrupo()
        );
        this.ultimoResumoBase = base.resumo;
        this._cacheLista = base.lista;
        return base.lista;
    },

    enviarWhatsAppCliente(key, telWhatsApp) {
        const agora = Date.now();
        const segDesdeUltimo = Math.floor((agora - this._ultimoDisparoMs) / 1000);
        if (this._ultimoDisparoMs > 0 && segDesdeUltimo < this.COOLDOWN_SEGUNDOS) {
            const faltam = this.COOLDOWN_SEGUNDOS - segDesdeUltimo;
            if (window.UI) UI.toast(`🛡️ Trava Anti-Banimento: aguarde ${faltam}s antes do próximo disparo para proteger o chip!`, 'warning');
            return;
        }
        const totalHoje = Object.keys(this.getEnviadosHoje()).length;
        if (totalHoje >= this.LIMITE_DIARIO_SEGURO && !confirm(`⚠️ Você já enviou ${totalHoje} mensagens hoje (limite seguro recomendado: ${this.LIMITE_DIARIO_SEGURO}/dia). Deseja enviar mesmo assim?`)) {
            return;
        }

        const txtEl = document.getElementById(`recap-msg-${key}`);
        const msg = txtEl ? txtEl.value.trim() : '';
        if (!msg) return;
        this._ultimoDisparoMs = agora;
        this.marcarEnviado(key, this.etapaAtual);
        window.open(`https://wa.me/${telWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
        if (window.UI) {
            UI.toast('📲 WhatsApp aberto! Aguarde o cliente responder "Sim/Pode" antes da 2ª mensagem.', 'success');
            this.renderListaCards();
        }
    },

    async refinarComGemini(key) {
        const txtEl = document.getElementById(`recap-msg-${key}`);
        if (!txtEl) return;
        const msgOriginal = txtEl.value;
        const cli = (this._cacheLista || []).find(c => c.key === key) || { primeiroNome: '' };

        if (!window.IAGuardian || typeof IAGuardian.chamarGemini !== 'function') {
            if (window.UI) UI.toast('Motor Gemini indisponível nesta tela.', 'warning');
            return;
        }

        txtEl.value = '⏳ Criando variação humana com Google Gemini 2.5 Flash...';
        try {
            const prompt = window.IARecapturaMotor
                ? IARecapturaMotor.montarPromptGemini(cli, this.etapaAtual, msgOriginal, this.getLinkGrupo())
                : msgOriginal;
            const textoGerado = await IAGuardian.chamarGemini(prompt, { temperature: 0.55, maxOutputTokens: 280 });
            txtEl.value = textoGerado || msgOriginal;
            if (window.UI) UI.toast('✨ Variação gerada com Google Gemini!', 'success');
        } catch (err) {
            txtEl.value = msgOriginal;
            if (window.UI) UI.toast(`⚠️ Gemini: ${err.message}`, 'warning');
        }
    },

    renderPainelRecaptura() {
        const todos = this.gerarListaRecaptura();
        const r = this.ultimoResumoBase;
        const enviados = todos.filter(c => c.enviadoHoje).length;
        const linkSalvo = this.getLinkGrupo();
        const cnt = cat => todos.filter(c => c.categoria === cat).length;
        const btnFiltro = (id, label) =>
            `<button class="btn btn-sm ${this.filtroAtual === id ? 'btn-primary' : 'btn-ghost'}" onclick="IARecaptura.trocarFiltro('${id}')">${label}</button>`;

        return `
        <div style="background:rgba(15,20,32,0.95);border:1.5px solid #10b981;border-radius:16px;padding:18px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                <div>
                    <h3 style="font-size:19px;margin:0;color:#00FFA3;">🛡️ RECAPTURA VIP BLACK CESINHA (2 ETAPAS ANTI-BAN)</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin:4px 0 0;">
                        1ª Msg genérica p/ Black (sem link, sem citar capinha velha) • Trava ${this.COOLDOWN_SEGUNDOS}s • Limite seguro ${enviados}/${this.LIMITE_DIARIO_SEGURO} hoje
                    </p>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn btn-sm ${this.etapaAtual === 'quebra_gelo' ? 'btn-primary' : 'btn-ghost'}" style="font-weight:800;" onclick="IARecaptura.trocarEtapa('quebra_gelo')">🛡️ 1ª Msg: Quebra-Gelo Black (Sem Link)</button>
                    <button class="btn btn-sm ${this.etapaAtual === 'oferta_grupo' ? 'btn-primary' : 'btn-ghost'}" style="font-weight:800;" onclick="IARecaptura.trocarEtapa('oferta_grupo')">🔥 2ª Msg: Oferta + Link Grupo VIP</button>
                </div>
            </div>

            <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.28);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                    <strong style="color:#00FFA3;">📊 Base Real: ${r.totalWhatsAppValido} clientes com WhatsApp válido</strong>
                    <span style="color:var(--text-muted);margin-left:8px;">| ⚠️ ${r.semTelefoneCadastros} fichas s/ telefone + ${r.nomesVendasSemCadastro} nomes só de venda avulsa</span>
                </div>
                ${r.semTelefoneCadastros > 0 ? `<button class="btn btn-sm btn-ghost" style="font-size:11px;padding:3px 10px;" onclick="IARecaptura.mostrarSemTelefone=!IARecaptura.mostrarSemTelefone;IARecaptura.trocarFiltro(IARecaptura.filtroAtual)">${this.mostrarSemTelefone ? '🔼 Ocultar sem número' : '👁️ Ver fichas sem número'}</button>` : ''}
            </div>

            ${this.mostrarSemTelefone && r.semTelefoneDetalhes.length > 0 ? `
                <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:10px;margin-bottom:12px;max-height:160px;overflow-y:auto;font-size:12px;">
                    <strong style="color:#fbbf24;">Clientes sem WhatsApp válido na ficha (não entram no disparo até cadastrar telefone):</strong>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                        ${r.semTelefoneDetalhes.map(x => `<span style="background:rgba(0,0,0,0.35);padding:3px 8px;border-radius:8px;color:#fde68a;">${x.nome} (${x.origem})</span>`).join('')}
                    </div>
                </div>` : ''}

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;background:rgba(0,0,0,0.3);padding:10px;border-radius:10px;">
                <input type="text" id="ia-link-grupo-input" class="form-input" style="flex:1;min-width:220px;font-size:12px;padding:6px 10px;" placeholder="Link do Grupo VIP (https://chat.whatsapp.com/...)" value="${linkSalvo}">
                <button class="btn btn-sm btn-ghost" onclick="IARecaptura.setLinkGrupo(document.getElementById('ia-link-grupo-input').value);UI.toast('Link do Grupo VIP salvo!','success');IARecaptura.trocarFiltro(IARecaptura.filtroAtual);">🔗 Salvar Link VIP</button>
            </div>

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
                ${btnFiltro('todos', `📋 Todos (${todos.length})`)}
                ${btnFiltro('os_pronta', `🚨 OS Pronta (${cnt('os_pronta')})`)}
                ${btnFiltro('celular', `📱 Celulares (${cnt('celular')})`)}
                ${btnFiltro('assistencia', `🔧 Assistência (${cnt('assistencia')})`)}
                ${btnFiltro('acessorio', `🛍️ Acessórios (${cnt('acessorio')})`)}
                ${btnFiltro('fogos', `🎇 Fogos (${cnt('fogos')})`)}
                ${btnFiltro('sem_historico', `📝 Só Cadastro (${cnt('sem_historico')})`)}
                <button class="btn btn-sm ${this.ocultarEnviadosHoje ? 'btn-primary' : 'btn-ghost'}" onclick="IARecaptura.ocultarEnviadosHoje=!IARecaptura.ocultarEnviadosHoje;IARecaptura.trocarFiltro(IARecaptura.filtroAtual)">⏳ Pendentes Hoje</button>
                <input type="text" class="form-input" style="flex:1;min-width:160px;font-size:12px;padding:6px 10px;" placeholder="🔍 Buscar nome ou número..." value="${this.buscaTexto}" oninput="IARecaptura.buscaTexto=this.value;IARecaptura.renderListaCards()">
            </div>

            <div id="ia-recaptura-cards-container" style="display:flex;flex-direction:column;gap:12px;max-height:640px;overflow-y:auto;padding-right:4px;"></div>
        </div>`;
    },

    renderListaCards() {
        const container = document.getElementById('ia-recaptura-cards-container');
        if (!container) return;
        let lista = this.gerarListaRecaptura();
        if (this.filtroAtual !== 'todos') lista = lista.filter(c => c.categoria === this.filtroAtual);
        if (this.ocultarEnviadosHoje) lista = lista.filter(c => !c.enviadoHoje);
        if (this.buscaTexto.trim()) {
            const q = window.IARecapturaMotor ? IARecapturaMotor.normalizarTexto(this.buscaTexto) : this.buscaTexto.toLowerCase().trim();
            lista = lista.filter(c => {
                const n = window.IARecapturaMotor ? IARecapturaMotor.normalizarTexto(c.nome) : c.nome.toLowerCase();
                const res = window.IARecapturaMotor ? IARecapturaMotor.normalizarTexto(c.ultimoResumo) : c.ultimoResumo.toLowerCase();
                return n.includes(q) || res.includes(q) || c.telefone.includes(q) || c.telWhatsApp.includes(q);
            });
        }

        if (lista.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);">Nenhum cliente encontrado neste filtro.</div>`;
            return;
        }

        const exibidos = lista.slice(0, this.limiteExibicao);
        const cardsHtml = exibidos.map(c => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid ${c.enviadoHoje ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'};border-left:4px solid ${c.corBadge};border-radius:12px;padding:12px;opacity:${c.enviadoHoje ? '0.65' : '1'};">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                    <div>
                        <strong style="font-size:14px;color:#fff;">👤 ${c.nome}</strong>
                        <span style="font-size:12px;color:var(--text-muted);margin-left:6px;">📞 ${c.telefone}</span>
                        <span style="font-size:11px;background:${c.corBadge}22;color:${c.corBadge};padding:2px 8px;border-radius:10px;margin-left:6px;font-weight:700;">${c.badge}</span>
                        ${c.enviadoHoje ? `<span style="font-size:11px;background:rgba(16,185,129,0.2);color:#10b981;padding:2px 8px;border-radius:10px;margin-left:6px;font-weight:800;">✅ Enviado hoje</span>` : ''}
                    </div>
                    <div style="font-size:11px;color:#FFD700;font-weight:700;">🧾 ${c.ultimoResumo} | 💰 ${UI.R(c.totalGasto)}</div>
                </div>
                <textarea id="recap-msg-${c.key}" class="form-input" rows="3" style="width:100%;font-size:13px;line-height:1.45;margin-bottom:8px;background:rgba(0,0,0,0.35);">${c.mensagem}</textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <button class="btn btn-sm btn-ghost" style="font-size:11px;" onclick="IARecaptura.refinarComGemini('${c.key}')">✨ Variação Google Gemini</button>
                    <button class="btn btn-sm" style="background:#10b981;color:#052e16;font-weight:900;padding:7px 16px;font-size:13px;" onclick="IARecaptura.enviarWhatsAppCliente('${c.key}', '${c.telWhatsApp}')">
                        📲 Enviar ${this.etapaAtual === 'quebra_gelo' ? '1ª Msg Black' : '2ª Msg + Grupo'}
                    </button>
                </div>
            </div>`).join('');

        const restantes = lista.length - exibidos.length;
        const rodapeHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:8px 4px;font-size:12px;color:var(--text-muted);">
                <span>Exibindo <strong>${exibidos.length}</strong> de <strong>${lista.length}</strong> cliente(s)</span>
                ${restantes > 0 ? `<div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-ghost" onclick="IARecaptura.carregarMais(50)">➕ Carregar +50 (${restantes} restantes)</button>
                    <button class="btn btn-sm btn-primary" onclick="IARecaptura.carregarMais('todos')">📋 Mostrar Todos (${lista.length})</button>
                </div>` : ''}
            </div>`;

        container.innerHTML = cardsHtml + rodapeHtml;
    }
};

window.IARecaptura = IARecaptura;
