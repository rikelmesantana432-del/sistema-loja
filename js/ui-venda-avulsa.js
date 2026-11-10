// StrategyOS 3.1 — Venda Avulsa com Vínculo Automático Inteligente de Estoque (Fuzzy Match)
UI._vendedorAvulso = function () {
    UI._avulsoMatchAtual = null;

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge">VENDA RÁPIDA / AVULSA (COM AUTO-ESTOQUE)</span>
            <h2 style="font-size:28px">📦 O QUE VOCÊ ESTÁ VENDENDO?</h2>
            <p style="font-size:18px;color:var(--text-muted);">Se digitar um celular ou acessório que já existe no estoque (mesmo com nome diferente, ex: "celular iphone 11"), o sistema puxa e dá baixa sozinho!</p>
        </div>

        <div style="max-width: 620px; margin: 0 auto;">
            <div style="margin-bottom: 20px;">
                <label style="display:block; font-size: 16px; margin-bottom: 8px; color: var(--text-secondary);">Categoria Rápida:</label>
                <div class="vendedor-radio-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="celular" onchange="UI._focusAvulsoInput('Celular ')">
                        <div style="font-size: 20px;">📲 Celular</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="capinha" checked onchange="UI._focusAvulsoInput('Capinha ')">
                        <div style="font-size: 20px;">📱 Capinha</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="pelicula" onchange="UI._focusAvulsoInput('Película ')">
                        <div style="font-size: 20px;">🛡️ Película</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="cabo" onchange="UI._focusAvulsoInput('Cabo ')">
                        <div style="font-size: 20px;">🔌 Cabo/Carreg</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="fone" onchange="UI._focusAvulsoInput('Fone ')">
                        <div style="font-size: 20px;">🎧 Fone</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="fogos" onchange="UI._focusAvulsoInput('Fogos ')">
                        <div style="font-size: 20px;">🎆 Fogos</div>
                    </label>
                    <label class="vendedor-radio-card" style="padding: 14px; text-align: center;">
                        <input type="radio" name="avulso-categoria" value="outro" onchange="UI._focusAvulsoInput('')">
                        <div style="font-size: 20px;">📦 Outro</div>
                    </label>
                </div>
            </div>

            <div style="margin-bottom: 18px;">
                <label style="display:block; font-size: 16px; margin-bottom: 8px; color: var(--text-secondary);">Descrição (ex: Celular iPhone 11, Capinha A54 preta):</label>
                <input type="text" id="avulso-desc" class="form-input" placeholder="Digite qual produto..." style="font-size: 20px; padding: 16px; width: 100%;" value="Capinha " oninput="UI._suggestAvulsoCost(); UI._checkAvulso();">
                <div id="avulso-estoque-match-card" style="display:none; margin-top: 10px;"></div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                    <label style="display:block; font-size: 16px; margin-bottom: 8px; color: #f59e0b; font-weight:700;">Custo (R$): * <span style="font-size:12px;color:var(--text-muted);font-weight:400;">(Automático se achar no estoque)</span></label>
                    <input type="number" id="avulso-custo" class="form-input" placeholder="Ex: 5.00" step="0.50" required style="font-size: 20px; padding: 16px; width: 100%; font-weight: 600; border-color: rgba(245, 158, 11, 0.4);" oninput="this.dataset.manual='1'; UI._checkAvulso()">
                    <div id="avulso-custo-sugestao" style="font-size:12px; color:var(--text-muted); margin-top:4px;"></div>
                </div>
                <div>
                    <label style="display:block; font-size: 16px; margin-bottom: 8px; color: var(--accent-green); font-weight:700;">Preço Venda (R$): *</label>
                    <input type="number" id="avulso-valor" class="form-input" placeholder="0.00" step="0.50" required style="font-size: 24px; padding: 16px; width: 100%; font-weight: 800; color: var(--accent-green);" oninput="this.dataset.manual='1'; UI._checkAvulso()">
                </div>
            </div>
        </div>

        <div class="vendedor-nav" style="margin-top: 32px; justify-content: center; gap: 20px;">
            <button class="btn btn-ghost btn-lg" style="font-size:18px; padding: 14px 28px;" onclick="UI._vendedorVender()">← Cancelar</button>
            <button id="btn-avulso-next" class="btn btn-primary btn-lg" style="font-size:20px; padding: 14px 40px; opacity: 0.5; pointer-events: none;" onclick="UI._vendedorAvulsoPasso2()">Próximo Passo →</button>
        </div>
    `);

    setTimeout(() => {
        UI._suggestAvulsoCost();
        document.getElementById('avulso-desc')?.focus();
    }, 80);
};

UI._suggestAvulsoCost = function () {
    const desc = (document.getElementById('avulso-desc')?.value || '').trim();
    const descLower = desc.toLowerCase();
    const custoInput = document.getElementById('avulso-custo');
    const valorInput = document.getElementById('avulso-valor');
    const sugestaoEl = document.getElementById('avulso-custo-sugestao');
    const matchCard = document.getElementById('avulso-estoque-match-card');
    if (!custoInput) return;

    // 1. Tentar puxar automaticamente do Estoque (Celulares ou Acessórios) mesmo com nome diferente
    const match = (window.dataManager && typeof dataManager.buscarMatchEstoqueInteligente === 'function' && desc.length >= 3)
        ? dataManager.buscarMatchEstoqueInteligente(desc)
        : null;

    if (match && match.prod) {
        UI._avulsoMatchAtual = match;
        const p = match.prod;
        const qtd = p.quantidade !== undefined ? p.quantidade : 1;
        if (!custoInput.dataset.manual || !custoInput.value) {
            custoInput.value = parseFloat(p.custo || 0).toFixed(2);
        }
        if (valorInput && (!valorInput.dataset.manual || !valorInput.value) && p.precoVenda > 0) {
            valorInput.value = parseFloat(p.precoVenda).toFixed(2);
        }
        if (sugestaoEl) {
            sugestaoEl.innerHTML = `<span style="color:#10b981;font-weight:700;">✅ Custo real puxado do estoque (${UI.R(p.custo || 0)})</span>`;
        }
        if (matchCard) {
            matchCard.style.display = 'block';
            matchCard.innerHTML = `
                <div style="background:rgba(16,185,129,0.12);border:1.5px solid #10b981;border-radius:12px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                    <div>
                        <div style="font-size:13px;font-weight:800;color:#10b981;">🎯 PRODUTO ENCONTRADO NO ESTOQUE (${match.origemLista === 'celulares' ? '📱 Celulares' : '🎧 Acessórios'})</div>
                        <div style="font-size:15px;font-weight:900;color:#fff;margin-top:2px;">${p.nome} — <span style="color:#FFD700;">Vitrine: ${UI.R(p.precoVenda || 0)}</span> <span style="font-size:12px;color:var(--text-muted);">(Qtd atual: ${qtd})</span></div>
                    </div>
                    <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#fff;cursor:pointer;background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:8px;">
                        <input type="checkbox" id="avulso-abater-estoque" checked style="width:16px;height:16px;">
                        Abater 1 un. do estoque
                    </label>
                </div>`;
        }
        UI._checkAvulso();
        return;
    }

    UI._avulsoMatchAtual = null;
    if (matchCard) {
        matchCard.style.display = 'none';
        matchCard.innerHTML = '';
    }

    // 2. Fallback: sugerir custo com base na última venda similar do histórico
    if (descLower.length >= 3 && dataManager.data && dataManager.data.historico && dataManager.data.historico.vendas) {
        const anterior = dataManager.data.historico.vendas.slice().reverse().find(v => (v.produto || '').toLowerCase().includes(descLower) && v.custo > 0);
        if (anterior && (!custoInput.value || parseFloat(custoInput.value) === 0)) {
            custoInput.value = anterior.custo;
            if (sugestaoEl) sugestaoEl.innerHTML = `💡 Sugestão baseada na última venda: <strong>R$ ${Number(anterior.custo).toFixed(2)}</strong>`;
            UI._checkAvulso();
        }
    }
};

UI._focusAvulsoInput = function (prefix) {
    const input = document.getElementById('avulso-desc');
    const custoInput = document.getElementById('avulso-custo');
    const valorInput = document.getElementById('avulso-valor');
    if (custoInput) delete custoInput.dataset.manual;
    if (valorInput) delete valorInput.dataset.manual;
    if (input) {
        input.value = prefix || '';
        input.focus();
    }
    UI._suggestAvulsoCost();
    UI._checkAvulso();
};

UI._checkAvulso = function () {
    const desc = (document.getElementById('avulso-desc')?.value || '').trim();
    const val = parseFloat(document.getElementById('avulso-valor')?.value);
    const custoStr = (document.getElementById('avulso-custo')?.value || '').trim();
    const custo = parseFloat(custoStr);
    const btn = document.getElementById('btn-avulso-next');
    if (!btn) return;

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
    const abaterCheck = document.getElementById('avulso-abater-estoque');
    const deveAbater = abaterCheck ? abaterCheck.checked : true;

    if (custoStr === '' || isNaN(custo) || custo < 0) {
        return UI.toast('Informe o custo do produto para continuar!', 'error');
    }

    const match = deveAbater ? (UI._avulsoMatchAtual || dataManager.buscarMatchEstoqueInteligente(desc)) : null;

    const prodAvulso = {
        id: match && match.prod ? match.prod.id : ('avulso_' + Date.now()),
        nome: match && match.prod ? match.prod.nome : desc,
        nomeDigitado: desc,
        precoVenda: val,
        precoFinal: val,
        custo: custo,
        _custoManualEditado: document.getElementById('avulso-custo')?.dataset.manual === '1',
        condicao: match && match.prod ? (match.prod.condicao || 'Estoque') : 'Avulso',
        tipo: 'avulso',
        _tipo: 'avulso',
        ignorarAutoEstoque: !deveAbater,
        _estoqueMatchId: match && match.prod ? match.prod.id : null,
        _estoqueMatchLista: match ? match.origemLista : null
    };

    if (!UI._vendedorCarrinho) UI._vendedorCarrinho = [];
    UI._vendedorCarrinho.push(prodAvulso);

    if (match && match.prod) {
        UI.toast(`🎯 Vinculado ao estoque: "${match.prod.nome}" será abatido automaticamente!`, 'success');
    } else {
        UI.toast(`📦 Produto Avulso adicionado ao carrinho (Custo: ${UI.R(custo)})!`, 'success');
    }

    UI._vendedorVenderProdutos(UI._clienteAtual || { nome: 'Consumidor Geral' });
};
