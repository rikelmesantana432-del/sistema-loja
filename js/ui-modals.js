// ====================================
// STRATEGYOS 3.0 - MODAIS
// PIX, autodetecção, custos películas
// ====================================

// === VENDER CELULAR ===
UI.modalVenderCelular = function (produtoId) {
    const prod = dataManager.data.estoqueCelulares.find(p => p.id === produtoId);
    if (!prod) return UI.toast('Produto não encontrado', 'error');
    const desc = Calculators.calcularDescontoTempo(prod);

    UI.openModal('💰 Vender ' + prod.nome, `
        <div class="analise-ponto">
            <div class="analise-ponto-info">Preço tabela: <strong>${UI.R(prod.precoVenda)}</strong></div>
            ${desc.pctDesconto > 0 ? `<div class="analise-ponto-info" style="color:var(--accent-yellow)">Sugestão: ${desc.pctDesconto}% off → ${UI.R(desc.novoPreco)} (${desc.motivo})</div>` : ''}
            ${desc.acao === 'troca' ? `<div class="analise-ponto-info" style="color:var(--accent-red)">🔴 ${desc.motivo}</div>` : ''}
            <div class="analise-ponto-info">Custo: ${UI.R(prod.custo)} | Dias: ${desc.dias}</div>
        </div>

        <div class="form-group">
            <label class="form-label">Valor da venda (R$)</label>
            <input class="form-input" id="venda-valor" type="number" step="0.01" value="${desc.pctDesconto > 0 ? desc.novoPreco : prod.precoVenda}" style="font-size:18px;font-weight:700">
        </div>

        <div class="form-group">
            <label class="form-label">Forma de pagamento</label>
            <div class="form-radio-group">
                <label class="form-radio-label"><input type="radio" name="forma" value="avista" checked><span>💵 À Vista</span></label>
                <label class="form-radio-label"><input type="radio" name="forma" value="cartao"><span>💳 Cartão</span></label>
                <label class="form-radio-label"><input type="radio" name="forma" value="pix"><span>📲 PIX</span></label>
            </div>
        </div>

        <div id="venda-cartao-opcoes" style="display:none">
            <div class="form-group"><label class="form-label">Bandeira</label>
                <div class="form-radio-group">
                    <label class="form-radio-label"><input type="radio" name="bandeira" value="normal" checked><span>Visa/Master</span></label>
                    <label class="form-radio-label"><input type="radio" name="bandeira" value="elo"><span>Elo</span></label>
                </div>
            </div>
            <div class="form-group"><label class="form-label">Parcelas</label>
                <select class="form-select" id="venda-parcelas" onchange="UI._calcPreviewVenda(${produtoId})">
                    <option value="0">Débito</option><option value="1">Crédito 1x</option>
                    ${Array.from({ length: 17 }, (_, i) => `<option value="${i + 2}">${i + 2}x</option>`).join('')}
                </select>
            </div>
        </div>

        <div id="venda-preview"></div>

        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarVenda(${produtoId})">✅ Confirmar</button>
        </div>
    `);

    // Toggle cartão options
    document.querySelectorAll('input[name="forma"]').forEach(r => {
        r.addEventListener('change', () => {
            const v = document.querySelector('input[name="forma"]:checked').value;
            document.getElementById('venda-cartao-opcoes').style.display = v === 'cartao' ? 'block' : 'none';
            UI._calcPreviewVenda(produtoId);
        });
    });
    document.querySelectorAll('input[name="bandeira"]').forEach(r => r.addEventListener('change', () => UI._calcPreviewVenda(produtoId)));
};

UI._calcPreviewVenda = function (produtoId) {
    const prod = dataManager.data.estoqueCelulares.find(p => p.id === produtoId);
    const valor = parseFloat(document.getElementById('venda-valor').value) || 0;
    const forma = document.querySelector('input[name="forma"]:checked').value;
    let html = '';

    if (forma === 'avista') {
        const lucro = valor - prod.custo;
        html = `<div class="analise-ponto"><div class="analise-ponto-info">Recebe: <strong>${UI.R(valor)}</strong> | Lucro: <strong style="color:var(--accent-green)">${UI.R(lucro)}</strong></div></div>`;
    } else if (forma === 'pix') {
        const calc = Calculators.calcularTaxaMaquina(valor, 0, 'pix');
        html = `<div class="analise-ponto"><div class="analise-ponto-info">Taxa PIX: ${calc.taxa}% (${UI.R(calc.desconto)})</div><div class="analise-ponto-info">Recebe: <strong>${UI.R(calc.liquido)}</strong> | Lucro: <strong style="color:var(--accent-green)">${UI.R(calc.liquido - prod.custo)}</strong></div></div>`;
    } else {
        const parcelas = parseInt(document.getElementById('venda-parcelas').value);
        const bandeira = document.querySelector('input[name="bandeira"]:checked').value;
        const calc = Calculators.calcularTaxaMaquina(valor, parcelas, bandeira);
        html = `<div class="analise-ponto"><div class="analise-ponto-info">Taxa ${bandeira === 'elo' ? 'Elo' : 'Visa/Master'}: ${calc.taxa}% (${UI.R(calc.desconto)})</div><div class="analise-ponto-info">Recebe: <strong>${UI.R(calc.liquido)}</strong> | Lucro: <strong style="color:${calc.liquido - prod.custo >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${UI.R(calc.liquido - prod.custo)}</strong></div></div>`;
    }
    document.getElementById('venda-preview').innerHTML = html;
};

