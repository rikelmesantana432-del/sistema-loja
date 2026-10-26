// ====================================
// STRATEGYOS 3.0 - UI CORE
// Modo duplo: Simplificado/Completo + Escuro/Claro
// ====================================

const UI = {
    paginaAtual: 'inicio',

    // === INIT ===
    init() {
        const prefs = dataManager.getPreferencias();
        this._aplicarTema(prefs.tema);
        this._aplicarModo(prefs.modo);
        this._initAtalhos();
        this.render();
        dataManager.verificarInadimplencia();
        this._atualizarAlertas();
        if (typeof dataManager.iniciarPilotoAutomaticoTelegram === 'function') {
            dataManager.iniciarPilotoAutomaticoTelegram();
        }
        
        // Alerta de deploy de teste
        const host = window.location.hostname;
        if (host.includes('netlify.app') && host !== 'cesinha-acessorios-strategyos.netlify.app' && !document.getElementById('banner-deploy-teste')) {
            const banner = document.createElement('div');
            banner.id = 'banner-deploy-teste';
            banner.style.cssText = 'background:#e63757;color:#fff;text-align:center;padding:12px;font-size:15px;font-weight:900;position:sticky;top:0;z-index:999999;box-shadow:0 4px 15px rgba(0,0,0,0.3);line-height:1.4;';
            banner.innerHTML = `⚠️ ATENÇÃO: Você está em um link temporário de testes! Vendas e notas salvas aqui NÃO vão aparecer no link oficial. <a href="https://cesinha-acessorios-strategyos.netlify.app" style="color:#FFD700;text-decoration:underline;margin-left:8px;font-weight:bold;">Acesse o link oficial aqui!</a>`;
            document.body.prepend(banner);
        }

        // Aplicar estado treino
        if (dataManager.isModoTreino()) {
            const trInd = document.getElementById('treino-indicator');
            const trBtn = document.getElementById('btn-treino');
            if (trInd) trInd.style.display = 'block';
            if (trBtn) trBtn.classList.add('active');
        }
    },

    render() { this.navigate(this.paginaAtual); },

    // === NAVEGAÇÃO ===
    navigate(pagina) {
        const main = document.getElementById('main-content');
        if (!main) return;

        main.style.opacity = '0';
        main.style.transform = 'translateY(8px)';
        main.style.transition = 'opacity 0.12s ease, transform 0.12s ease';

        setTimeout(() => {
            this.paginaAtual = pagina;
            document.querySelectorAll('.nav-btn, .mob-nav-item').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.nav-btn[data-page="${pagina}"]`);
            if (btn) btn.classList.add('active');
            const mobBtn = document.querySelector(`.mob-nav-item[data-page="${pagina}"]`);
            if (mobBtn) mobBtn.classList.add('active');
            // Fechar sidebar no mobile e voltar ao topo
            document.getElementById('sidebar')?.classList.remove('open');
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}

            try {
                switch (pagina) {
                    case 'inicio': this.renderDashboard(); break;
                    case 'celulares': UI.renderCelulares(); break;
                    case 'acessorios': UI.renderAcessorios(); break;
                    case 'cobrancas': UI.renderCobrancas(); break;
                    case 'assistencia': UI.renderAssistencia(); break;
                    case 'clientes': UI.renderClientes(); break;
                    case 'campanhas': UI.renderCampanhas(); break;
                    case 'registrar': UI.renderRegistrar(); break;
                    case 'historico': UI.renderHistorico(); break;
                    case 'caixa':
                        if (typeof UI.renderCaixa === 'function') UI.renderCaixa();
                        else this.toast('Módulo de caixa não carregado', 'error');
                        break;
                    case 'financeiro':
                        if (typeof UI.renderFinanceiro === 'function') UI.renderFinanceiro();
                        else this.toast('Módulo financeiro não carregado', 'error');
                        break;
                    case 'trocas':
                        if (typeof UI.renderTrocas === 'function') UI.renderTrocas();
                        else this.toast('Módulo de trocas não carregado', 'error');
                        break;
                    case 'vendedor':
                        if (typeof UI.renderVendedor === 'function') UI.renderVendedor();
                        break;
                    case 'fiado':
                        if (typeof UI.renderFiado === 'function') UI.renderFiado();
                        else this.toast('Módulo fiado não carregado', 'error');
                        break;
                    case 'sugestoes':
                        if (typeof UI.renderIASugestoes === 'function') UI.renderIASugestoes();
                        else if (typeof UI.renderSugestoes === 'function') UI.renderSugestoes();
                        break;
                    case 'fidelidade':
                        if (typeof UI.renderFidelidade === 'function') UI.renderFidelidade();
                        break;
                    case 'estoque':
                        if (typeof UI.renderEstoque === 'function') UI.renderEstoque();
                        else this.toast('Módulo estoque não carregado', 'error');
                        break;
                    default:
                        this.renderDashboard();
                }
            } catch (err) {
                console.error('Erro na renderização da página:', err);
                this.toast('Erro ao carregar tela: ' + err.message, 'error');
            } finally {
                main.style.opacity = '1';
                main.style.transform = 'translateY(0)';
            }
        }, 120);
    },

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    },

    // === BUSCA INSTANTÂNEA NO ESTOQUE POR LETRA ===
    buscarEstoqueAoDigitar(query) {
        const box = document.getElementById('global-search-results');
        if (!box) return;
        if (!query || query.trim().length === 0) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }

        const res = dataManager.buscarEstoqueInteligente(query);
        if (res.length === 0) {
            box.style.display = 'block';
            box.innerHTML = `<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px;">❌ Nenhum item encontrado para "${query}"</div>`;
            return;
        }

        let html = `<div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:8px;text-transform:uppercase;">🔍 ${res.length} resultados encontrados:</div>`;
        res.forEach(item => {
            const isDisponivel = item.status === 'disponivel' || item.quantidade > 0;
            const icon = item.tipo === 'celular' ? '📱' : '📦';
            const badgeColor = isDisponivel ? '#10b981' : '#ef4444';
            const badgeText = isDisponivel ? (item.tipo === 'acessorio' ? `${item.quantidade} un` : 'Disponível') : 'Esgotado';

            html += `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;border-radius:8px;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" onclick="UI._selecionarResultadoBusca('${item.tipo}', '${item.id}')">
                    <div style="flex:1;">
                        <div style="font-weight:700;color:#fff;font-size:13px;">${icon} ${item.nome}</div>
                        <div style="font-size:11px;color:var(--text-secondary);">${item.categoria} • <span style="color:${badgeColor};font-weight:700;">${badgeText}</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800;color:#10b981;font-size:14px;">${UI.R(item.preco)}</div>
                        <button class="btn btn-sm btn-primary" style="font-size:10px;padding:3px 8px;margin-top:2px;">🛒 Selecionar</button>
                    </div>
                </div>`;
        });

        box.style.display = 'block';
        box.innerHTML = html;
    },

    _selecionarResultadoBusca(tipo, id) {
        const box = document.getElementById('global-search-results');
        if (box) box.style.display = 'none';
        const input = document.getElementById('global-search-input');
        if (input) input.value = '';

        if (tipo === 'celular') {
            UI.navigate('celulares');
        } else {
            UI.navigate('acessorios');
        }
    },

    // === TEMA + MODO ===
    alternarTema() {
        const prefs = dataManager.getPreferencias();
        const novo = prefs.tema === 'escuro' ? 'claro' : 'escuro';
        dataManager.setPreferencia('tema', novo);
        this._aplicarTema(novo);
    },

    // === MODO TREINO ===
    alternarTreino() {
        if (dataManager.isModoTreino()) {
            dataManager.desativarModoTreino();
            document.getElementById('treino-indicator').style.display = 'none';
            document.getElementById('btn-treino').classList.remove('active');
            this.toast('Modo treino DESATIVADO — dados restaurados', 'info');
        } else {
            dataManager.ativarModoTreino();
            document.getElementById('treino-indicator').style.display = 'block';
            document.getElementById('btn-treino').classList.add('active');
            this.toast('🎓 Modo treino ATIVADO — nada é salvo de verdade', 'success');
        }
        this.render();
    },

    // === ATALHOS DE TECLADO ===
    _initAtalhos() {
        document.addEventListener('keydown', e => {
            if (!e.ctrlKey || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            switch (e.key.toLowerCase()) {
                case 'v': e.preventDefault(); UI.navigate('vendedor'); break;
                case 'e': e.preventDefault(); UI.navigate('celulares'); break;
                case 't': e.preventDefault(); UI.navigate('trocas'); break;
                case 'p': e.preventDefault(); UI.navigate('cobrancas'); break;
                case 'd': e.preventDefault(); UI.navigate('inicio'); break;
            }
        });
    },

    _aplicarTema(tema) {
        document.body.classList.remove('tema-escuro', 'tema-claro');
        document.body.classList.add(`tema-${tema}`);
        const btn = document.getElementById('btn-tema');
        if (btn) btn.textContent = tema === 'escuro' ? '🌙' : '☀️';
    },

    alternarModo() {
        const prefs = dataManager.getPreferencias();
        const novo = prefs.modo === 'simplificado' ? 'completo' : 'simplificado';
        dataManager.setPreferencia('modo', novo);
        this._aplicarModo(novo);
        this.render();
    },

    _aplicarModo(modo) {
        document.body.classList.remove('modo-simplificado', 'modo-completo');
        document.body.classList.add(`modo-${modo}`);
        const btn = document.getElementById('btn-modo');
        if (btn) btn.textContent = modo === 'simplificado' ? '📱' : '🖥️';
    },

    getModo() { return dataManager.getPreferencias().modo; },

    // === DASHBOARD ===
    renderDashboard() {
        const f = dataManager.data.financeiro;
        const meta = dataManager.calcularProgressoMeta();
        const celulares = dataManager.getEstoqueCelulares();
        const acessorios = dataManager.getEstoqueAcessorios();
        const creds = dataManager.getCrediariosAtivos();
        const oss = dataManager.getOrdensAtivas();
        const isCompleto = this.getModo() === 'completo';

        // Produtos prioritários (IRP > 40)
        const prioridade = celulares.map(p => {
            const irp = Calculators.calcularIRP(p);
            const desc = Calculators.calcularDescontoTempo(p);
            return { ...p, irp, desc };
        }).filter(p => p.irp > 30).sort((a, b) => b.irp - a.irp).slice(0, 5);

        let html = '';

        // === HERO: SEU DINHEIRO ===
        if (isCompleto) {
            const isf = Calculators.calcularISF();
            const isfClass = Calculators.classificarISF(isf);
            const patrimonio = dataManager.calcularPatrimonioTotal();
            const estoqueVal = dataManager.calcularValorEstoqueCelulares();
            const totalReceber = dataManager.calcularTotalAReceber();

            html += `
            <div class="hero-section" style="padding: 24px 16px;">
                <div style="display:flex; justify-content:center; gap:24px; align-items:center; flex-wrap:wrap;">
                    <div style="text-align:center;">
                        <div class="hero-value" style="font-size:36px; color:var(--accent-purple);">${this.R(f.caixaSecundario || 0)}</div>
                        <div class="hero-label" style="font-size:12px; color:var(--accent-purple);">Caixa Balcão / Gaveta</div>
                    </div>
                    <div style="width:1px; height:45px; background:rgba(255,255,255,0.15)"></div>
                    <div style="text-align:center;">
                        <div class="hero-value" style="font-size:36px; color:#f97316;">${this.R(f.caixaFogos || 0)}</div>
                        <div class="hero-label" style="font-size:12px; color:#f97316;">Caixa de Fogos</div>
                    </div>
                </div>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px;font-size:13px;color:var(--text-muted)">
                    <span>📦 Estoque: ${celulares.length} — ${this.R(estoqueVal)} (custo)</span>
                    <span>💳 Crediários: ${this.R(totalReceber)} (${creds.length} ativos)</span>
                </div>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px;font-size:13px">
                    <span>🛡️ Segurança: ${isfClass.emoji} ${isf}/100 — ${isfClass.texto}</span>
                    <span>💰 Patrimônio Total: ${this.R(patrimonio)}</span>
                </div>
            </div>`;
        } else {
            html += `
            <div class="hero-section" style="padding: 24px 16px;">
                <div style="display:flex; justify-content:center; gap:24px; align-items:center; flex-wrap:wrap;">
                    <div style="text-align:center;">
                        <div class="hero-value" style="font-size:36px; color:var(--accent-purple);">${this.R(f.caixaSecundario || 0)}</div>
                        <div class="hero-label" style="font-size:12px; color:var(--accent-purple);">Caixa Balcão / Gaveta</div>
                    </div>
                    <div style="width:1px; height:45px; background:rgba(255,255,255,0.15)"></div>
                    <div style="text-align:center;">
                        <div class="hero-value" style="font-size:36px; color:#f97316;">${this.R(f.caixaFogos || 0)}</div>
                        <div class="hero-label" style="font-size:12px; color:#f97316;">Caixa de Fogos</div>
                    </div>
                </div>
            </div>`;
        }

        // === 4+ CARDS RÁPIDOS ===
        html += `<div class="quick-cards">
            <div class="dash-card" onclick="UI.navigate('celulares')">
                <div class="dash-card-value">${celulares.length}</div>
                <div class="dash-card-label">📱 Celulares</div>
            </div>
            <div class="dash-card" onclick="UI.navigate('acessorios')">
                <div class="dash-card-value">${acessorios.length}</div>
                <div class="dash-card-label">📦 Acessórios</div>
            </div>
            <div class="dash-card" onclick="UI.navigate('cobrancas')">
                <div class="dash-card-value">${creds.length}</div>
                <div class="dash-card-label">💳 Cobranças</div>
            </div>
            <div class="dash-card" onclick="UI.navigate('assistencia')">
                <div class="dash-card-value">${oss.length}</div>
                <div class="dash-card-label">🔧 Consertos</div>
            </div>
        </div>`;



        // === PRIORIDADE DE VENDA ===
        if (prioridade.length > 0) {
            html += `<h3 class="dash-section-title">🚨 VENDER PRIMEIRO</h3>`;
            html += `<div class="priority-table"><table><thead><tr>
                <th>Produto</th><th>Dias</th><th>Margem</th><th>Desconto</th>
                ${isCompleto ? '<th>Nova Margem</th>' : ''}<th>Ação</th>
            </tr></thead><tbody>`;
            prioridade.forEach(p => {
                const acaoEmoji = p.desc.acao === 'troca' ? '🔴' : p.desc.acao === 'liquidar' ? '🔴' : p.desc.acao === 'baixar' ? '🟡' : '🟢';
                const acaoLabel = p.desc.acao === 'troca' ? 'Troca' : p.desc.acao === 'liquidar' ? 'Liquidar' : p.desc.acao === 'baixar' ? 'Baixar' : 'Manter';
                html += `<tr>
                    <td>${p.nome}</td>
                    <td>${p.desc.dias}d</td>
                    <td>${p.desc.margem}%</td>
                    <td>${p.desc.pctDesconto > 0 ? p.desc.pctDesconto + '%' : '—'}</td>
                    ${isCompleto ? `<td>${p.desc.novaMargem}%</td>` : ''}
                    <td>${acaoEmoji} ${acaoLabel}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        }

        // === BOTÕES DE AÇÃO ===
        html += `<div class="action-buttons">
            <button class="btn btn-success btn-xl" onclick="UI.navigate('registrar')">🛒 Registrar Venda</button>
            <button class="btn btn-primary btn-xl" onclick="UI.navigate('celulares')">📱 Ver Celulares</button>
            <button class="btn btn-warning btn-xl" onclick="UI.navigate('cobrancas')">💳 Ver Cobranças</button>
        </div>`;

        // === GESTÃO DE CAIXA ===
        if (typeof UI._renderBotoesCaixa === 'function') {
            html += `<h3 class="dash-section-title">💰 GESTÃO DE CAIXA</h3>`;
            html += UI._renderBotoesCaixa();
        }

        // === GRÁFICO DE VENDAS ===
        html += `<h3 class="dash-section-title" style="margin-top:20px">📈 VENDAS — ÚLTIMOS 7 DIAS</h3>`;
        html += `<div id="grafico-vendas" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.08);border-radius:12px;padding:8px;min-height:220px"></div>`;

        // === BLOCO DE NOTAS & RECADOS ===
        if (typeof UI._obterWidgetBlocoNotas === 'function') {
            html += UI._obterWidgetBlocoNotas();
        }

        document.getElementById('main-content').innerHTML = html;

        setTimeout(() => {
            const els = document.querySelectorAll('.hero-value, .dash-card-value');
            els.forEach(el => {
                const text = el.textContent;
                const isMoney = text.includes('R$');
                let sufixo = '';
                if (text.includes(' un')) sufixo = ' un';
                if (text.includes(' und')) sufixo = ' und';

                const txt = text.replace(/[^\d,-]/g, '').replace(',', '.');
                const val = parseFloat(txt);
                if (!isNaN(val)) {
                    if (isMoney) {
                        UI.animarNumero(el, val, 800, 'R$ ', 2, sufixo);
                    } else {
                        UI.animarNumero(el, val, 800, '', 0, sufixo);
                    }
                }
            });
            if (typeof UI._renderGraficoVendas === 'function') UI._renderGraficoVendas();
        }, 50);
    },

    // === ALERTAS ===
    _atualizarAlertas() {
        const alertas = this.gerarAlertas();
        const badge = document.getElementById('notif-count');
        if (badge) {
            badge.textContent = alertas.length;
            badge.style.display = alertas.length > 0 ? 'inline-flex' : 'none';
        }
    },

    gerarAlertas() {
        const alertas = [];
        const f = dataManager.data.financeiro;
        const saldoOperacional = (f.caixaSecundario || 0) + (f.caixaTerciario || 0);
        if (saldoOperacional < 500) alertas.push({ tipo: 'danger', msg: '💰 Caixa operacional baixo! Só ' + this.R(saldoOperacional) });
        
        const semCusto = dataManager.getProdutosSemCusto();
        if (semCusto.total > 0) {
            alertas.push({ tipo: 'warning', msg: `⚠️ ${semCusto.total} produto(s) no estoque estão SEM CUSTO cadastrado` });
        }
        const inadimplentes = dataManager.verificarInadimplencia();
        inadimplentes.forEach(i => alertas.push({ tipo: 'warning', msg: `⚠️ ${i.cliente}: ${i.dias} dias de atraso (${this.R(i.valor)})` }));
        const estoque = dataManager.getEstoqueCelulares();
        estoque.forEach(p => {
            const dias = dataManager.diasNoEstoque(p);
            if (dias > 45) alertas.push({ tipo: 'warning', msg: `📱 ${p.nome}: ${dias} dias parado` });
        });
        if (estoque.length < 3) alertas.push({ tipo: 'info', msg: '📦 Estoque baixo — só ' + estoque.length + ' celulares' });
        return alertas;
    },

    abrirAlertas() {
        const alertas = this.gerarAlertas();
        if (alertas.length === 0) return this.toast('✅ Nenhum alerta', 'success');
        const html = alertas.map(a => `<div class="alerta-item alerta-${a.tipo}">${a.msg}</div>`).join('');
        this.openModal('🔔 Alertas', html);
    },

    // === MODAL ===
    openModal(titulo, html, footerHtml) {
        if (html === undefined && typeof titulo === 'string') {
            html = titulo;
            titulo = '🔔 StrategyOS 3.0';
        }
        if (footerHtml) {
            html = `${html || ''}<div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">${footerHtml}</div>`;
        }
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        const overlay = document.getElementById('modal-overlay');
        if (titleEl) titleEl.textContent = titulo;
        if (bodyEl) bodyEl.innerHTML = html;
        if (overlay) {
            overlay.style.display = '';
            overlay.classList.add('active');
            overlay.onclick = function(e) {
                if (e.target === overlay) UI.closeModal();
            };
        }
    },

    showModal(titulo, html, footerHtml) {
        return this.openModal(titulo, html, footerHtml);
    },

    modal(titulo, html, footerHtml) {
        return this.openModal(titulo, html, footerHtml);
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    setContent(titulo, html) {
        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = `<div class="dashboard-section"><h2 style="margin-bottom:16px;">${titulo || ''}</h2>${html || ''}</div>`;
        }
    },

    showToast(msg, tipo = 'info') {
        return this.toast(msg, tipo);
    },

    novaOS(modeloPre = '', servicoPre = '', valorPre = '') {
        if (typeof this.modalNovaOS === 'function') return this.modalNovaOS(modeloPre, servicoPre, valorPre);
        if (typeof this._assistNovaOS === 'function') return this._assistNovaOS();
        this.navigate('assistencia');
    },

    instalarAppPWA() {
        if (window._deferredPWAPrompt) {
            window._deferredPWAPrompt.prompt();
        } else {
            this.toast('📱 Para instalar: no menu do navegador, clique em "Adicionar à tela inicial" ou "Instalar aplicativo".', 'info');
        }
    },

    // === TOAST ===
    toast(msg, tipo = 'info') {
        let container = document.getElementById('toast-container');
        if (!container && document.body) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        if (!container) return;
        const toast = document.createElement('div');
        const icones = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `<span style="font-size:18px">${icones[tipo] || 'ℹ️'}</span><span>${msg}</span>`;
        toast.addEventListener('click', () => {
            toast.style.transform = 'translateX(120%) scale(0.85)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        });
        container.appendChild(toast);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    },

    // === ANIMAÇÃO NÚMERO ===
    animarNumero(elemento, valorFinal, duracao = 800, prefixo = 'R$ ', decimais = 2, sufixo = '') {
        const inicio = Date.now();
        const valorInicial = 0;
        function atualizar() {
            const agora = Date.now();
            const progresso = Math.min((agora - inicio) / duracao, 1);
            const ease = 1 - Math.pow(1 - progresso, 3);
            const valorAtual = valorInicial + (valorFinal - valorInicial) * ease;
            if (decimais === 0) {
                elemento.textContent = prefixo + Math.round(valorAtual).toLocaleString('pt-BR') + sufixo;
            } else {
                elemento.textContent = prefixo + valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais }) + sufixo;
            }
            if (progresso < 1) requestAnimationFrame(atualizar);
        }
        requestAnimationFrame(atualizar);
    },

    // === FORMATAÇÃO ===
    R(valor) {
        if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
};

window.UI = UI;

