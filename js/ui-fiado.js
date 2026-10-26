// StrategyOS 3.1 — VENDAS FIADO (aba sistema principal)

UI.renderFiado = function () {
    const fiados = dataManager.getFiados();
    const alertas = dataManager.getFiadosAlerta();
    const pendentes = fiados.filter(f => f.status === 'pendente');
    const recebidos = fiados.filter(f => f.status === 'recebido');
    const hoje = dataManager.hojeLocal ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0];

    const statusBadge = (f) => {
        if (f.status === 'recebido') return '<span style="color:var(--accent-green)">✅ Recebido</span>';
        if (f.dataCobrar < hoje) return '<span style="color:var(--accent-red)">🔴 Atrasado</span>';
        if (f.dataCobrar === hoje) return '<span style="color:var(--accent-yellow)">🟡 Hoje</span>';
        return '<span style="color:var(--accent-green)">🟢 No prazo</span>';
    };

    let alertaHtml = '';
    if (alertas.atrasados.length > 0) {
        alertaHtml += `<div class="card" style="border-left:3px solid var(--accent-red);margin-bottom:12px"><div class="card-header"><h3>🔴 ATRASADOS (${alertas.atrasados.length})</h3></div>`;
        alertas.atrasados.forEach(f => { alertaHtml += `<div style="padding:4px 16px;font-size:14px">• ${f.cliente} — ${UI.R(f.valor)} — ${f.produto} (desde ${f.dataRegistro})</div>`; });
        alertaHtml += '</div>';
    }
    if (alertas.hoje.length > 0) {
        alertaHtml += `<div class="card" style="border-left:3px solid var(--accent-yellow);margin-bottom:12px"><div class="card-header"><h3>🟡 COBRAR HOJE (${alertas.hoje.length})</h3></div>`;
        alertas.hoje.forEach(f => { alertaHtml += `<div style="padding:4px 16px;font-size:14px">• ${f.cliente} — ${UI.R(f.valor)} — ${f.produto}</div>`; });
        alertaHtml += '</div>';
    }
    if (alertas.amanha.length > 0) {
        alertaHtml += `<div class="card" style="border-left:3px solid var(--accent-green);margin-bottom:12px"><div class="card-header"><h3>🟢 COBRAR AMANHÃ (${alertas.amanha.length})</h3></div>`;
        alertas.amanha.forEach(f => { alertaHtml += `<div style="padding:4px 16px;font-size:14px">• ${f.cliente} — ${UI.R(f.valor)} — ${f.produto}</div>`; });
        alertaHtml += '</div>';
    }

    document.getElementById('main-content').innerHTML = `
        <div class="section-header"><h2>📝 VENDAS FIADO</h2><p>Controle de vendas a prazo (sem parcelas formais)</p></div>
        <div class="dash-cards" style="margin-bottom:16px">
            <div class="dash-card"><div class="dash-card-label">Total fiado</div><div class="dash-card-value" style="color:var(--accent-yellow)">${UI.R(alertas.total)}</div></div>
            <div class="dash-card"><div class="dash-card-label">A receber hoje</div><div class="dash-card-value">${UI.R(alertas.hoje.reduce((s, f) => s + f.valor, 0))}</div></div>
            <div class="dash-card"><div class="dash-card-label">Atrasados</div><div class="dash-card-value" style="color:var(--accent-red)">${alertas.atrasados.length} clientes</div></div>
        </div>
        <button class="btn btn-primary" onclick="UI._novoFiado()" style="margin-bottom:16px">+ Nova Venda Fiado</button>
        ${alertaHtml}
        <div class="card"><div class="card-header"><h3>📋 Lista de Fiados (${pendentes.length} pendentes)</h3></div>
            <div style="overflow-x:auto">
                <table class="priority-table">
                    <thead><tr><th>Cliente</th><th>Produto</th><th>Valor</th><th>Vendido em</th><th>Cobrar em</th><th>Status</th><th>Ação</th></tr></thead>
                    <tbody>
                        ${pendentes.map(f => `<tr>
                            <td><strong>${f.cliente}</strong></td><td>${f.produto}</td><td>${UI.R(f.valor)}</td>
                            <td>${f.dataRegistro}</td><td>${f.dataCobrar}</td><td>${statusBadge(f)}</td>
                            <td><button class="btn btn-sm btn-primary" onclick="UI._abrirModalReceberFiado(${f.id}, '${f.cliente.replace(/'/g, "\\'")}', ${f.valor})">Receber</button></td>
                        </tr>`).join('')}
                        ${pendentes.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum fiado pendente 🎉</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
        ${recebidos.length > 0 ? `<div class="card" style="margin-top:12px"><div class="card-header"><h3>✅ Histórico (${recebidos.length} recebidos)</h3></div>
            <table class="priority-table"><thead><tr><th>Cliente</th><th>Produto</th><th>Valor</th><th>Recebido em</th></tr></thead>
            <tbody>${recebidos.slice(-10).reverse().map(f => `<tr><td>${f.cliente}</td><td>${f.produto}</td><td>${UI.R(f.valor)}</td><td>${f.dataRecebimento || '-'}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
};

UI._abrirModalReceberFiado = function (id, cliente, valor) {
    const html = `
        <div style="padding:16px;text-align:center;">
            <h3 style="color:#10b981;font-size:20px;margin-bottom:8px;">💰 RECEBER FIADO</h3>
            <p style="font-size:16px;color:var(--text-muted);margin-bottom:16px;">Cliente: <strong>${cliente}</strong> • Valor: <strong style="color:#00d97e;font-size:18px;">${UI.R(valor)}</strong></p>
            <div style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">Como o cliente está pagando agora?</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <button class="btn" style="padding:16px;font-size:16px;font-weight:800;background:rgba(16,185,129,0.15);border:2px solid #10b981;color:#10b981;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:6px;" onclick="UI._confirmarRecebimentoFiado(${id}, 'dinheiro')">
                    <span style="font-size:28px;">💵</span>
                    <span>DINHEIRO</span>
                    <span style="font-size:11px;opacity:0.8;">(Entra no Caixa Gaveta)</span>
                </button>
                <button class="btn" style="padding:16px;font-size:16px;font-weight:800;background:rgba(14,165,233,0.15);border:2px solid #0ea5e9;color:#0ea5e9;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:6px;" onclick="UI._confirmarRecebimentoFiado(${id}, 'pix')">
                    <span style="font-size:28px;">💠</span>
                    <span>PIX / CONTA</span>
                    <span style="font-size:11px;opacity:0.8;">(Entra no Caixa Principal)</span>
                </button>
            </div>
            <div style="margin-top:16px;">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            </div>
        </div>
    `;
    UI.openModal('💵 RECEBIMENTO DE FIADO', html);
};

UI._confirmarRecebimentoFiado = function (id, forma) {
    dataManager.receberFiado(id, forma);
    UI.closeModal();
    UI.toast(`✅ Fiado recebido via ${forma.toUpperCase()} com sucesso!`, 'success');
    UI.renderFiado();
};

UI._novoFiado = function () {
    const hoje = dataManager.hojeLocal ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0];
    const prazos = [
        { label: 'Até 7 dias (Sem juros)', dias: 7, juros: 0 },
        { label: 'Até 15 dias (+10% juros)', dias: 15, juros: 10 },
        { label: 'Até 30 dias (+20% juros)', dias: 30, juros: 20 },
        { label: 'Até 45 dias (+30% juros)', dias: 45, juros: 30 },
        { label: 'Até 60 dias (+40% juros)', dias: 60, juros: 40 }
    ];
    UI.openModal('📝 REGISTRAR VENDA FIADO (A PRAZO)', `
        <div class="form-group"><label class="form-label">Cliente:</label><input class="form-input" id="fiado-cliente" placeholder="Nome do cliente"></div>
        <div class="form-group"><label class="form-label">Telefone:</label><input class="form-input" id="fiado-tel" placeholder="(XX) XXXXX-XXXX"></div>
        <hr style="border-color:var(--border-color);margin:12px 0">
        <div class="form-group"><label class="form-label">O que vendeu?</label><input class="form-input" id="fiado-produto" placeholder="Ex: Carregador, Capinha, Película"></div>
        <div class="form-group"><label class="form-label">Valor Original (R$):</label><input class="form-input" id="fiado-valor" type="number" step="0.01" placeholder="0.00" oninput="UI._calcFiadoPreview()"></div>
        <hr style="border-color:var(--border-color);margin:12px 0">
        <div class="form-group"><label class="form-label">Prazo e Tabela de Juros:</label>
            <div style="display:flex;flex-direction:column;gap:6px">
                ${prazos.map((p, i) => `<label class="vendedor-radio-card" style="padding:10px;"><input type="radio" name="fiado-prazo" value="${p.dias}" data-juros="${p.juros}" ${i === 1 ? 'checked' : ''} onchange="UI._calcFiadoPreview()"> ${p.label}</label>`).join('')}
            </div>
        </div>
        <div id="fiado-preview-box" style="margin-top:12px;background:rgba(245,158,11,0.1);border:1px solid #f59e0b;padding:12px;border-radius:10px;text-align:center;">
            <div style="font-size:12px;color:var(--text-muted);">PREVIEW DO FIADO</div>
            <div id="fiado-preview-detalhe" style="font-size:16px;font-weight:700;margin-top:4px;">Digite o valor original...</div>
        </div>
        <div class="form-group" style="margin-top:12px;"><label class="form-label">Observação (opcional):</label><input class="form-input" id="fiado-obs" placeholder=""></div>
    `, `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="UI._previewEConfirmarFiado()">🔍 VER CONFIRMAÇÃO</button>`);
};

UI._calcFiadoPreview = function () {
    const valorOriginal = parseFloat(document.getElementById('fiado-valor')?.value) || 0;
    const prazoRadio = document.querySelector('input[name="fiado-prazo"]:checked');
    const jurosPct = parseFloat(prazoRadio?.getAttribute('data-juros') || 0);
    const box = document.getElementById('fiado-preview-detalhe');
    if (!box) return;

    if (valorOriginal > 0) {
        const jurosValor = (valorOriginal * jurosPct) / 100;
        const totalFinal = valorOriginal + jurosValor;
        box.innerHTML = `Original: <strong>${UI.R(valorOriginal)}</strong> + Juros (${jurosPct}%): <strong>${UI.R(jurosValor)}</strong><br><span style="font-size:20px;color:#00d97e;">Total Final: ${UI.R(totalFinal)}</span>`;
    } else {
        box.innerHTML = `Digite o valor original...`;
    }
};

UI._previewEConfirmarFiado = function () {
    const cliente = document.getElementById('fiado-cliente')?.value?.trim();
    const produto = document.getElementById('fiado-produto')?.value?.trim();
    const valorOriginal = parseFloat(document.getElementById('fiado-valor')?.value);
    const prazoRadio = document.querySelector('input[name="fiado-prazo"]:checked');
    if (!cliente || !produto || isNaN(valorOriginal) || valorOriginal <= 0 || !prazoRadio) {
        return UI.toast('Preencha todos os campos obrigatórios!', 'error');
    }

    const dias = parseInt(prazoRadio.value);
    const jurosPct = parseFloat(prazoRadio.getAttribute('data-juros') || 0);
    const jurosValor = (valorOriginal * jurosPct) / 100;
    const valorFinal = valorOriginal + jurosValor;
    const dtCobrarObj = new Date(Date.now() + dias * 86400000);
    const dataCobrar = dataManager.hojeLocal ? dataManager.hojeLocal(dtCobrarObj) : dtCobrarObj.toISOString().split('T')[0];
    const dataFormatada = new Date(dataCobrar + 'T12:00:00').toLocaleDateString('pt-BR');

    const html = `
        <div style="padding:16px;text-align:center;">
            <h3 style="color:#f59e0b;font-size:22px;margin:0 0 12px 0;">⚠️ CONFIRMAÇÃO DE VENDA FIADO</h3>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:16px;border-radius:12px;text-align:left;font-size:15px;">
                <div>👤 <strong>Cliente:</strong> ${cliente}</div>
                <div>📦 <strong>Produto:</strong> ${produto}</div>
                <div>📅 <strong>Prazo Escolhido:</strong> ${dias} dias (Cobrar em: ${dataFormatada})</div>
                <hr style="border-color:rgba(255,255,255,0.1);margin:10px 0;">
                <div>💰 <strong>Valor Original:</strong> ${UI.R(valorOriginal)}</div>
                <div>📈 <strong>Juros (${jurosPct}%):</strong> ${UI.R(jurosValor)}</div>
                <div style="font-size:22px;font-weight:900;color:#00d97e;margin-top:8px;">💎 TOTAL A COBRAR: ${UI.R(valorFinal)}</div>
            </div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button class="btn btn-ghost" style="flex:1;" onclick="UI.closeModal(); UI._novoFiado();">← Ajustar Dados</button>
                <button class="btn btn-success" style="flex:2;font-weight:900;" onclick="UI._efetivarSalvarFiado('${cliente.replace(/'/g, "\\'")}', '${produto.replace(/'/g, "\\'")}', ${valorFinal}, '${dataCobrar}', '${document.getElementById('fiado-tel')?.value || ''}', '${document.getElementById('fiado-obs')?.value || ''}')">✅ CONFIRMAR E GERAR DÍVIDA</button>
            </div>
        </div>
    `;
    UI.openModal('🔍 PREVIEW FIADO', html);
};

UI._efetivarSalvarFiado = function (cliente, produto, valor, dataCobrar, telefone, observacao) {
    dataManager.registrarFiado({
        cliente, produto, valor, dataCobrar, telefone, observacao
    });
    UI.closeModal();
    UI.toast(`✅ Fiado registrado com sucesso! ${cliente} — ${UI.R(valor)}`, 'success');
    UI.renderFiado();
};