UI._confirmarVenda = function (produtoId) {
    const valor = parseFloat(document.getElementById('venda-valor').value) || 0;
    const forma = document.querySelector('input[name="forma"]:checked').value;
    if (!valor) return UI.toast('Informe o valor', 'error');
    let r;
    if (forma === 'avista') {
        r = dataManager.venderAVista(produtoId, valor);
    } else if (forma === 'pix') {
        r = dataManager.venderParcelado(produtoId, valor, 0, 'pix');
    } else {
        const parcelas = parseInt(document.getElementById('venda-parcelas').value);
        const bandeira = document.querySelector('input[name="bandeira"]:checked').value;
        r = dataManager.venderParcelado(produtoId, valor, parcelas, bandeira);
    }
    if (r.sucesso) { UI.toast(`✅ Vendido! Lucro: ${UI.R(r.lucro || (valor - (r.produto || {}).custo))}`, 'success'); UI.closeModal(); UI.render(); }
    else UI.toast(r.erro, 'error');
};

// === VENDA À VISTA (DIRETO) ===
UI.modalRegistrarVendaVista = function () {
    const celulares = dataManager.getEstoqueCelulares();
    if (celulares.length === 0) return UI.toast('Nenhum celular disponível', 'error');
    UI.openModal('💵 Venda à Vista', `
        <div class="form-group"><label class="form-label">Celular</label>
            <select class="form-select" id="vv-produto">${celulares.map(p => `<option value="${p.id}">${p.nome} — ${UI.R(p.precoVenda)}</option>`).join('')}</select>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn-success btn-lg" onclick="UI.closeModal();UI.modalVenderCelular(parseInt(document.getElementById('vv-produto').value));">Continuar</button></div>
    `);
};

// === VENDA PARCELADA / PIX ===
UI.modalRegistrarVendaParcelada = function () {
    const celulares = dataManager.getEstoqueCelulares();
    if (celulares.length === 0) return UI.toast('Nenhum celular disponível', 'error');
    UI.openModal('💳 Venda Parcelada / PIX', `
        <div class="form-group"><label class="form-label">Celular</label>
            <select class="form-select" id="vp-produto">${celulares.map(p => `<option value="${p.id}">${p.nome} — ${UI.R(p.precoVenda)}</option>`).join('')}</select>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn-success btn-lg" onclick="UI.closeModal();UI.modalVenderCelular(parseInt(document.getElementById('vp-produto').value));">Continuar</button></div>
    `);
};

// === RECEBER PARCELA ===
UI.modalReceberParcela = function (crediarioId) {
    const cred = dataManager.data.crediarios.find(c => c.id === crediarioId);
    if (!cred) return;
    UI.openModal('💰 Receber Parcela', `
        <div class="analise-ponto">
            <div class="analise-ponto-title">${cred.cliente}</div>
            <div class="analise-ponto-info">Parcela ${cred.parcelasPagas + 1}/${cred.parcelasTotal} — ${UI.R(cred.valorParcela)}</div>
            <div class="analise-ponto-info">Restante: ${UI.R(cred.valorTotal - cred.parcelasPagas * cred.valorParcela)}</div>
        </div>
        <div class="form-group"><label class="form-label">Valor recebido</label><input class="form-input" id="rp-valor" type="number" step="0.01" value="${cred.valorParcela}"></div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarParcela(${crediarioId})">✅ Receber</button>
        </div>
    `);
};

UI._confirmarParcela = function (crediarioId) {
    const valor = parseFloat(document.getElementById('rp-valor').value) || 0;
    if (!valor) return UI.toast('Informe o valor', 'error');
    const r = dataManager.receberParcela(crediarioId, valor);
    if (r.sucesso) { UI.toast(`✅ Parcela ${r.parcela} recebida!`, 'success'); UI.closeModal(); UI.render(); }
};

