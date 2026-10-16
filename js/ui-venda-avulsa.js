// StrategyOS 3.1 — Venda Avulsa (Fluxo Vendedor para Itens Fora do Estoque)
UI._vendedorAvulso = function () {
    const cor = VENDEDOR_CORES.vender;

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge">VENDA SEM ESTOQUE</span>
            <h2 style="font-size:28px">📦 O QUE VOCÊ ESTÁ VENDENDO?</h2>
            <p style="font-size:20px">Descreva o produto que não está cadastrado</p>
        </div>

        <div style="max-width: 600px; margin: 0 auto;">
            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size: 16px; margin-bottom: 8px; color: var(--text-secondary);">Categoria:</label>
                <div class="vendedor-radio-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <label class="vendedor-radio-card" style="padding: 16px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="capinha" checked onchange="UI._focusAvulsoInput('capinha')">
                        <div style="font-size: 24px;">📱 Capinha</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 16px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="pelicula" onchange="UI._focusAvulsoInput('pelicula')">
                        <div style="font-size: 24px;">🛡️ Película</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 16px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="cabo" onchange="UI._focusAvulsoInput('cabo')">
                        <div style="font-size: 24px;">🔌 Cabo/Carreg</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 16px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="fone" onchange="UI._focusAvulsoInput('fone')">
                        <div style="font-size: 24px;">🎧 Fone</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 16px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="fogos" onchange="UI._focusAvulsoInput('fogos')">
                        <div style="font-size: 24px;">🎆 Fogos</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 16px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="outro" onchange="UI._focusAvulsoInput('')">
                        <div style="font-size: 24px;">📦 Outro</div>
                    </label>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size: 16px; margin-bottom: 8px; color: var(--text-secondary);">Descrição (ex: Capinha A54 preta):</label>
                <input type="text" id="avulso-desc" class="form-input" placeholder="Digite qual produto..." style="font-size: 20px; padding: 16px; width: 100%;" value="Capinha " oninput="UI._checkAvulso(); UI._suggestAvulsoCost();">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="display:block; font-size: 16px; margin-bottom: 8px; color: #f59e0b; font-weight:700;">Custo (R$): * <span style="font-size:12px;color:var(--text-muted);font-weight:400;">(Obrigatório para o financeiro)</span></label>
                    <input type="number" id="avulso-custo" class="form-input" placeholder="Ex: 5.00" step="0.50" required style="font-size: 20px; padding: 16px; width: 100%; font-weight: 600; border-color: rgba(245, 158, 11, 0.4);" oninput="UI._checkAvulso()">
                    <div id="avulso-custo-sugestao" style="font-size:12px; color:var(--text-muted); margin-top:4px;"></div>
                </div>
                <div>
                    <label style="display:block; font-size: 16px; margin-bottom: 8px; color: var(--accent-green); font-weight:700;">Preço Venda (R$): *</label>
                    <input type="number" id="avulso-valor" class="form-input" placeholder="0.00" step="0.50" required style="font-size: 24px; padding: 16px; width: 100%; font-weight: 800; color: var(--accent-green);" oninput="UI._checkAvulso()">
                </div>
            </div>
        </div>

        <div class="vendedor-nav" style="margin-top: 40px; justify-content: center; gap: 20px;">
            <button class="btn btn-ghost btn-lg" style="font-size:18px; padding: 14px 28px;" onclick="UI._vendedorVender()">← Cancelar</button>
            <button id="btn-avulso-next" class="btn btn-primary btn-lg" style="font-size:20px; padding: 14px 40px; opacity: 0.5; pointer-events: none;" onclick="UI._vendedorAvulsoPasso2()">Próximo Passo →</button>
        </div>
    `);

    setTimeout(() => {
        UI._suggestAvulsoCost();
        document.getElementById('avulso-custo')?.focus();
    }, 100);
};

UI._suggestAvulsoCost = function () {
    const desc = (document.getElementById('avulso-desc')?.value || '').trim().toLowerCase();
    const custoInput = document.getElementById('avulso-custo');
    const sugestaoEl = document.getElementById('avulso-custo-sugestao');
    if (!custoInput || desc.length < 3) return;

    if (dataManager.data && dataManager.data.historico && dataManager.data.historico.vendas) {
        const anterior = dataManager.data.historico.vendas.slice().reverse().find(v => (v.produto || '').toLowerCase().includes(desc) && v.custo > 0);
        if (anterior && (!custoInput.value || parseFloat(custoInput.value) === 0)) {
            custoInput.value = anterior.custo;
            if (sugestaoEl) sugestaoEl.innerHTML = `💡 Sugestão baseada na última venda: <strong>R$ ${anterior.custo.toFixed(2)}</strong>`;
            UI._checkAvulso();
        }
    }
};

UI._focusAvulsoInput = function (prefix) {
    const input = document.getElementById('avulso-desc');
    if (prefix) {
        input.value = prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' ';
    } else {
        input.value = '';
    }
    input.focus();
    UI._checkAvulso();
    UI._suggestAvulsoCost();
};

UI._checkAvulso = function () {
    const desc = document.getElementById('avulso-desc').value.trim();
    const val = parseFloat(document.getElementById('avulso-valor').value);
    const custoStr = (document.getElementById('avulso-custo')?.value || '').trim();
    const custo = parseFloat(custoStr);
    const btn = document.getElementById('btn-avulso-next');

    // Custo e Valor de Venda são obrigatórios
    if (desc.length > 2 && !isNaN(val) && val > 0 && custoStr !== '' && !isNaN(custo) && custo >= 0) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    } else {
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
    }
};

UI._vendedorAvulsoPasso2 = function () {
    const desc = document.getElementById('avulso-desc').value.trim();
    const val = parseFloat(document.getElementById('avulso-valor').value);
    const custoStr = (document.getElementById('avulso-custo')?.value || '').trim();
    const custo = parseFloat(custoStr);

    if (custoStr === '' || isNaN(custo) || custo < 0) {
        return UI.toast('Informe o custo do produto avulso para continuar!', 'error');
    }

    const prodAvulso = {
        id: 'avulso_' + Date.now(),
        nome: desc,
        precoVenda: val,
        precoFinal: val,
        custo: custo,
        condicao: 'Avulso',
        tipo: 'avulso',
        _tipo: 'avulso'
    };

    if (!UI._vendedorCarrinho) UI._vendedorCarrinho = [];
    UI._vendedorCarrinho.push(prodAvulso);

    UI.toast(`📦 Produto Avulso adicionado ao carrinho (Custo: ${UI.R(custo)})!`, 'success');
    
    // Renderiza de volta a tela principal de Venda (com o carrinho atualizado)
    UI._vendedorVenderProdutos(UI._clienteAtual || {nome:'Consumidor Geral'});
};
