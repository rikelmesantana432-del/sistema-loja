// =========================================================================
// STRATEGYOS 3.0 - GERENCIADOR DE TABELA DE PREÇOS E CUSTOS DE ASSISTÊNCIA
// Gestão de Peças por Modelo, Status de Custo e Importação em Lote (Bulk)
// =========================================================================

UI._tabPrecosFiltro = 'todos';
UI._tabPrecosBusca = '';

UI.modalTabelaPrecosConserto = function (abaAtiva = 'lista') {
    const tabela = dataManager.data.tabelaServicosModelo || {};
    const modelosList = Object.keys(tabela);
    
    // Análise de cobertura de custos
    let totalModelos = modelosList.length;
    let completos = 0;
    let incompletos = 0;
    
    modelosList.forEach(m => {
        const s = tabela[m];
        const temTela = s.tela && (s.tela.p > 0);
        const temBat = s.bateria && (s.bateria.p > 0);
        if (temTela && temBat) completos++;
        else incompletos++;
    });

    const html = `
    <div style="padding:10px; max-width:950px; margin:0 auto;">
        <!-- CABEÇALHO -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div>
                <h3 style="color:#FFD700; font-size:22px; margin:0; font-weight:800;">🔧 TABELA DE PREÇOS & CUSTO DE PEÇAS</h3>
                <p style="font-size:13px; color:var(--text-muted); margin:4px 0 0;">
                    ${totalModelos} aparelhos no catálogo • <span style="color:#00FFA3;">${completos} com custos</span> • <span style="color:#f59e0b;">${incompletos} incompletos</span>
                </p>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn ${abaAtiva === 'lista' ? 'btn-primary' : 'btn-ghost'}" onclick="UI.modalTabelaPrecosConserto('lista')" style="font-size:13px;">📋 Catálogo de Modelos</button>
                <button class="btn ${abaAtiva === 'bulk' ? 'btn-primary' : 'btn-ghost'}" onclick="UI.modalTabelaPrecosConserto('bulk')" style="font-size:13px; background:${abaAtiva === 'bulk' ? '#0ea5e9' : 'transparent'}; color:#fff;">📤 Importar em Lote (Excel/CSV)</button>
            </div>
        </div>

        ${abaAtiva === 'lista' ? UI._renderAbaListaPrecos(tabela) : UI._renderAbaBulkPrecos()}
    </div>
    `;

    UI.openModal('🔧 Tabela de Peças & Manutenção', html);
};

UI._renderAbaListaPrecos = function (tabela) {
    const modelos = Object.keys(tabela).sort();
    const busca = (UI._tabPrecosBusca || '').toLowerCase().trim();
    const filtro = UI._tabPrecosFiltro || 'todos';

    const filtrados = modelos.filter(m => {
        const s = tabela[m] || {};
        const temCusto = (s.tela && s.tela.p > 0) || (s.bateria && s.bateria.p > 0);
        if (busca && !m.toLowerCase().includes(busca)) return false;
        if (filtro === 'sem_custo' && temCusto) return false;
        if (filtro === 'com_custo' && !temCusto) return false;
        return true;
    });

    return `
    <!-- FILTROS E BUSCA -->
    <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; align-items:center;">
        <input class="form-input" id="busca-modelo-tabela" style="flex:2; min-width:200px; padding:10px 14px; font-size:14px;" 
            placeholder="🔍 Buscar modelo (ex: iPhone 11, A14, Moto G22)..." 
            value="${UI._tabPrecosBusca}" 
            oninput="UI._tabPrecosBusca=this.value; document.getElementById('grid-modelos-container').innerHTML=UI._renderLinhasModelos(UI._obterModelosFiltrados());">
        
        <div style="display:flex; gap:6px;">
            <button class="btn btn-sm ${filtro === 'todos' ? 'btn-primary' : 'btn-ghost'}" onclick="UI._tabPrecosFiltro='todos'; UI.modalTabelaPrecosConserto('lista')">Todos (${modelos.length})</button>
            <button class="btn btn-sm ${filtro === 'sem_custo' ? 'btn-primary' : 'btn-ghost'}" style="${filtro === 'sem_custo' ? 'background:#ef4444;' : 'color:#ef4444;'}" onclick="UI._tabPrecosFiltro='sem_custo'; UI.modalTabelaPrecosConserto('lista')">⚠️ Faltando Peças</button>
            <button class="btn btn-sm ${filtro === 'com_custo' ? 'btn-primary' : 'btn-ghost'}" style="${filtro === 'com_custo' ? 'background:#10b981;' : 'color:#10b981;'}" onclick="UI._tabPrecosFiltro='com_custo'; UI.modalTabelaPrecosConserto('lista')">✅ Com Custo</button>
        </div>
    </div>

    <!-- TABELA / LISTA DE MODELOS -->
    <div id="grid-modelos-container" style="max-height:480px; overflow-y:auto; border:1px solid rgba(255,255,255,0.08); border-radius:12px; background:rgba(15,20,32,0.6);">
        ${UI._renderLinhasModelos(filtrados)}
    </div>
    `;
};