// === COMPRAR CELULAR (com autodetecção) ===
UI.modalComprarCelular = function () {
    UI.openModal('🛒 Comprar Celular', `
        <div class="form-float"><input class="form-input" id="cp-nome" placeholder=" " oninput="UI._autoDetectarProduto()"><label for="cp-nome">Nome do produto (Ex: iPhone 11)</label></div>
        <div id="cp-autodetect"></div>
        <div class="form-row">
            <div class="form-float"><input class="form-input" id="cp-custo" type="number" step="0.01" placeholder=" "><label for="cp-custo">Custo (R$)</label></div>
            <div class="form-float"><input class="form-input" id="cp-venda" type="number" step="0.01" placeholder=" "><label for="cp-venda">Preço de venda (R$)</label></div>
        </div>
        <div class="form-group"><label class="form-label">Condição</label>
            <select class="form-select" id="cp-condicao"><option>Usado</option><option>Novo</option><option>Lacrado</option><option>Troca</option></select>
        </div>
        <div id="cp-analise"></div>
        <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-primary btn-lg btn-block" onclick="UI._analisarCompraModal()">📊 Analisar</button>
        </div>
        <div id="cp-confirmar"></div>
    `);
};

UI._autoDetectarProduto = function () {
    const nome = document.getElementById('cp-nome').value.trim();
    if (nome.length < 3) { document.getElementById('cp-autodetect').innerHTML = ''; return; }
    const det = Calculators.detectarTipoProduto(nome);
    if (det) {
        document.getElementById('cp-autodetect').innerHTML = `
            <div class="analise-ponto" style="border-left:3px solid var(--accent-green)">
                <div class="analise-ponto-info">${det.icone} Tipo detectado: <strong>${det.label}</strong></div>
                <div class="analise-ponto-info">Estoque: ${det.estoque}</div>
            </div>`;
    } else {
        document.getElementById('cp-autodetect').innerHTML = `
            <div class="analise-ponto" style="border-left:3px solid var(--accent-yellow)">
                <div class="analise-ponto-info">❓ Não reconheci o produto. Selecione:</div>
                <div class="form-radio-group" style="margin-top:6px">
                    <label class="form-radio-label"><input type="radio" name="tipo-manual" value="celular" checked><span>📱 Celular</span></label>
                    <label class="form-radio-label"><input type="radio" name="tipo-manual" value="acessorio"><span>📦 Acessório</span></label>
                    <label class="form-radio-label"><input type="radio" name="tipo-manual" value="equipamento"><span>🏪 Equipamento</span></label>
                </div>
            </div>`;
    }
};

UI._analisarCompraModal = function () {
    const nome = document.getElementById('cp-nome').value.trim();
    const custo = parseFloat(document.getElementById('cp-custo').value) || 0;
    const venda = parseFloat(document.getElementById('cp-venda').value) || 0;
    if (!nome || !custo || !venda) return UI.toast('Preencha todos os campos', 'error');
    const a = Calculators.analisarCompra(nome, custo, venda);

    document.getElementById('cp-analise').innerHTML = `
        <div class="decisao-banner" style="background:${a.decisao.cor === 'var(--accent-green)' ? 'rgba(0,217,126,0.1)' : a.decisao.cor === 'var(--accent-yellow)' ? 'rgba(245,166,35,0.1)' : 'rgba(230,55,87,0.1)'};border:2px solid ${a.decisao.cor};color:${a.decisao.cor}">
            ${a.decisao.emoji} ${a.decisao.texto}
        </div>
        <div class="analise-ponto"><div class="analise-ponto-title">1. 💰 CAPACIDADE</div><div class="analise-ponto-info">${a.capacidade.emoji} ${a.capacidade.texto} — Caixa após: ${UI.R(a.aposCaixa)}</div></div>
        <div class="analise-ponto"><div class="analise-ponto-title">2. 📊 PREÇO MERCADO</div><div class="analise-ponto-info">${a.precoMercado.classificacao}${a.precoMercado.media ? ` — Média: ${UI.R(a.precoMercado.media)}` : ''}</div></div>
        <div class="analise-ponto"><div class="analise-ponto-title">3. 🏘️ AMARGOSA</div><div class="analise-ponto-info">${a.adequacao.emoji} ${a.adequacao.texto}</div></div>
        <div class="analise-ponto"><div class="analise-ponto-title">4. 📈 MARGEM</div><div class="analise-ponto-info">${a.margemClass.emoji} ${a.margem}% — ${a.margemClass.texto} — Lucro: ${UI.R(a.lucro)}</div></div>
        <div class="analise-ponto"><div class="analise-ponto-title">5. ⚡ RISCO (IRP)</div><div class="analise-ponto-info">${a.irpClass.emoji} ${a.irp}/100 — ${a.irpClass.texto}</div></div>
        <div class="analise-ponto"><div class="analise-ponto-title">6. 🎯 IMPACTO META</div><div class="analise-ponto-info">Contribuição mensal: ~${UI.R(a.contribuicaoMensal)} | Tempo estimado: ${a.tempoVenda} dias</div></div>
        <div class="analise-ponto"><div class="analise-ponto-title">7. 📦 ESTOQUE</div><div class="analise-ponto-info">${a.estoqueStatus.emoji} ${a.estoqueAtual} produtos — ${a.estoqueStatus.texto}</div></div>
        ${a.hist ? `<div class="analise-ponto"><div class="analise-ponto-title">8. 📜 HISTÓRICO</div><div class="analise-ponto-info">${a.hist.vendas.length} vendas anteriores — Média dias: ${a.hist.mediaDias} — Média margem: ${a.hist.mediaMargem}%</div></div>` : `<div class="analise-ponto"><div class="analise-ponto-title">8. 📜 HISTÓRICO</div><div class="analise-ponto-info">Sem vendas anteriores deste modelo</div></div>`}
    `;

    document.getElementById('cp-confirmar').innerHTML = `
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarCompra()">🛒 Comprar</button>
        </div>`;
};

