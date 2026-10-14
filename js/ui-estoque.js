// StrategyOS 3.1 — Gestão de Estoque COMPLETA
// Aba separada | Quantidade obrigatória | +Add Mais | Filtros | Resumo

UI.renderEstoque = function () {
    const celulares = dataManager.getEstoqueCelulares();
    const acessorios = dataManager.getEstoqueAcessorios();
    const totalUnidades = celulares.reduce((s, p) => s + (p.quantidade || 1), 0) + acessorios.reduce((s, a) => s + (a.quantidade || 1), 0);
    const totalCusto = celulares.reduce((s, p) => s + (p.custo || 0), 0) + acessorios.reduce((s, a) => s + (a.custo || 0) * (a.quantidade || 1), 0);
    const totalItens = celulares.length + acessorios.length;

    const renderLista = (filtro, tipo) => {
        let html = '';
        const f = (filtro || '').toLowerCase();

        // Widget de Estoque Crítico (Itens acabando <= 3 un)
        const acessoriosAcabando = acessorios.filter(a => (a.quantidade || 0) <= 3);
        if (acessoriosAcabando.length > 0 && !f) {
            html += `
            <div style="background:rgba(239,68,68,0.08);border:1px solid var(--accent-red);border-radius:14px;padding:16px;margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <h3 style="font-size:18px;color:var(--accent-red);margin:0;font-weight:800">⚠️ ESTOQUE CRÍTICO (${acessoriosAcabando.length} ITENS EM FALTA / ACABANDO)</h3>
                    <span style="font-size:12px;color:var(--text-muted)">Reposição urgente necessária</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
                    ${acessoriosAcabando.map(item => `
                        <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center">
                            <div>
                                <strong style="font-size:14px;color:#FFF">${item.nome}</strong>
                                <div style="font-size:12px;color:${item.quantidade <= 0 ? 'var(--accent-red)' : 'var(--accent-yellow)'}">${item.quantidade <= 0 ? '❌ ESGOTADO' : '⚠️ Apenas ' + item.quantidade + ' un'}</div>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="UI._estoqueAddMais('${item.id}','acessorio')">+ Repor</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        // Produtos Sem Custo Cadastrado
        if (tipo === 'sem_custo') {
            const cSemCusto = celulares.filter(p => !p.custo || p.custo <= 0);
            const aSemCusto = acessorios.filter(a => !a.custo || a.custo <= 0);
            const todosSemCusto = [...cSemCusto.map(c => ({ ...c, _tipoOriginal: 'cel' })), ...aSemCusto.map(a => ({ ...a, _tipoOriginal: 'acess' }))];
            const semCustoFiltrados = f ? todosSemCusto.filter(p => p.nome.toLowerCase().includes(f)) : todosSemCusto;

            html += `
            <div style="background:rgba(245,158,11,0.08);border:1px solid #f59e0b;border-radius:14px;padding:16px;margin-bottom:20px;">
                <h3 style="font-size:20px;color:#f59e0b;margin:0 0 8px;font-weight:800">⚠️ APARELHOS E PRODUTOS SEM CUSTO (${semCustoFiltrados.length})</h3>
                <p style="font-size:13px;color:var(--text-muted);margin:0">Digite o valor de custo pago por cada item abaixo e clique em Salvar para atualizar a margem e o DRE financeiro da loja.</p>
            </div>`;

            if (semCustoFiltrados.length === 0) {
                html += '<p style="text-align:center;padding:30px;color:var(--accent-green);font-size:18px">🎉 Todos os produtos do estoque já possuem custo cadastrado!</p>';
            } else {
                semCustoFiltrados.forEach(p => {
                    html += `
                    <div style="background:var(--card-bg);border:1px solid #f59e0b;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                        <div>
                            <div style="font-size:18px;font-weight:800;color:#FFF">${p._tipoOriginal === 'cel' ? '📱' : '🎧'} ${p.nome}</div>
                            <div style="font-size:14px;color:var(--text-muted);margin-top:4px">
                                <strong>Preço de Venda:</strong> <span style="color:#00FFA3;font-weight:700">${UI.R(p.precoVenda)}</span> | 
                                <strong>Quantidade:</strong> ${p.quantidade || 1} un
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <label style="font-size:14px;color:#f59e0b;font-weight:700">Custo Pago (R$):</label>
                            <input type="number" id="custo-inp-${p.id}" class="form-input" style="width:130px;padding:10px;font-size:18px;color:#f59e0b;font-weight:800;text-align:center" placeholder="0.00" value="${p.custo || ''}">
                            <button class="btn" style="background:#f59e0b;color:#000;font-weight:900;font-size:15px;padding:10px 16px;" onclick="UI._estoqueSalvarCustoRapido('${p.id}', '${p._tipoOriginal}')">💾 Salvar Custo</button>
                        </div>
                    </div>`;
                });
            }
            return html;
        }

        // Celulares
        if (tipo === 'todos' || tipo === 'celulares') {
            const celFiltrados = f ? celulares.filter(p => p.nome.toLowerCase().includes(f)) : celulares;
            if (celFiltrados.length > 0) {
                html += `<h3 style="font-size:20px;margin:16px 0 10px;color:var(--accent-cyan)">📱 CELULARES (${celFiltrados.length})</h3>`;
                celFiltrados.forEach(p => {
                    const dias = dataManager.diasNoEstoque ? dataManager.diasNoEstoque(p) : 0;
                    const qtd = p.quantidade || 1;
                    const esgotado = qtd <= 0;
                    const baixo = qtd <= 2 && qtd > 0;
                    html += `<div style="background:var(--card-bg);border:1px solid ${esgotado ? 'var(--accent-red)' : baixo ? 'var(--accent-yellow)' : 'var(--border-color)'};border-radius:12px;padding:16px;margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <div>
                                <div style="font-size:18px;font-weight:700">📱 ${p.nome}</div>
                                <div style="font-size:15px;color:var(--text-muted)">${p.condicao || ''}${dias > 0 ? ' | ' + dias + ' dias na loja' : ''}</div>
                                <div style="font-size:16px;margin-top:4px"><strong>Quantidade:</strong> ${qtd} unidade${qtd > 1 ? 's' : ''} ${esgotado ? '<span style="color:var(--accent-red);font-weight:700">ESGOTADO</span>' : baixo ? '<span style="color:var(--accent-yellow)">⚠️ Baixo</span>' : ''}</div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:20px;font-weight:800;color:var(--accent-green)">${UI.R(p.precoVenda)}</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                            ${!esgotado ? `<button class="btn btn-sm btn-primary" style="font-size:14px" onclick="UI._estoqueVender('${p.id}','cel')">🛒 Vender</button>` : ''}
                            <button class="btn btn-sm btn-ghost" style="font-size:14px" onclick="UI._estoqueAddMais('${p.id}','cel')">+ Add Mais</button>
                            ${qtd > 0 ? `<button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-red)" onclick="UI._estoqueDiminuir('${p.id}','cel')">➖ Diminuir</button>` : ''}
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-cyan)" onclick="UI._estoqueEditarCompleto('${p.id}','cel')">✏️ Editar Completo</button>
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:#ef4444" onclick="UI._estoqueRemoverProduto('${p.id}','cel')">🗑️ Excluir</button>
                        </div>
                    </div>`;
                });
            }
        }

        // Acessórios
        if (tipo === 'todos' || tipo === 'acessorios') {
            const isAcessorio = a => a.tipo !== 'equipamento_loja' && a.tipo !== 'fogos';
            const aceFiltrados = f ? acessorios.filter(a => isAcessorio(a) && a.nome.toLowerCase().includes(f)) : acessorios.filter(isAcessorio);
            if (aceFiltrados.length > 0) {
                html += `<h3 style="font-size:20px;margin:16px 0 10px;color:var(--accent-yellow)">🎧 ACESSÓRIOS (${aceFiltrados.length})</h3>`;
                aceFiltrados.forEach(p => {
                    const qtd = p.quantidade || 1;
                    const esgotado = qtd <= 0;
                    const baixo = qtd <= 3 && qtd > 0;
                    html += `<div style="background:var(--card-bg);border:1px solid ${esgotado ? 'var(--accent-red)' : baixo ? 'var(--accent-yellow)' : 'var(--border-color)'};border-radius:12px;padding:16px;margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <div>
                                <div style="font-size:18px;font-weight:700">🎧 ${p.nome}</div>
                                <div style="font-size:16px;margin-top:4px"><strong>Quantidade:</strong> ${qtd} unidade${qtd > 1 ? 's' : ''} ${esgotado ? '<span style="color:var(--accent-red);font-weight:700">ESGOTADO</span>' : baixo ? '<span style="color:var(--accent-yellow)">⚠️ Baixo</span>' : ''}</div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:20px;font-weight:800;color:var(--accent-green)">${UI.R(p.precoVenda)}</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                            ${!esgotado ? `<button class="btn btn-sm btn-primary" style="font-size:14px" onclick="UI._estoqueVender('${p.id}','acess')">🛒 Vender</button>` : ''}
                            <button class="btn btn-sm btn-ghost" style="font-size:14px" onclick="UI._estoqueAddMais('${p.id}','acess')">+ Add Mais</button>
                            ${qtd > 0 ? `<button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-red)" onclick="UI._estoqueDiminuir('${p.id}','acess')">➖ Diminuir</button>` : ''}
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-cyan)" onclick="UI._estoqueEditarCompleto('${p.id}','acess')">✏️ Editar Completo</button>
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:#ef4444" onclick="UI._estoqueRemoverProduto('${p.id}','acess')">🗑️ Excluir</button>
                        </div>
                    </div>`;
                });
            }
        }

        // Fogos de Artifício
        if (tipo === 'todos' || tipo === 'fogos') {
            const fogosFiltrados = f ? acessorios.filter(a => (a.tipo === 'fogos' || a.nome.toLowerCase().includes('fogos') || a.nome.toLowerCase().includes('giranda') || a.nome.toLowerCase().includes('caixa 12') || a.nome.toLowerCase().includes('caixa 19')) && a.nome.toLowerCase().includes(f)) 
                                    : acessorios.filter(a => a.tipo === 'fogos' || a.nome.toLowerCase().includes('fogos') || a.nome.toLowerCase().includes('giranda') || a.nome.toLowerCase().includes('caixa 12') || a.nome.toLowerCase().includes('caixa 19'));
            if (fogosFiltrados.length > 0) {
                const totalInvestidoFogos = fogosFiltrados.reduce((s, item) => s + ((item.custo || 0) * (item.quantidade || 1)), 0);
                html += `
                <div style="background:rgba(255,182,92,0.06);border:1px solid rgba(255,182,92,0.3);border-radius:14px;padding:16px;margin:20px 0 14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
                        <h3 style="font-size:20px;margin:0;color:#FFB65C;">🎆 REVENDA DE FOGOS DE ARTIFÍCIO (${fogosFiltrados.length} ITENS)</h3>
                        <span style="font-size:13px;color:#00FFA3;font-weight:700;">Total Investido em Estoque: ${UI.R(totalInvestidoFogos)}</span>
                    </div>
                    <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px;">💡 O valor de custo de cada fogo vendido é guardado 100% no Fundo de Reposição e o lucro é dividido 40/60.</p>
                </div>`;

                fogosFiltrados.forEach(p => {
                    const qtd = p.quantidade || 1;
                    const esgotado = qtd <= 0;
                    const baixo = qtd <= 3 && qtd > 0;
                    const semCusto = !p.custo || p.custo <= 0;

                    html += `<div style="background:var(--card-bg);border:1px solid ${semCusto ? '#FF5A6E' : esgotado ? 'var(--accent-red)' : baixo ? 'var(--accent-yellow)' : 'var(--border-color)'};border-radius:12px;padding:16px;margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                            <div>
                                <div style="font-size:18px;font-weight:700;color:#FFB65C;">🎆 ${p.nome} ${semCusto ? '<span style="font-size:11px;color:#FF5A6E;font-weight:800;background:rgba(255,90,110,0.15);padding:2px 8px;border-radius:6px;margin-left:6px;">⚠️ CUSTO NÃO CADASTRADO</span>' : ''}</div>
                                <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
                                    <strong>Custo Aquisição:</strong> <span style="color:#f59e0b;font-weight:700;">${p.custo ? UI.R(p.custo) : 'N/A'}</span> | 
                                    <strong>Preço Venda:</strong> <span style="color:#00FFA3;font-weight:700;">${UI.R(p.precoVenda)}</span> | 
                                    <strong>Lucro Est.:</strong> <span style="color:#FFF;">${UI.R(p.precoVenda - (p.custo || 0))}</span>
                                </div>
                                <div style="font-size:14px;margin-top:4px"><strong>Estoque:</strong> ${qtd} unidade${qtd > 1 ? 's' : ''} ${esgotado ? '<span style="color:var(--accent-red);font-weight:700">ESGOTADO</span>' : baixo ? '<span style="color:var(--accent-yellow)">⚠️ Baixo</span>' : ''}</div>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:22px;font-weight:900;color:#00FFA3;">${UI.R(p.precoVenda)}</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                            ${!esgotado ? `<button class="btn btn-sm btn-primary" style="font-size:14px" onclick="UI._estoqueVender('${p.id}','acess')">🛒 Vender Fogo</button>` : ''}
                            <button class="btn btn-sm btn-ghost" style="font-size:14px" onclick="UI._estoqueAddMais('${p.id}','acess')">+ Add Reposição</button>
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-cyan)" onclick="UI._estoqueEditarCompleto('${p.id}','acess')">✏️ Editar Completo</button>
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:#ef4444" onclick="UI._estoqueRemoverProduto('${p.id}','acess')">🗑️ Excluir</button>
                        </div>
                    </div>`;
                });
            }
        }

        // Equipamentos
        if (tipo === 'todos' || tipo === 'equipamentos') {
            const eqFiltrados = f ? acessorios.filter(a => a.nome.toLowerCase().includes(f) && a.tipo === 'equipamento_loja') : acessorios.filter(a => a.tipo === 'equipamento_loja');
            if (eqFiltrados.length > 0) {
                html += `<h3 style="font-size:20px;margin:16px 0 10px;color:var(--text-muted)">📦 EQUIPAMENTOS (${eqFiltrados.length})</h3>`;
                eqFiltrados.forEach(p => {
                    const qtd = p.quantidade || 1;
                    html += `<div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:16px;margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <div>
                                <div style="font-size:18px;font-weight:700">📦 ${p.nome}</div>
                                <div style="font-size:16px;margin-top:4px"><strong>Quantidade:</strong> ${qtd}</div>
                            </div>
                            <div style="text-align:right"><div style="font-size:20px;font-weight:800;color:var(--accent-green)">${UI.R(p.precoVenda)}</div></div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                            <button class="btn btn-sm btn-ghost" style="font-size:14px" onclick="UI._estoqueAddMais('${p.id}','acess')">+ Add Mais</button>
                            ${qtd > 0 ? `<button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-red)" onclick="UI._estoqueDiminuir('${p.id}','acess')">➖ Diminuir</button>` : ''}
                            <button class="btn btn-sm btn-ghost" style="font-size:14px;color:var(--accent-cyan)" onclick="UI._estoqueAjustar('${p.id}','acess')">✏️ Ajustar</button>
                        </div>
                    </div>`;
                });
            }
        }

        return html || '<p style="text-align:center;padding:30px;color:var(--text-muted);font-size:18px">Nenhum produto encontrado</p>';
    };

    let html = `<div class="dashboard-section">
        <h2 style="font-size:24px;margin-bottom:12px">📦 GESTÃO DE ESTOQUE</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
            <div style="text-align:center;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:14px"><div style="font-size:24px;font-weight:800">${totalItens}</div><div style="font-size:13px;color:var(--text-muted)">itens diferentes</div></div>
            <div style="text-align:center;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:14px"><div style="font-size:24px;font-weight:800">${totalUnidades}</div><div style="font-size:13px;color:var(--text-muted)">unidades total</div></div>
            <div style="text-align:center;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:14px"><div style="font-size:24px;font-weight:800;color:var(--accent-green)">${UI.R(totalCusto)}</div><div style="font-size:13px;color:var(--text-muted)">investido</div></div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
            <button class="btn btn-primary" style="font-size:16px" onclick="UI._estoqueAddNovo()">+ Adicionar Produto</button>
            <button class="btn" style="font-size:16px;background:#00d97e;color:#000;font-weight:800;" onclick="UI.modalImprimirEtiquetasA4()">🖨️ Imprimir Folha de Etiquetas A4</button>
            <button class="btn btn-ghost" style="font-size:14px;color:#ef4444;border:1px solid rgba(239,68,68,0.3)" onclick="UI._estoqueRemoverAntigos60()">🧹 Limpar Celulares (>60 Dias)</button>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
            <button class="btn btn-sm" id="est-f-todos" style="font-size:14px;background:var(--accent-cyan);color:#fff" onclick="UI._estoqueSetFiltro('todos')">Todos</button>
            <button class="btn btn-sm btn-ghost" id="est-f-sem-custo" style="font-size:14px;background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);" onclick="UI._estoqueSetFiltro('sem_custo')">⚠️ Sem Custo</button>
            <button class="btn btn-sm btn-ghost" id="est-f-celulares" style="font-size:14px" onclick="UI._estoqueSetFiltro('celulares')">📱 Celulares</button>
            <button class="btn btn-sm btn-ghost" id="est-f-acessorios" style="font-size:14px" onclick="UI._estoqueSetFiltro('acessorios')">🎧 Acessórios</button>
            <button class="btn btn-sm btn-ghost" id="est-f-fogos" style="font-size:14px;background:rgba(255,182,92,0.15);color:#FFB65C;" onclick="UI._estoqueSetFiltro('fogos')">🎆 Fogos de Artifício</button>
            <button class="btn btn-sm btn-ghost" id="est-f-equipamentos" style="font-size:14px" onclick="UI._estoqueSetFiltro('equipamentos')">📦 Equipamentos</button>
        </div>

        <input class="form-input" id="est-busca-geral" placeholder="🔍 Buscar produto..." oninput="UI._estoqueRenderLista()" style="font-size:16px;padding:12px;margin-bottom:14px">

        ${typeof UI._obterWidgetProdutosProcurados === 'function' ? UI._obterWidgetProdutosProcurados() : ''}

        <div id="est-lista-geral">${renderLista('', 'todos')}</div>
    </div>`;

    document.getElementById('main-content').innerHTML = html;
    UI._estoqueFiltroAtual = 'todos';

    UI._estoqueRenderLista = function () {
        const busca = document.getElementById('est-busca-geral')?.value || '';
        document.getElementById('est-lista-geral').innerHTML = renderLista(busca, UI._estoqueFiltroAtual);
    };

    UI._estoqueSetFiltro = function (tipo) {
        UI._estoqueFiltroAtual = tipo;
        ['todos', 'sem_custo', 'celulares', 'acessorios', 'fogos', 'equipamentos'].forEach(t => {
            const btn = document.getElementById('est-f-' + t);
            if (btn) { 
                btn.className = t === tipo ? 'btn btn-sm' : 'btn btn-sm btn-ghost'; 
                btn.style.background = t === tipo ? (t === 'sem_custo' ? '#f59e0b' : 'var(--accent-cyan)') : (t === 'sem_custo' ? 'rgba(245,158,11,0.15)' : ''); 
                btn.style.color = t === tipo ? '#fff' : (t === 'sem_custo' ? '#f59e0b' : ''); 
            }
        });
        UI._estoqueRenderLista();
    };
};

// Add mais unidades
UI._estoqueAddMais = function (id, tipo) {
    let prod = null;
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    if (lista) prod = lista.find(p => String(p.id) === String(id));
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');

    const custoAtual = prod.custo || 0;
    UI.openModal(`📦 Adicionar Mais — ${prod.nome}`, `
        <div style="padding:12px">
            <p style="font-size:16px;margin-bottom:12px">Quantidade atual: <strong>${prod.quantidade || 1} unidade(s)</strong></p>
            <label class="form-label">Quantas unidades vai adicionar?</label>
            <input class="form-input" id="addm-qtd" type="number" min="1" value="1" style="font-size:20px;text-align:center;font-weight:700;padding:12px">
            <label class="form-label" style="margin-top:12px">Custo de cada: R$ ${custoAtual.toFixed(2)} (mesma do cadastro)</label>
            <label style="display:block;font-size:15px;margin-top:8px;cursor:pointer"><input type="checkbox" id="addm-novocusto-check" onchange="document.getElementById('addm-novocusto').style.display=this.checked?'block':'none'"> Custo mudou</label>
            <div id="addm-novocusto" style="display:none;margin-top:8px"><input class="form-input" id="addm-custo" type="number" style="font-size:18px;padding:10px" placeholder="Novo custo unitário"></div>
            <div id="addm-total" style="margin-top:12px;font-size:18px;font-weight:700;text-align:center;color:var(--accent-green)"></div>
            <button class="btn btn-primary" style="width:100%;margin-top:16px;font-size:18px;padding:12px" onclick="UI._estoqueConfirmarAddMais('${id}','${tipo}')">✅ Adicionar</button>
        </div>`);
    const calcTotal = () => { const q = parseInt(document.getElementById('addm-qtd')?.value) || 0; const c = parseFloat(document.getElementById('addm-custo')?.value) || custoAtual; document.getElementById('addm-total').textContent = 'Total a gastar: ' + UI.R(q * c); };
    document.getElementById('addm-qtd')?.addEventListener('input', calcTotal);
    calcTotal();
};

UI._estoqueConfirmarAddMais = function (id, tipo) {
    let prod = null;
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    if (lista) prod = lista.find(p => String(p.id) === String(id));
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');

    const qtd = parseInt(document.getElementById('addm-qtd')?.value) || 0;
    if (qtd <= 0) return UI.toast('Digite uma quantidade válida', 'error');
    const novoCusto = document.getElementById('addm-novocusto-check')?.checked ? parseFloat(document.getElementById('addm-custo')?.value) : null;
    prod.quantidade = (prod.quantidade || 1) + qtd;
    if (novoCusto && novoCusto > 0) prod.custo = novoCusto;
    
    dataManager.registrarLogHistorico({
        tipo: 'estoque_reposicao',
        descricao: `📦 REPOSIÇÃO DE ESTOQUE: +${qtd} un. de ${prod.nome} (Custo un: ${UI.R(prod.custo)})`,
        valor: -(qtd * (prod.custo || 0)),
        custo: prod.custo || 0
    });

    dataManager.data._ultimoSaveLocal = Date.now();
    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();
    UI.closeModal();
    UI.toast(`✅ +${qtd} unidades de ${prod.nome} adicionadas!`, 'success');
    UI.renderEstoque();
};

// Add novo produto
UI._estoqueAddNovo = function () {
    UI.openModal('📦 ADICIONAR NOVO PRODUTO', `
        <div style="padding:12px">
            <label class="form-label">Nome do produto:</label>
            <input class="form-input" id="novo-nome" style="font-size:16px;padding:10px" placeholder="Ex: Película HD, iPhone 14, Fone Bluetooth">
            <label class="form-label" style="margin-top:10px">Tipo:</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <label style="font-size:16px;cursor:pointer;padding:8px 14px;border:1px solid var(--border-color);border-radius:8px"><input type="radio" name="novo-tipo" value="celular"> 📱 Celular</label>
                <label style="font-size:16px;cursor:pointer;padding:8px 14px;border:1px solid var(--border-color);border-radius:8px"><input type="radio" name="novo-tipo" value="acessorio" checked> 🎧 Acessório</label>
                <label style="font-size:16px;cursor:pointer;padding:8px 14px;border:1px solid var(--border-color);border-radius:8px"><input type="radio" name="novo-tipo" value="equipamento_loja"> 📦 Equipamento</label>
            </div>
            <div id="novo-condicao-area" style="margin-top:10px;display:none">
                <label class="form-label">Condição:</label>
                <select class="form-input" id="novo-condicao" style="font-size:16px;padding:10px">
                    <option value="Novo">Novo</option><option value="Lacrado">Lacrado</option><option value="Usado">Usado</option><option value="Troca">Troca</option>
                </select>
                <label class="form-label" style="margin-top:10px">URL da Foto (Vitrine):</label>
                <input class="form-input" id="novo-foto" style="font-size:16px;padding:10px" placeholder="https://link-da-imagem.com/foto.jpg">
            </div>
            <label class="form-label" style="margin-top:10px">Quantidade: <span style="color:var(--accent-red)">*OBRIGATÓRIO</span></label>
            <input class="form-input" id="novo-qtd" type="number" min="1" value="1" style="font-size:20px;text-align:center;font-weight:700;padding:12px" placeholder="Quantos comprou?">
            <label class="form-label" style="margin-top:10px">Custo unitário (R$): <span style="color:var(--accent-red)">*OBRIGATÓRIO</span></label>
            <input class="form-input" id="novo-custo" type="number" style="font-size:18px;padding:10px" placeholder="Quanto custou CADA UM" oninput="UI._estoqueCalcResumo()">
            <label class="form-label" style="margin-top:10px">Preço de venda (R$): <span style="color:var(--accent-red)">*OBRIGATÓRIO</span></label>
            <input class="form-input" id="novo-venda" type="number" style="font-size:18px;padding:10px" placeholder="Por quanto vai vender CADA UM" oninput="UI._estoqueCalcResumo()">
            <div id="novo-resumo" style="margin-top:12px;background:rgba(59,130,246,0.08);border-radius:10px;padding:14px;font-size:16px"></div>
            <button class="btn btn-primary" style="width:100%;margin-top:16px;font-size:18px;padding:12px" onclick="UI._estoqueConfirmarNovo()">✅ Adicionar ao Estoque</button>
        </div>`);

    // Toggle condição para celulares
    document.querySelectorAll('input[name="novo-tipo"]').forEach(r => r.addEventListener('change', () => {
        document.getElementById('novo-condicao-area').style.display = r.value === 'celular' ? 'block' : 'none';
    }));

    UI._estoqueCalcResumo = function () {
        const qtd = parseInt(document.getElementById('novo-qtd')?.value) || 0;
        const custo = parseFloat(document.getElementById('novo-custo')?.value) || 0;
        const venda = parseFloat(document.getElementById('novo-venda')?.value) || 0;
        const lucro = venda - custo;
        const margem = custo > 0 ? ((lucro / custo) * 100).toFixed(0) : 0;
        document.getElementById('novo-resumo').innerHTML = `
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Investimento total:</span><strong>${UI.R(custo * qtd)}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Lucro por unidade:</span><strong style="color:var(--accent-green)">${UI.R(lucro)}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Margem:</span><strong style="color:${margem > 30 ? 'var(--accent-green)' : 'var(--accent-yellow)'}">${margem}%</strong></div>`;
    };
};

UI._estoqueConfirmarNovo = function () {
    const nome = document.getElementById('novo-nome')?.value;
    const tipo = document.querySelector('input[name="novo-tipo"]:checked')?.value || 'acessorio';
    const qtd = parseInt(document.getElementById('novo-qtd')?.value) || 0;
    const custo = parseFloat(document.getElementById('novo-custo')?.value) || 0;
    const venda = parseFloat(document.getElementById('novo-venda')?.value) || 0;
    if (!nome) return UI.toast('Digite o nome do produto', 'error');
    if (qtd <= 0) return UI.toast('Quantidade é obrigatória!', 'error');
    if (custo <= 0) return UI.toast('Custo unitário é obrigatório!', 'error');
    if (venda <= 0) return UI.toast('Preço de venda é obrigatório!', 'error');

    const novoId = Date.now();
    if (tipo === 'celular') {
        const condicao = document.getElementById('novo-condicao')?.value || 'Novo';
        const fotoUrl = document.getElementById('novo-foto')?.value || '';
        dataManager.data.estoqueCelulares.push({ id: novoId, nome, custo, precoVenda: venda, condicao, fotoUrl, dataCompra: new Date().toISOString().split('T')[0], status: 'disponivel', quantidade: qtd, giro: 'medio', popularidade: 'medio', idadeModelo: 'medio' });
    } else {
        dataManager.data.estoqueAcessorios.push({ id: novoId, nome, custo, precoVenda: venda, tipo, dataCompra: new Date().toISOString().split('T')[0], status: 'disponivel', quantidade: qtd });
    }

    dataManager.registrarLogHistorico({
        tipo: 'estoque_cadastro',
        descricao: `✨ NOVO PRODUTO CADASTRADO: ${nome} (${qtd} un. | Custo un: ${UI.R(custo)} | Venda: ${UI.R(venda)})`,
        valor: -(qtd * custo),
        custo: custo
    });

    dataManager.saveData();
    UI.closeModal();
    UI.toast(`✅ ${nome} (${qtd} un.) adicionado ao estoque!`, 'success');
    UI.renderEstoque();
};

// Vender do estoque
UI._estoqueVender = function (id, tipo) {
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    let prod = lista ? lista.find(p => String(p.id) === String(id)) : null;
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');
    const qtd = prod.quantidade || 1;
    if (qtd <= 0) return UI.toast('Produto esgotado!', 'error');
    prod.quantidade = qtd - 1;
    
    if (tipo === 'acess' && dataManager.venderAcessorio) {
        dataManager.venderAcessorio(id, prod.precoVenda, 'Cliente Loja');
    } else {
        dataManager._registrarSincronizacaoFinanceira({
            tipo: 'venda_' + (tipo === 'acess' ? 'acessorio' : 'celular'),
            produto: prod.nome,
            valorVenda: prod.precoVenda,
            custo: prod.custo,
            caixaDestino: 'caixaSecundario',
            cliente: 'Cliente Loja'
        });
    }

    dataManager.saveData();
    UI.toast(`✅ 1 unidade de ${prod.nome} vendida!`, 'success');
    UI.renderEstoque();
};

// Diminuir quantidade
UI._estoqueDiminuir = function (id, tipo) {
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    let prod = lista ? lista.find(p => String(p.id) === String(id)) : null;
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');
    const qtdAtual = prod.quantidade || 1;
    UI.openModal(`➖ Diminuir — ${prod.nome}`, `
        <div style="padding:12px">
            <p style="font-size:18px;margin-bottom:12px">Quantidade atual: <strong style="font-size:24px;color:var(--accent-cyan)">${qtdAtual}</strong> unidade${qtdAtual > 1 ? 's' : ''}</p>
            <label class="form-label">Quantas unidades quer tirar?</label>
            <input class="form-input" id="dim-qtd" type="number" min="1" max="${qtdAtual}" value="1" style="font-size:24px;text-align:center;font-weight:700;padding:14px">
            <label class="form-label" style="margin-top:12px">Motivo (opcional):</label>
            <select class="form-input" id="dim-motivo" style="font-size:16px;padding:10px">
                <option value="perda">📦 Perda / Extravio</option>
                <option value="defeito">🔧 Defeituoso / Devolvido</option>
                <option value="uso_loja">🏪 Uso da loja</option>
                <option value="erro_contagem">📝 Erro na contagem</option>
                <option value="outro">Outro</option>
            </select>
            <div id="dim-resultado" style="margin-top:14px;font-size:18px;text-align:center;font-weight:700"></div>
            <button class="btn" style="width:100%;margin-top:16px;font-size:18px;padding:12px;background:var(--accent-red);color:#fff" onclick="UI._estoqueConfirmarDiminuir('${id}','${tipo}')">➖ Diminuir Quantidade</button>
        </div>`);
    const calcDim = () => {
        const q = parseInt(document.getElementById('dim-qtd')?.value) || 0;
        const restante = qtdAtual - q;
        const el = document.getElementById('dim-resultado');
        if (el) el.innerHTML = restante <= 0 ? '<span style="color:var(--accent-red)">⚠️ Vai ZERAR o estoque!</span>' : `Vai ficar: <span style="color:var(--accent-green)">${restante} unidade${restante > 1 ? 's' : ''}</span>`;
    };
    document.getElementById('dim-qtd')?.addEventListener('input', calcDim);
    calcDim();
};

UI._estoqueConfirmarDiminuir = function (id, tipo) {
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    let prod = lista ? lista.find(p => String(p.id) === String(id)) : null;
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');
    const qtd = parseInt(document.getElementById('dim-qtd')?.value) || 0;
    if (qtd <= 0) return UI.toast('Digite uma quantidade válida', 'error');
    const qtdAtual = prod.quantidade || 1;
    if (qtd > qtdAtual) return UI.toast(`Não pode tirar mais que ${qtdAtual}!`, 'error');
    prod.quantidade = qtdAtual - qtd;
    dataManager.saveData();
    UI.closeModal();
    UI.toast(`➖ ${qtd} unidade${qtd > 1 ? 's' : ''} de ${prod.nome} removida${qtd > 1 ? 's' : ''}!`, 'success');
    UI.renderEstoque();
};

UI._estoqueAjustar = function (id, tipo) {
    let prod = null;
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    if (lista) prod = lista.find(p => String(p.id) === String(id));
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');

    const qtdAtual = prod.quantidade !== undefined ? prod.quantidade : (prod.status === 'disponivel' ? 1 : 0);
    const custoAtual = prod.custo || 0;
    const vendaAtual = prod.precoVenda || 0;
    const isCelular = tipo === 'cel' || tipo === 'celular';

    UI.openModal(`✏️ EDIÇÃO COMPLETA — ${prod.nome}`, `
        <div style="padding:12px">
            <label class="form-label" style="font-weight:700;">Nome do produto:</label>
            <input class="form-input" id="edit-nome" value="${(prod.nome || '').replace(/"/g, '&quot;')}" style="font-size:16px;padding:10px;margin-bottom:10px;width:100%;">
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                <div>
                    <label class="form-label" style="font-weight:700;">Custo Aquisição (R$):</label>
                    <input class="form-input" id="edit-custo" type="number" step="0.01" value="${custoAtual}" style="font-size:16px;padding:10px;color:#f59e0b;font-weight:800;width:100%;">
                </div>
                <div>
                    <label class="form-label" style="font-weight:700;">Preço de Venda (R$):</label>
                    <input class="form-input" id="edit-venda" type="number" step="0.01" value="${vendaAtual}" style="font-size:16px;padding:10px;color:#00FFA3;font-weight:800;width:100%;">
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                <div>
                    <label class="form-label" style="font-weight:700;">Quantidade em Estoque:</label>
                    <input class="form-input" id="edit-qtd" type="number" min="0" value="${qtdAtual}" style="font-size:20px;text-align:center;font-weight:800;padding:10px;width:100%;">
                </div>
                ${isCelular ? `
                <div>
                    <label class="form-label" style="font-weight:700;">Condição:</label>
                    <select class="form-input" id="edit-condicao" style="font-size:15px;padding:10px;width:100%;">
                        <option value="Novo" ${prod.condicao === 'Novo' ? 'selected' : ''}>Novo</option>
                        <option value="Lacrado" ${prod.condicao === 'Lacrado' ? 'selected' : ''}>Lacrado</option>
                        <option value="Usado" ${prod.condicao === 'Usado' ? 'selected' : ''}>Usado / Seminovo</option>
                        <option value="Troca" ${prod.condicao === 'Troca' ? 'selected' : ''}>Troca</option>
                    </select>
                </div>
                ` : '<div></div>'}
            </div>

            <div id="edit-preview-lucro" style="margin-top:12px;background:rgba(0,255,163,0.06);border:1px solid rgba(0,255,163,0.2);border-radius:10px;padding:12px;font-size:14px;"></div>

            <button class="btn btn-primary" style="width:100%;margin-top:16px;font-size:18px;padding:14px;font-weight:800;" onclick="UI._estoqueConfirmarAjustar('${id}','${tipo}')">💾 Salvar Alterações no Estoque</button>
        </div>`);

    const calcPreview = () => {
        const c = parseFloat(document.getElementById('edit-custo')?.value) || 0;
        const v = parseFloat(document.getElementById('edit-venda')?.value) || 0;
        const q = parseInt(document.getElementById('edit-qtd')?.value) || 0;
        const lucroUnit = v - c;
        const margem = c > 0 ? ((lucroUnit / c) * 100).toFixed(0) : 0;
        const el = document.getElementById('edit-preview-lucro');
        if (el) {
            el.innerHTML = `
                <div style="display:flex;justify-content:space-between;"><span>Lucro por unidade:</span><strong style="color:#00FFA3;">${UI.R(lucroUnit)} (${margem}% ROI)</strong></div>
                <div style="display:flex;justify-content:space-between;margin-top:4px;color:var(--text-muted);font-size:12px;"><span>Lucro total com estoque (${q} un.):</span><strong>${UI.R(lucroUnit * q)}</strong></div>
            `;
        }
    };

    document.getElementById('edit-custo')?.addEventListener('input', calcPreview);
    document.getElementById('edit-venda')?.addEventListener('input', calcPreview);
    document.getElementById('edit-qtd')?.addEventListener('input', calcPreview);
    calcPreview();
};

UI._estoqueConfirmarAjustar = function (id, tipo) {
    let prod = null;
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    if (lista) prod = lista.find(p => String(p.id) === String(id));
    if (!prod && dataManager.data) {
        const outraLista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (outraLista) prod = outraLista.find(p => String(p.id) === String(id));
    }
    if (!prod) return UI.toast('Produto não encontrado!', 'error');

    const novoNome = document.getElementById('edit-nome')?.value?.trim();
    const novoCusto = parseFloat(document.getElementById('edit-custo')?.value) || 0;
    const novoVenda = parseFloat(document.getElementById('edit-venda')?.value) || 0;
    const novaQtd = parseInt(document.getElementById('edit-qtd')?.value);

    if (!novoNome) return UI.toast('Informe o nome do produto', 'error');
    if (isNaN(novaQtd) || novaQtd < 0) return UI.toast('Digite uma quantidade válida', 'error');

    const antigoNome = prod.nome;
    prod.nome = novoNome;
    prod.custo = novoCusto;
    prod.precoVenda = novoVenda;
    prod.quantidade = novaQtd;
    prod.status = novaQtd > 0 ? 'disponivel' : 'vendido';

    if (tipo === 'cel' || tipo === 'celular') {
        const cond = document.getElementById('edit-condicao')?.value;
        if (cond) prod.condicao = cond;
    }

    dataManager.registrarLogHistorico({
        tipo: 'estoque_edicao',
        descricao: `✏️ PRODUTO EDITADO NO ESTOQUE: ${antigoNome} → ${novoNome} (Custo: ${UI.R(novoCusto)} | Venda: ${UI.R(novoVenda)} | Qtd: ${novaQtd})`,
        valor: 0,
        custo: novoCusto
    });

    dataManager.data._ultimoSaveLocal = Date.now();
    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();
    UI.closeModal();
    UI.toast(`✅ ${novoNome} atualizado com sucesso no estoque!`, 'success');
    UI.renderEstoque();
};

// === REMOVER PRODUTO DO ESTOQUE ===
UI._estoqueRemoverProduto = function (id, tipo) {
    let prod = null;
    let lista = null;
    let idx = -1;

    if (dataManager.data && dataManager.data.estoqueCelulares) {
        idx = dataManager.data.estoqueCelulares.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            lista = dataManager.data.estoqueCelulares;
            prod = lista[idx];
        }
    }
    if (idx === -1 && dataManager.data && dataManager.data.estoqueAcessorios) {
        idx = dataManager.data.estoqueAcessorios.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            lista = dataManager.data.estoqueAcessorios;
            prod = lista[idx];
        }
    }

    if (idx === -1 || !prod || !lista) return UI.toast('Produto não encontrado no estoque', 'error');

    const nomeProd = prod.nome;
    if (!confirm(`⚠️ Tem certeza que deseja EXCLUIR "${nomeProd}" do estoque?`)) return;

    if (dataManager.estornarVendaERetroagirCaixa) {
        dataManager.estornarVendaERetroagirCaixa({
            nomeProduto: nomeProd,
            valorVenda: prod.precoVenda || 0,
            custo: prod.custo || 0,
            caixaOrigem: 'caixaSecundario'
        });
    }

    lista.splice(idx, 1);
    dataManager.data._ultimoSaveLocal = Date.now();
    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();

    UI.toast(`🗑️ "${nomeProd}" foi removido do estoque!`, 'success');
    UI.renderEstoque();
};

UI._confirmarExclusaoEstoque = function (id, tipo) {
    UI._estoqueRemoverProduto(id, tipo);
};

// === EDIÇÃO COMPLETA DE PRODUTO DO ESTOQUE ===
UI._estoqueEditarCompleto = function (id, tipo) {
    UI._estoqueAjustar(id, tipo);
};

UI._estoqueSalvarEdicaoCompleta = function (id, tipo) {
    UI._estoqueConfirmarAjustar(id, tipo);
};

// === REMOÇÃO DE CELULARES ENCALHADOS > 60 DIAS ===
UI._estoqueRemoverAntigos60 = function () {
    const celulares = dataManager.getEstoqueCelulares();
    const antigos = celulares.filter(p => dataManager.diasNoEstoque(p) >= 60);
    
    if (antigos.length === 0) {
        return UI.toast('Nenhum celular com 60 dias ou mais no estoque! ⚡', 'info');
    }

    const htmlLista = antigos.map(a => `<li><strong>${a.nome}</strong> — ${dataManager.diasNoEstoque(a)} dias na loja (${UI.R(a.precoVenda)})</li>`).join('');

    UI.openModal('🧹 Remoção de Celulares Encalhados (>60 Dias)', `
        <div style="padding:16px">
            <p style="font-size:16px;color:#ef4444;font-weight:700">Encontrados ${antigos.length} celulares com 60 dias ou mais no estoque:</p>
            <ul style="margin:12px 0 20px 20px;max-height:180px;overflow-y:auto;font-size:14px;color:var(--text-color)">
                ${htmlLista}
            </ul>
            <p style="font-size:14px;color:var(--text-muted)">Deseja remover todos esses aparelhos do estoque ativo?</p>
            <div style="display:flex;gap:12px;margin-top:20px;justify-content:flex-end">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
                <button class="btn btn-primary" style="background:#ef4444;border:none;color:#fff;font-weight:800;" onclick="UI._estoqueConfirmarRemoverAntigos60()">🗑️ Confirmar Remoção (${antigos.length})</button>
            </div>
        </div>
    `);
};

UI._estoqueConfirmarRemoverAntigos60 = function () {
    const res = dataManager.removerCelularesAntigos(60);
    UI.closeModal();
    UI.toast(`✅ ${res.removidos} celulares antigos foram removidos do estoque!`, 'success');
    UI.renderEstoque();
};

// === SALVAMENTO RÁPIDO DE CUSTO PENDENTE NO ESTOQUE ===
UI._estoqueSalvarCustoRapido = function (id, tipo) {
    const val = parseFloat(document.getElementById('custo-inp-' + id)?.value);
    if (isNaN(val) || val < 0) return UI.toast('Por favor digite um custo válido', 'error');

    let prod = null;
    let lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    if (lista) prod = lista.find(p => String(p.id) === String(id));
    if (!prod && dataManager.data) {
        lista = (tipo === 'acess' || tipo === 'acessorio') ? dataManager.data.estoqueCelulares : dataManager.data.estoqueAcessorios;
        if (lista) prod = lista.find(p => String(p.id) === String(id));
    }

    if (!prod) return UI.toast('Produto não encontrado', 'error');

    prod.custo = val;
    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();

    UI.toast(`✅ Custo de R$ ${val.toFixed(2)} salvo para "${prod.nome}"!`, 'success');
    UI.renderEstoque();
};


