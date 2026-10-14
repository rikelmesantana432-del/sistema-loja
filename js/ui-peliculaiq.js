// StrategyOS — UI de Inteligência de Compatibilidade de Películas 3D (PeliculAIQ)
// Identidade Visual Premium StrategyOS (Cores Neons, Dark Mode, Glassmorphism)

UI.renderPeliculAIQ = function () {
    const content = document.getElementById('main-content');
    if (!content) return;

    let html = `
    <div class="dashboard-section" style="animation: fadeIn 0.3s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="font-size:26px;font-weight:900;color:#FFF;margin:0;display:flex;align-items:center;gap:10px;">
                    <span>📱</span> INTELIGÊNCIA DE PELÍCULAS 3D
                    <span style="font-size:11px;background:linear-gradient(135deg, #00FFA3, #00B8FF);color:#000;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;">POWERED BY PeliculAIQ</span>
                </h2>
                <p style="font-size:14px;color:var(--text-muted);margin:4px 0 0 0;">Cruzamento inteligente de compatibilidade de telas & Estoque Ativo da Loja</p>
            </div>
            <div style="background:rgba(0,255,163,0.08);border:1px solid rgba(0,255,163,0.2);padding:8px 16px;border-radius:12px;text-align:right;">
                <span style="font-size:12px;color:var(--text-muted);display:block;">Catálogo Catalogado</span>
                <strong style="font-size:18px;color:#00FFA3;" id="peliculaiq-total-count">${window.PeliculAIQ?.db?.length || 1370} Aparelhos</strong>
            </div>
        </div>

        <!-- CARD DE BUSCA PRINCIPAL -->
        <div style="background:var(--card-bg, #1a1a2e);border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:16px;padding:22px;margin-bottom:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <label style="font-size:15px;font-weight:700;color:var(--text-color, #fff);margin-bottom:10px;display:block;">
                🔍 Qual o modelo do celular do cliente?
            </label>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <input type="text" id="peliculaiq-search-input" class="form-input" 
                       placeholder="Ex: Moto G20, Galaxy A15, iPhone 13, Redmi Note 12..." 
                       style="flex:1;min-width:260px;font-size:17px;padding:14px 18px;border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid var(--border-color, rgba(255,255,255,0.15));color:#fff;"
                       onkeypress="if(event.key==='Enter') UI._peliculAIQExecutarBusca()">
                <button class="btn btn-primary" onclick="UI._peliculAIQExecutarBusca()" style="padding:14px 28px;font-size:16px;font-weight:800;border-radius:12px;background:linear-gradient(135deg, #00FFA3, #00B8FF);color:#000;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;">
                    ⚡ BUSCAR COMPATÍVEIS
                </button>
            </div>
            
            <div style="margin-top:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:13px;color:var(--text-muted);">Atalhos rápidos:</span>
                <button class="btn btn-sm btn-ghost" onclick="document.getElementById('peliculaiq-search-input').value='Moto G20';UI._peliculAIQExecutarBusca();" style="font-size:12px;padding:4px 10px;border-radius:8px;">📱 Moto G20</button>
                <button class="btn btn-sm btn-ghost" onclick="document.getElementById('peliculaiq-search-input').value='Galaxy A03';UI._peliculAIQExecutarBusca();" style="font-size:12px;padding:4px 10px;border-radius:8px;">📱 Galaxy A03</button>
                <button class="btn btn-sm btn-ghost" onclick="document.getElementById('peliculaiq-search-input').value='Redmi Note 12';UI._peliculAIQExecutarBusca();" style="font-size:12px;padding:4px 10px;border-radius:8px;">📱 Redmi Note 12</button>
                <button class="btn btn-sm btn-ghost" onclick="document.getElementById('peliculaiq-search-input').value='iPhone 13';UI._peliculAIQExecutarBusca();" style="font-size:12px;padding:4px 10px;border-radius:8px;">📱 iPhone 13</button>
            </div>
        </div>

        <!-- ÁREA DE RESULTADOS -->
        <div id="peliculaiq-results-area">
            <div style="text-align:center;padding:40px 20px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.1);border-radius:16px;">
                <div style="font-size:48px;margin-bottom:12px;">📱✨</div>
                <h3 style="font-size:18px;color:#FFF;margin:0 0 6px 0;">Digite o modelo acima para consultar as películas 3D compatíveis</h3>
                <p style="font-size:14px;color:var(--text-muted);margin:0;">O sistema fará a análise física da tela e mostrará quais películas do estoque servem perfeitamente.</p>
            </div>
        </div>
    </div>`;

    content.innerHTML = html;
};