UI._confirmarCompra = function () {
    const nome = document.getElementById('cp-nome').value.trim();
    const custo = parseFloat(document.getElementById('cp-custo').value) || 0;
    const venda = parseFloat(document.getElementById('cp-venda').value) || 0;
    const condicao = document.getElementById('cp-condicao').value;

    // Detectar tipo
    let det = Calculators.detectarTipoProduto(nome);
    if (!det) {
        const manual = document.querySelector('input[name="tipo-manual"]:checked');
        const tipoVal = manual ? manual.value : 'celular';
        det = { tipo: tipoVal, estoque: tipoVal === 'acessorio' ? 'estoqueAcessorios' : tipoVal === 'equipamento' ? 'estoqueUsoLoja' : 'estoqueCelulares' };
    }

    if (det.estoque === 'estoqueAcessorios') {
        const novoId = Math.max(0, ...dataManager.data.estoqueAcessorios.map(p => p.id)) + 1;
        dataManager.data.estoqueAcessorios.push({ id: novoId, nome, custo, precoVenda: venda, tipo: 'acessorio', dataCompra: new Date().toISOString().split('T')[0], status: 'disponivel' });
        dataManager.data.financeiro.caixaAcessorios -= custo;
        dataManager.saveData();
        UI.toast('✅ Acessório adicionado!', 'success');
    } else if (det.estoque === 'estoqueUsoLoja') {
        dataManager.data.estoqueUsoLoja.push({ nome, custo, dataCompra: new Date().toISOString().split('T')[0] });
        dataManager.saveData();
        UI.toast('✅ Equipamento adicionado!', 'success');
    } else {
        const r = dataManager.comprarProduto({ nome, custo, precoVenda: venda, condicao, giro: 'medio', popularidade: 'medio', idadeModelo: 'medio' });
        if (r.sucesso) UI.toast(`✅ ${nome} comprado! Caixa: ${UI.R(r.caixaAtual)}`, 'success');
        else return UI.toast(r.erro, 'error');
    }
    UI.closeModal(); UI.render();
};

// === ANÁLISE DE COMPRA (genérico) ===
UI.modalAnalisarCompra = function (nome, custo, venda) {
    UI.modalComprarCelular();
    setTimeout(() => {
        try {
            const nomeEl = document.getElementById('cp-nome');
            if (nomeEl) nomeEl.value = nome;
            const custoEl = document.getElementById('cp-custo');
            if (custoEl) custoEl.value = custo;
            const vendaEl = document.getElementById('cp-venda');
            if (vendaEl) vendaEl.value = venda;
            UI._autoDetectarProduto();
            UI._analisarCompraModal();
        } catch (e) {
            UI.toast('Erro ao carregar. Tente novamente.', 'error');
        }
    }, 200);
};

// === VENDER PELÍCULA — Complemento 11 ===
UI.modalVenderPelicula = function () {
    const custos = dataManager.data.precoPelicula.custosReais;
    UI.openModal('📱 Vender Película', `
        <div class="form-group"><label class="form-label">Modelo do aparelho</label><input class="form-input" id="pel-modelo" placeholder="Ex: iPhone 12, Samsung A54" oninput="UI._calcPelicula()"></div>
        <div class="form-group"><label class="form-label">Tipo de película</label>
            <select class="form-select" id="pel-tipo-pelicula" onchange="UI._calcPelicula()">
                <option value="hd_hidrogel">HD Hidrogel (custo: ${UI.R(custos.hd_hidrogel)})</option>
                <option value="fosca">Fosca (custo: ${UI.R(custos.fosca)})</option>
            </select>
        </div>
        <div class="form-group"><label class="form-label">Tipo de aplicação</label>
            <select class="form-select" id="pel-tipo" onchange="UI._calcPelicula()">
                <option value="frontalHD">Frontal HD</option>
                <option value="frontalForca">Frontal Força</option>
                <option value="completa">Completa (frente + verso)</option>
            </select>
        </div>
        <div id="pel-resultado"></div>
    `);
};