UI._obterModelosFiltrados = function () {
    const tabela = dataManager.data.tabelaServicosModelo || {};
    const busca = (UI._tabPrecosBusca || '').toLowerCase().trim();
    const filtro = UI._tabPrecosFiltro || 'todos';

    return Object.keys(tabela).sort().filter(m => {
        const s = tabela[m] || {};
        const temCusto = (s.tela && s.tela.p > 0) || (s.bateria && s.bateria.p > 0);
        if (busca && !m.toLowerCase().includes(busca)) return false;
        if (filtro === 'sem_custo' && temCusto) return false;
        if (filtro === 'com_custo' && !temCusto) return false;
        return true;
    });
};

UI._renderLinhasModelos = function (modelos) {
    const tabela = dataManager.data.tabelaServicosModelo || {};
    if (modelos.length === 0) {
        return '<div style="padding:40px; text-align:center; color:var(--text-muted);">Nenhum aparelho encontrado com os filtros atuais.</div>';
    }

    return `
    <table class="priority-table" style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
            <tr style="background:rgba(255,255,255,0.04); text-align:left;">
                <th style="padding:12px;">Aparelho / Modelo</th>
                <th style="padding:12px;">📱 Tela (Custo / Sugerido)</th>
                <th style="padding:12px;">🔋 Bateria (Custo / Sugerido)</th>
                <th style="padding:12px;">🔌 Conector</th>
                <th style="padding:12px; text-align:center;">Ação</th>
            </tr>
        </thead>
        <tbody>
            ${modelos.map(m => {
                const s = tabela[m] || {};
                const cTela = s.tela ? s.tela.p : 0;
                const cBat = s.bateria ? s.bateria.p : 0;
                const cCon = s.conector ? s.conector.p : 0;

                // Sugestão de venda calculada pela Régua de Maximização de Lucro (Teto Máximo)
                const faixasT = cTela > 0 ? Calculators._calcularPrecoConsertoEscalonado(cTela, 50) : { maximo: 0, minimo: 0 };
                const sugTela = faixasT.maximo;
                const minTela = faixasT.minimo;
                const faixasB = cBat > 0 ? Calculators._calcularPrecoConsertoEscalonado(cBat, 35) : { maximo: 0 };
                const sugBat = faixasB.maximo;

                return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:10px 12px; font-weight:800; color:#FFF; text-transform:uppercase;">
                        ${m}
                    </td>
                    <td style="padding:10px 12px;">
                        ${cTela > 0 ? `<span style="color:#00FFA3; font-weight:700;">R$ ${cTela}</span> <span style="color:var(--text-muted);font-size:11px;">(Cobrar Teto: R$ ${sugTela} | Mín: R$ ${minTela})</span>` : '<span style="color:#f59e0b; background:rgba(245,158,11,0.1); padding:2px 6px; border-radius:4px; font-size:11px;">⚠️ Sem Custo</span>'}
                    </td>
                    <td style="padding:10px 12px;">
                        ${cBat > 0 ? `<span style="color:#00FFA3; font-weight:700;">R$ ${cBat}</span> <span style="color:var(--text-muted);font-size:11px;">(Venda: R$ ${Math.round(sugBat)})</span>` : '<span style="color:var(--text-muted); font-size:11px;">-</span>'}
                    </td>
                    <td style="padding:10px 12px;">
                        ${cCon > 0 ? `<span style="color:#00FFA3; font-weight:700;">R$ ${cCon}</span>` : '<span style="color:var(--text-muted); font-size:11px;">-</span>'}
                    </td>
                    <td style="padding:10px 12px; text-align:center;">
                        <button class="btn btn-sm btn-ghost" onclick="UI._editarCustoModelo('${m.replace(/'/g, "\\'")}')" style="font-size:12px; padding:4px 8px;">✏️ Editar</button>
                    </td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>
    `;
};

UI._editarCustoModelo = function (modelo) {
    const s = (dataManager.data.tabelaServicosModelo || {})[modelo] || {};
    const cTela = s.tela ? s.tela.p : 0;
    const cBat = s.bateria ? s.bateria.p : 0;
    const cCon = s.conector ? s.conector.p : 0;

    const modalEditar = `
    <div style="padding:16px;">
        <h4 style="color:#FFD700; font-size:18px; margin:0 0 14px; text-transform:uppercase;">✏️ Editar Custos: ${modelo}</h4>
        
        <label class="form-label">Custo da Tela Frontal (R$):</label>
        <input class="form-input" id="edit-custo-tela" type="number" step="1" value="${cTela}" style="font-size:18px; padding:8px; margin-bottom:12px;">
        
        <label class="form-label">Custo da Bateria (R$):</label>
        <input class="form-input" id="edit-custo-bateria" type="number" step="1" value="${cBat}" style="font-size:18px; padding:8px; margin-bottom:12px;">
        
        <label class="form-label">Custo do Conector de Carga (R$):</label>
        <input class="form-input" id="edit-custo-conector" type="number" step="1" value="${cCon}" style="font-size:18px; padding:8px; margin-bottom:16px;">

        <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button class="btn btn-ghost" onclick="UI.modalTabelaPrecosConserto('lista')">Cancelar</button>
            <button class="btn btn-success" onclick="UI._salvarEdicaoCustoModelo('${modelo.replace(/'/g, "\\'")}')">💾 Salvar Alterações</button>
        </div>
    </div>
    `;

    UI.openModal('✏️ Editar Peças', modalEditar);
};

