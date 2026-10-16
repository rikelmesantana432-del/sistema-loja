// StrategyOS 3.1 — Gestão de Caixas COMPLETA (Correção 7)
// Adicionar, Retirar, Transferir, Zerar, Histórico

UI._renderBotoesCaixa = function () {
    return `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:16px">
        <button class="btn" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#fff;font-size:16px;font-weight:bold;box-shadow:0 4px 12px rgba(16,185,129,0.3);" onclick="UI.modalBaterCaixa()">⚖️ BATER CAIXA (FECHAMENTO)</button>
        <button class="btn btn-primary" onclick="UI.adicionarDinheiro()" style="font-size:16px">💰 Adicionar Dinheiro</button>
        <button class="btn" style="background:var(--accent-red);color:#fff;font-size:16px" onclick="UI.retirarDinheiro()">💸 Retirar Dinheiro</button>
        <button class="btn" style="background:var(--accent-cyan);color:#fff;font-size:16px" onclick="UI.transferirEntreCaixas()">🔄 Transferir</button>
        <button class="btn btn-ghost" style="font-size:16px" onclick="UI.zerarCaixa()">🗑️ Zerar Caixa</button>
        <button class="btn btn-ghost" style="font-size:16px" onclick="UI.verHistoricoMovimentacoes()">📋 Histórico</button>
        <button class="btn btn-ghost" style="font-size:16px" onclick="UI.verHistoricoFechamentos()">📜 Fechamentos</button>
        <button class="btn btn-ghost" style="font-size:16px;background:rgba(255, 215, 0, 0.12);color:#FFD700;border:1px solid rgba(255, 215, 0, 0.3);" onclick="UI.modalExtrairCustosVendas()">📊 Extrair Custos/Vendas</button>
    </div>`;
};

// === HISTÓRICO DE FECHAMENTOS ===
UI.verHistoricoFechamentos = function () {
    const fechamentosDiarios = dataManager.data.fechamentosCaixa || [];
    const semanais = dataManager.data.fechamentosSemanais || [];
    
    let html = `
    <div style="padding:10px;">
        <h3 style="color:#10b981;margin-bottom:12px;">📊 Conferências de Caixa (Fechamento Diário)</h3>
        <div style="max-height:250px;overflow-y:auto;margin-bottom:24px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);">
            <table style="width:100%;font-size:13px;border-collapse:collapse;text-align:left;">
                <thead style="position:sticky;top:0;background:rgba(15,20,32,0.98);z-index:2;">
                    <tr style="border-bottom:2px solid var(--border-color);color:var(--text-muted);">
                        <th style="padding:10px;">Data / Usuário</th>
                        <th style="padding:10px;">Declarado (Gaveta + Pix)</th>
                        <th style="padding:10px;">Resultado</th>
                        <th style="padding:10px;width:35%">Observações</th>
                    </tr>
                </thead>
                <tbody>`;
    
    if (fechamentosDiarios.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted)">Nenhuma conferência de caixa registrada.</td></tr>';
    } else {
        fechamentosDiarios.slice().reverse().forEach(f => {
            const dataFmt = new Date(f.data).toLocaleString('pt-BR');
            const totalDecl = (f.valorGaveta || 0) + (f.valorMaquina || 0);
            
            let corStatus = f.status === 'exato' ? '#10b981' : f.status === 'sobra' ? '#3b82f6' : '#ef4444';
            let iconeStatus = f.status === 'exato' ? '✅ Bateu' : f.status === 'sobra' ? '📈 Sobra' : '📉 Quebra';
            
            html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:10px;white-space:nowrap;"><strong>${dataFmt}</strong><br><span style="font-size:11px;color:var(--text-muted)">${f.usuario || 'Func.'}</span></td>
                <td style="padding:10px;">
                    Gaveta: <strong style="color:#00FFA3">${UI.R(f.valorGaveta)}</strong><br>
                    Pix/Maq: <span style="color:#A78BFA">${UI.R(f.valorMaquina || 0)}</span>
                </td>
                <td style="padding:10px;">
                    <span style="color:${corStatus};font-weight:bold">${iconeStatus}</span><br>
                    <span style="font-size:11px;color:var(--text-muted)">Dif: ${UI.R(f.diferenca)}</span>
                </td>
                <td style="padding:10px;font-size:11px;color:#cbd5e1;line-height:1.4">${f.observacao || '<em>Nenhuma obs.</em>'}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table></div>
        <h3 style="color:#8b5cf6;margin-bottom:12px;">📅 Fechamentos Semanais</h3>
        <div style="max-height:250px;overflow-y:auto;border-radius:10px;border:1px solid rgba(255,255,255,0.1);">
            <table style="width:100%;font-size:13px;border-collapse:collapse;text-align:left;">
                <thead style="position:sticky;top:0;background:rgba(15,20,32,0.98);z-index:2;">
                    <tr style="border-bottom:2px solid var(--border-color);color:var(--text-muted);">
                        <th style="padding:10px;">Data / Semana</th>
                        <th style="padding:10px;">Lucro (Líquido)</th>
                        <th style="padding:10px;">Aparelhos Vendidos</th>
                        <th style="padding:10px;">Origem</th>
                    </tr>
                </thead>
                <tbody>`;

    if (semanais.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted)">Nenhum fechamento semanal registrado.</td></tr>';
    } else {
        semanais.slice().reverse().forEach(s => {
            const dataFmt = s.dataFechamento ? new Date(s.dataFechamento).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'}) : '—';
            html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:10px;white-space:nowrap;">${dataFmt} <br><span style="font-size:10px;color:var(--text-muted)">${s.semana || ''}</span></td>
                <td style="padding:10px;color:#8b5cf6;font-weight:bold;">${UI.R(s.lucroSemana || 0)}</td>
                <td style="padding:10px;text-align:center;">${s.totalAparelhos || 0}</td>
                <td style="padding:10px;font-size:11px;">${s.origem || 'Automático'}</td>
            </tr>`;
        });
    }

    html += `</tbody></table></div></div>`;
    
    UI.openModal('📜 Histórico de Fechamentos (Diários e Semanais)', html);
};

// === ADICIONAR DINHEIRO ===
UI.adicionarDinheiro = function () {
    const f = dataManager.getFinanceiro();
    UI.openModal('💰 Adicionar Dinheiro', `
        <div style="padding:12px">
            <label class="form-label">Caixa de destino:</label>
            <select class="form-input" id="add-caixa" style="font-size:16px;padding:10px">
                <option value="caixaPrincipal">🏪 Caixa Principal (Balcão / Loja) (${UI.R(f.caixaPrincipal || f.caixaSecundario || 0)})</option>
                <option value="caixaFogos">🎇 Caixa de Fogos de Artifício (${UI.R(f.caixaFogos || 0)})</option>
                <option value="caixaAssistencia">🔧 Caixa Assistência Técnica (${UI.R(f.caixaAssistencia || 0)})</option>
                <option value="reservaEmergencia">🛡️ Reserva de Emergência (${UI.R(f.reservaEmergencia || 0)})</option>
            </select>
            <label class="form-label" style="margin-top:12px">Valor (R$):</label>
            <input class="form-input" id="add-valor" type="number" style="font-size:20px;text-align:center;font-weight:700;padding:12px" placeholder="0,00">
            <label class="form-label" style="margin-top:12px">Motivo:</label>
            <select class="form-input" id="add-motivo" style="font-size:16px;padding:10px">
                <option value="Venda manual">Venda manual</option>
                <option value="Aporte pessoal">Aporte pessoal</option>
                <option value="Devolução">Devolução</option>
                <option value="Outro">Outro</option>
            </select>
            <label class="form-label" style="margin-top:12px">Observação (opcional):</label>
            <input class="form-input" id="add-obs" placeholder="Detalhes extras..." style="font-size:16px;padding:10px">
            <button class="btn btn-primary" style="width:100%;margin-top:16px;font-size:18px;padding:12px" onclick="UI._confirmarAdicao()">✅ ADICIONAR</button>
        </div>`);
};

UI._confirmarAdicao = function () {
    const caixa = document.getElementById('add-caixa').value;
    const valor = parseFloat(document.getElementById('add-valor').value);
    const motivo = document.getElementById('add-motivo').value;
    const obs = document.getElementById('add-obs')?.value || '';
    if (!valor || valor <= 0) return UI.toast('Digite um valor válido', 'error');
    dataManager.data.financeiro[caixa] += valor;
    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({ tipo: 'entrada', caixa, valor, motivo, obs, data: new Date().toISOString() });
    dataManager.saveData();
    UI.closeModal();
    UI.toast(`✅ ${UI.R(valor)} adicionado ao ${caixa}`, 'success');
    UI.render();
};

// === RETIRAR DINHEIRO ===
UI.retirarDinheiro = function () {
    const f = dataManager.getFinanceiro();
    UI.openModal('💸 Retirar Dinheiro', `
        <div style="padding:12px">
            <label class="form-label">Retirar de:</label>
            <select class="form-input" id="ret-caixa" style="font-size:16px;padding:10px">
                <option value="caixaSecundario">Caixa Secundário (Balcão / Gaveta) (${UI.R(f.caixaSecundario || 0)})</option>
                <option value="caixaTerciario">Caixa Terciário (Pai) (${UI.R(f.caixaTerciario || 0)})</option>
                <option value="caixaAcessorios">Caixa Acessórios (${UI.R(f.caixaAcessorios)})</option>
                <option value="caixaAssistencia">Caixa Assistência (${UI.R(f.caixaAssistencia)})</option>
                <option value="reservaEmergencia">Reserva de Emergência (${UI.R(f.reservaEmergencia)})</option>
                <option value="caixaPrincipal">Caixa Principal (Interno) (${UI.R(f.caixaPrincipal)})</option>
            </select>
            <label class="form-label" style="margin-top:12px">Valor (R$):</label>
            <input class="form-input" id="ret-valor" type="number" style="font-size:20px;text-align:center;font-weight:700;padding:12px" placeholder="0,00">
            <label class="form-label" style="margin-top:12px">Motivo:</label>
            <select class="form-input" id="ret-motivo" style="font-size:16px;padding:10px">
                <option value="Compra de estoque">Compra de estoque</option>
                <option value="Despesas da loja">Despesas da loja</option>
                <option value="Retirada pessoal">Retirada pessoal</option>
                <option value="Pagamento fornecedor">Pagamento fornecedor</option>
                <option value="Outro">Outro</option>
            </select>
            <label class="form-label" style="margin-top:12px">Observação (opcional):</label>
            <input class="form-input" id="ret-obs" placeholder="Detalhes..." style="font-size:16px;padding:10px">
            <button class="btn" style="background:var(--accent-red);color:#fff;width:100%;margin-top:16px;font-size:18px;padding:12px" onclick="UI._confirmarRetirada()">💸 RETIRAR</button>
        </div>`);
};

UI._confirmarRetirada = function () {
    const caixa = document.getElementById('ret-caixa').value;
    const valor = parseFloat(document.getElementById('ret-valor').value);
    const motivo = document.getElementById('ret-motivo').value;
    const obs = document.getElementById('ret-obs')?.value || '';
    if (!valor || valor <= 0) return UI.toast('Digite um valor válido', 'error');
    if (dataManager.data.financeiro[caixa] < valor) return UI.toast('Saldo insuficiente!', 'error');
    dataManager.data.financeiro[caixa] -= valor;
    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({ tipo: 'saida', caixa, valor, motivo, obs, data: new Date().toISOString() });
    dataManager.saveData();
    UI.closeModal();
    UI.toast(`💸 ${UI.R(valor)} retirado de ${caixa}`, 'success');
    UI.render();
};

// === TRANSFERIR ENTRE CAIXAS ===
UI.transferirEntreCaixas = function () {
    const opts = `<option value="caixaSecundario">Secundário (${UI.R(f.caixaSecundario || 0)})</option><option value="caixaTerciario">Terciário (Pai) (${UI.R(f.caixaTerciario || 0)})</option><option value="caixaAcessorios">Acessórios (${UI.R(f.caixaAcessorios)})</option><option value="caixaAssistencia">Assistência (${UI.R(f.caixaAssistencia)})</option><option value="reservaEmergencia">Reserva (${UI.R(f.reservaEmergencia)})</option><option value="caixaPrincipal">Principal (Interno) (${UI.R(f.caixaPrincipal)})</option>`;
    UI.openModal('🔄 Transferir entre Caixas', `
        <div style="padding:12px">
            <label class="form-label">De (origem):</label>
            <select class="form-input" id="transf-origem" style="font-size:16px;padding:10px">${opts}</select>
            <label class="form-label" style="margin-top:12px">Para (destino):</label>
            <select class="form-input" id="transf-destino" style="font-size:16px;padding:10px">${opts}</select>
            <label class="form-label" style="margin-top:12px">Valor (R$):</label>
            <input class="form-input" id="transf-valor" type="number" style="font-size:20px;text-align:center;font-weight:700;padding:12px" placeholder="0,00">
            <button class="btn" style="background:var(--accent-cyan);color:#fff;width:100%;margin-top:16px;font-size:18px;padding:12px" onclick="UI._confirmarTransferencia()">🔄 TRANSFERIR</button>
        </div>`);
};

UI._confirmarTransferencia = function () {
    const origem = document.getElementById('transf-origem').value;
    const destino = document.getElementById('transf-destino').value;
    const valor = parseFloat(document.getElementById('transf-valor').value);
    if (!valor || valor <= 0) return UI.toast('Digite um valor válido', 'error');
    if (origem === destino) return UI.toast('Origem e destino devem ser diferentes', 'error');
    if (dataManager.data.financeiro[origem] < valor) return UI.toast('Saldo insuficiente!', 'error');
    dataManager.data.financeiro[origem] -= valor;
    dataManager.data.financeiro[destino] += valor;
    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({ tipo: 'transferencia', caixaOrigem: origem, caixaDestino: destino, valor, data: new Date().toISOString() });
    dataManager.saveData();
    UI.closeModal();
    UI.toast(`🔄 ${UI.R(valor)} transferido de ${origem} para ${destino}`, 'success');
    UI.render();
};

// === ZERAR CAIXA ===
UI.zerarCaixa = function () {
    const f = dataManager.getFinanceiro();
    UI.openModal('🗑️ Zerar Caixa', `
        <div style="padding:12px">
            <p style="font-size:18px;color:var(--accent-red);margin-bottom:12px">⚠️ Isso vai colocar o saldo em R$ 0,00!</p>
            <select class="form-input" id="zerar-caixa" style="font-size:16px;padding:10px">
                <option value="caixaSecundario">Secundário (Balcão / Gaveta) (${UI.R(f.caixaSecundario || 0)})</option>
                <option value="caixaTerciario">Terciário (Pai) (${UI.R(f.caixaTerciario || 0)})</option>
                <option value="caixaAcessorios">Acessórios (${UI.R(f.caixaAcessorios)})</option>
                <option value="caixaAssistencia">Assistência (${UI.R(f.caixaAssistencia)})</option>
                <option value="caixaPrincipal">Principal (Interno) (${UI.R(f.caixaPrincipal)})</option>
            </select>
            <button class="btn" style="background:var(--accent-red);color:#fff;width:100%;margin-top:16px;font-size:18px;padding:12px" onclick="UI._confirmarZerar()">🗑️ CONFIRMAR ZERAR</button>
        </div>`);
};

UI._confirmarZerar = function () {
    const caixa = document.getElementById('zerar-caixa').value;
    const valorAnterior = dataManager.data.financeiro[caixa];
    dataManager.data.financeiro[caixa] = 0;
    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({ tipo: 'zerado', caixa, valorAnterior, data: new Date().toISOString() });
    dataManager.saveData();
    UI.closeModal();
    UI.toast(`🗑️ ${caixa} zerado (era ${UI.R(valorAnterior)})`, 'success');
    UI.render();
};