UI._calcPelicula = function () {
    const modelo = document.getElementById('pel-modelo').value.trim();
    if (!modelo) return;
    const tipo = document.getElementById('pel-tipo').value;
    const tipoPelicula = document.getElementById('pel-tipo-pelicula').value;
    const precos = Calculators.getPrecosPelicula(modelo);
    const preco = precos[tipo] || precos.frontalHD;
    const custos = dataManager.data.precoPelicula.custosReais;
    const custo = custos[tipoPelicula] || custos.hd_hidrogel;
    const lucro = preco - custo;
    const margem = custo > 0 ? Math.round(lucro / custo * 100) : 0;

    document.getElementById('pel-resultado').innerHTML = `
        <div class="analise-ponto">
            <div class="analise-ponto-title">📊 ${modelo.toUpperCase()} — ${precos.categoria}</div>
            <div class="analise-ponto-info">Custo película: ${UI.R(custo)}</div>
            <div class="analise-ponto-info" style="font-weight:700;color:var(--accent-green)">Preço sugerido: ${UI.R(preco)}</div>
            <div class="analise-ponto-info">Lucro: ${UI.R(lucro)} (${margem}% de margem) 🔥</div>
        </div>
        <div class="form-group"><label class="form-label">Valor final (R$)</label><input class="form-input" id="pel-valor" type="number" step="0.01" value="${preco}" style="font-size:18px;font-weight:700"></div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarPelicula()">✅ Vender</button>
        </div>`;
};

UI._confirmarPelicula = function () {
    const modelo = document.getElementById('pel-modelo').value.trim();
    const tipo = document.getElementById('pel-tipo').value;
    const tipoPelicula = document.getElementById('pel-tipo-pelicula').value;
    const valor = parseFloat(document.getElementById('pel-valor').value) || 0;
    if (!modelo || !valor) return UI.toast('Preencha os campos', 'error');
    const r = dataManager.venderPelicula(modelo, tipo, valor, tipoPelicula);
    UI.toast(`✅ Película vendida! Lucro: ${UI.R(r.lucro)}`, 'success');
    UI.closeModal(); UI.render();
};

// === ACESSÓRIOS ===
UI.modalAdicionarAcessorio = function () {
    UI.openModal('📦 Adicionar Acessório', `
        <div class="form-group"><label class="form-label">Nome</label><input class="form-input" id="aa-nome" placeholder="Ex: Carregador USB-C"></div>
        <div class="form-row">
            <div class="form-group"><label class="form-label">Custo (R$)</label><input class="form-input" id="aa-custo" type="number" step="0.01"></div>
            <div class="form-group"><label class="form-label">Preço de venda (R$)</label><input class="form-input" id="aa-venda" type="number" step="0.01"></div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarAdicionarAcessorio()">✅ Adicionar</button>
        </div>
    `);
};

UI._confirmarAdicionarAcessorio = function () {
    const nome = document.getElementById('aa-nome').value.trim();
    const custo = parseFloat(document.getElementById('aa-custo').value) || 0;
    const venda = parseFloat(document.getElementById('aa-venda').value) || 0;
    if (!nome || !venda) return UI.toast('Preencha os campos', 'error');
    const novoId = Math.max(0, ...dataManager.data.estoqueAcessorios.map(p => p.id)) + 1;
    dataManager.data.estoqueAcessorios.push({ id: novoId, nome, custo, precoVenda: venda, tipo: 'acessorio', dataCompra: new Date().toISOString().split('T')[0], status: 'disponivel' });
    dataManager.saveData();
    UI.toast('✅ Acessório adicionado!', 'success');
    UI.closeModal(); UI.navigate('acessorios');
};

UI.modalVenderAcessorio = function (produtoId) {
    const prod = dataManager.data.estoqueAcessorios.find(p => p.id === produtoId);
    if (!prod) return;
    UI.openModal('💰 Vender ' + prod.nome, `
        <div class="analise-ponto"><div class="analise-ponto-info">Preço: ${UI.R(prod.precoVenda)} | Custo: ${UI.R(prod.custo)} | Lucro: ${UI.R(prod.precoVenda - prod.custo)}</div></div>
        <div class="form-group"><label class="form-label">Valor final (R$)</label><input class="form-input" id="va-valor" type="number" step="0.01" value="${prod.precoVenda}"></div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarVendaAcessorio(${produtoId})">✅ Vender</button>
        </div>
    `);
};