UI._salvarEdicaoCustoModelo = function (modelo) {
    const cTela = parseFloat(document.getElementById('edit-custo-tela')?.value || 0);
    const cBat = parseFloat(document.getElementById('edit-custo-bateria')?.value || 0);
    const cCon = parseFloat(document.getElementById('edit-custo-conector')?.value || 0);

    if (!dataManager.data.tabelaServicosModelo) dataManager.data.tabelaServicosModelo = {};
    if (!dataManager.data.tabelaServicosModelo[modelo]) dataManager.data.tabelaServicosModelo[modelo] = {};

    const item = dataManager.data.tabelaServicosModelo[modelo];
    item.tela = { p: cTela, m: 40, d: 2 };
    item.bateria = { p: cBat, m: 30, d: 1 };
    item.conector = { p: cCon, m: 35, d: 1 };

    dataManager.saveData();
    UI.toast(`✅ Custos de ${modelo.toUpperCase()} atualizados com sucesso!`, 'success');
    UI.modalTabelaPrecosConserto('lista');
};

UI._renderAbaBulkPrecos = function () {
    return `
    <div style="background:rgba(20,24,38,0.8); border:1px solid #0ea5e9; border-radius:14px; padding:20px;">
        <h4 style="color:#0ea5e9; margin:0 0 8px; font-size:16px;">📤 IMPORTAÇÃO EM LOTE DE PREÇOS (BULK UPLOAD)</h4>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
            Cole abaixo uma lista copiada do Excel ou digite no formato: <strong>Modelo; CustoTela; CustoBateria; CustoConector</strong> (separado por ponto e vírgula ou tabulação).
        </p>

        <textarea id="bulk-precos-input" style="width:100%; height:160px; background:#0b0f19; border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:12px; color:#fff; font-family:monospace; font-size:13px;" placeholder="Exemplo:
iPhone 11; 130; 70; 55
Samsung A14; 85; 45; 35
Moto G22; 75; 40; 30
Xiaomi Redmi Note 12; 95; 50; 40"></textarea>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:10px;">
            <button class="btn btn-ghost" onclick="UI._exportarTabelaPrecosCSV()" style="font-size:13px;">📥 Exportar Tabela Atual em CSV</button>
            <button class="btn btn-primary" onclick="UI._processarBulkPrecos()" style="background:#0ea5e9; font-weight:800; font-size:14px; padding:12px 24px;">⚡ PROCESSAR E ATUALIZAR TODOS</button>
        </div>
    </div>
    `;
};

UI._processarBulkPrecos = function () {
    const raw = document.getElementById('bulk-precos-input')?.value || '';
    const linhas = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (linhas.length === 0) return UI.toast('Cole ao menos uma linha para importar!', 'error');

    let importados = 0;
    if (!dataManager.data.tabelaServicosModelo) dataManager.data.tabelaServicosModelo = {};

    linhas.forEach(linha => {
        // Suporta ponto e vírgula, vírgula ou tab
        const partes = linha.split(/[;\t]/).map(p => p.trim());
        if (partes.length >= 2) {
            const modNome = partes[0].toLowerCase();
            const cTela = parseFloat(partes[1].replace('R$', '').replace(',', '.')) || 0;
            const cBat = partes[2] ? parseFloat(partes[2].replace('R$', '').replace(',', '.')) || 0 : 0;
            const cCon = partes[3] ? parseFloat(partes[3].replace('R$', '').replace(',', '.')) || 0 : 0;

            if (!dataManager.data.tabelaServicosModelo[modNome]) {
                dataManager.data.tabelaServicosModelo[modNome] = {};
            }

            const m = dataManager.data.tabelaServicosModelo[modNome];
            if (cTela > 0) m.tela = { p: cTela, m: 40, d: 2 };
            if (cBat > 0) m.bateria = { p: cBat, m: 30, d: 1 };
            if (cCon > 0) m.conector = { p: cCon, m: 35, d: 1 };

            importados++;
        }
    });

    dataManager.saveData();
    UI.toast(`🎉 ${importados} modelos e custos importados com sucesso!`, 'success');
    UI.modalTabelaPrecosConserto('lista');
};

UI._exportarTabelaPrecosCSV = function () {
    const tabela = dataManager.data.tabelaServicosModelo || {};
    let csv = 'Modelo;CustoTela;CustoBateria;CustoConector\n';

    Object.keys(tabela).sort().forEach(m => {
        const s = tabela[m] || {};
        const cTela = s.tela ? s.tela.p : 0;
        const cBat = s.bateria ? s.bateria.p : 0;
        const cCon = s.conector ? s.conector.p : 0;
        csv += `${m};${cTela};${cBat};${cCon}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tabela_Custos_Assistencia_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('📥 Download do arquivo CSV iniciado!', 'success');
};