// === HISTÓRICO DE MOVIMENTAÇÕES ===
UI.verHistoricoMovimentacoes = function () {
    const movs = dataManager.getTodosMovimentacoesHistorico();
    const nomes = { caixaPrincipal: 'Principal', caixaAcessorios: 'Acessórios', caixaAssistencia: 'Assistência', caixaSecundario: 'Secundário', caixaTerciario: 'Terciário (Pai)', reservaEmergencia: 'Reserva' };
    
    let html = `
    <div style="padding:10px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:12px;padding:14px;margin-bottom:16px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;margin-bottom:10px;">
                <div>
                    <label class="form-label" style="font-size:11px;color:var(--text-muted);">🔎 Pesquisar (Produto, Cliente ou Descrição):</label>
                    <input class="form-input" id="hist-busca-input" placeholder="Digite para filtrar instantaneamente..." oninput="UI._filtrarModalHistorico()" style="font-size:14px;padding:8px;">
                </div>
                <div>
                    <label class="form-label" style="font-size:11px;color:var(--text-muted);">🗓️ Filtrar por Data Específica:</label>
                    <input class="form-input" id="hist-data-input" type="date" onchange="UI._filtrarModalHistorico()" style="font-size:14px;padding:8px;">
                </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                <span style="font-size:11px;color:var(--text-muted);font-weight:700;">Atalhos:</span>
                <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:4px 8px;" onclick="document.getElementById('hist-data-input').value=new Date().toISOString().substring(0,10);UI._filtrarModalHistorico();">🗓️ Hoje</button>
                <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:4px 8px;" onclick="document.getElementById('hist-data-input').value='';document.getElementById('hist-busca-input').value='';UI._filtrarModalHistorico();">🔍 Exibir Todo o Histórico (${movs.length})</button>
            </div>
        </div>

        <div style="margin-bottom:10px;font-size:13px;color:var(--text-muted);" id="hist-contador-info">
            Exibindo ${movs.length} movimentações no histórico da loja até o momento
        </div>

        <div style="max-height:480px;overflow-y:auto;">
            <table style="width:100%;font-size:13px;border-collapse:collapse;text-align:left;">
                <thead style="position:sticky;top:0;background:rgba(15,20,32,0.98);z-index:2;">
                    <tr style="border-bottom:2px solid var(--border-color);color:var(--text-muted);">
                        <th style="padding:10px;">Data / Hora</th>
                        <th style="padding:10px;">Tipo</th>
                        <th style="padding:10px;">Caixa</th>
                        <th style="padding:10px;">Valor Total</th>
                        <th style="padding:10px;">Descrição / Cliente</th>
                        <th style="padding:10px;text-align:center;">Ação</th>
                    </tr>
                </thead>
                <tbody id="hist-tbody-container">
                    <!-- Renderizado dinamicamente via UI._filtrarModalHistorico -->
                </tbody>
            </table>
        </div>
    </div>`;

    UI.openModal('📋 Histórico Completo da Loja (Sem Limites)', html);

    UI._filtrarModalHistorico = function () {
        const busca = (document.getElementById('hist-busca-input')?.value || '').toLowerCase().trim();
        const dataFiltro = document.getElementById('hist-data-input')?.value || '';
        const tbody = document.getElementById('hist-tbody-container');
        const countInfo = document.getElementById('hist-contador-info');

        if (!tbody) return;

        const filtrados = movs.filter(m => {
            const descMatch = (m.descricao || '').toLowerCase().includes(busca);
            const cliMatch = (m.cliente || '').toLowerCase().includes(busca);
            const tipoMatch = (m.tipo || '').toLowerCase().includes(busca);
            const matchText = !busca || descMatch || cliMatch || tipoMatch;

            let matchData = true;
            if (dataFiltro && m.data) {
                const ts = dataManager.parseDataSafe(m.data);
                const dtStr = ts > 0 ? new Date(ts).toISOString().substring(0, 10) : (m.data || '').substring(0, 10);
                matchData = dtStr === dataFiltro;
            }

            return matchText && matchData;
        });

        if (countInfo) {
            countInfo.textContent = `Exibindo ${filtrados.length} de ${movs.length} movimentações registradas`;
        }

        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:26px;color:var(--text-muted)">Nenhuma movimentação encontrada para os filtros selecionados.</td></tr>';
            return;
        }

        let rowsHtml = '';
        filtrados.forEach((m, idx) => {
            const ts = dataManager.parseDataSafe(m.data);
            const dataFmt = ts > 0 ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
            const val = parseFloat(m.valor || 0);
            const cor = val < 0 || m.tipo === 'saida' || m.tipo === 'despesa' ? 'var(--accent-red)' : 'var(--accent-green)';
            const tipoLabel = m.tipo === 'despesa' ? '💸 Despesa' : val < 0 ? '➖ Saída/Compra' : '➕ Venda/Entrada';
            const caixaLabel = m.caixa ? (nomes[m.caixa] || m.caixa) : 'Secundário';
            const descClean = (m.descricao || m.motivo || m.obs || '-').replace(/'/g, "\\'");

            rowsHtml += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                    <td style="padding:10px;color:var(--text-muted);font-size:12px;">${dataFmt}</td>
                    <td style="padding:10px;color:${cor};font-weight:700;font-size:12px;">${tipoLabel}</td>
                    <td style="padding:10px;font-size:12px;">${caixaLabel}</td>
                    <td style="padding:10px;font-weight:800;color:${cor};font-size:13px;">${UI.R(val)}</td>
                    <td style="padding:10px;color:#FFF;font-size:13px;">${m.descricao || m.motivo || m.obs || '-'} ${m.cliente && m.cliente !== 'Não Identificado' ? `<span style="font-size:11px;color:var(--text-muted);">(${m.cliente})</span>` : ''}</td>
                    <td style="padding:10px;text-align:center;">
                        <button class="btn btn-sm btn-ghost" style="color:#ff5555;padding:4px 8px;font-size:11px;" onclick="UI.modalConfirmarEstornarItem('${descClean}', ${val}, '${m.custo || 0}', '${m.caixa || 'caixaSecundario'}', '${m.tipo || ''}', '${m.data || ''}')">🗑️ Estornar</button>
                    </td>
                </tr>`;
        });

        tbody.innerHTML = rowsHtml;
    };

    setTimeout(() => UI._filtrarModalHistorico(), 50);
};

UI.modalConfirmarEstornarItem = function (descricao, valor, custo, caixa, tipo, dataItem = '') {
    UI.openModal('⚠️ Confirmar Estorno / Cancelamento', `
        <div style="text-align:center;padding:16px;">
            <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
            <h3 style="color:#ff5555;font-size:18px;margin-bottom:8px;">Deseja estornar esta movimentação?</h3>
            <div style="background:rgba(255,50,50,0.1);border:1px solid rgba(255,50,50,0.3);border-radius:12px;padding:14px;margin:16px 0;text-align:left;">
                <div style="font-size:14px;color:#FFF;font-weight:700;">📦 ${descricao}</div>
                <div style="font-size:14px;color:#ff5555;font-weight:800;margin-top:4px;">💰 Valor: ${UI.R(valor)}</div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">Esta ação irá **descontar o valor do caixa**, **retroagir o lucro e comissão** e remover o registro do histórico.</div>
        </div>
        <div class="modal-footer" style="display:flex;gap:8px;">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-danger btn-lg" style="flex:1;" onclick="
                dataManager.estornarVendaERetroagirCaixa({ nomeProduto: '${descricao.replace(/'/g, "\\'")}', valorVenda: ${valor}, custo: ${custo}, caixaOrigem: '${caixa}', tipo: '${tipo}', dataItem: '${dataItem}' });
                UI.toast('✅ Movimentação estornada e caixa ajustado!', 'success');
                UI.closeModal();
                UI.render();
            ">✓ Confirmar Estorno</button>
        </div>
    `);
};

// === SANGRIA / FECHAMENTO DE TURNO VENDEDOR ===
UI.fecharTurnoVendedor = function () {
    const f = dataManager.getFinanceiro();
    const saldo = f.caixaSecundario || 0;
    
    UI.openModal('📥 Fechamento de Turno & Sangria (Balcão)', `
        <div style="padding:12px">
            <p style="font-size:15px;color:var(--text-muted);margin-bottom:16px;">
                Esta operação realiza a conferência e transfere todo o saldo acumulado do <strong>Caixa Secundário (Gaveta)</strong> para o <strong>Caixa Terciário (Pai)</strong>, deixando o caixa limpo para o próximo turno.
            </p>
            <div style="text-align:center;background:rgba(168,85,247,0.1);padding:16px;border-radius:12px;border:1px dashed var(--accent-purple);margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Saldo Acumulado no Turno</div>
                <div style="font-size:32px;font-weight:900;color:var(--accent-purple);margin-top:4px;">${UI.R(saldo)}</div>
            </div>
            
            <label class="form-label">Valor da Sangria (R$):</label>
            <input class="form-input" id="sangria-valor" type="number" value="${saldo.toFixed(2)}" style="font-size:20px;text-align:center;font-weight:700;padding:10px;">
            
            <label class="form-label" style="margin-top:12px">Observações (opcional):</label>
            <input class="form-input" id="sangria-obs" placeholder="Ex: Entregue em mãos para o administrador..." style="font-size:15px;padding:8px;">
            
            <button class="btn" style="background:var(--accent-purple);color:#fff;width:100%;margin-top:20px;font-size:18px;padding:12px;" onclick="UI._confirmarSangriaBalcao()">✅ CONCLUIR E TRANSFERIR</button>
        </div>
    `);
};
UI.fecharTurnoIlanna = UI.fecharTurnoVendedor;

UI._confirmarSangriaBalcao = function () {
    const valor = parseFloat(document.getElementById('sangria-valor').value);
    const obs = document.getElementById('sangria-obs').value || '';
    if (isNaN(valor) || valor <= 0) return UI.toast('Digite um valor válido!', 'error');
    
    const f = dataManager.data.financeiro;
    if (f.caixaSecundario < valor) return UI.toast('Valor da sangria excede o saldo do Caixa Secundário!', 'error');
    
    f.caixaSecundario -= valor;
    if (f.caixaTerciario === undefined) f.caixaTerciario = 0;
    f.caixaTerciario += valor;
    
    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({
        tipo: 'transferencia',
        caixaOrigem: 'caixaSecundario',
        caixaDestino: 'caixaTerciario',
        valor,
        motivo: 'Sangria de Turno (Balcão)',
        obs: obs || 'Conferência física concluída',
        data: new Date().toISOString()
    });
    
    dataManager.saveData();
    UI.closeModal();
    UI.toast(`✅ Sangria de ${UI.R(valor)} transferida para o Caixa Terciário (Pai)!`, 'success');
    UI.render();
};
UI._confirmarSangriaIlanna = UI._confirmarSangriaBalcao;

// === RENDERIZAR TELA DE CAIXA COMPLETA DA LOJA ===
UI.renderCaixa = function () {
    const f = dataManager.getFinanceiro();
    const fundoCusto = dataManager.data.fundoCustoEstoque || { totalAcumulado: 0, historicoCusto: [] };
    const divisao = dataManager.data.divisaoLucro || { totalLucroAcumulado: 0, acumuladoLoja40: 0, acumuladoPai60: 0, historicoDivisao: [] };
    const movs = (dataManager.data.movimentacoesCaixa || []).slice().reverse().slice(0, 30);

    let html = `
    <div style="max-width:1100px;margin:0 auto;padding:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="margin:0;font-size:28px;color:#FFD700;">💰 GESTÃO FINANCEIRA & SINCRONIZAÇÃO DE CAIXAS</h2>
                <p style="margin:4px 0 0;color:var(--text-muted);font-size:15px;">Apuração em tempo real de caixas, custos de reposição e divisão de lucros (40% Loja / 60% Pai)</p>
            </div>
            ${UI._renderBotoesCaixa()}
        </div>

        <!-- CARDS DOS CAIXAS DA LOJA (CAIXA PRINCIPAL & CAIXA FOGOS) -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;margin-bottom:20px;">
            <div class="dash-card" style="border:2px solid #10b981;background:rgba(16,185,129,0.08);padding:24px;border-radius:16px;box-shadow:var(--shadow-sm);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div class="dash-card-value" style="color:#10b981;font-size:36px;font-weight:900;">${UI.R(f.caixaPrincipal || f.caixaSecundario || 0)}</div>
                        <div class="dash-card-label" style="font-size:15px;color:#FFF;font-weight:bold;margin-top:6px;">🏪 CAIXA PRINCIPAL (BALCÃO / LOJA)</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Eletrônicos, Películas, Capas e Consertos</div>
                    </div>
                    <div style="font-size:42px;">💰</div>
                </div>
            </div>

            <div class="dash-card" style="border:2px solid #FFB65C;background:rgba(255,182,92,0.08);padding:24px;border-radius:16px;box-shadow:var(--shadow-sm);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div class="dash-card-value" style="color:#FFB65C;font-size:36px;font-weight:900;">${UI.R(f.caixaFogos || 0)}</div>
                        <div class="dash-card-label" style="font-size:15px;color:#FFF;font-weight:bold;margin-top:6px;">🎇 CAIXA DE FOGOS DE ARTIFÍCIO</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Vendas exclusivas de Bombas, Girandas e Fogos</div>
                    </div>
                    <div style="font-size:42px;">🎇</div>
                </div>
            </div>
        </div>

        <!-- PAINEL DE FUNDO DE REPOSIÇÃO (CMV) E DIVISÃO 40/60 -->
        <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(255, 215, 0, 0.3);border-radius:18px;padding:20px;margin-bottom:24px;box-shadow:0 8px 30px rgba(0,0,0,0.4);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
                <div>
                    <h3 style="margin:0;font-size:20px;color:#FFD700;font-weight:800;">📦 FUNDO DE CUSTO DE ESTOQUE (REPOSIÇÃO) & DIVISÃO DE LUCRO LÍQUIDO</h3>
                    <p style="margin:4px 0 0;font-size:13px;color:var(--text-muted);">Custo dos produtos separado automaticamente + Lucro splitado 40% Loja / 60% Pai</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn" style="background:#f59e0b;color:#000;font-weight:800;font-size:13px;padding:8px 14px;border-radius:8px;" onclick="UI._modalDepositarFundoReposicao()">📥 Depositar / Separar Custo</button>
                    <button class="btn" style="background:#ef4444;color:#fff;font-weight:800;font-size:13px;padding:8px 14px;border-radius:8px;" onclick="UI._modalUsarFundoReposicao()">🛍️ Usar p/ Comprar Estoque</button>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:20px;">
                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(245,158,11,0.5);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">📦 Reposição Geral (Celulares/Acessórios)</div>
                    <div style="font-size:26px;font-weight:900;color:#f59e0b;margin:6px 0;">${UI.R(fundoCusto.saldoGuardado !== undefined ? fundoCusto.saldoGuardado : (fundoCusto.totalAcumulado || 0))}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Guardado p/ repor eletrônicos</div>
                </div>

                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(255,182,92,0.6);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:#FFB65C;font-weight:800;text-transform:uppercase;">🎇 Fundo Reposição Fogos (Exclusivo)</div>
                    <div style="font-size:26px;font-weight:900;color:#FFB65C;margin:6px 0;">${UI.R(dataManager.data.fundoReposicaoFogos?.saldoGuardado || 0)}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Guardado 100% exclusivo p/ reposição de fogos</div>
                    <div style="margin-top:4px;font-size:10px;color:var(--text-muted);">Acumulado Histórico: ${UI.R(dataManager.data.fundoReposicaoFogos?.totalAcumulado || 0)}</div>
                </div>

                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(16,185,129,0.4);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">🏪 Parte da Loja (40% Lucro)</div>
                    <div style="font-size:26px;font-weight:900;color:#10b981;margin:6px 0;">${UI.R(divisao.acumuladoLoja40 || 0)}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Destinado a investimentos na loja</div>
                </div>

                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(168,85,247,0.4);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">👨‍🦳 Participação do Pai (60% Lucro)</div>
                    <div style="font-size:26px;font-weight:900;color:#c084fc;margin:6px 0;">${UI.R(divisao.acumuladoPai60 || 0)}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Pro-labore e participação do pai</div>
                </div>
            </div>
        <!-- FECHAMENTO SEMANAL E TABELA DETALHADA DE SEGUNDA A SÁBADO -->
        ${(() => {
            const sem = dataManager.getFechamentoSemanal();
            return `
            <div style="background:rgba(15, 20, 32, 0.95);border:2px solid rgba(0,217,126,0.4);border-radius:18px;padding:22px;margin-bottom:24px;box-shadow:0 8px 30px rgba(0,0,0,0.5);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                    <div>
                        <h3 style="margin:0;font-size:22px;color:#00d97e;font-weight:900;">🗓️ FECHAMENTO DE SÁBADO (BALANÇO & TABELA SEMANAL SEGUNDA A SÁBADO)</h3>
                        <p style="margin:4px 0 0;font-size:14px;color:var(--text-muted);">Período da Semana: <strong>${sem.inicioSemanaStr} até ${sem.fimSemanaStr}</strong></p>
                    </div>
                    <button class="btn btn-success" style="font-weight:800;font-size:15px;padding:10px 18px;" onclick="UI._confirmarFechamentoSemanalSabado()">🔒 CONCLUIR FECHAMENTO DE SÁBADO</button>
                </div>

                <!-- GRÁFICO VISUAL DE BARRAS DA SEMANA -->
                ${(() => {
                    const maxVenda = Math.max(1, ...sem.tabelaSemanal.map(d => d.vendas));
                    return `
                    <div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:16px;margin-bottom:18px;border:1px solid rgba(255,255,255,0.06);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                            <span style="font-size:13px;font-weight:800;color:#00d97e;text-transform:uppercase;">📊 DESEMPENHO VISUAL SEGUNDA A SÁBADO</span>
                            <div style="display:flex;gap:12px;font-size:11px;font-weight:700;">
                                <span style="color:#10b981;">🟢 Vendas</span>
                                <span style="color:#f59e0b;">🟠 Custo</span>
                                <span style="color:#ef4444;">🔴 Despesas</span>
                                <span style="color:#3b82f6;">🔵 Lucro</span>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(6, 1fr);gap:10px;align-items:end;min-height:120px;padding-top:20px;">
                            ${sem.tabelaSemanal.map(d => {
                                const hVenda = Math.round((d.vendas / maxVenda) * 90);
                                const hLucro = d.vendas > 0 ? Math.round((d.lucroLiquido / maxVenda) * 90) : 0;
                                return `
                                <div style="text-align:center;">
                                    <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;font-weight:700;">${d.diaNome.substring(0, 3)}</div>
                                    <div style="display:flex;justify-content:center;align-items:end;gap:3px;height:90px;background:rgba(255,255,255,0.02);border-radius:6px;padding:2px;">
                                        <div style="width:38%;height:${hVenda}%;background:#10b981;border-radius:3px 3px 0 0;" title="Vendas: ${UI.R(d.vendas)}"></div>
                                        <div style="width:38%;height:${hLucro}%;background:#3b82f6;border-radius:3px 3px 0 0;" title="Lucro: ${UI.R(d.lucroLiquido)}"></div>
                                    </div>
                                    <div style="font-size:10px;font-weight:800;color:#10b981;margin-top:4px;">${d.vendas > 0 ? 'R$' + Math.round(d.vendas) : '-'}</div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                })()}

                <!-- TABELA DE SEGUNDA A SÁBADO DETALHADA -->
                <div style="overflow-x:auto;margin-bottom:18px;-webkit-overflow-scrolling:touch;">
                    <table style="min-width:900px;width:100%;font-size:13px;border-collapse:collapse;text-align:center;background:rgba(0,0,0,0.25);border-radius:12px;overflow:hidden;">
                        <thead>
                            <tr style="background:rgba(0,217,126,0.15);color:#00d97e;font-weight:800;border-bottom:2px solid rgba(0,217,126,0.3);">
                                <th style="padding:10px 8px;text-align:left;min-width:110px;">Dia</th>
                                <th style="padding:10px 8px;min-width:60px;">Data</th>
                                <th style="padding:10px 8px;color:#10b981;min-width:90px;">💰 Vendas</th>
                                <th style="padding:10px 8px;color:#f59e0b;min-width:90px;">📦 Custo</th>
                                <th style="padding:10px 8px;color:#ef4444;min-width:90px;">💸 Despesas</th>
                                <th style="padding:10px 8px;color:#3b82f6;min-width:100px;">💎 Lucro</th>
                                <th style="padding:10px 8px;color:#10b981;min-width:100px;">🏪 Loja 40%</th>
                                <th style="padding:10px 8px;color:#f472b6;min-width:100px;">💜 Mãe ~35%</th>
                                <th style="padding:10px 8px;color:#c084fc;min-width:100px;">👨‍🦳 Pai ~25%</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sem.tabelaSemanal || []).map(d => `
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);${d.diaNome === 'Sábado' ? 'background:rgba(0,217,126,0.05);font-weight:bold;' : ''}">
                                    <td style="padding:10px 8px;text-align:left;font-weight:700;color:#FFF;">${d.diaNome}</td>
                                    <td style="padding:10px 8px;color:var(--text-muted);">${d.dataFormatada}</td>
                                    <td style="padding:10px 8px;font-weight:700;color:#10b981;">${UI.R(d.vendas)}</td>
                                    <td style="padding:10px 8px;font-weight:700;color:#f59e0b;">${UI.R(d.custo)}</td>
                                    <td style="padding:10px 8px;font-weight:700;color:#ef4444;">${UI.R(d.despesas)}</td>
                                    <td style="padding:10px 8px;font-weight:800;color:#3b82f6;">${UI.R(d.lucroLiquido)}</td>
                                    <td style="padding:10px 8px;font-weight:700;color:#10b981;">${UI.R(d.loja40)}</td>
                                    <td style="padding:10px 8px;font-weight:700;color:#f472b6;">${UI.R(d.mae58)}</td>
                                    <td style="padding:10px 8px;font-weight:700;color:#c084fc;">${UI.R(d.pai42)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background:rgba(255,215,0,0.12);font-weight:900;font-size:14px;border-top:2px solid #FFD700;color:#FFD700;">
                                <td style="padding:12px 8px;text-align:left;" colspan="2">TOTAL DA SEMANA</td>
                                <td style="padding:12px 8px;color:#10b981;">${UI.R(sem.vendasSemana)}</td>
                                <td style="padding:12px 8px;color:#f59e0b;">${UI.R(sem.custoSemana)}</td>
                                <td style="padding:12px 8px;color:#ef4444;">${UI.R(sem.despesasSemana)}</td>
                                <td style="padding:12px 8px;color:#3b82f6;">${UI.R(sem.lucroLiquidoReal)}</td>
                                <td style="padding:12px 8px;color:#10b981;">${UI.R(sem.parteLoja40)}</td>
                                <td style="padding:12px 8px;color:#f472b6;">${UI.R(sem.parteMae58)}</td>
                                <td style="padding:12px 8px;color:#c084fc;">${UI.R(sem.partePai42)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;background:rgba(0,0,0,0.2);padding:16px;border-radius:14px;border:1px dashed rgba(255,255,255,0.1);">
                    <div style="text-align:center;">
                        <div style="font-size:12px;color:#10b981;font-weight:800;text-transform:uppercase;">🏪 40% Fundo Loja</div>
                        <div style="font-size:26px;font-weight:900;color:#10b981;margin:4px 0;">${UI.R(sem.parteLoja40)}</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:12px;color:#f472b6;font-weight:800;text-transform:uppercase;">💜 Cota da Mãe (~35%)</div>
                        <div style="font-size:26px;font-weight:900;color:#f472b6;margin:4px 0;">${UI.R(sem.parteMae58)}</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:12px;color:#c084fc;font-weight:800;text-transform:uppercase;">👨‍🦳 Cota do Pai (~25%)</div>
                        <div style="font-size:26px;font-weight:900;color:#c084fc;margin:4px 0;">${UI.R(sem.partePai42)}</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:12px;color:#f59e0b;font-weight:800;text-transform:uppercase;">💵 Dinheiro na Gaveta</div>
                        <div style="font-size:26px;font-weight:900;color:#f59e0b;margin:4px 0;">${UI.R(sem.gavetaAtual)}</div>
                    </div>
                </div>
            </div>`;
        })()}

        <!-- EXTRATO COMPLETO DE HISTÓRICO CONSOLIDADO (BACKUP + CAIXA + VENDAS) -->
        ${(() => {
            const todosMovs = dataManager.getTodosMovimentacoesHistorico();
            const movsExibicao = todosMovs.slice(0, 50);

            let extHtml = `
            <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                    <div>
                        <h3 style="margin:0;font-size:18px;color:#FFD700;font-weight:800;">📋 EXTRATO COMPLETO DE HISTÓRICO CONSOLIDADO</h3>
                        <p style="margin:2px 0 0;font-size:12px;color:var(--text-muted);">Exibindo ${movsExibicao.length} de ${todosMovs.length} movimentações registradas no histórico total</p>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-ghost btn-sm" onclick="UI.verHistoricoMovimentacoes()" style="font-size:13px;padding:6px 12px;">🔍 Ver Histórico Completo em Modal</button>
                        <button class="btn btn-sm" onclick="Integrations.enviarBackupTelegram()" style="background:#00a86b;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;">☁️ Backup Telegram</button>
                        <button class="btn btn-sm" onclick="Integrations.modalConfigurarTelegram()" style="background:#0088cc;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;">🤖 Configurar Telegram</button>
                    </div>
                </div>
                
                <div style="overflow-x:auto;">
                    <table style="width:100%;font-size:13px;border-collapse:collapse;text-align:left;">
                        <thead>
                            <tr style="border-bottom:2px solid rgba(255,255,255,0.1);color:var(--text-muted);">
                                <th style="padding:10px;">Data / Hora</th>
                                <th style="padding:10px;">Descrição / Origem</th>
                                <th style="padding:10px;">Valor Venda</th>
                                <th style="padding:10px;color:#f59e0b;">Custo Reposição</th>
                                <th style="padding:10px;color:#10b981;">Loja (40%)</th>
                                <th style="padding:10px;color:#c084fc;">Pai (60%)</th>
                            </tr>
                        </thead>
                        <tbody>`;

            if (movsExibicao.length === 0) {
                extHtml += `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">Nenhuma movimentação registrada no histórico</td></tr>`;
            } else {
                movsExibicao.forEach(m => {
                    const dataStr = m.data ? new Date(m.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
                    const custoVal = parseFloat(m.custo || 0);
                    const valTotal = parseFloat(m.valor || 0);
                    const lojaVal = m.parteLoja || (valTotal > 0 ? Math.round((valTotal - custoVal) * 0.40 * 100) / 100 : 0);
                    const paiVal = m.partePai || (valTotal > 0 ? Math.round((valTotal - custoVal) * 0.60 * 100) / 100 : 0);

                    extHtml += `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="padding:10px;color:var(--text-muted);">${dataStr}</td>
                            <td style="padding:10px;font-weight:600;color:#FFF;">${m.descricao || m.tipo}</td>
                            <td style="padding:10px;font-weight:800;color:${valTotal < 0 ? '#ef4444' : '#10b981'};">${UI.R(valTotal)}</td>
                            <td style="padding:10px;font-weight:700;color:#f59e0b;">${UI.R(custoVal)}</td>
                            <td style="padding:10px;font-weight:700;color:#34d399;">${UI.R(lojaVal > 0 ? lojaVal : 0)}</td>
                            <td style="padding:10px;font-weight:700;color:#c084fc;">${UI.R(paiVal > 0 ? paiVal : 0)}</td>
                        </tr>`;
                });
            }
            extHtml += `
                        </tbody>
                    </table>
                </div>
            </div>`;
            return extHtml;
        })()}
    </div>`;

    document.getElementById('main-content').innerHTML = html;
};

// === ABA EXCLUSIVA DE GESTÃO FINANCEIRA E DRE DA LOJA ===
UI.renderFinanceiro = function () {
    const f = dataManager.getFinanceiro();
    const fundoCusto = dataManager.data.fundoCustoEstoque || { totalAcumulado: 0, historicoCusto: [] };
    const divisao = dataManager.data.divisaoLucro || { totalLucroAcumulado: 0, acumuladoLoja40: 0, acumuladoPai60: 0, historicoDivisao: [] };
    const movs = dataManager.data.movimentacoesCaixa || [];

    // Apuração Geral de DRE Sincronizada com Caixas Reais
    // Apuração Geral de DRE Sincronizada com Transações Reais (Sem alucinação por saldo de gaveta)
    const vendasHist = dataManager.data.historico?.vendas || [];
    let totalReceitaBruta = vendasHist.reduce((s, v) => s + (v.valorVenda || v.valorBruto || v.liquido || v.valor || 0), 0);
    const receitaMovs = movs.filter(m => m.tipo === 'conserto' || m.tipo === 'os_concluida' || m.tipo === 'os_entrada').reduce((s, m) => s + (m.valor || 0), 0);
    totalReceitaBruta += receitaMovs;

    const totalCMV = vendasHist.reduce((s, v) => s + (v.custo || 0), 0) || (fundoCusto.totalAcumulado || 0);
    const lucroBruto = Math.max(0, totalReceitaBruta - totalCMV);

    const totalDespesas = movs.filter(m => m.tipo === 'despesa').reduce((s, m) => s + Math.abs(m.valor || 0), 0);
    const lucroLiquidoReal = Math.max(0, lucroBruto - totalDespesas);

    const parteLoja40 = Math.round(lucroLiquidoReal * 0.40 * 100) / 100;
    const partePai60 = Math.round(lucroLiquidoReal * 0.60 * 100) / 100;

    const semCusto = dataManager.getProdutosSemCusto();

    let html = `
    <div style="max-width:1100px;margin:0 auto;padding:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <span class="vendedor-step-badge" style="background:#10b981">FINANCEIRO EXCLUSIVO (ADMIN)</span>
                <h2 style="margin:4px 0 0;font-size:28px;color:#FFD700;">📊 DRE & ORGANIZAÇÃO FINANCEIRA DA LOJA</h2>
                <p style="margin:4px 0 0;color:var(--text-muted);font-size:15px;">Visão gerencial de receitas, custos de reposição, despesas operacionais e divisão 40/60</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-primary" onclick="UI._modalNovaDespesaLoja()" style="font-size:14px;padding:8px 14px;">💸 Registrar Despesa</button>
                <button class="btn btn-ghost" style="background:rgba(56,189,248,0.15);color:#38bdf8;border-color:rgba(56,189,248,0.4);font-size:14px;padding:8px 14px;" onclick="UI._menuOpcoesTelegram()">✈️ Telegram Bot</button>
                <button class="btn btn-ghost" onclick="UI._enviarDREWhatsApp()" style="font-size:14px;padding:8px 14px;">📱 Enviar DRE</button>
                <button class="btn btn-ghost" onclick="UI.modalRelatorioLucroPorServico()" style="font-size:14px;padding:8px 14px;background:rgba(255,215,0,0.1);color:#FFD700;border-color:rgba(255,215,0,0.4);">📊 Lucro por Serviço</button>
                <button class="btn btn-ghost" onclick="UI._confirmarZerarFinanceiroCompleto()" style="font-size:14px;padding:8px 14px;color:var(--accent-red);border-color:rgba(239,68,68,0.4)">🔄 Zerar Saldos p/ Início Limpo</button>
                <button class="btn btn-ghost" onclick="UI.bloquearAdmin()" style="font-size:14px;padding:8px 14px;">🔒 Bloquear Acesso</button>
            </div>
        </div>

        ${semCusto.total > 0 ? `
        <!-- ALERTA DE PRODUTOS SEM CUSTO -->
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.4);border-radius:14px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
                <div style="font-size:16px;color:#ef4444;font-weight:900;">⚠️ ALERTA: ${semCusto.total} PRODUTO(S) NO ESTOQUE ESTÃO SEM VALOR DE CUSTO!</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
                    ${semCusto.celulares.length > 0 ? semCusto.celulares.length + ' celular(es)' : ''} ${semCusto.acessorios.length > 0 ? semCusto.acessorios.length + ' acessório(s)' : ''} sem custo cadastrado. É necessário informar o custo para calcular a reposição exata e a DRE.
                </div>
            </div>
            <button class="btn btn-sm" style="background:#ef4444;color:#fff;font-weight:bold;font-size:14px;padding:8px 14px;border:none;border-radius:8px;cursor:pointer;" onclick="UI._modalListarProdutosSemCusto()">🔧 Cadastrar Custo dos Produtos</button>
        </div>` : ''}

        <!-- DASHBOARD DRE -->
        <div style="background:linear-gradient(135deg, rgba(15, 20, 32, 0.95), rgba(10, 14, 24, 0.95));border:1px solid rgba(16, 185, 129, 0.3);border-radius:18px;padding:24px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <h3 style="font-size:20px;color:#FFD700;margin-bottom:16px;font-weight:800;">📑 DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE)</h3>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-bottom:20px;">
                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(16,185,129,0.3);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">1. Receita Bruta Total</div>
                    <div style="font-size:26px;font-weight:900;color:#10b981;margin:6px 0;">${UI.R(totalReceitaBruta)}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Vendas + Consertos + Acessórios</div>
                </div>

                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(245,158,11,0.3);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">2. (-) Custo Reposição (CMV)</div>
                    <div style="font-size:26px;font-weight:900;color:#f59e0b;margin:6px 0;">- ${UI.R(totalCMV)}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Valor reservado p/ repor mercadorias</div>
                </div>

                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">3. (-) Despesas Operacionais</div>
                    <div style="font-size:26px;font-weight:900;color:#ef4444;margin:6px 0;">- ${UI.R(totalDespesas)}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">Contas, Aluguel, Luz, Peças extra</div>
                </div>

                <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(255,215,0,0.4);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">4. (=) Lucro Líquido Real</div>
                    <div style="font-size:26px;font-weight:900;color:#FFD700;margin:6px 0;">${UI.R(lucroLiquidoReal)}</div>
                    <div style="font-size:11px;color:#00d97e;">Lucro limpo disponível p/ rateio</div>
                </div>
            </div>

            <!-- DIVISÃO DO LUCRO LÍQUIDO — TABELA INTUITIVA COMPLETA -->
            <div style="background:rgba(255,215,0,0.05);border:1px dashed rgba(255,215,0,0.3);border-radius:14px;padding:20px;margin-bottom:20px;">
                <div style="font-size:14px;color:#FFD700;font-weight:800;margin-bottom:16px;text-transform:uppercase;">⚖️ DIVISÃO COMPLETA DO LUCRO LÍQUIDO</div>
                
                <!-- TABELA VISUAL DA DIVISÃO -->
                <div style="overflow-x:auto;margin-bottom:16px;">
                    <table style="width:100%;font-size:14px;border-collapse:collapse;text-align:left;background:rgba(0,0,0,0.3);border-radius:12px;overflow:hidden;">
                        <thead>
                            <tr style="background:rgba(255,215,0,0.12);border-bottom:2px solid rgba(255,215,0,0.3);">
                                <th style="padding:12px 16px;color:#FFD700;font-weight:800;">Destino</th>
                                <th style="padding:12px 16px;color:#FFD700;font-weight:800;text-align:center;">%</th>
                                <th style="padding:12px 16px;color:#FFD700;font-weight:800;text-align:right;">Valor</th>
                                <th style="padding:12px 16px;color:var(--text-muted);font-weight:700;">Finalidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                                <td style="padding:12px 16px;font-weight:800;color:#FFD700;font-size:15px;">💎 Lucro Líquido Total</td>
                                <td style="padding:12px 16px;text-align:center;font-weight:800;color:#FFD700;">100%</td>
                                <td style="padding:12px 16px;text-align:right;font-weight:900;font-size:18px;color:#FFD700;">${UI.R(lucroLiquidoReal)}</td>
                                <td style="padding:12px 16px;color:var(--text-muted);font-size:12px;">Receita Bruta − Custos − Despesas</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(16,185,129,0.06);">
                                <td style="padding:12px 16px;font-weight:800;color:#10b981;font-size:15px;">🏪 Fundo Exclusivo da Loja</td>
                                <td style="padding:12px 16px;text-align:center;font-weight:800;color:#10b981;">40%</td>
                                <td style="padding:12px 16px;text-align:right;font-weight:900;font-size:18px;color:#10b981;">${UI.R(lucroLiquidoReal * 0.40)}</td>
                                <td style="padding:12px 16px;color:var(--text-muted);font-size:12px;">Caixa, reposição, contas e expansão</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                                <td colspan="4" style="padding:6px 16px;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;background:rgba(255,255,255,0.02);">↪ 60% DISTRIBUÍVEL (${UI.R(lucroLiquidoReal * 0.60)}) — Dividido entre Mãe e Pai:</td>
                            </tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(236,72,153,0.06);">
                                <td style="padding:12px 16px;font-weight:800;color:#f472b6;font-size:15px;">💜 Cota Exclusiva da Mãe</td>
                                <td style="padding:12px 16px;text-align:center;font-weight:800;color:#f472b6;">~35%</td>
                                <td style="padding:12px 16px;text-align:right;font-weight:900;font-size:18px;color:#f472b6;">${UI.R(lucroLiquidoReal * 0.60 * 0.58)}</td>
                                <td style="padding:12px 16px;color:var(--text-muted);font-size:12px;">58% do distribuível — Dinâmica, maior que o Pai</td>
                            </tr>
                            <tr style="background:rgba(168,85,247,0.06);">
                                <td style="padding:12px 16px;font-weight:800;color:#c084fc;font-size:15px;">👨‍🦳 Cota do Pai (Sócio)</td>
                                <td style="padding:12px 16px;text-align:center;font-weight:800;color:#c084fc;">~25%</td>
                                <td style="padding:12px 16px;text-align:right;font-weight:900;font-size:18px;color:#c084fc;">${UI.R(lucroLiquidoReal * 0.60 * 0.42)}</td>
                                <td style="padding:12px 16px;color:var(--text-muted);font-size:12px;">42% do distribuível — Sócio investidor</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- CARDS RESUMO -->
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;">
                    <div style="background:rgba(16,185,129,0.12);padding:14px;border-radius:10px;border-left:4px solid #10b981;text-align:center;">
                        <div style="font-size:11px;color:var(--text-muted);font-weight:700;">🏪 FUNDO LOJA (40%)</div>
                        <div style="font-size:22px;font-weight:900;color:#10b981;margin-top:4px;">${UI.R(lucroLiquidoReal * 0.40)}</div>
                    </div>
                    <div style="background:rgba(236,72,153,0.12);padding:14px;border-radius:10px;border-left:4px solid #ec4899;text-align:center;">
                        <div style="font-size:11px;color:var(--text-muted);font-weight:700;">💜 COTA MÃE (~35%)</div>
                        <div style="font-size:22px;font-weight:900;color:#f472b6;margin-top:4px;">${UI.R(lucroLiquidoReal * 0.60 * 0.58)}</div>
                    </div>
                    <div style="background:rgba(168,85,247,0.12);padding:14px;border-radius:10px;border-left:4px solid #a855f7;text-align:center;">
                        <div style="font-size:11px;color:var(--text-muted);font-weight:700;">👨‍🦳 COTA PAI (~25%)</div>
                        <div style="font-size:22px;font-weight:900;color:#c084fc;margin-top:4px;">${UI.R(lucroLiquidoReal * 0.60 * 0.42)}</div>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO DEDICADA: DESPESAS FIXAS DA LOJA -->
            ${(() => {
                const fixas = dataManager.data.despesasFixas || [
                    { id: 1, nome: 'Aluguel da Loja', valor: 600, vencimento: 'Dia 10' },
                    { id: 2, nome: 'Energia Elétrica / Luz', valor: 150, vencimento: 'Dia 15' },
                    { id: 3, nome: 'Salário / Comissão (Vendedor)', valor: 1200, vencimento: 'Mensal' },
                    { id: 4, nome: 'Internet Fibra', valor: 100, vencimento: 'Dia 05' },
                    { id: 5, nome: 'Segurança / Alarme', valor: 80, vencimento: 'Dia 20' }
                ];
                const totalFixas = fixas.reduce((s, item) => s + (item.valor || 0), 0);
                const fundoLojaBruto = totalReceitaBruta * 0.40;
                const saldoLojaAposFixas = fundoLojaBruto - totalFixas;

                let fixHtml = `
                <div style="background:rgba(15, 23, 42, 0.9);border:1px solid rgba(59,130,246,0.3);border-radius:14px;padding:18px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
                        <div>
                            <span style="font-size:11px;color:#60a5fa;font-weight:800;text-transform:uppercase;">📌 PREVISÃO MENSAL DA EMPRESA</span>
                            <h4 style="margin:2px 0 0;font-size:18px;color:#FFF;font-weight:800;">DESPESAS FIXAS DA LOJA</h4>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="UI._modalGerenciarDespesasFixas()" style="font-size:13px;padding:6px 12px;">⚙️ Gerenciar Despesas Fixas</button>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;margin-bottom:14px;">
                        ${fixas.map(f => `
                            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <div style="font-size:13px;font-weight:700;color:#FFF;">${f.nome}</div>
                                    <div style="font-size:11px;color:var(--text-muted);">${f.vencimento || 'Mensal'}</div>
                                </div>
                                <div style="font-size:14px;font-weight:900;color:#ef4444;">${UI.R(f.valor)}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(59,130,246,0.1);padding:12px 16px;border-radius:10px;border-left:4px solid #3b82f6;flex-wrap:wrap;gap:10px;">
                        <div>
                            <div style="font-size:12px;color:var(--text-muted);font-weight:700;">TOTAL DE DESPESAS FIXAS DA LOJA:</div>
                            <div style="font-size:22px;font-weight:900;color:#ef4444;">${UI.R(totalFixas)} / mês</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px;color:var(--text-muted);font-weight:700;">SALDO DO FUNDO DA LOJA (40%) APÓS FIXAS:</div>
                            <div style="font-size:22px;font-weight:900;color:${saldoLojaAposFixas >= 0 ? '#10b981' : '#ef4444'};">${UI.R(saldoLojaAposFixas)}</div>
                        </div>
                    </div>
                </div>`;
                return fixHtml;
            })()}
        </div>

        <!-- RELATÓRIO DE DESPESAS DA LOJA -->
        <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;font-size:18px;color:#FFD700;font-weight:800;">💸 HISTÓRICO DE DESPESAS OPERACIONAIS</h3>
                <button class="btn btn-sm btn-ghost" onclick="UI._modalNovaDespesaLoja()">+ Lançar Contas</button>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;font-size:13px;border-collapse:collapse;text-align:left;">
                    <thead>
                        <tr style="border-bottom:2px solid rgba(255,255,255,0.1);color:var(--text-muted);">
                            <th style="padding:8px;">Data</th>
                            <th style="padding:8px;">Descrição da Despesa</th>
                            <th style="padding:8px;">Caixa Origem</th>
                            <th style="padding:8px;color:#ef4444;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>`;

    const despesas = movs.filter(m => m.tipo === 'despesa');
    if (despesas.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted);">Nenhuma despesa lançada este mês.</td></tr>`;
    } else {
        despesas.slice(0, 15).forEach(d => {
            const dataStr = d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '';
            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:8px;color:var(--text-muted);">${dataStr}</td>
                    <td style="padding:8px;color:#FFF;font-weight:600;">${d.descricao}</td>
                    <td style="padding:8px;color:var(--text-secondary);">${d.caixa || 'Principal'}</td>
                    <td style="padding:8px;font-weight:800;color:#ef4444;">- ${UI.R(Math.abs(d.valor))}</td>
                </tr>`;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>

        <!-- INDICADORES FINANCEIROS EXTRAS -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-top:20px;">
            <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(59,130,246,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">📈 Margem de Lucro Bruta</div>
                <div style="font-size:24px;font-weight:900;color:#60a5fa;margin:6px 0;">${totalReceitaBruta > 0 ? ((lucroBruto / totalReceitaBruta) * 100).toFixed(1) : 0}%</div>
                <div style="font-size:11px;color:var(--text-secondary);">Lucro Bruto / Receita Total</div>
            </div>
            <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(16,185,129,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">🎫 Ticket Médio de Venda</div>
                <div style="font-size:24px;font-weight:900;color:#10b981;margin:6px 0;">${UI.R((dataManager.data.historico?.vendas || []).length > 0 ? totalReceitaBruta / (dataManager.data.historico.vendas.length || 1) : 0)}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${(dataManager.data.historico?.vendas || []).length} vendas realizadas</div>
            </div>
            <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(236,72,153,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">🔧 Receita Assistência Técnica</div>
                <div style="font-size:24px;font-weight:900;color:#f472b6;margin:6px 0;">${UI.R(dataManager.data.financeiro?.caixaAssistencia || 0)}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${(dataManager.data.assistencia?.ordensServico || []).filter(o => o.status === 'entregue').length} OS finalizadas</div>
            </div>
            <div style="background:rgba(15, 20, 32, 0.95);border:2px solid ${(f.caixaSecundario || 0) >= 2400 ? '#00FFA3' : 'rgba(168,85,247,0.4)'};border-radius:14px;padding:16px;text-align:center;box-shadow:${(f.caixaSecundario || 0) >= 2400 ? '0 0 15px rgba(0,255,163,0.3)' : 'none'};">
                <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">💜 COMISSÃO DE VENDAS (FECHAMENTO)</div>
                <div style="font-size:24px;font-weight:900;color:${(f.caixaSecundario || 0) >= 2400 ? '#00FFA3' : '#c084fc'};margin:6px 0;">${UI.R(Math.max(0, ((f.caixaSecundario || 0) - 2400) * 0.10))}</div>
                <div style="font-size:11px;color:var(--text-secondary);">
                    ${(f.caixaSecundario || 0) >= 2400 
                        ? '🎉 META BATIDA! (10% sobre o excedente de R$ 2.400)' 
                        : 'Vendas acumuladas: ' + UI.R(f.caixaSecundario || 0) + ' (Falta ' + UI.R(Math.max(0, 2400 - (f.caixaSecundario || 0))) + ' p/ meta de R$ 2.400)'}
                </div>
            </div>

        <!-- NOVO: TABELA DE CUSTOS E DESPESAS DIA A DIA -->
        ${(() => {
            const relatorioDias = dataManager.getRelatorioMensalPorDia();
            let tableHtml = `
            <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;margin-top:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="color:#00d97e;font-size:16px;margin:0;">📅 DETALHAMENTO DE CUSTOS E DESPESAS DIA A DIA (MÊS ATUAL)</h3>
                    <span style="font-size:12px;color:var(--text-muted);">Relatório Mensal</span>
                </div>
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:var(--text-secondary);text-align:left;">
                                <th style="padding:10px;">Data</th>
                                <th style="padding:10px;">💰 Vendas (Bruto)</th>
                                <th style="padding:10px;">📦 Custo Reposição</th>
                                <th style="padding:10px;">💸 Despesas do Dia</th>
                                <th style="padding:10px;">💎 Lucro Líquido</th>
                                <th style="padding:10px;">🏪 40% Loja</th>
                                <th style="padding:10px;">👨‍🦳 60% Pai</th>
                            </tr>
                        </thead>
                        <tbody>`;
            if (relatorioDias.length === 0) {
                tableHtml += `<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text-muted);">Nenhuma movimentação registrada este mês.</td></tr>`;
            } else {
                let totV = 0, totC = 0, totD = 0, totL = 0, totLoja = 0, totPai = 0;
                relatorioDias.forEach(d => {
                    totV += d.vendas;
                    totC += d.custo;
                    totD += d.despesas;
                    totL += d.lucroLiquidoReal;
                    totLoja += d.parteLoja40;
                    totPai += d.partePai60;

                    const dateStr = d.data.split('-').reverse().join('/');
                    const despDesc = d.itensDespesas.length > 0 ? d.itensDespesas.join(', ') : 'Sem despesa extra';

                    tableHtml += `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="padding:10px;font-weight:700;color:#FFF;">${dateStr}</td>
                            <td style="padding:10px;color:#10b981;font-weight:700;">+ ${UI.R(d.vendas)}</td>
                            <td style="padding:10px;color:#f59e0b;">- ${UI.R(d.custo)}</td>
                            <td style="padding:10px;color:#ef4444;">- ${UI.R(d.despesas)} <div style="font-size:10px;color:var(--text-muted);">${despDesc}</div></td>
                            <td style="padding:10px;color:#3b82f6;font-weight:800;">${UI.R(d.lucroLiquidoReal)}</td>
                            <td style="padding:10px;color:#a855f7;">${UI.R(d.parteLoja40)}</td>
                            <td style="padding:10px;color:#00d97e;font-weight:700;">${UI.R(d.partePai60)}</td>
                        </tr>`;
                });

                tableHtml += `
                        <tr style="border-top:2px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.02);font-weight:800;">
                            <td style="padding:12px;color:#FFF;">TOTAL DO MÊS</td>
                            <td style="padding:12px;color:#10b981;">${UI.R(totV)}</td>
                            <td style="padding:12px;color:#f59e0b;">${UI.R(totC)}</td>
                            <td style="padding:12px;color:#ef4444;">${UI.R(totD)}</td>
                            <td style="padding:12px;color:#3b82f6;">${UI.R(totL)}</td>
                            <td style="padding:12px;color:#a855f7;">${UI.R(totLoja)}</td>
                            <td style="padding:12px;color:#00d97e;">${UI.R(totPai)}</td>
                        </tr>`;
            }
            tableHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>`;
            return tableHtml;
        })()}
    </div>`;

    document.getElementById('main-content').innerHTML = html;
};

// === SUGESTÃO 1: RELATÓRIO DE LUCRO POR TIPO DE SERVIÇO NA DRE ===
UI._gerarRelatorioLucroPorServico = function () {
    const vendasHist = dataManager.data.historico?.vendas || [];
    const categorias = {
        'Tela Premium (Original)': { receita: 0, custo: 0, qtd: 0, icon: '💎', color: '#FFD700' },
        'Tela 1ª Linha (Incell)': { receita: 0, custo: 0, qtd: 0, icon: '⭐', color: '#00FFA3' },
        'Tela 2ª Linha': { receita: 0, custo: 0, qtd: 0, icon: '💰', color: '#60a5fa' },
        'Bateria': { receita: 0, custo: 0, qtd: 0, icon: '🔋', color: '#f59e0b' },
        'Conector / Botão / Câmera': { receita: 0, custo: 0, qtd: 0, icon: '🔧', color: '#a78bfa' },
        'Película': { receita: 0, custo: 0, qtd: 0, icon: '📱', color: '#34d399' },
        'Venda de Celular': { receita: 0, custo: 0, qtd: 0, icon: '📲', color: '#f472b6' },
        'Acessório': { receita: 0, custo: 0, qtd: 0, icon: '🎧', color: '#fb923c' },
        'Outros Serviços': { receita: 0, custo: 0, qtd: 0, icon: '🔩', color: '#94a3b8' }
    };
    vendasHist.forEach(v => {
        const prod = (v.produto || v.servico || '').toLowerCase();
        const val = parseFloat(v.valorVenda || v.liquido || v.valor || 0);
        const custo = parseFloat(v.custo || 0);
        let cat = 'Outros Serviços';
        if (prod.includes('telaoriginal') || prod.includes('tela premium') || prod.includes('original')) cat = 'Tela Premium (Original)';
        else if (prod.includes('tela2a') || prod.includes('segunda linha') || prod.includes('2a linha')) cat = 'Tela 2ª Linha';
        else if (prod.includes('tela') || prod.includes('screen') || prod.includes('incell')) cat = 'Tela 1ª Linha (Incell)';
        else if (prod.includes('bateria') || prod.includes('battery')) cat = 'Bateria';
        else if (prod.includes('conector') || prod.includes('botao') || prod.includes('camera') || prod.includes('câmera')) cat = 'Conector / Botão / Câmera';
        else if (prod.includes('pelicula') || prod.includes('película')) cat = 'Película';
        else if (v.tipo === 'venda_celular' || prod.includes('iphone') || prod.includes('samsung') || prod.includes('moto') || prod.includes('xiaomi')) cat = 'Venda de Celular';
        else if (v.tipo === 'acessorio' || prod.includes('case') || prod.includes('capa') || prod.includes('carregador') || prod.includes('fone')) cat = 'Acessório';
        categorias[cat].receita += val;
        categorias[cat].custo += custo;
        categorias[cat].qtd += 1;
    });
    return Object.entries(categorias).filter(([, d]) => d.qtd > 0)
        .sort(([, a], [, b]) => (b.receita - b.custo) - (a.receita - a.custo));
};

UI.modalRelatorioLucroPorServico = function () {
    const cats = UI._gerarRelatorioLucroPorServico();
    if (cats.length === 0) return UI.toast('Sem dados de vendas ainda', 'warning');

    let rows = cats.map(([nome, d]) => {
        const lucro = Math.max(0, d.receita - d.custo);
        const margem = d.receita > 0 ? ((lucro / d.receita) * 100).toFixed(1) : 0;
        const margemCor = parseFloat(margem) >= 50 ? '#00FFA3' : parseFloat(margem) >= 35 ? '#FFD700' : '#ef4444';
        return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:10px;font-weight:700;color:#FFF;">${d.icon} ${nome}</td>
            <td style="padding:10px;text-align:right;color:var(--text-muted);">${d.qtd}</td>
            <td style="padding:10px;text-align:right;color:#10b981;font-weight:700;">+${UI.R(d.receita)}</td>
            <td style="padding:10px;text-align:right;color:#f59e0b;">-${UI.R(d.custo)}</td>
            <td style="padding:10px;text-align:right;font-weight:800;color:#FFD700;">${UI.R(lucro)}</td>
            <td style="padding:10px;text-align:right;font-weight:800;color:${margemCor};">${margem}%</td>
        </tr>`;
    }).join('');

    const cards = cats.slice(0, 4).map(([nome, d]) => {
        const lucro = Math.max(0, d.receita - d.custo);
        const margem = d.receita > 0 ? ((lucro / d.receita) * 100).toFixed(0) : 0;
        const margemCor = parseFloat(margem) >= 50 ? '#00FFA3' : parseFloat(margem) >= 35 ? '#FFD700' : '#ef4444';
        return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;text-align:center;">
            <div style="font-size:24px;">${d.icon}</div>
            <div style="font-size:12px;font-weight:700;color:#FFF;margin:6px 0;">${nome}</div>
            <div style="font-size:20px;font-weight:900;color:#FFD700;">${UI.R(lucro)}</div>
            <div style="font-size:11px;color:${margemCor};margin-top:4px;">Margem: ${margem}%</div>
        </div>`;
    }).join('');

    UI.openModal('📊 Lucro por Tipo de Serviço', `
        <div style="margin-bottom:16px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px;">${cards}</div>
            <div style="overflow-x:auto;">
                <table style="width:100%;font-size:13px;border-collapse:collapse;">
                    <thead><tr style="border-bottom:2px solid rgba(255,255,255,0.1);color:var(--text-muted);">
                        <th style="padding:10px;text-align:left;">Categoria</th>
                        <th style="padding:10px;text-align:right;">Qtd</th>
                        <th style="padding:10px;text-align:right;">Receita</th>
                        <th style="padding:10px;text-align:right;">Custo</th>
                        <th style="padding:10px;text-align:right;">Lucro</th>
                        <th style="padding:10px;text-align:right;">Margem</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer" style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-lg" onclick="UI.closeModal()">Fechar</button>
            <button class="btn btn-primary btn-lg" onclick="UI._enviarRelatorioServicosWhatsApp()">📲 Enviar WhatsApp</button>
        </div>
    `);
};

// === FECHAMENTO DE CAIXA / BATER CAIXA ===
UI.modalBaterCaixa = function () {
    const f = dataManager.getFinanceiro() || {};
    const hojeStr = new Date().toISOString().substring(0, 10);

    // Vendas em dinheiro/gaveta do dia
    const vendasHist = dataManager.data.historico?.vendas || [];
    const vendasHoje = vendasHist.filter(v => (v.data || '').startsWith(hojeStr));
    const vendasHojeDinheiro = vendasHoje
.filter(v => !v.pagamento || v.pagamento.toLowerCase().includes('dinheiro') || v.pagamento.toLowerCase().includes('à vista') || v.caixaDestino === 'caixaSecundario')
        .reduce((s, v) => s + (parseFloat(v.valorVenda) || parseFloat(v.valor) || 0), 0);

    // Movimentações do dia (entradas e saídas)
    const movs = dataManager.data.movimentacoesCaixa || [];
    const movsHoje = movs.filter(m => (m.data || '').startsWith(hojeStr));
    const suprimentosHoje = movsHoje
        .filter(m => m.tipo === 'suprimento' || (m.valor > 0 && m.tipo !== 'venda_acessorio' && m.tipo !== 'venda_celular'))
        .reduce((s, m) => s + Math.abs(parseFloat(m.valor || 0)), 0);

    const sangriasDespesasHoje = movsHoje
        .filter(m => m.tipo === 'sangria' || m.tipo === 'despesa' || m.valor < 0)
        .reduce((s, m) => s + Math.abs(parseFloat(m.valor || 0)), 0);

    // Saldo esperado do dia na gaveta
    const saldoEsperadoDia = Math.max(0, vendasHojeDinheiro + suprimentosHoje - sangriasDespesasHoje);
    const saldoAcumulado = parseFloat(f.caixaSecundario || f.caixaPrincipal || 0);

    // Saldo cotado para o dia
    const saldoSistemaTotal = (vendasHoje.length > 0 || movsHoje.length > 0) ? saldoEsperadoDia : (saldoAcumulado > 0 ? saldoAcumulado : 0);

    // --- LÓGICA DE CATEGORIAS PROMPT 10 ---
    let catCelulares = [];
    let catAcessorios = [];
    let catServicos = [];
    let catOutros = [];
    let catRetiradas = [];

    vendasHoje.forEach(v => {
        const t = (v.tipo || v.pagamento || '').toLowerCase();
        const p = (v.produto || 'Item').toLowerCase();
        const obj = { text: `• ${v.produto || 'Item'} — ${UI.R(parseFloat(v.valorVenda) || parseFloat(v.valor) || 0)}`, val: (parseFloat(v.valorVenda) || parseFloat(v.valor) || 0) };
        if (t.includes('celular') || t.includes('avista') || t.includes('parcelado') || t.includes('pix') || p.includes('iphone') || p.includes('samsung') || p.includes('motorola') || p.includes('xiaomi')) {
            catCelulares.push(obj);
        } else if (t.includes('acessorio') || t.includes('avulso') || t.includes('multi')) {
            catAcessorios.push(obj);
        } else if (t.includes('conserto') || t.includes('os_')) {
            catServicos.push(obj);
        } else {
            catOutros.push(obj);
        }
    });

    movsHoje.forEach(m => {
        const t = (m.tipo || '').toLowerCase();
        if (t.includes('retirada') || t.includes('despesa')) {
            catRetiradas.push({ text: `• ${m.descricao || m.motivo || 'Retirada'} — ${UI.R(Math.abs(parseFloat(m.valor) || 0))}`, val: Math.abs(parseFloat(m.valor) || 0) });
        }
    });

    let categoriasHtml = '';
    const buildCatHtml = (titulo, arr, cor) => {
        if(arr.length === 0) return '';
        const sub = arr.reduce((acc, a) => acc + a.val, 0);
        let s = `<div style="margin-bottom:12px;background:rgba(255,255,255,0.02);padding:10px;border-radius:8px;">
                    <div style="color:${cor};font-weight:bold;margin-bottom:6px;">${titulo} - Subtotal: ${UI.R(sub)}</div>`;
        arr.forEach(a => s += `<div style="font-size:13px;color:#ccc;margin-bottom:2px;">${a.text}</div>`);
        s += `</div>`;
        return s;
    };

    categoriasHtml += buildCatHtml('📱 Celulares', catCelulares, '#3b82f6');
    categoriasHtml += buildCatHtml('🎧 Acessórios / Avulso', catAcessorios, '#a855f7');
    categoriasHtml += buildCatHtml('🔧 Serviços / Conserto', catServicos, '#f97316');
    categoriasHtml += buildCatHtml('💸 Retiradas', catRetiradas, '#ef4444');
    categoriasHtml += buildCatHtml('📦 Outros', catOutros, '#9ca3af');

    UI.openModal('⚖️ BATER CAIXA — FECHAMENTO DIÁRIO', `
        <div style="padding:12px">
            <div style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:12px;padding:14px;margin-bottom:16px;">
                <div style="font-size:13px;color:#10b981;font-weight:800;text-transform:uppercase;">💰 SALDO ESPERADO NA GAVETA HOJE:</div>
                <div style="font-size:28px;font-weight:900;color:#00FFA3;margin-top:4px;">${UI.R(saldoSistemaTotal)}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">
                    💵 Vendas Dinheiro Hoje: <strong>${UI.R(vendasHojeDinheiro)}</strong> | 💸 Saídas/Despesas Hoje: <strong>${UI.R(sangriasDespesasHoje)}</strong>
                    <br>🏦 Saldo Acumulado nos Caixas: ${UI.R(saldoAcumulado)}
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="font-size:15px;color:#FFD700;margin-bottom:10px;">📋 HISTÓRICO DO DIA (POR CATEGORIA):</h4>
                ${categoriasHtml}
            </div>

            <h4 style="font-size:15px;color:#FFD700;margin-bottom:10px;">💵 CONTAGEM FÍSICA DE DINHEIRO NA GAVETA:</h4>
            
            <div class="form-group">
                <label class="form-label">Valor total contado na gaveta (R$):</label>
                <input class="form-input" id="bater-gaveta-valor" type="number" step="0.01" style="font-size:22px;font-weight:700;text-align:center;padding:12px;color:#00FFA3" placeholder="0,00" oninput="UI._calcularConferênciaBaterCaixa(${saldoSistemaTotal})">
            </div>

            <div class="form-group" style="margin-top:12px">
                <label class="form-label">Comprovantes em Cartão / PIX no dia (opcional R$):</label>
                <input class="form-input" id="bater-maquina-valor" type="number" step="0.01" style="font-size:18px;text-align:center;padding:10px" placeholder="0,00">
            </div>

            <div id="bater-caixa-resultado" style="margin-top:16px;"></div>

            <div class="form-group" style="margin-top:12px">
                <label class="form-label">Observações da funcionária (ex: sangria feita, troco):</label>
                <textarea class="form-textarea" id="bater-obs" placeholder="Ex: Deixado R$ 50 de troco para amanhã..." style="font-size:14px;height:70px"></textarea>
            </div>

            <div class="modal-footer" style="display:flex;gap:8px;margin-top:20px;">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
                <button class="btn btn-success btn-lg" style="flex:1;font-weight:900;" onclick="UI._confirmarBaterCaixa(${saldoSistemaTotal})">✅ CONFIRMAR E SALVAR FECHAMENTO</button>
            </div>
        </div>
    `);
};

UI._calcularConferênciaBaterCaixa = function (saldoEsperado) {
    const valorGaveta = parseFloat(document.getElementById('bater-gaveta-valor')?.value || 0);
    const valorMaquina = parseFloat(document.getElementById('bater-maquina-valor')?.value || 0);
    const div = document.getElementById('bater-caixa-resultado');
    if (!div) return;

    if (isNaN(valorGaveta) && isNaN(valorMaquina)) {
        div.innerHTML = '';
        return;
    }

    const dif = (valorGaveta + valorMaquina) - saldoEsperado;
    if (Math.abs(dif) < 0.05) {
        div.innerHTML = `
            <div style="background:rgba(16,185,129,0.15);border:2px solid #10b981;border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:24px;">✅</div>
                <strong style="color:#10b981;font-size:18px;">CAIXA BATEU PERFEITAMENTE!</strong>
                <div style="font-size:13px;color:#FFF;margin-top:4px;">Diferença: R$ 0,00</div>
            </div>`;
    } else if (dif > 0) {
        div.innerHTML = `
            <div style="background:rgba(59,130,246,0.15);border:2px solid #3b82f6;border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:24px;">📈</div>
                <strong style="color:#3b82f6;font-size:18px;">SOBRA NO CAIXA</strong>
                <div style="font-size:13px;color:#FFF;margin-top:4px;">Temos <strong style="color:#3b82f6">R$ ${dif.toFixed(2)}</strong> a mais que o sistema.</div>
            </div>`;
    } else {
        div.innerHTML = `
            <div style="background:rgba(239,68,68,0.15);border:2px solid #ef4444;border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:24px;">📉</div>
                <strong style="color:#ef4444;font-size:18px;">QUEBRA / FALTA DE CAIXA</strong>
                <div style="font-size:13px;color:#FFF;margin-top:4px;">Faltam <strong style="color:#ef4444">R$ ${Math.abs(dif).toFixed(2)}</strong> para bater.</div>
            </div>`;
    }
};

UI._confirmarBaterCaixa = function (saldoEsperado) {
    const valorGaveta = parseFloat(document.getElementById('bater-gaveta-valor')?.value || 0);
    const valorMaquina = parseFloat(document.getElementById('bater-maquina-valor')?.value || 0);
    const obs = document.getElementById('bater-obs')?.value?.trim() || '';

    if (isNaN(valorGaveta)) return UI.toast('Informe o valor contado na gaveta', 'error');

    const dif = (valorGaveta + valorMaquina) - saldoEsperado;
    const dataHora = new Date().toISOString();

    if (!dataManager.data.fechamentosCaixa) dataManager.data.fechamentosCaixa = [];
    
    const fechamento = {
        data: dataHora,
        saldoEsperado,
        valorGaveta,
        valorMaquina,
        diferenca: dif,
        status: Math.abs(dif) < 0.05 ? 'exato' : dif > 0 ? 'sobra' : 'falta',
        observacao: obs,
        usuario: UI._clienteAtual ? UI._clienteAtual.nome : 'Funcionária'
    };

    dataManager.data.fechamentosCaixa.push(fechamento);

    // Registrar no histórico de movimentações do caixa
    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({
        tipo: 'fechamento_caixa',
        valor: valorGaveta,
        diferenca: dif,
        data: dataHora,
        motivo: `Fechamento de Caixa: ${fechamento.status.toUpperCase()} (${UI.R(dif)})`,
        obs: obs
    });

    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();
    
    // Disparar relatório completo e backup do dia no Telegram ao fechar o caixa no final do dia
    if (dataManager.enviarFechamentoDiarioTelegram) {
        dataManager.enviarFechamentoDiarioTelegram();
    }
    
    UI.closeModal();

    // Modal de envio do relatório do fechamento por WhatsApp
    const msgWpp = encodeURIComponent(
        `⚖️ *FECHAMENTO DE CAIXA DIÁRIO — CESINHA*\n` +
        `📅 Data/Hora: ${new Date(dataHora).toLocaleString('pt-BR')}\n` +
        `----------------------------------------\n` +
        `💵 *Dinheiro na Gaveta:* ${UI.R(valorGaveta)}\n` +
        `📊 *Esperado pelo Sistema:* ${UI.R(saldoEsperado)}\n` +
        `📊 *Resultado:* ${Math.abs(dif) < 0.05 ? '✅ PERFEITO (EXATO)' : dif > 0 ? `📈 SOBRA de ${UI.R(dif)}` : `⚠️ QUEBRA/FALTA de ${UI.R(Math.abs(dif))}`}\n` +
        (valorMaquina > 0 ? `💳 Comprovantes Cartão/PIX: ${UI.R(valorMaquina)}\n` : '') +
        (obs ? `📝 Observações: ${obs}\n` : '') +
        `----------------------------------------\n` +
        `_StrategyOS — Cesinha Acessórios_`
    );

    UI.openModal('✅ Fechamento Registrado!', `
        <div style="text-align:center;padding:16px;">
            <div style="font-size:56px;margin-bottom:12px;">⚖️</div>
            <h3 style="color:#10b981;font-size:22px;">FECHAMENTO REGISTRADO!</h3>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;margin:16px 0;text-align:left;">
                <div>Gaveta Contada: <strong>${UI.R(valorGaveta)}</strong></div>
                <div>Esperado: <strong>${UI.R(saldoEsperado)}</strong></div>
                <div style="color:${Math.abs(dif) < 0.05 ? '#10b981' : dif > 0 ? '#3b82f6' : '#ef4444'};font-size:16px;font-weight:800;margin-top:6px;">
                    Resultado: ${Math.abs(dif) < 0.05 ? '✅ OK' : dif > 0 ? '📈 SOBRA DE ' + UI.R(dif) : '⚠️ QUEBRA DE -' + UI.R(Math.abs(dif))}
                </div>
            </div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Deseja enviar o comprovante de fechamento para o WhatsApp do proprietário?</p>
        </div>
        <div class="modal-footer" style="display:flex;gap:8px;">
            <button class="btn btn-ghost" onclick="UI.closeModal();UI.render();">Fechar</button>
            <a href="https://wa.me/?text=${msgWpp}" target="_blank" class="btn btn-lg" style="background:#25D366;color:#fff;font-weight:900;flex:1;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;" onclick="UI.closeModal();UI.render();">
                📲 Enviar no WhatsApp
            </a>
        </div>
    `);
};



UI._modalNovaDespesaLoja = function () {
    const f = dataManager.getFinanceiro();
    UI.openModal('💸 Registrar Despesa da Loja', `
        <div style="padding:12px">
            <label class="form-label">Descrição da despesa (ex: Aluguel, Luz, Peças):</label>
            <input class="form-input" id="desp-desc" placeholder="Ex: Conta de Energia Elétrica" style="font-size:16px;padding:10px">
            
            <label class="form-label" style="margin-top:12px">Valor da Despesa (R$):</label>
            <input class="form-input" id="desp-valor" type="number" step="0.01" style="font-size:20px;text-align:center;font-weight:700;padding:10px" placeholder="0.00">
            
            <label class="form-label" style="margin-top:12px">Caixa pagador:</label>
            <select class="form-input" id="desp-caixa" style="font-size:16px;padding:10px">
                <option value="secundario">Caixa Secundário (Balcão / Gaveta) (${UI.R(f.caixaSecundario || 0)})</option>
                <option value="terciario">Caixa Terciário (Pai) (${UI.R(f.caixaTerciario || 0)})</option>
                <option value="assistencia">Caixa Assistência (${UI.R(f.caixaAssistencia)})</option>
                <option value="acessorios">Caixa Acessórios (${UI.R(f.caixaAcessorios)})</option>
                <option value="principal">Caixa Principal (Interno) (${UI.R(f.caixaPrincipal)})</option>
            </select>
            
            <button class="btn btn-primary" style="width:100%;margin-top:20px;font-size:18px;padding:12px" onclick="UI._confirmarDespesaLoja()">💾 LANÇAR DESPESA</button>
        </div>
    `);
};

UI._confirmarDespesaLoja = function () {
    const desc = document.getElementById('desp-desc')?.value?.trim();
    const valor = parseFloat(document.getElementById('desp-valor')?.value || 0);
    const caixa = document.getElementById('desp-caixa')?.value || 'principal';

    if (!desc) return UI.toast('Digite a descrição da despesa', 'error');
    if (!valor || valor <= 0) return UI.toast('Digite um valor válido', 'error');

    dataManager.registrarDespesa(valor, desc, caixa);
    UI.closeModal();
    UI.toast('💸 Despesa registrada com sucesso!', 'success');
    UI.renderFinanceiro();
};

UI._enviarDREWhatsApp = function () {
    const f = dataManager.getFinanceiro();
    const fundoCusto = dataManager.data.fundoCustoEstoque || { totalAcumulado: 0 };
    const movs = dataManager.data.movimentacoesCaixa || [];

    const totalReceitaBruta = (dataManager.data.historico?.vendas || []).reduce((s, v) => s + (v.valorVenda || v.valor || v.liquido || 0), 0) +
        movs.filter(m => m.tipo === 'conserto' || m.tipo === 'os_concluida' || m.tipo === 'os_entrada').reduce((s, m) => s + (m.valor || 0), 0);

    const totalCMV = fundoCusto.totalAcumulado || 0;
    const totalDespesas = movs.filter(m => m.tipo === 'despesa').reduce((s, m) => s + Math.abs(m.valor || 0), 0);
    const lucroLiquidoReal = Math.max(0, totalReceitaBruta - totalCMV - totalDespesas);
    const parteLoja40 = Math.round(lucroLiquidoReal * 0.40 * 100) / 100;
    const partePai60 = Math.round(lucroLiquidoReal * 0.60 * 100) / 100;

    const texto = `📊 *DEMONSTRATIVO DE RESULTADO (DRE) — CESINHA ACESSÓRIOS*\n` +
        `----------------------------------------\n` +
        `🟢 *Receita Bruta Total:* ${UI.R(totalReceitaBruta)}\n` +
        `📦 *(-) Custo de Reposição (CMV):* ${UI.R(totalCMV)}\n` +
        `💸 *(-) Despesas Operacionais:* ${UI.R(totalDespesas)}\n` +
        `----------------------------------------\n` +
        `💎 *LUCRO LÍQUIDO REAL:* ${UI.R(lucroLiquidoReal)}\n` +
        `----------------------------------------\n` +
        `🏪 *Parte da Loja (40%):* ${UI.R(parteLoja40)}\n` +
        `👨‍🦳 *Participação do Pai (60%):* ${UI.R(partePai60)}\n`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
};

UI._modalListarProdutosSemCusto = function () {
    const { celulares, acessorios } = dataManager.getProdutosSemCusto();
    let html = `<div style="padding:12px;max-height:70vh;overflow-y:auto;">
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:16px">Digite o valor de custo de cada produto para atualizar o cálculo de reposição do estoque:</p>`;

    if (celulares.length > 0) {
        html += `<h4 style="color:#FFD700;margin-bottom:8px;">📱 Celulares (${celulares.length})</h4>`;
        celulares.forEach(p => {
            html += `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;">
                <div>
                    <strong style="color:#FFF;">${p.nome}</strong> (${p.condicao || 'Estoque'})
                    <div style="font-size:12px;color:var(--text-muted)">Preço Venda: ${UI.R(p.precoVenda)}</div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-size:13px;color:var(--text-muted)">Custo R$:</span>
                    <input class="form-input" id="custo-cel-${p.id}" type="number" step="0.01" placeholder="0.00" style="width:100px;font-size:15px;padding:6px;text-align:center">
                    <button class="btn btn-sm btn-primary" onclick="UI._salvarCustoProduto('celular', ${p.id})">Salvar</button>
                </div>
            </div>`;
        });
    }

    if (acessorios.length > 0) {
        html += `<h4 style="color:#10b981;margin:16px 0 8px 0;">📦 Acessórios (${acessorios.length})</h4>`;
        acessorios.forEach(p => {
            html += `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;">
                <div>
                    <strong style="color:#FFF;">${p.nome}</strong>
                    <div style="font-size:12px;color:var(--text-muted)">Preço Venda: ${UI.R(p.precoVenda)}</div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-size:13px;color:var(--text-muted)">Custo R$:</span>
                    <input class="form-input" id="custo-acess-${p.id}" type="number" step="0.01" placeholder="0.00" style="width:100px;font-size:15px;padding:6px;text-align:center">
                    <button class="btn btn-sm btn-primary" onclick="UI._salvarCustoProduto('acessorio', ${p.id})">Salvar</button>
                </div>
            </div>`;
        });
    }

    html += `</div>`;
    UI.openModal('🔧 Cadastrar Custo de Reposição', html);
};

UI._salvarCustoProduto = function (tipo, id) {
    const inputId = tipo === 'celular' ? `custo-cel-${id}` : `custo-acess-${id}`;
    const valor = parseFloat(document.getElementById(inputId)?.value || 0);
    if (!valor || valor <= 0) return UI.toast('Digite um valor de custo válido!', 'error');

    if (tipo === 'celular') {
        const prod = dataManager.data.estoqueCelulares.find(p => p.id === id);
        if (prod) prod.custo = valor;
    } else {
        const prod = dataManager.data.estoqueAcessorios.find(p => p.id === id);
        if (prod) prod.custo = valor;
    }

    dataManager.saveData();
    UI.toast('✅ Custo do produto atualizado!', 'success');
    UI._modalListarProdutosSemCusto();
};

UI._confirmarZerarFinanceiroCompleto = function () {
    if (confirm('⚠️ Tem certeza que deseja zerar todos os saldos de caixa, fundo de reposição e históricos financeiros para começar uma contagem limpa a partir de agora?')) {
        dataManager.zerarDadosFinanceiros();
        UI.renderFinanceiro();
    }
};

// === MODAIS DO FUNDO DE REPOSIÇÃO (GUARDAR / UTILIZAR) ===
UI._modalDepositarFundoReposicao = function () {
    const fundoCusto = dataManager.data.fundoCustoEstoque || { totalAcumulado: 0, saldoGuardado: 0 };
    const saldoAtual = fundoCusto.saldoGuardado !== undefined ? fundoCusto.saldoGuardado : (fundoCusto.totalAcumulado || 0);
    UI.openModal('📥 Guardar Dinheiro no Fundo de Reposição', `
        <div style="padding:12px">
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:16px;">
                Use este formulário quando pegar o dinheiro da gaveta/vendas e <strong>separar no cofre ou conta bancária</strong> destinado exclusivamente a comprar novo estoque de películas e mercadorias.
            </p>
            <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:12px;margin-bottom:16px;text-align:center;">
                <div style="font-size:12px;color:var(--text-muted);">Saldo Atualmente Guardado:</div>
                <div style="font-size:24px;font-weight:900;color:#f59e0b;">${UI.R(saldoAtual)}</div>
            </div>
            <label class="form-label">Valor a Guardar / Depositar (R$):</label>
            <input class="form-input" id="dep-reposicao-valor" type="number" step="0.01" style="font-size:22px;text-align:center;font-weight:700;padding:12px;color:#f59e0b;" placeholder="0,00">
            <label class="form-label" style="margin-top:12px">Descrição / Observação:</label>
            <input class="form-input" id="dep-reposicao-obs" placeholder="Ex: Guardado no cofre do fundo de reposição" style="font-size:15px;padding:10px">
            <button class="btn" style="background:#f59e0b;color:#000;font-weight:800;width:100%;margin-top:20px;font-size:18px;padding:12px;" onclick="UI._confirmarDepositarFundoReposicao()">📥 CONFIRMAR E GUARDAR</button>
        </div>
    `);
};

UI._confirmarDepositarFundoReposicao = function () {
    const valor = parseFloat(document.getElementById('dep-reposicao-valor').value);
    const obs = document.getElementById('dep-reposicao-obs').value || '';
    if (isNaN(valor) || valor <= 0) return UI.toast('Digite um valor válido!', 'error');

    const res = dataManager.depositarFundoReposicao(valor, obs);
    if (res.sucesso) {
        UI.closeModal();
        UI.toast(`✅ ${UI.R(valor)} guardado no Fundo de Reposição! Novo saldo: ${UI.R(res.saldo)}`, 'success');
        UI.render();
    } else {
        UI.toast(res.erro || 'Erro ao guardar dinheiro', 'error');
    }
};

UI._modalUsarFundoReposicao = function () {
    const fundoCusto = dataManager.data.fundoCustoEstoque || { totalAcumulado: 0, saldoGuardado: 0 };
    const saldoAtual = fundoCusto.saldoGuardado !== undefined ? fundoCusto.saldoGuardado : (fundoCusto.totalAcumulado || 0);
    UI.openModal('🛍️ Usar Fundo de Reposição (Comprar Estoque)', `
        <div style="padding:12px">
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:16px;">
                Use este formulário quando <strong>comprar novas películas, capinhas, cabos ou peças</strong> utilizando o dinheiro reservado de reposição.
            </p>
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:12px;margin-bottom:16px;text-align:center;">
                <div style="font-size:12px;color:var(--text-muted);">Saldo Disponível no Fundo:</div>
                <div style="font-size:24px;font-weight:900;color:#10b981;">${UI.R(saldoAtual)}</div>
            </div>
            <label class="form-label">Valor Utilizado (R$):</label>
            <input class="form-input" id="usar-reposicao-valor" type="number" step="0.01" style="font-size:22px;text-align:center;font-weight:700;padding:12px;color:#ef4444;" placeholder="0,00">
            <label class="form-label" style="margin-top:12px">O que foi comprado?</label>
            <input class="form-input" id="usar-reposicao-obs" placeholder="Ex: Lote de 50 películas 3D + 20 capinhas" style="font-size:15px;padding:10px">
            <button class="btn btn-danger" style="width:100%;margin-top:20px;font-size:18px;padding:12px;font-weight:800;" onclick="UI._confirmarUsarFundoReposicao()">🛍️ ABATER E CONFIRMAR COMPRA</button>
        </div>
    `);
};

UI._confirmarUsarFundoReposicao = function () {
    const valor = parseFloat(document.getElementById('usar-reposicao-valor').value);
    const obs = document.getElementById('usar-reposicao-obs').value || '';
    if (isNaN(valor) || valor <= 0) return UI.toast('Digite um valor válido!', 'error');

    const res = dataManager.usarFundoReposicao(valor, obs);
    if (res.sucesso) {
        UI.closeModal();
        UI.toast(`🛍️ Compra de ${UI.R(valor)} registrada! Saldo restante no fundo: ${UI.R(res.saldo)}`, 'success');
        UI.render();
    } else {
        UI.toast(res.erro || 'Erro ao utilizar o fundo', 'error');
    }
};

UI._confirmarFechamentoSemanalSabado = function () {
    const sem = dataManager.getFechamentoSemanal();
    UI.openModal('🔒 Concluir Fechamento de Sábado', `
        <div style="padding:14px">
            <h3 style="color:#00d97e;margin:0 0 12px 0;">CONFIRMAÇÃO DO FECHAMENTO SEMANAL</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">
                Deseja confirmar o fechamento de sábado da semana (<strong>${sem.inicioSemanaStr} até ${sem.fimSemanaStr}</strong>)?
            </p>
            <div style="background:rgba(255,255,255,0.03);padding:14px;border-radius:12px;margin-bottom:16px;font-size:14px;line-height:1.6;">
                • 💰 Vendas Brutas: <strong>${UI.R(sem.vendasSemana)}</strong><br>
                • 📦 Custo Reposição: <strong>${UI.R(sem.custoSemana)}</strong><br>
                • 💸 Despesas: <strong>${UI.R(sem.despesasSemana)}</strong><br>
                • 💎 Lucro Líquido: <strong>${UI.R(sem.lucroLiquidoReal)}</strong><br>
                • 🏪 Parte da Loja (40%): <strong style="color:#10b981;">${UI.R(sem.parteLoja40)}</strong><br>
                • 💜 Cota Exclusiva da Mãe (~35%): <strong style="color:#f472b6;">${UI.R(sem.parteMae58)}</strong><br>
                • 👨‍🦳 Cota do Pai (~25%): <strong style="color:#c084fc;">${UI.R(sem.partePai42)}</strong>
            </div>
            <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
                <button class="btn btn-ghost" style="flex:1;min-width:110px;" onclick="UI.copiarRelatorioWhatsAppSabado()">📲 WhatsApp</button>
                <button class="btn btn-ghost" style="flex:1;min-width:110px;" onclick="UI._gerarPDFFechamentoSemanal()">🖨️ Gerar PDF</button>
                <button class="btn btn-ghost" style="flex:1;min-width:110px;" onclick="UI.modalEnviarRelatorioEmail()">📧 E-mail</button>
                <button class="btn btn-success btn-lg" style="flex:2;min-width:180px;font-size:16px;font-weight:800;" onclick="UI._executarFechamentoSemanalSabado()">✅ CONFIRMAR FECHAMENTO</button>
            </div>
        </div>
    `);
};

UI._gerarPDFFechamentoSemanal = function () {
    const sem = dataManager.getFechamentoSemanal();
    const dataHora = new Date().toLocaleString('pt-BR');

    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fechamento Semanal — Cesinha Acessórios</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #111; line-height: 1.5; }
                .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px; }
                .title { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
                .subtitle { font-size: 14px; color: #555; }
                .box { border: 1px solid #ccc; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: #f9f9f9; }
                .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; font-size: 15px; }
                .row:last-child { border-bottom: none; }
                .total-row { font-weight: bold; font-size: 18px; color: #000; border-top: 2px solid #111; margin-top: 10px; padding-top: 10px; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">🏪 CESINHA ACESSÓRIOS — STRATEGYOS</div>
                <div class="subtitle">COMPROVANTE DE FECHAMENTO SEMANAL DE CONTAS</div>
                <div style="font-size:12px;margin-top:6px;">Período: ${sem.inicioSemanaStr} a ${sem.fimSemanaStr} | Gerado em: ${dataHora}</div>
            </div>

            <div class="box">
                <div class="row"><span>💰 Vendas Brutas da Semana:</span><strong>${UI.R(sem.vendasSemana)}</strong></div>
                <div class="row"><span>📦 (-) Custo de Reposição (CMV):</span><span style="color:#c53030;">- ${UI.R(sem.custoSemana)}</span></div>
                <div class="row"><span>💸 (-) Despesas Operacionais:</span><span style="color:#c53030;">- ${UI.R(sem.despesasSemana)}</span></div>
                <div class="row total-row"><span>💎 LUCRO LÍQUIDO REAL:</span><span>${UI.R(sem.lucroLiquidoReal)}</span></div>
            </div>

            <div class="box">
                <div style="font-weight:bold;margin-bottom:10px;font-size:16px;">⚖️ DIVISÃO DAS COTAS (40% / 60%):</div>
                <div class="row"><span>🏪 40% Fundo Exclusivo da Loja:</span><strong>${UI.R(sem.parteLoja40)}</strong></div>
                <div class="row"><span>💜 Cota Exclusiva da Mãe (~35%):</span><strong>${UI.R(sem.parteMae58)}</strong></div>
                <div class="row"><span>👨‍🦳 Cota de Participação do Pai (~25%):</span><strong>${UI.R(sem.partePai42)}</strong></div>
            </div>

            <div class="box">
                <div class="row"><span>💵 Dinheiro Físico Contado na Gaveta:</span><strong>${UI.R(sem.gavetaAtual)}</strong></div>
                <div class="row"><span>🔒 Saldo Guardado no Cofre:</span><strong>${UI.R(dataManager.data.fundoCustoEstoque?.saldoGuardado || 0)}</strong></div>
            </div>

            <div class="footer">
                Documento Oficial de Apuração Financeira — StrategyOS v3.9 (Amargosa/BA)
            </div>

            <div style="margin-top:20px;text-align:center;" class="no-print">
                <button onclick="window.print()" style="padding:12px 24px;font-size:16px;font-weight:bold;cursor:pointer;background:#10b981;color:#fff;border:none;border-radius:6px;">🖨️ IMPRIMIR / SALVAR COMO PDF</button>
            </div>
        </body>
        </html>
    `);
    win.document.close();
};

UI._executarFechamentoSemanalSabado = async function () {
    const sem = dataManager.getFechamentoSemanal();
    const f = dataManager.data.financeiro;
    if (f.caixaTerciario === undefined) f.caixaTerciario = 0;
    f.caixaTerciario += sem.partePai42;
    
    // REGRA SOLICITADA: NÃO zera no sábado pois ainda há expediente. 
    // O sistema registra a apuração e o zeramento acontecerá automaticamente no domingo!
    dataManager.data.fechamentoSemanalConcluidoData = new Date().toISOString().substring(0, 10);

    if (!dataManager.data.movimentacoesCaixa) dataManager.data.movimentacoesCaixa = [];
    dataManager.data.movimentacoesCaixa.push({
        tipo: 'fechamento_semanal',
        valor: sem.vendasSemana,
        lucroLiquido: sem.lucroLiquidoReal,
        parteLoja40: sem.parteLoja40,
        parteMae58: sem.parteMae58,
        partePai42: sem.partePai42,
        descricao: `Fechamento Semanal (${sem.inicioSemanaStr} a ${sem.fimSemanaStr}): Registrado com sucesso. Zeramento agendado para o Domingo. 40% Loja ${UI.R(sem.parteLoja40)} | Mãe ${UI.R(sem.parteMae58)} | Pai ${UI.R(sem.partePai42)}`,
        data: new Date().toISOString()
    });

    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();
    UI.closeModal();

    // Abrir o PDF formatado automaticamente após confirmar
    UI._gerarPDFFechamentoSemanal();

    // Enviar notificação e backup via Telegram
    const msgTelegram = `📊 *FECHAMENTO SEMANAL DE SÁBADO — CESINHA ACESSÓRIOS*\n` +
        `📅 Período: *${sem.inicioSemanaStr} até ${sem.fimSemanaStr}*\n\n` +
        `💰 *Vendas da Semana (Bruto)*: ${UI.R(sem.vendasSemana)}\n` +
        `📦 *Fundo de Reposição (CMV)*: ${UI.R(sem.custoSemana)}\n` +
        `💸 *Despesas da Semana*: ${UI.R(sem.despesasSemana)}\n` +
        `---------------------------------------\n` +
        `💎 *LUCRO LÍQUIDO REAL*: *${UI.R(sem.lucroLiquidoReal)}*\n\n` +
        `🏪 *40% Fundo da Loja*: *${UI.R(sem.parteLoja40)}*\n` +
        `💜 *Cota Exclusiva da Mãe (~35%)*: *${UI.R(sem.parteMae58)}*\n` +
        `👨‍🦳 *Cota de Participação do Pai (~25%)*: *${UI.R(sem.partePai42)}*\n\n` +
        `💵 *Dinheiro Físico na Gaveta*: *${UI.R(sem.gavetaAtual)}*\n` +
        `🔒 *Saldo Guardado no Cofre*: *${UI.R(dataManager.data.fundoCustoEstoque?.saldoGuardado || 0)}*`;

    if (dataManager.data.configuracoes?.telegramBotToken) {
        UI.toast('✈️ Enviando fechamento de sábado e backup para o Telegram...', 'info');
        await dataManager.enviarTelegram(msgTelegram);
        if (dataManager.data.configuracoes?.telegramChatIdEquipe) {
            await dataManager.enviarTelegram(msgTelegram, dataManager.data.configuracoes.telegramChatIdEquipe);
        }
        await dataManager.enviarBackupDocumentoTelegram();
        UI.toast('🎉 Fechamento de Sábado e Backup salvos no Telegram com sucesso!', 'success');
    } else {
        UI.toast('🎉 Fechamento de Sábado registrado localmente!', 'success');
    }

    UI.render();
};

UI.copiarRelatorioWhatsAppSabado = function () {
    const sem = dataManager.getFechamentoSemanal();
    const texto = `📊 *FECHAMENTO SEMANAL DE SÁBADO — CESINHA ACESSÓRIOS*\n` +
        `📅 Período: ${sem.inicioSemanaStr} até ${sem.fimSemanaStr}\n\n` +
        `💰 *Vendas da Semana (Bruto)*: ${UI.R(sem.vendasSemana)}\n` +
        `📦 *Fundo de Reposição (CMV)*: ${UI.R(sem.custoSemana)}\n` +
        `💸 *Despesas da Semana*: ${UI.R(sem.despesasSemana)}\n` +
        `---------------------------------------\n` +
        `💎 *LUCRO LÍQUIDO REAL*: ${UI.R(sem.lucroLiquidoReal)}\n\n` +
        `🏪 *40% Loja (Investimento)*: ${UI.R(sem.parteLoja40)}\n` +
        `👨‍🦳 *60% Pai (Retirada/Pro-labore)*: ${UI.R(sem.partePai60)}\n\n` +
        `💵 *Dinheiro Físico Atual na Gaveta*: ${UI.R(sem.gavetaAtual)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto);
        UI.toast('📋 Relatório do Sábado copiado p/ o WhatsApp!', 'success');
    } else {
        window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(texto), '_blank');
    }
};

UI.modalEnviarRelatorioEmail = function () {
    const emailAtual = dataManager.data.configuracoes?.emailNotificacoes || '';
    UI.openModal('📧 Relatório Semanal da Loja por E-mail', `
        <div style="padding:14px">
            <h3 style="color:#10b981;margin:0 0 10px 0;">ENVIAR RELATÓRIO DA LOJA POR E-MAIL</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">
                Digite o seu e-mail para enviar o relatório semanal completo (Vendas, Custos, Lucro 40/60 e Estoque):
            </p>
            <label class="form-label">Seu E-mail:</label>
            <input class="form-input" id="email-notif-input" type="email" style="font-size:16px;padding:12px;margin-bottom:16px;width:100%;" value="${emailAtual}" placeholder="seu-email@gmail.com">
            
            <button class="btn btn-primary btn-lg" style="width:100%;font-size:16px;padding:12px;font-weight:800;" onclick="UI._executarEnvioRelatorioEmail()">📧 ENVIAR RELATÓRIO AGORA</button>
        </div>
    `);
};

UI._executarEnvioRelatorioEmail = function () {
    const email = document.getElementById('email-notif-input').value.trim();
    if (!email || !email.includes('@')) return UI.toast('Digite um e-mail válido!', 'error');

    if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
    dataManager.data.configuracoes.emailNotificacoes = email;
    dataManager.saveData();

    const sem = dataManager.getFechamentoSemanal();
    const assunto = encodeURIComponent(`📊 Relatório Semanal da Loja — Cesinha Acessórios (${sem.inicioSemanaStr} a ${sem.fimSemanaStr})`);
    const corpo = encodeURIComponent(
        `RELATÓRIO SEMANAL DA SITUAÇÃO DA LOJA — CESINHA ACESSÓRIOS\n` +
        `Período: ${sem.inicioSemanaStr} até ${sem.fimSemanaStr}\n\n` +
        `💰 Faturamento Bruto da Semana: R$ ${sem.vendasSemana.toFixed(2)}\n` +
        `📦 Custo de Reposição de Estoque (CMV): R$ ${sem.custoSemana.toFixed(2)}\n` +
        `💸 Despesas da Semana: R$ ${sem.despesasSemana.toFixed(2)}\n` +
        `-----------------------------------------------------\n` +
        `💎 LUCRO LÍQUIDO REAL DA SEMANA: R$ ${sem.lucroLiquidoReal.toFixed(2)}\n\n` +
        `🏪 Parte da Loja (40%): R$ ${sem.parteLoja40.toFixed(2)}\n` +
        `👨‍🦳 Parte do Pai (60%): R$ ${sem.partePai60.toFixed(2)}\n\n` +
        `💵 Dinheiro Físico Atual na Gaveta: R$ ${sem.gavetaAtual.toFixed(2)}\n` +
        `📦 Saldo Guardado no Cofre p/ Reposição: R$ ${(dataManager.data.fundoCustoEstoque?.saldoGuardado || 0).toFixed(2)}\n\n` +
        `Enviado pelo StrategyOS v3.9 (Vercel Principal)`
    );

    window.open(`mailto:${email}?subject=${assunto}&body=${corpo}`, '_blank');
    UI.closeModal();
    UI.toast('📧 O seu gerenciador de e-mail foi aberto com o relatório semanal formatado!', 'success');
};

// === ⚙️ GERENCIAR DESPESAS FIXAS DA LOJA ===
UI._modalGerenciarDespesasFixas = function () {
    const fixas = dataManager.data.despesasFixas || [];
    let html = `
        <div style="padding:10px">
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:16px;">
                Cadastre e atualize as despesas mensais recorrentes da loja (Aluguel, Luz, Salários, Internet, Segurança).
            </p>
            <div style="display:grid;gap:10px;margin-bottom:20px;max-height:300px;overflow-y:auto;">
                ${fixas.length === 0 ? '<p style="color:var(--text-muted);text-align:center;">Nenhuma despesa fixa cadastrada.</p>' : ''}
                ${fixas.map(f => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
                        <div>
                            <div style="font-weight:700;color:#FFF;font-size:15px;">${f.nome}</div>
                            <div style="font-size:12px;color:var(--text-muted);">Vencimento: ${f.vencimento || 'Mensal'}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:16px;font-weight:900;color:#ef4444;">${UI.R(f.valor)}</span>
                            <button class="btn btn-sm btn-ghost" onclick="UI._excluirDespesaFixa(${f.id})" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px;">
                <h4 style="margin:0 0 10px;color:#10b981;font-size:15px;">➕ Cadastrar Nova Despesa Fixa</h4>
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;">
                    <input class="form-input" id="nova-fixa-nome" placeholder="Nome (ex: Aluguel)" style="font-size:14px;padding:8px">
                    <input class="form-input" id="nova-fixa-valor" type="number" step="0.01" placeholder="Valor R$" style="font-size:14px;padding:8px">
                    <input class="form-input" id="nova-fixa-venc" placeholder="Dia (ex: Dia 10)" style="font-size:14px;padding:8px">
                </div>
                <button class="btn btn-primary" style="width:100%;margin-top:12px;font-size:14px;padding:10px;" onclick="UI._adicionarDespesaFixa()">✅ Salvar Despesa Fixa</button>
            </div>
        </div>
    `;
    UI.openModal('📌 Despesas Fixas da Loja', html);
};

UI._adicionarDespesaFixa = function () {
    const nome = document.getElementById('nova-fixa-nome')?.value?.trim();
    const valor = parseFloat(document.getElementById('nova-fixa-valor')?.value || 0);
    const venc = document.getElementById('nova-fixa-venc')?.value?.trim() || 'Mensal';

    if (!nome) return UI.toast('Digite o nome da despesa', 'error');
    if (!valor || valor <= 0) return UI.toast('Digite um valor válido', 'error');

    if (!dataManager.data.despesasFixas) dataManager.data.despesasFixas = [];
    dataManager.data.despesasFixas.push({
        id: Date.now(),
        nome,
        valor,
        vencimento: venc
    });
    dataManager.saveData();

    UI.toast('📌 Despesa fixa cadastrada!', 'success');
    UI._modalGerenciarDespesasFixas();
    UI.renderFinanceiro();
};

UI._excluirDespesaFixa = function (id) {
    if (!confirm('Deseja excluir esta despesa fixa?')) return;
    dataManager.data.despesasFixas = (dataManager.data.despesasFixas || []).filter(f => f.id !== id);
    dataManager.saveData();
    UI.toast('🗑️ Despesa fixa removida!', 'success');
    UI._modalGerenciarDespesasFixas();
    UI.renderFinanceiro();
};

// === PAINEL E ENVIO DE FECHAMENTOS VIA TELEGRAM ===
UI._menuOpcoesTelegram = function () {
    UI.openModal('✈️ Enviar Relatórios pelo Telegram', `
        <div style="padding:14px;text-align:center;">
            <div style="font-size:42px;margin-bottom:8px">✈️</div>
            <h3 style="color:#38bdf8;margin-bottom:6px">BOT DO TELEGRAM DA LOJA</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">
                Envie relatórios detalhados diretamente para o seu celular e para o grupo da equipe.
            </p>
            <div style="display:grid;grid-template-columns:1fr;gap:12px;max-width:400px;margin:0 auto 20px;">
                <button class="btn btn-ghost btn-lg" style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.4);font-weight:800;padding:14px" onclick="UI._enviarFechamentoDiaTelegram()">
                    📊 Enviar Fechamento do DIA
                </button>
                <button class="btn btn-ghost btn-lg" style="background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.4);font-weight:800;padding:14px" onclick="UI._enviarFechamentoSemanalTelegram()">
                    🗓️ Enviar Fechamento SEMANAL (Seg a Sáb)
                </button>
                <button class="btn btn-ghost btn-lg" style="background:rgba(168,85,247,0.12);color:#c084fc;border:1px solid rgba(168,85,247,0.4);font-weight:800;padding:14px" onclick="UI._enviarFechamentoMensalTelegram()">
                    🗓️ Enviar Fechamento MENSAL (DRE)
                </button>
                <button class="btn btn-ghost btn-lg" style="background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.4);font-weight:800;padding:14px" onclick="UI._verificarEstoqueBaixoTelegram()">
                    ⚠️ Alertas de Estoque Mínimo (<= 3 un.)
                </button>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;display:flex;justify-content:space-between;gap:10px">
                <button class="btn btn-ghost" onclick="UI.modalConfigurarTelegram()">⚙️ Configurações do Bot</button>
                <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
            </div>
        </div>
    `);
};

UI._enviarFechamentoDiaTelegram = async function () {
    UI.toast('✈️ Enviando fechamento do dia para o Telegram...', 'info');
    const res = await dataManager.enviarFechamentoDiarioTelegram();
    if (res.sucesso) UI.toast('🎉 Fechamento do dia enviado com sucesso para o Telegram!', 'success');
    else UI.toast(res.erro || 'Erro ao enviar no Telegram', 'error');
};

UI._enviarFechamentoSemanalTelegram = async function () {
    UI.toast('✈️ Enviando fechamento semanal para o Telegram...', 'info');
    const sem = dataManager.getFechamentoSemanal();
    const msg = `📊 *FECHAMENTO SEMANAL SEGUNDA A SÁBADO*\n` +
        `📅 *${sem.inicioSemanaStr} até ${sem.fimSemanaStr}*\n\n` +
        `💰 *Vendas Brutas*: ${UI.R(sem.vendasSemana)}\n` +
        `📦 *Fundo Reposição (CMV)*: -${UI.R(sem.custoSemana)}\n` +
        `💸 *Despesas Operacionais*: -${UI.R(sem.despesasSemana)}\n` +
        `---------------------------------------\n` +
        `💎 *LUCRO LÍQUIDO REAL*: *${UI.R(sem.lucroLiquidoReal)}*\n\n` +
        `🏪 *40% Fundo Loja*: ${UI.R(sem.parteLoja40)}\n` +
        `💜 *Cota Mãe (~35%)*: ${UI.R(sem.parteMae58)}\n` +
        `👨‍🦳 *Cota Pai (~25%)*: ${UI.R(sem.partePai42)}\n\n` +
        `💵 *Gaveta Físico*: ${UI.R(sem.gavetaAtual)}`;
    const res = await dataManager.enviarTelegram(msg);
    await dataManager.enviarBackupDocumentoTelegram();
    if (res.sucesso) UI.toast('🎉 Fechamento semanal enviado com sucesso para o Telegram!', 'success');
    else UI.toast(res.erro || 'Erro ao enviar no Telegram', 'error');
};

UI._enviarFechamentoMensalTelegram = async function () {
    UI.toast('✈️ Enviando fechamento mensal para o Telegram...', 'info');
    const res = await dataManager.enviarFechamentoMensalTelegram();
    if (res.sucesso) UI.toast('🎉 Fechamento mensal enviado com sucesso para o Telegram!', 'success');
    else UI.toast(res.erro || 'Erro ao enviar no Telegram', 'error');
};

UI._verificarEstoqueBaixoTelegram = async function () {
    UI.toast('✈️ Checando itens com estoque crítico...', 'info');
    const res = await dataManager.verificarEAlertarEstoqueBaixoTelegram();
    if (res.sucesso) {
        UI.toast(res.mensagem || '🎉 Alerta de estoque crítico enviado para o Telegram!', 'success');
    } else {
        UI.toast(res.erro || 'Erro ao enviar alerta de estoque no Telegram', 'error');
    }
};

// === EXTRAIR CUSTOS E PRODUTOS VENDIDOS ===
UI.modalExtrairCustosVendas = function () {
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    
    let html = `
    <div style="padding: 10px; font-family: sans-serif; color: #fff;">
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 15px;">
            Filtre e extraia a lista de produtos vendidos e seus respectivos custos para fechar o financeiro. Itens sem custo serão destacados em vermelho.
        </p>
        
        <!-- Filtros -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: bold;">📅 Período:</label>
                <select id="ext-filtro-periodo" class="form-input" style="padding: 8px; font-size: 14px; background: #111827;" onchange="UI.atualizarTabelaExtrair()">
                    <option value="este_mes" selected>Este Mês</option>
                    <option value="mes_anterior">Mês Anterior</option>
                    <option value="hoje">Hoje</option>
                    <option value="ultimos_7_dias">Últimos 7 dias</option>
                    <option value="todos">Todo o Histórico</option>
                </select>
            </div>
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: bold;">💰 Custo:</label>
                <select id="ext-filtro-custo" class="form-input" style="padding: 8px; font-size: 14px; background: #111827;" onchange="UI.atualizarTabelaExtrair()">
                    <option value="todos" selected>Todos os Itens</option>
                    <option value="sem_custo">Apenas Sem Custo (R$ 0)</option>
                    <option value="com_custo">Apenas Com Custo (> R$ 0)</option>
                </select>
            </div>
            <div>
                <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: bold;">🏷️ Categoria:</label>
                <select id="ext-filtro-tipo" class="form-input" style="padding: 8px; font-size: 14px; background: #111827;" onchange="UI.atualizarTabelaExtrair()">
                    <option value="todos" selected>Todas</option>
                    <option value="celular">Celulares</option>
                    <option value="acessorio">Acessórios</option>
                    <option value="pelicula">Películas</option>
                    <option value="conserto">Consertos (OS)</option>
                    <option value="avulso">Vendas Avulsas / Outro</option>
                </select>
            </div>
        </div>

        <!-- Métricas Resumo -->
        <div id="ext-resumo-container" style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px;">
            <!-- preenchido dinamicamente -->
        </div>

        <!-- Tabela -->
        <div style="max-height: 380px; overflow-y: auto; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px; background: rgba(10,15,30,0.4);">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                <thead style="position: sticky; top: 0; background: #111827; z-index: 5; border-bottom: 2px solid rgba(255,255,255,0.1);">
                    <tr>
                        <th style="padding: 12px;">Data</th>
                        <th style="padding: 12px;">Produto / Venda</th>
                        <th style="padding: 12px;">Categoria</th>
                        <th style="padding: 12px;">Preço Venda</th>
                        <th style="padding: 12px;">Custo</th>
                        <th style="padding: 12px;">Lucro</th>
                        <th style="padding: 12px; text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody id="ext-tabela-corpo">
                    <!-- preenchido dinamicamente -->
                </tbody>
            </table>
        </div>

        <!-- Botões de Ação -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
            <button class="btn" style="background: #2563eb; color: #fff;" onclick="UI.exportarCSVExtrair()">📥 Baixar CSV</button>
            <button class="btn" style="background: #10b981; color: #fff; font-weight: bold;" onclick="UI.copiarTabelaExtrair()">📋 Copiar para Excel/Sheets</button>
        </div>
    </div>
    `;
    
    UI.openModal('📊 Extração de Custos e Produtos Vendidos', html);
    
    // Popular dados inicialmente
    UI.atualizarTabelaExtrair();
};

UI.atualizarTabelaExtrair = function () {
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    const periodo = document.getElementById('ext-filtro-periodo').value;
    const custoFiltro = document.getElementById('ext-filtro-custo').value;
    const tipoFiltro = document.getElementById('ext-filtro-tipo').value;
    
    const agora = new Date();
    const esteMes = agora.getMonth();
    const esteAno = agora.getFullYear();
    
    // Filtrar por período
    const filtrados = vendas.filter(v => {
        const dataVenda = new Date(v.data);
        if (isNaN(dataVenda.getTime())) return true;
        
        if (periodo === 'hoje') {
            return dataVenda.toDateString() === agora.toDateString();
        } else if (periodo === 'este_mes') {
            return dataVenda.getMonth() === esteMes && dataVenda.getFullYear() === esteAno;
        } else if (periodo === 'mes_anterior') {
            let mesAnt = esteMes - 1;
            let anoAnt = esteAno;
            if (mesAnt < 0) {
                mesAnt = 11;
                anoAnt -= 1;
            }
            return dataVenda.getMonth() === mesAnt && dataVenda.getFullYear() === anoAnt;
        } else if (periodo === 'ultimos_7_dias') {
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(agora.getDate() - 7);
            return dataVenda >= seteDiasAtras;
        }
        return true; // 'todos'
    });
    
    // Filtrar por custo e tipo
    const finalFiltrados = filtrados.filter(v => {
        const c = parseFloat(v.custo) || 0;
        
        if (custoFiltro === 'sem_custo' && c > 0) return false;
        if (custoFiltro === 'com_custo' && c <= 0) return false;
        
        if (tipoFiltro !== 'todos') {
            const t = (v.tipo || '').toLowerCase();
            if (tipoFiltro === 'celular' && !t.includes('celular') && !t.includes('avista') && !t.includes('parcelado') && !t.includes('crediario') && !t.includes('pix')) return false;
            if (tipoFiltro === 'acessorio' && !t.includes('acessorio')) return false;
            if (tipoFiltro === 'pelicula' && !t.includes('pelicula')) return false;
            if (tipoFiltro === 'conserto' && !t.includes('conserto') && !t.includes('os_')) return false;
            if (tipoFiltro === 'avulso' && !t.includes('avulso') && !t.includes('outro')) return false;
        }
        
        return true;
    });
    
    finalFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    let totalVendas = 0;
    let totalCusto = 0;
    let totalLucro = 0;
    let semCustoQtd = 0;
    
    finalFiltrados.forEach(v => {
        const val = parseFloat(v.valorVenda || v.valor || v.preco || 0);
        const cus = parseFloat(v.custo) || 0;
        const luc = val - cus;
        
        totalVendas += val;
        totalCusto += cus;
        totalLucro += luc;
        if (cus <= 0) semCustoQtd++;
    });
    
    const resumoContainer = document.getElementById('ext-resumo-container');
    resumoContainer.innerHTML = `
        <div style="flex:1; min-width: 140px; padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: bold;">TOTAL VENDAS</div>
            <div style="font-size: 18px; font-weight: bold; color: #3b82f6; margin-top: 4px;">${UI.R(totalVendas)}</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${finalFiltrados.length} itens</div>
        </div>
        <div style="flex:1; min-width: 140px; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: bold;">CUSTO TOTAL (CMV)</div>
            <div style="font-size: 18px; font-weight: bold; color: #10b981; margin-top: 4px;">${UI.R(totalCusto)}</div>
        </div>
        <div style="flex:1; min-width: 140px; padding: 12px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: bold;">LUCRO ESTIMADO</div>
            <div style="font-size: 18px; font-weight: bold; color: #a78bfa; margin-top: 4px;">${UI.R(totalLucro)}</div>
        </div>
        ${semCustoQtd > 0 ? `
        <div style="flex:1; min-width: 140px; padding: 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px;">
            <div style="font-size: 11px; color: #f87171; font-weight: bold;">⚠️ SEM CUSTO</div>
            <div style="font-size: 18px; font-weight: bold; color: #f87171; margin-top: 4px;">${semCustoQtd} itens</div>
            <div style="font-size: 10px; color: #f87171; margin-top: 2px;">Ajuste clicando em Editar</div>
        </div>
        ` : `
        <div style="flex:1; min-width: 140px; padding: 12px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px;">
            <div style="font-size: 11px; color: #34d399; font-weight: bold;">CUSTOS CADASTRADOS</div>
            <div style="font-size: 16px; font-weight: bold; color: #34d399; margin-top: 4px;">💯 Tudo Ok</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Nenhum item sem custo!</div>
        </div>
        `}
    `;
    
    const corpo = document.getElementById('ext-tabela-corpo');
    if (finalFiltrados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhuma venda encontrada com os filtros selecionados.</td></tr>';
        return;
    }
    
    corpo.innerHTML = finalFiltrados.map((v, index) => {
        const val = parseFloat(v.valorVenda || v.valor || v.preco || 0);
        const cus = parseFloat(v.custo) || 0;
        const luc = val - cus;
        const dataFmt = new Date(v.data).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
        
        let badg = `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.08); color: #fff;">Outro</span>`;
        const t = (v.tipo || '').toLowerCase();
        if (t.includes('celular') || t.includes('avista') || t.includes('parcelado') || t.includes('crediario') || t.includes('pix')) badg = `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: rgba(59,130,246,0.2); color: #60a5fa;">📱 Celular</span>`;
        else if (t.includes('acessorio')) badg = `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: rgba(16,185,129,0.2); color: #34d399;">📦 Acessório</span>`;
        else if (t.includes('pelicula')) badg = `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: rgba(236,72,153,0.2); color: #f472b6;">🛡️ Película</span>`;
        else if (t.includes('conserto') || t.includes('os_')) badg = `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: rgba(139,92,246,0.2); color: #a78bfa;">🔧 OS</span>`;
        else if (t.includes('avulso')) badg = `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: rgba(245,158,11,0.2); color: #fbbf24;">🛍️ Avulso</span>`;
        
        const custoVisual = cus <= 0 
            ? `<span style="color:#ef4444; font-weight:bold; background:rgba(239,68,68,0.15); padding: 2px 6px; border-radius: 4px; display:inline-block;">⚠️ R$ 0,00</span>` 
            : `<span style="color:#34d399;">${UI.R(cus)}</span>`;
            
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px; white-space: nowrap;">${dataFmt}</td>
                <td style="padding: 10px; font-weight: 500; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${v.produto}">
                    ${v.produto}
                    <br><span style="font-size: 11px; color: var(--text-muted);">Cli: ${v.cliente || 'Não Identificado'}</span>
                </td>
                <td style="padding: 10px;">${badg}</td>
                <td style="padding: 10px; font-weight: bold; color: #fff;">${UI.R(val)}</td>
                <td style="padding: 10px;">${custoVisual}</td>
                <td style="padding: 10px; font-weight: bold; color: ${luc >= 0 ? '#10b981' : '#ef4444'};">${UI.R(luc)}</td>
                <td style="padding: 10px; text-align: center;">
                    <button class="btn" style="padding: 4px 8px; font-size: 11px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);" onclick="UI.ajustarCustoEspecifico('${v.data}', '${v.produto.replace(/'/g, "\\'")}')">✏️ Custo</button>
                </td>
            </tr>
        `;
    }).join('');
};

UI.ajustarCustoEspecifico = function (dataId, produtoNome) {
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    const venda = vendas.find(v => v.data === dataId && v.produto === produtoNome);
    
    if (!venda) return UI.toast('Venda não encontrada no histórico', 'error');
    
    const valorAtualCusto = parseFloat(venda.custo) || 0;
    const valorVenda = parseFloat(venda.valorVenda || venda.valor || venda.preco || 0);
    
    const novoCustoStr = prompt(`Definir Custo para: "${venda.produto}"\nPreço de Venda: ${UI.R(valorVenda)}\nCusto Atual: R$ ${valorAtualCusto.toFixed(2)}\n\nDigite o novo valor de custo (R$):`, valorAtualCusto.toString());
    
    if (novoCustoStr === null) return;
    
    const novoCusto = parseFloat(novoCustoStr.replace(',', '.'));
    if (isNaN(novoCusto) || novoCusto < 0) return UI.toast('Valor de custo inválido!', 'error');
    
    venda.custo = novoCusto;
    venda.lucro = valorVenda - novoCusto;
    
    dataManager.saveData();
    dataManager.salvarSupabase();
    UI.toast('Custo e lucro atualizados no histórico com sucesso!', 'success');
    UI.atualizarTabelaExtrair();
};

UI.copiarTabelaExtrair = function () {
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    const periodo = document.getElementById('ext-filtro-periodo').value;
    const custoFiltro = document.getElementById('ext-filtro-custo').value;
    const tipoFiltro = document.getElementById('ext-filtro-tipo').value;
    
    const agora = new Date();
    const esteMes = agora.getMonth();
    const esteAno = agora.getFullYear();
    
    const filtrados = vendas.filter(v => {
        const dataVenda = new Date(v.data);
        if (isNaN(dataVenda.getTime())) return true;
        
        if (periodo === 'hoje') {
            return dataVenda.toDateString() === agora.toDateString();
        } else if (periodo === 'este_mes') {
            return dataVenda.getMonth() === esteMes && dataVenda.getFullYear() === esteAno;
        } else if (periodo === 'mes_anterior') {
            let mesAnt = esteMes - 1;
            let anoAnt = esteAno;
            if (mesAnt < 0) { mesAnt = 11; anoAnt -= 1; }
            return dataVenda.getMonth() === mesAnt && dataVenda.getFullYear() === anoAnt;
        } else if (periodo === 'ultimos_7_dias') {
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(agora.getDate() - 7);
            return dataVenda >= seteDiasAtras;
        }
        return true;
    }).filter(v => {
        const c = parseFloat(v.custo) || 0;
        if (custoFiltro === 'sem_custo' && c > 0) return false;
        if (custoFiltro === 'com_custo' && c <= 0) return false;
        if (tipoFiltro !== 'todos') {
            const t = (v.tipo || '').toLowerCase();
            if (tipoFiltro === 'celular' && !t.includes('celular') && !t.includes('avista') && !t.includes('parcelado') && !t.includes('crediario') && !t.includes('pix')) return false;
            if (tipoFiltro === 'acessorio' && !t.includes('acessorio')) return false;
            if (tipoFiltro === 'pelicula' && !t.includes('pelicula')) return false;
            if (tipoFiltro === 'conserto' && !t.includes('conserto') && !t.includes('os_')) return false;
            if (tipoFiltro === 'avulso' && !t.includes('avulso') && !t.includes('outro')) return false;
        }
        return true;
    });
    
    if (filtrados.length === 0) return UI.toast('Nenhum dado filtrado para copiar.', 'error');
    
    let tsv = "Data\tProduto\tCategoria\tCliente\tValor Venda (R$)\tCusto (R$)\tLucro (R$)\n";
    
    filtrados.forEach(v => {
        const val = parseFloat(v.valorVenda || v.valor || v.preco || 0);
        const cus = parseFloat(v.custo) || 0;
        const luc = val - cus;
        const dataFmt = new Date(v.data).toLocaleString('pt-BR');
        const cat = v.tipo || 'Outro';
        
        tsv += `${dataFmt}\t${v.produto}\t${cat}\t${v.cliente || 'Não Identificado'}\t${val.toFixed(2).replace('.', ',')}\t${cus.toFixed(2).replace('.', ',')}\t${luc.toFixed(2).replace('.', ',')}\n`;
    });
    
    navigator.clipboard.writeText(tsv).then(() => {
        UI.toast('📋 Dados copiados! Cole no Excel ou Google Sheets (CTRL+V).', 'success');
    }).catch(err => {
        console.error('Erro ao copiar dados:', err);
        UI.toast('Erro ao copiar dados. Tente usar o botão Baixar CSV.', 'error');
    });
};

UI.exportarCSVExtrair = function () {
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    const periodo = document.getElementById('ext-filtro-periodo').value;
    const custoFiltro = document.getElementById('ext-filtro-custo').value;
    const tipoFiltro = document.getElementById('ext-filtro-tipo').value;
    
    const agora = new Date();
    const esteMes = agora.getMonth();
    const esteAno = agora.getFullYear();
    
    const filtrados = vendas.filter(v => {
        const dataVenda = new Date(v.data);
        if (isNaN(dataVenda.getTime())) return true;
        
        if (periodo === 'hoje') {
            return dataVenda.toDateString() === agora.toDateString();
        } else if (periodo === 'este_mes') {
            return dataVenda.getMonth() === esteMes && dataVenda.getFullYear() === esteAno;
        } else if (periodo === 'mes_anterior') {
            let mesAnt = esteMes - 1;
            let anoAnt = esteAno;
            if (mesAnt < 0) { mesAnt = 11; anoAnt -= 1; }
            return dataVenda.getMonth() === mesAnt && dataVenda.getFullYear() === anoAnt;
        } else if (periodo === 'ultimos_7_dias') {
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(agora.getDate() - 7);
            return dataVenda >= seteDiasAtras;
        }
        return true;
    }).filter(v => {
        const c = parseFloat(v.custo) || 0;
        if (custoFiltro === 'sem_custo' && c > 0) return false;
        if (custoFiltro === 'com_custo' && c <= 0) return false;
        if (tipoFiltro !== 'todos') {
            const t = (v.tipo || '').toLowerCase();
            if (tipoFiltro === 'celular' && !t.includes('celular') && !t.includes('avista') && !t.includes('parcelado') && !t.includes('crediario') && !t.includes('pix')) return false;
            if (tipoFiltro === 'acessorio' && !t.includes('acessorio')) return false;
            if (tipoFiltro === 'pelicula' && !t.includes('pelicula')) return false;
            if (tipoFiltro === 'conserto' && !t.includes('conserto') && !t.includes('os_')) return false;
            if (tipoFiltro === 'avulso' && !t.includes('avulso') && !t.includes('outro')) return false;
        }
        return true;
    });
    
    if (filtrados.length === 0) return UI.toast('Nenhum dado filtrado para exportar.', 'error');
    
    let csvContent = "\ufeffData;Produto;Categoria;Cliente;Valor Venda;Custo;Lucro\n";
    
    filtrados.forEach(v => {
        const val = parseFloat(v.valorVenda || v.valor || v.preco || 0);
        const cus = parseFloat(v.custo) || 0;
        const luc = val - cus;
        const dataFmt = new Date(v.data).toLocaleString('pt-BR');
        
        csvContent += `"${dataFmt}";"${v.produto.replace(/"/g, '""')}";"${v.tipo || 'Outro'}";"${(v.cliente || 'Não Identificado').replace(/"/g, '""')}";${val.toFixed(2).replace('.', ',')};${cus.toFixed(2).replace('.', ',')};${luc.toFixed(2).replace('.', ',')}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `strategyos_relatorio_custos_${periodo}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    UI.toast('📥 Relatório CSV baixado!', 'success');
};