UI._confirmarVendaAcessorio = function (produtoId) {
    const valor = parseFloat(document.getElementById('va-valor').value) || 0;
    if (!valor) return UI.toast('Informe o valor', 'error');
    const r = dataManager.venderAcessorio(produtoId, valor);
    if (r.sucesso) { UI.toast(`✅ Vendido! Lucro: ${UI.R(r.lucro)}`, 'success'); UI.closeModal(); UI.navigate('acessorios'); }
};

// === ATUALIZAR PREÇOS ===
UI.modalAtualizarPrecos = function () {
    const celulares = dataManager.getEstoqueCelulares();
    UI.openModal('📊 Atualizar Preços de Mercado', `
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Pesquise no OLX, Mercado Livre e concorrentes locais. Informe a média.</p>
        ${celulares.map(p => `
            <div class="form-row" style="margin-bottom:8px;align-items:center">
                <div style="font-size:13px;font-weight:500">${p.nome}</div>
                <input class="form-input" id="preco-${p.id}" type="number" step="0.01" placeholder="Preço médio">
            </div>
        `).join('')}
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._salvarPrecos()">💾 Salvar</button>
        </div>
    `);
};

UI._salvarPrecos = function () {
    const celulares = dataManager.getEstoqueCelulares();
    let salvos = 0;
    celulares.forEach(p => {
        const input = document.getElementById(`preco-${p.id}`);
        const valor = parseFloat(input.value);
        if (valor > 0) { dataManager.atualizarPrecoMercado(p.nome, valor, 'pesquisa'); salvos++; }
    });
    UI.toast(`✅ ${salvos} preços atualizados!`, 'success');
    UI.closeModal();
};

// === IMPORTAR PREÇOS CSV — Complemento 10 ===
UI.modalImportarPrecos = function () {
    UI.openModal('📥 Importar Preços de Mercado', `
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Importe uma planilha CSV com preços de referência.</p>
        <div class="analise-ponto">
            <div class="analise-ponto-title">📋 Formato esperado</div>
            <div class="analise-ponto-info">Modelo | Preço Mínimo | Preço Máximo | Fonte</div>
            <div class="analise-ponto-info" style="font-style:italic">iPhone 11 64GB;2100;2400;OLX</div>
            <div class="analise-ponto-info" style="font-style:italic">Samsung A54;1400;1600;ML</div>
        </div>
        <div class="import-area" onclick="document.getElementById('csv-file').click()">
            <div style="font-size:36px">📄</div>
            <p style="margin-top:8px">Clique para escolher arquivo CSV</p>
            <input type="file" id="csv-file" accept=".csv,.txt" style="display:none" onchange="UI._lerCSV(event)">
        </div>
        <div id="csv-preview"></div>
        <div style="margin-top:16px">
            <button class="btn btn-ghost" onclick="UI._downloadTemplateCSV()">📥 Baixar template</button>
        </div>
    `);
};

UI._lerCSV = function (event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const r = dataManager.importarPrecosCSV(e.target.result);
        if (r.sucesso) {
            document.getElementById('csv-preview').innerHTML = `
                <div class="decisao-banner" style="background:rgba(0,217,126,0.1);border:2px solid var(--accent-green);color:var(--accent-green);font-size:16px">
                    ✅ ${r.importados} produtos importados!
                </div>
                ${r.resultados.map(p => `<div class="analise-ponto-info">${p.modelo}: ${UI.R(p.min)}-${UI.R(p.max)} (média ${UI.R(p.media)})</div>`).join('')}
            `;
        }
    };
    reader.readAsText(file);
};

UI._downloadTemplateCSV = function () {
    const csv = 'Modelo;Preco Minimo;Preco Maximo;Fonte\niPhone 11 64GB;2100;2400;OLX\niPhone 12 128GB;2600;2900;OLX\nSamsung A54;1400;1600;ML\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'precos_mercado_template.csv'; a.click();
    UI.toast('📥 Template baixado!', 'info');
};