UI._peliculAIQExecutarBusca = function () {
    const input = document.getElementById('peliculaiq-search-input');
    const resultsArea = document.getElementById('peliculaiq-results-area');
    if (!input || !resultsArea) return;

    const query = input.value.trim();
    if (!query) {
        if (typeof UI.toast === 'function') UI.toast('Digite o modelo do aparelho para buscar!', 'warning');
        return;
    }

    resultsArea.innerHTML = `
        <div style="text-align:center;padding:40px;">
            <div style="font-size:32px;animation:spin 1s linear infinite;display:inline-block;">⚡</div>
            <p style="margin-top:12px;color:var(--text-muted);font-size:16px;">Analisando parâmetros de tela & verificando estoque da loja...</p>
        </div>`;

    setTimeout(() => {
        if (!window.PeliculAIQ) {
            resultsArea.innerHTML = `<div style="padding:20px;color:#ef4444;">Erro: Módulo PeliculAIQ não encontrado.</div>`;
            return;
        }

        const res = window.PeliculAIQ.buscarCompatibilidades(query);

        if (!res.sucesso) {
            resultsArea.innerHTML = `
                <div style="padding:24px;background:rgba(239,68,68,0.08);border:1px solid #ef4444;border-radius:14px;color:#fff;">
                    <h4 style="margin:0 0 8px 0;color:#ef4444;font-size:18px;">⚠️ Aparelho não localizado</h4>
                    <p style="margin:0;font-size:14px;color:var(--text-muted);">${res.erro}</p>
                    <p style="margin-top:10px;font-size:13px;">Dica: Tente digitar sem a marca (Ex: use "G20" em vez de "Motorola Moto G20").</p>
                </div>`;
            return;
        }

        const alvo = res.aparelhoAlvo;
        const compativeis = res.compativeis;

        let html = `
        <div style="background:rgba(0,220,255,0.06);border:1px solid rgba(0,220,255,0.2);border-radius:16px;padding:18px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div>
                    <span style="font-size:12px;color:var(--accent-cyan, #00B8FF);font-weight:800;letter-spacing:1px;">APARELHO SELECIONADO</span>
                    <h3 style="font-size:22px;color:#FFF;margin:2px 0 0 0;font-weight:900;">${alvo.modelo} <span style="font-size:14px;color:var(--text-muted);font-weight:400;">(${alvo.marca})</span></h3>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
                        <span>📐 Tela: <strong>${alvo.tela}</strong></span> | 
                        <span>📺 Resolução: <strong>${alvo.resolucao}</strong></span>
                    </div>
                </div>
                <div>
                    <span style="font-size:14px;background:rgba(0,255,163,0.15);color:#00FFA3;padding:6px 14px;border-radius:20px;font-weight:800;border:1px solid rgba(0,255,163,0.3);">
                        ✨ ${res.totalCompativeisEncontrados} Películas Compatíveis
                    </span>
                </div>
            </div>
        </div>`;

        if (compativeis.length === 0) {
            html += `<p style="padding:20px;text-align:center;color:var(--text-muted);">Nenhuma película com compatibilidade acima de 70% foi encontrada para este modelo específico.</p>`;
        } else {
            html += `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(310px, 1fr));gap:16px;">`;

            compativeis.forEach(item => {
                const matchPct = item.percentualCompatibilidade;
                const matchColor = matchPct >= 95 ? '#00FFA3' : matchPct >= 85 ? '#00B8FF' : '#F59E0B';
                const temEstoque = item.estoqueLoja && item.estoqueLoja.disponivel;
                const qtdEstoque = item.estoqueLoja ? item.estoqueLoja.quantidade : 0;
                const isIAExpanded = item.origemBase === 'Expandido_IA_StrategyOS';

                html += `
                <div style="background:var(--card-bg, #1a1a2e);border:1px solid ${temEstoque ? 'rgba(0,255,163,0.4)' : 'var(--border-color, rgba(255,255,255,0.08))'};border-radius:14px;padding:16px;position:relative;display:flex;flex-direction:column;justify-space:between;">
                    ${temEstoque ? `<span style="position:absolute;top:-10px;right:12px;background:#00FFA3;color:#000;font-size:11px;font-weight:900;padding:2px 10px;border-radius:10px;box-shadow:0 4px 12px rgba(0,255,163,0.3);">EM ESTOQUE (${qtdEstoque} un)</span>` : ''}

                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                            <div>
                                <h4 style="font-size:17px;font-weight:800;color:#FFF;margin:0;">${item.modelo}</h4>
                                <span style="font-size:12px;color:var(--text-muted);">${item.marca}</span>
                            </div>
                            <div style="text-align:right;">
                                <span style="font-size:18px;font-weight:900;color:${matchColor};">${matchPct}%</span>
                                <span style="font-size:10px;display:block;color:var(--text-muted);">MATCH</span>
                            </div>
                        </div>

                        <!-- BADGE DE SINALIZAÇÃO DE ORIGEM -->
                        <div style="margin-bottom:10px;">
                            ${isIAExpanded ? 
                                `<span style="font-size:10px;background:rgba(147,51,234,0.15);color:#a855f7;border:1px solid rgba(147,51,234,0.3);padding:2px 8px;border-radius:6px;font-weight:700;">✨ Expandido IA StrategyOS (pós 1.300)</span>` :
                                `<span style="font-size:10px;background:rgba(255,255,255,0.05);color:var(--text-muted);padding:2px 8px;border-radius:6px;">📚 Base de Dados Infinito</span>`
                            }
                        </div>

                        <!-- BARRA DE PROGRESSO DE COMPATIBILIDADE -->
                        <div style="background:rgba(255,255,255,0.08);height:6px;border-radius:3px;margin-bottom:12px;overflow:hidden;">
                            <div style="background:${matchColor};height:100%;width:${matchPct}%;"></div>
                        </div>
                    </div>

                    <!-- BOTÃO OU STATUS DE ESTOQUE DA LOJA -->
                    <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
                        ${temEstoque ? `
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <span style="font-size:13px;color:#00FFA3;font-weight:700;">✅ Sirva a película do ${item.modelo}</span>
                                <button class="btn btn-sm btn-primary" onclick="UI._vndEscolherPeliculaEspecial('${item.modelo}')" style="font-size:11px;padding:4px 10px;background:#00FFA3;color:#000;font-weight:800;">🛒 Colocar</button>
                            </div>
                        ` : `
                            <span style="font-size:12px;color:var(--text-muted);">❌ Película do ${item.modelo} esgotada na gaveta</span>
                        `}
                    </div>
                </div>`;
            });

            html += `</div>`;
        }

        resultsArea.innerHTML = html;
    }, 250);
};