// === INTEGRAÇÕES (TELEGRAM, GOOGLE DRIVE, EMAIL) ===
UI.modalConfigurarTelegram = function () {
    const config = dataManager.data.configIntegracoes || {};
    UI.openModal('✈️ Integração Bot do Telegram', `
        <div class="analise-ponto" style="margin-bottom:16px">
            <div class="analise-ponto-title">ℹ️ Como configurar em 2 minutos</div>
            <div class="analise-ponto-info">1. Abra o Telegram e procure por <strong>@BotFather</strong></div>
            <div class="analise-ponto-info">2. Envie o comando <code>/newbot</code> e siga as instruções para copiar o <strong>Token</strong>.</div>
            <div class="analise-ponto-info">3. Inicie conversa com seu bot e abra <strong>@userinfobot</strong> para ver seu <strong>Chat ID</strong>.</div>
        </div>

        <div class="form-group">
            <label class="form-label">Telegram Bot Token</label>
            <input class="form-input" id="cfg-telegram-token" placeholder="Ex: 123456789:ABCdefGHIjklmno..." value="${config.telegramToken || ''}">
        </div>

        <div class="form-group">
            <label class="form-label">Seu Chat ID (ou ID do Grupo)</label>
            <input class="form-input" id="cfg-telegram-chatid" placeholder="Ex: 987654321" value="${config.telegramChatId || ''}">
        </div>

        <div class="form-group">
            <label class="form-checkbox-label">
                <input type="checkbox" id="cfg-telegram-autodiario" ${config.telegramAutoDiario !== false ? 'checked' : ''}>
                <span>Enviar relatório automático no fechamento diário</span>
            </label>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="UI._salvarConfigTelegram()">💾 Salvar Configurações</button>
            <button class="btn btn-accent" onclick="Integrations.enviarTelegram()">✈️ Testar Envio Agora</button>
        </div>
    `);
};

UI._salvarConfigTelegram = function () {
    if (!dataManager.data.configIntegracoes) dataManager.data.configIntegracoes = {};
    dataManager.data.configIntegracoes.telegramToken = document.getElementById('cfg-telegram-token').value.trim();
    dataManager.data.configIntegracoes.telegramChatId = document.getElementById('cfg-telegram-chatid').value.trim();
    dataManager.data.configIntegracoes.telegramAutoDiario = document.getElementById('cfg-telegram-autodiario').checked;
    dataManager.saveData();
    UI.toast('✅ Configurações do Telegram salvas com sucesso!', 'success');
    UI.closeModal();
};

UI.exportarBackupGoogleDrive = function () {
    UI.modalConfigurarGoogleDrive();
};

UI.modalConfigurarGoogleDrive = function () {
    const config = dataManager.data.configIntegracoes || {};
    UI.openModal('📁 Backup Automático no Google Drive', `
        <div class="analise-ponto" style="margin-bottom:16px">
            <div class="analise-ponto-title">💡 Backup Instantâneo & Nuvem</div>
            <div class="analise-ponto-info">Você pode fazer o download do arquivo JSON de backup a qualquer momento com 1 clique ou conectar um Webhook do Google Apps Script.</div>
        </div>

        <div class="form-group">
            <label class="form-label">Google Apps Script Webhook URL (Opcional para Backup Automático)</label>
            <input class="form-input" id="cfg-drive-scripturl" placeholder="https://script.google.com/macros/s/..." value="${config.googleDriveScriptUrl || ''}">
        </div>

        <div class="form-group">
            <label class="form-checkbox-label">
                <input type="checkbox" id="cfg-drive-autodiario" ${config.driveAutoDiario !== false ? 'checked' : ''}>
                <span>Download/Backup automático no fechamento do dia</span>
            </label>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="UI._salvarConfigGoogleDrive()">💾 Salvar Configurações</button>
            <button class="btn btn-success" onclick="Integrations.fazerBackupGoogleDrive()">📁 Fazer Backup Agora</button>
        </div>
    `);
};

UI._salvarConfigGoogleDrive = function () {
    if (!dataManager.data.configIntegracoes) dataManager.data.configIntegracoes = {};
    dataManager.data.configIntegracoes.googleDriveScriptUrl = document.getElementById('cfg-drive-scripturl').value.trim();
    dataManager.data.configIntegracoes.driveAutoDiario = document.getElementById('cfg-drive-autodiario').checked;
    dataManager.saveData();
    UI.toast('✅ Configurações do Google Drive salvas!', 'success');
    UI.closeModal();
};

UI.modalConfigurarEmail = function () {
    const config = dataManager.data.configIntegracoes || {};
    UI.openModal('📧 Relatórios por E-mail', `
        <div class="analise-ponto" style="margin-bottom:16px">
            <div class="analise-ponto-title">ℹ️ Envio de Relatórios Executivos</div>
            <div class="analise-ponto-info">Receba o resumo financeiro, de vendas e estoque diretamente no seu e-mail.</div>
        </div>

        <div class="form-group">
            <label class="form-label">Seu E-mail de Destino</label>
            <input class="form-input" id="cfg-email-destino" type="email" placeholder="seu-email@gmail.com" value="${config.emailDestino || ''}">
        </div>

        <div class="form-group">
            <label class="form-label">URL Webhook / Google Script Email Relay (Opcional)</label>
            <input class="form-input" id="cfg-email-scripturl" placeholder="https://script.google.com/macros/s/..." value="${config.emailScriptUrl || ''}">
        </div>

        <div class="form-group">
            <label class="form-checkbox-label">
                <input type="checkbox" id="cfg-email-autodiario" ${config.emailAutoDiario !== false ? 'checked' : ''}>
                <span>Enviar e-mail automático diariamente</span>
            </label>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="UI._salvarConfigEmail()">💾 Salvar Configurações</button>
            <button class="btn btn-accent" onclick="Integrations.enviarEmailRelatorio()">📧 Enviar E-mail Agora</button>
        </div>
    `);
};

UI._salvarConfigEmail = function () {
    if (!dataManager.data.configIntegracoes) dataManager.data.configIntegracoes = {};
    dataManager.data.configIntegracoes.emailDestino = document.getElementById('cfg-email-destino').value.trim();
    dataManager.data.configIntegracoes.emailScriptUrl = document.getElementById('cfg-email-scripturl').value.trim();
    dataManager.data.configIntegracoes.emailAutoDiario = document.getElementById('cfg-email-autodiario').checked;
    dataManager.saveData();
    UI.toast('✅ Configurações de e-mail salvas com sucesso!', 'success');
    UI.closeModal();
};

UI.executarFechamentoSemanalManual = function () {
    const res = dataManager.fecharSemanaManualmente(false);
    if (res) {
        UI.toast('🚀 Reset & Fechamento Semanal de Estoque concluído com sucesso!', 'success');
        UI.openModal('📊 Resumo do Fechamento Semanal', `
            <div class="analise-ponto">
                <div class="analise-ponto-title">✅ Ciclo Semanal Concluído</div>
                <div class="analise-ponto-info">Total de Aparelhos em Estoque: <strong>${res.totalAparelhos}</strong></div>
                <div class="analise-ponto-info">Capital Travado (Custo): <strong>${UI.R(res.totalCustoEstoque)}</strong></div>
                <div class="analise-ponto-info">Potencial de Venda: <strong>${UI.R(res.totalVendaEstoque)}</strong></div>
                <div class="analise-ponto-info">Vendas na Semana: <strong>${UI.R(res.totalVendasSemana)}</strong></div>
                <div class="analise-ponto-info" style="color:var(--accent-green)">Lucro da Semana: <strong>${UI.R(res.lucroSemana)}</strong></div>
            </div>
            <div class="analise-ponto" style="margin-top:12px">
                <div class="analise-ponto-title">👨‍👩‍👧‍👦 Divisão Oficial dos Lucros</div>
                <div class="analise-ponto-info">🏦 40% Fundo da Loja: <strong>${UI.R(res.divisao.cotaLoja40)}</strong></div>
                <div class="analise-ponto-info">👩‍💼 35% Cota Mãe: <strong>${UI.R(res.divisao.cotaMaeExclusiva)}</strong></div>
                <div class="analise-ponto-info">👨‍💼 25% Cota Pai: <strong>${UI.R(res.divisao.cotaPai)}</strong></div>
            </div>
            <div style="margin-top:20px;text-align:right">
                <button class="btn btn-primary" onclick="UI.closeModal()">Entendido</button>
            </div>
        `);
    } else {
        UI.toast('Erro ao realizar o fechamento semanal', 'error');
    }
};

UI.modalIntegracoes = function () {
    UI.openModal('⚙️ Central de Integrações, Automações & Reset Semanal', `
        <div style="display:grid;grid-template-columns:1fr;gap:12px">
            <button class="btn btn-lg" onclick="UI.modalConfigurarTelegram()" style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid #38bdf8;justify-content:flex-start;">
                ✈️ Configurar Bot do Telegram
            </button>
            <button class="btn btn-lg" onclick="UI.modalConfigurarGoogleDrive()" style="background:rgba(59,130,246,0.15);color:#3b82f6;border:1px solid #3b82f6;justify-content:flex-start;">
                📁 Configurar Backup Google Drive
            </button>
            <button class="btn btn-lg" onclick="UI.modalConfigurarEmail()" style="background:rgba(168,85,247,0.15);color:#a855f7;border:1px solid #a855f7;justify-content:flex-start;">
                📧 Configurar Relatórios por E-mail
            </button>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0">
            <button class="btn btn-lg" onclick="UI.executarFechamentoSemanalManual()" style="background:rgba(0,255,163,0.15);color:#00FFA3;border:1px solid #00FFA3;justify-content:flex-start;">
                🔄 Executar Reset / Fechamento Semanal do Estoque
            </button>
        </div>
    `);
};
