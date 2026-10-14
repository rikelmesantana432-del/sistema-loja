// ====================================
// STRATEGYOS 3.0 - SEÇÕES UI
// Clientes + Campanhas + Completo/Simples
// ====================================

// === CELULARES ===
UI.renderCelulares = function () {
    const celulares = dataManager.getEstoqueCelulares();
    const vendidos = dataManager.data.estoqueCelulares.filter(p => p.status === 'vendido');
    const isCompleto = UI.getModo() === 'completo';
    const totalCusto = celulares.reduce((s, p) => s + p.custo, 0);

    let html = `<h2 style="margin-bottom:4px">📱 Celulares em Estoque</h2>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${celulares.length} disponíveis${isCompleto ? ` — Custo total: ${UI.R(totalCusto)}` : ''}</p>
        <button class="btn btn-success btn-lg" onclick="UI.modalComprarCelular()" style="margin-bottom:16px">+ Comprar Celular</button>`;

    celulares.forEach(p => {
        const irp = Calculators.calcularIRP(p);
        const irpC = Calculators.classificarIRP(irp);
        const desc = Calculators.calcularDescontoTempo(p);
        const margem = p.custo > 0 ? Math.round((p.precoVenda - p.custo) / p.custo * 100) : 100;
        const badgeClass = irp <= 30 ? 'badge-green' : irp <= 60 ? 'badge-yellow' : 'badge-red';

        html += `<div class="product-card">
            <div class="product-header">
                <div>
                    <div class="product-name">${p.nome}</div>
                    <div class="product-info">${p.condicao} | ${desc.dias} dias${isCompleto ? ` | IRP: ${irp}` : ''}</div>
                </div>
                <div class="product-price">${UI.R(p.precoVenda)}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                <span class="product-badge ${badgeClass}">${irpC.emoji} ${irp <= 30 ? 'Rápido' : irp <= 60 ? 'Médio' : 'Lento'}</span>
                <span class="product-badge">${margem}% margem</span>
                ${desc.pctDesconto > 0 ? `<span class="product-badge badge-yellow">↓ ${desc.pctDesconto}% sugerido → ${UI.R(desc.novoPreco)}</span>` : ''}
                ${desc.acao === 'troca' ? `<span class="product-badge badge-red">🔴 Aceitar troca</span>` : ''}
            </div>
            ${isCompleto ? `<div class="product-info">Custo: ${UI.R(p.custo)} | Lucro: ${UI.R(p.precoVenda - p.custo)} | Margem nova: ${desc.novaMargem}%</div>` : ''}
            <div class="product-actions">
                <button class="btn btn-success btn-sm" onclick="UI.modalVenderCelular('${p.id}')">💰 Vender</button>
                <button class="btn btn-ghost btn-sm" onclick="UI.modalAnalisarCompra('${p.nome}',${p.custo},${p.precoVenda})">📊 Detalhes</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--accent-cyan)" onclick="UI._estoqueEditarCompleto('${p.id}','cel')">✏️ Editar</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="UI._estoqueRemoverProduto('${p.id}','cel')">🗑️ Excluir</button>
            </div>
        </div>`;
    });

    if (celulares.length === 0) html += '<p style="text-align:center;color:var(--text-muted);padding:30px">Nenhum celular no estoque</p>';
    document.getElementById('main-content').innerHTML = html;
};

// === ACESSÓRIOS ===
UI.renderAcessorios = function () {
    const acess = dataManager.getEstoqueAcessorios();
    const f = dataManager.data.financeiro;

    let html = `<h2 style="margin-bottom:4px">📦 Acessórios</h2>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">💡 Caixa separado — não impacta Meta Paraguai</p>
        <div class="dash-card" style="margin-bottom:16px;cursor:default;max-width:200px">
            <div class="dash-card-value">${UI.R(f.caixaAcessorios)}</div>
            <div class="dash-card-label">Caixa Acessórios</div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn btn-success" onclick="UI.modalAdicionarAcessorio()">+ Adicionar</button>
            <button class="btn btn-primary" onclick="UI.modalVenderPelicula()">📱 Vender Película</button>
        </div>`;

    acess.forEach(a => {
        html += `<div class="product-card">
            <div class="product-header">
                <div class="product-name">${a.nome}</div>
                <div class="product-price">${UI.R(a.precoVenda)}</div>
            </div>
            <div class="product-info">Custo: ${UI.R(a.custo)} | Lucro: ${UI.R(a.precoVenda - a.custo)}</div>
            <div class="product-actions">
                <button class="btn btn-success btn-sm" onclick="UI.modalVenderAcessorio('${a.id}')">💰 Vender</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--accent-cyan)" onclick="UI._estoqueEditarCompleto('${a.id}','acess')">✏️ Editar</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="UI._estoqueRemoverProduto('${a.id}','acess')">🗑️ Excluir</button>
            </div>
        </div>`;
    });

    if (acess.length === 0) html += '<p style="text-align:center;color:var(--text-muted);padding:20px">Nenhum acessório</p>';
    document.getElementById('main-content').innerHTML = html;
};

// === COBRANÇAS ===
UI.renderCobrancas = function () {
    const creds = dataManager.getCrediariosAtivos();
    const totalReceber = dataManager.calcularTotalAReceber();
    const atrasados = creds.filter(c => c.status !== 'em_dia');
    const isCompleto = UI.getModo() === 'completo';

    let html = `<h2 style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <span>💳 Cobranças</span>
            <button class="btn btn-primary btn-sm" onclick="UI.modalLembretesCobrancaHoje()" style="background:var(--accent-yellow);color:#000;font-weight:bold;padding:8px 14px;">🚀 Lembretes de Hoje</button>
        </h2>
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default">
                <div class="dash-card-value">${UI.R(totalReceber)}</div>
                <div class="dash-card-label">Total a receber</div>
            </div>
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default">
                <div class="dash-card-value" style="color:var(--accent-red)">${atrasados.length}</div>
                <div class="dash-card-label">Em atraso</div>
            </div>
        </div>`;

    creds.forEach(c => {
        const restante = c.valorTotal - (c.parcelasPagas * c.valorParcela);
        const statusEmoji = c.status === 'em_dia' ? '🟢' : c.status === 'atrasado' ? '🟡' : '🔴';
        const statusCor = c.status === 'em_dia' ? 'badge-green' : c.status === 'atrasado' ? 'badge-yellow' : 'badge-red';
        const score = dataManager.calcularScoreCliente(c.cliente);
        const scoreClass = Calculators.classificarScore(score);

        html += `<div class="cred-item">
            <div class="cred-header">
                <span class="cred-name">${statusEmoji} ${c.cliente}</span>
                <span class="cred-status ${statusCor}">${c.status === 'em_dia' ? 'Em dia' : c.status === 'atrasado' ? 'Atrasado' : 'Inadimplente'}</span>
            </div>
            <div class="cred-info">Score: ${scoreClass.emoji} ${score} | Parcela: ${c.parcelasPagas}/${c.parcelasTotal} × ${UI.R(c.valorParcela)}</div>
            <div class="cred-info">Resta: ${UI.R(restante)}${c.proximaParcela !== 'vencido' ? ` | Próxima: ${c.proximaParcela}` : ' | ⚠️ VENCIDO'}${c.diasAtraso > 0 ? ` | ${c.diasAtraso} dias atraso` : ''}</div>
            ${isCompleto ? `<div class="cred-info">Produto: ${c.produtoVendido || '—'} | Início: ${c.dataInicio}</div>` : ''}
            <div class="product-actions" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-success btn-sm" onclick="UI.modalReceberParcela('${c.id}')">💰 Receber</button>
                ${c.cliente ? `<button class="btn btn-primary btn-sm" onclick="UI._vendedorDispararLembreteWhatsApp('${c.id}')" style="background:#075e54;border:none;">💬 Cobrar</button>` : ''}
                ${c.cliente ? `<button class="btn btn-ghost btn-sm" onclick="UI.abrirFichaCliente('${c.cliente}')">👤 Ficha</button>` : ''}
            </div>
        </div>`;
    });

    if (creds.length === 0) html += '<p style="text-align:center;color:var(--text-muted);padding:30px">✅ Nenhum crediário ativo</p>';
    document.getElementById('main-content').innerHTML = html;
};

// === REGISTRAR — Complemento 7: sem crediário ===
UI.renderRegistrar = function () {
    document.getElementById('main-content').innerHTML = `
        <h2 style="margin-bottom:16px">📝 Registrar</h2>
        <div class="reg-cards">
            <div class="reg-card" onclick="UI.modalRegistrarVendaVista()">
                <div class="reg-card-icon">💵</div>
                <div class="reg-card-title">Venda à Vista</div>
            </div>
            <div class="reg-card" onclick="UI.modalRegistrarVendaParcelada()">
                <div class="reg-card-icon">💳</div>
                <div class="reg-card-title">Venda Parcelada / PIX</div>
            </div>
            <div class="reg-card" onclick="UI.modalVenderPelicula()">
                <div class="reg-card-icon">📱</div>
                <div class="reg-card-title">Película</div>
            </div>
            <div class="reg-card" onclick="UI.modalComprarCelular()">
                <div class="reg-card-icon">🛒</div>
                <div class="reg-card-title">Comprar Celular</div>
            </div>
            <div class="reg-card" onclick="UI.modalAtualizarPrecos()">
                <div class="reg-card-icon">📊</div>
                <div class="reg-card-title">Atualizar Preços</div>
            </div>
            <div class="reg-card" onclick="UI.modalImportarPrecos()">
                <div class="reg-card-icon">📥</div>
                <div class="reg-card-title">Importar Planilha</div>
            </div>
        </div>`;
};

// === HISTÓRICO ===
UI.renderHistorico = function () {
    const hist = dataManager.data.historico;
    const vendas = hist.vendas || [];
    const totalVendas = vendas.reduce((s, v) => s + (v.valorVenda || v.valorBruto || 0), 0);
    const totalLucro = vendas.reduce((s, v) => s + (v.lucro || 0), 0);

    let html = `<h2 style="margin-bottom:16px">📊 Histórico</h2>
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default">
                <div class="dash-card-value">${UI.R(totalVendas)}</div>
                <div class="dash-card-label">Total vendas</div>
            </div>
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default">
                <div class="dash-card-value" style="color:var(--accent-green)">${UI.R(totalLucro)}</div>
                <div class="dash-card-label">Lucro total</div>
            </div>
        </div>`;

    const todasMovs = hist.movimentacoes || [];
    movs.forEach(m => {
        const indiceReal = todasMovs.indexOf(m); // índice real no array original
        const positivo = m.valor >= 0;
        html += `<div class="history-item" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <div style="flex:1;min-width:0">
                <div style="font-weight:500;font-size:13px">${m.descricao}</div>
                <div style="font-size:11px;color:var(--text-dim)">${new Date(m.data).toLocaleDateString('pt-BR')}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
                <span class="history-value ${positivo ? 'positivo' : 'negativo'}">${positivo ? '+' : ''}${UI.R(m.valor)}</span>
                <button onclick="UI._deletarMovimentacao(${indiceReal})"
                    style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:15px;padding:4px;border-radius:4px;transition:color 0.2s"
                    onmouseover="this.style.color='var(--accent-red)'"
                    onmouseout="this.style.color='var(--text-dim)'"
                    title="Apagar esta movimentação">🗑️</button>
            </div>
        </div>`;
    });

    if (movs.length === 0) html += '<p style="text-align:center;color:var(--text-muted);padding:20px">Nenhuma movimentação</p>';

    html += `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="UI._exportarDados()">📤 Exportar</button>
        <button class="btn btn-ghost" onclick="UI._importarDados()">📥 Importar</button>
        <button class="btn btn-danger" onclick="UI._resetarDados()">🗑️ Resetar</button>
    </div>`;

    document.getElementById('main-content').innerHTML = html;
};

UI._deletarMovimentacao = function (indice) {
    const mov = dataManager.data.historico.movimentacoes[indice];
    if (!mov) return UI.toast('Movimentação não encontrada', 'error');

    const valorStr = UI.R(Math.abs(mov.valor || 0));
    const confirmMsg = `Apagar "${mov.descricao}" (${valorStr})?\n\nEsta ação REVERTERÁ os efeitos no caixa e estoque.`;
    if (!confirm(confirmMsg)) return;

    const meta = mov._meta || {};

    try {
        if (mov.tipo === 'venda') {
            const valEstorno = (mov.valor || 0);
            dataManager.data.financeiro.caixaPrincipal = Math.max(0, (dataManager.data.financeiro.caixaPrincipal || 0) - valEstorno);
            dataManager.data.financeiro.caixaSecundario = Math.max(0, (dataManager.data.financeiro.caixaSecundario || 0) - valEstorno);

            if (meta.produtoId && !meta.estoqueArray) {
                const prod = dataManager.data.estoqueCelulares.find(p => p.id === meta.produtoId);
                if (prod) prod.status = 'disponivel';
            }
            if (meta.produtoId && meta.estoqueArray === 'acessorios') {
                const prod = dataManager.data.estoqueAcessorios.find(p => p.id === meta.produtoId);
                if (prod) prod.status = 'disponivel';
            }
            if (meta.crediarioId) {
                const cidx = dataManager.data.crediarios.findIndex(c => c.id === meta.crediarioId);
                if (cidx !== -1) dataManager.data.crediarios.splice(cidx, 1);
                if (meta.produtoId) {
                    const prod = dataManager.data.estoqueCelulares.find(p => p.id === meta.produtoId);
                    if (prod) prod.status = 'disponivel';
                }
            }
            const vidx = dataManager.data.historico.vendas.map(v => v.produto).lastIndexOf(meta.produtoNome || '');
            if (vidx !== -1) dataManager.data.historico.vendas.splice(vidx, 1);

        } else if (mov.tipo === 'compra') {
            dataManager.data.financeiro.caixaPrincipal += Math.abs(mov.valor || 0);
            if (meta.produtoId) {
                const pidx = dataManager.data.estoqueCelulares.findIndex(p => p.id === meta.produtoId);
                if (pidx !== -1) dataManager.data.estoqueCelulares.splice(pidx, 1);
            }

        } else if (mov.tipo === 'troca') {
            dataManager.data.financeiro.caixaPrincipal -= (mov.valor || 0);
            if (meta.eTroca && meta.produtoId) {
                const prod = dataManager.data.estoqueCelulares.find(p => p.id === meta.produtoId);
                if (prod) prod.status = 'disponivel';
            }

        } else if (mov.tipo === 'parcela') {
            dataManager.data.financeiro.caixaPrincipal -= (mov.valor || 0);
            if (meta.crediarioId) {
                const cred = dataManager.data.crediarios.find(c => c.id === meta.crediarioId);
                if (cred && cred.parcelasPagas > 0) {
                    cred.parcelasPagas--;
                    if (cred.status === 'quitado') cred.status = 'em_dia';
                    if (cred.historicoPagamentos && cred.historicoPagamentos.length > 0) {
                        cred.historicoPagamentos.pop();
                    }
                }
            }

        } else if (mov.tipo === 'conserto') {
            dataManager.data.financeiro.caixaAssistencia -= (mov.valor || 0);
            if (meta.osNumero) {
                const os = dataManager.data.assistencia.ordensServico.find(o => o.numero === meta.osNumero);
                if (os) {
                    os.status = 'pronto';
                    os.restante = (os.restante || 0) + (meta.valorPago || 0);
                    os.pago = Math.max(0, (os.pago || 0) - (meta.valorPago || 0));
                    os.dataEntrega = null;
                }
            }

        } else if (mov.tipo === 'despesa') {
            const caixaDespKey = meta.caixa === 'acessorios' ? 'caixaAcessorios' : meta.caixa === 'assistencia' ? 'caixaAssistencia' : 'caixaPrincipal';
            dataManager.data.financeiro[caixaDespKey] += Math.abs(mov.valor || 0);

        } else if (mov.tipo === 'os') {
            if (mov.valor > 0) dataManager.data.financeiro.caixaAssistencia -= (mov.valor || 0);
        }
    } catch (e) {
        console.warn('Erro ao reverter efeitos:', e);
    }

    dataManager.data.historico.movimentacoes.splice(indice, 1);
    dataManager.saveData();
    UI.navigate('historico');
    UI.toast('↩️ Movimentação revertida e removida do histórico', 'success');
};

UI._exportarDados = function () {
    const json = dataManager.exportarDados();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `strategyos_backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
    UI.toast('📤 Backup exportado!', 'success');
};

UI._importarDados = function () {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader(); reader.onload = ev => {
            try { dataManager.importarDados(ev.target.result); UI.toast('✅ Dados importados!', 'success'); UI.render(); }
            catch (err) { UI.toast('❌ Erro ao importar', 'error'); }
        }; reader.readAsText(file);
    }; input.click();
};

UI._resetarDados = function () {
    UI.openModal('⚠️ Resetar Dados', `
        <p style="margin-bottom:16px">Tem certeza? <strong>Todos os dados serão apagados</strong> e o sistema voltará ao estado de fábrica — com estoque, caixa e clientes originais.</p>
        <div style="background:var(--bg-input);border-radius:8px;overflow:hidden;margin-bottom:8px;height:6px">
            <div id="reset-bar" style="height:6px;background:var(--accent-red);width:100%;transition:width 3s linear;border-radius:8px"></div>
        </div>
        <p style="text-align:center;color:var(--text-muted);font-size:13px;margin-bottom:16px">
            Aguarde <span id="reset-num">3</span>s...
        </p>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI._cancelarReset()">Cancelar</button>
            <button class="btn btn-danger" id="btn-reset-ok" disabled style="opacity:0.4">🗑️ Confirmar Reset</button>
        </div>
    `);

    setTimeout(() => {
        const bar = document.getElementById('reset-bar');
        if (bar) bar.style.width = '0%';
    }, 50);

    let s = 3;
    UI._resetTimer = setInterval(() => {
        s--;
        const num = document.getElementById('reset-num');
        if (num) num.textContent = s;
        if (s <= 0) {
            clearInterval(UI._resetTimer);
            const btn = document.getElementById('btn-reset-ok');
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.onclick = function () {
                    clearInterval(UI._resetTimer);
                    dataManager.resetarDados();
                    UI.toast('✅ Sistema resetado para os dados de fábrica!', 'success');
                    UI.closeModal();
                    setTimeout(() => location.reload(), 600);
                };
            }
        }
    }, 1000);
};

UI._cancelarReset = function () {
    if (UI._resetTimer) clearInterval(UI._resetTimer);
    UI.closeModal();
};

// === CÁLCULO E GESTÃO DE CLIENTES INATIVOS (+30 DIAS) ===
UI._obterDadosInatividadeClientes = function () {
    const clientes = dataManager.getClientes() || [];
    const vendas = dataManager.data.historico?.vendas || [];
    const movs = dataManager.data.movimentacoesCaixa || [];
    const oss = dataManager.data.assistencia?.ordensServico || [];
    const agora = new Date();

    return clientes.map(c => {
        const nomeLower = (c.nome || '').toLowerCase().trim();
        let ultimaData = c.dataCadastro ? new Date(c.dataCadastro) : null;
        let ultimoProduto = 'Cadastro Inicial';
        let ultimoValor = 0;

        vendas.forEach(v => {
            if ((v.cliente || '').toLowerCase().trim() === nomeLower && v.data) {
                const d = new Date(v.data);
                if (!ultimaData || d > ultimaData) {
                    ultimaData = d;
                    ultimoProduto = v.produto || 'Compra no Balcão';
                    ultimoValor = parseFloat(v.valorVenda || v.valor || 0);
                }
            }
        });

        movs.forEach(m => {
            if ((m.cliente || '').toLowerCase().trim() === nomeLower && m.data && m.tipo !== 'despesa') {
                const d = new Date(m.data);
                if (!ultimaData || d > ultimaData) {
                    ultimaData = d;
                    ultimoProduto = m.descricao || 'Atendimento Loja';
                    ultimoValor = parseFloat(m.valor || 0);
                }
            }
        });

        oss.forEach(o => {
            if ((o.cliente || '').toLowerCase().trim() === nomeLower && (o.dataEntrada || o.data)) {
                const d = new Date(o.dataEntrada || o.data);
                if (!ultimaData || d > ultimaData) {
                    ultimaData = d;
                    ultimoProduto = `Conserto OS #${o.numero || ''} (${o.modelo || ''})`;
                    ultimoValor = parseFloat(o.valor || 0);
                }
            }
        });

        const diasSemComprar = ultimaData ? Math.floor((agora.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        const isInativo30Dias = diasSemComprar >= 30;

        return {
            ...c,
            ultimaDataStr: ultimaData ? ultimaData.toISOString().substring(0, 10) : 'Sem registro',
            diasSemComprar,
            isInativo30Dias,
            ultimoProduto,
            ultimoValor
        };
    });
};

UI._enviarMensagemReativacaoCliente = function (nome, telefone, dias) {
    const primeiroNome = (nome || '').split(' ')[0];
    const telLimpo = (telefone || '').replace(/\D/g, '');
    const diasTexto = dias >= 900 ? 'bastante tempo' : `${dias} dias`;
    const msg = `Olá, ${primeiroNome}! Tudo bem com você? 😊\n\nSentimos sua falta aqui na *Cesinha Acessórios*! Faz ${diasTexto} que não te vemos por aqui. 🛒✨\n\nPassando para te desejar uma ótima semana e avisar que chegaram novidades incríveis em capas, películas de alta resistência, carregadores rápidos e acessórios com condições especiais exclusivas para você!\n\nQuando puder, venha tomar um café conosco ou nos chame aqui. Abraços da equipe Cesinha Acessórios! 🚀📱`;

    if (!telLimpo || telLimpo.length < 8) {
        if (navigator.clipboard) navigator.clipboard.writeText(msg);
        return UI.toast('📋 Mensagem copiada! (Cliente sem telefone válido)', 'info');
    }

    const telCompleto = telLimpo.length <= 11 ? `55${telLimpo}` : telLimpo;
    const url = `https://api.whatsapp.com/send?phone=${telCompleto}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

UI._copiarMensagemReativacaoCliente = function (nome, dias) {
    const primeiroNome = (nome || '').split(' ')[0];
    const diasTexto = dias >= 900 ? 'bastante tempo' : `${dias} dias`;
    const msg = `Olá, ${primeiroNome}! Tudo bem com você? 😊\n\nSentimos sua falta aqui na *Cesinha Acessórios*! Faz ${diasTexto} que não te vemos por aqui. 🛒✨\n\nPassando para te desejar uma ótima semana e avisar que chegaram novidades incríveis em capas, películas de alta resistência, carregadores rápidos e acessórios com condições especiais exclusivas para você!\n\nQuando puder, venha tomar um café conosco ou nos chame aqui. Abraços da equipe Cesinha Acessórios! 🚀📱`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(msg);
        UI.toast('📋 Mensagem de reativação copiada para a área de transferência!', 'success');
    }
};

// === CLIENTES — Complemento 4 ===
UI.renderClientes = function () {
    const clientesCompletos = UI._obterDadosInatividadeClientes();
    const credAtivos = dataManager.getCrediariosAtivos() || [];
    const inadimplentes = clientesCompletos.filter(c => c.score < 400);
    const inativos30Dias = clientesCompletos.filter(c => c.isInativo30Dias);

    const hojeStr = new Date().toISOString().substring(0, 10);
    const clientesHoje = clientesCompletos.filter(c => (c.dataCadastro || '').startsWith(hojeStr));

    let html = `
    <div style="max-width:1100px;margin:0 auto;padding:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <div>
                <h2 style="margin:0;font-size:26px;color:#FFD700;">👥 GESTÃO DE CLIENTES & ATENDIMENTOS</h2>
                <p style="margin:4px 0 0;font-size:13px;color:var(--text-muted);">Busca rápida, reativação de clientes inativos (+30 dias) e disparo no WhatsApp</p>
            </div>
            <button class="btn btn-success btn-lg" onclick="UI.modalNovoCliente()">+ Novo Cliente</button>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
            <div class="dash-card" style="flex:1;min-width:110px;cursor:default"><div class="dash-card-value">${clientesCompletos.length}</div><div class="dash-card-label">Total Cadastrados</div></div>
            <div class="dash-card" style="flex:1;min-width:110px;cursor:pointer;border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.08);" onclick="UI._setFiltroDataCliente('inativos')">
                <div class="dash-card-value" style="color:#f59e0b;">${inativos30Dias.length}</div>
                <div class="dash-card-label" style="color:#f59e0b;font-weight:bold;">⚠️ Inativos (+30 dias)</div>
            </div>
            <div class="dash-card" style="flex:1;min-width:110px;cursor:default"><div class="dash-card-value" style="color:#00FFA3;">${clientesHoje.length}</div><div class="dash-card-label">Cadastrados Hoje</div></div>
            <div class="dash-card" style="flex:1;min-width:110px;cursor:default"><div class="dash-card-value">${credAtivos.length}</div><div class="dash-card-label">Com Crediário</div></div>
            <div class="dash-card" style="flex:1;min-width:110px;cursor:default"><div class="dash-card-value" style="color:var(--accent-red)">${inadimplentes.length}</div><div class="dash-card-label">Score Baixo</div></div>
        </div>

        <!-- BARRA DE PESQUISA AVANÇADA E FILTROS DE DATA -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:14px;padding:16px;margin-bottom:20px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:12px;">
                <div>
                    <label class="form-label" style="font-size:11px;color:var(--text-muted);">🔎 Pesquisar Cliente (Nome, Telefone, CPF):</label>
                    <input class="form-input" id="cl-busca-input" placeholder="Digite para filtrar instantaneamente..." oninput="UI._filtrarClientesLista()" style="font-size:15px;padding:10px;">
                </div>
                <div>
                    <label class="form-label" style="font-size:11px;color:var(--text-muted);">🗓️ Filtrar por Data de Atendimento/Cadastro:</label>
                    <input class="form-input" id="cl-data-input" type="date" onchange="UI._filtrarClientesLista()" style="font-size:15px;padding:10px;">
                </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <span style="font-size:12px;color:var(--text-muted);font-weight:700;">Atalhos de Período & CRM:</span>
                <button class="btn btn-sm" id="btn-filtro-inativos" style="background:#f59e0b;color:#000;font-weight:800;" onclick="UI._setFiltroDataCliente('inativos')">⏰ Inativos (+30 dias) (${inativos30Dias.length})</button>
                <button class="btn btn-sm btn-ghost" id="btn-filtro-hoje" onclick="UI._setFiltroDataCliente('hoje')">🗓️ Hoje (${clientesHoje.length})</button>
                <button class="btn btn-sm btn-ghost" id="btn-filtro-semana" onclick="UI._setFiltroDataCliente('semana')">📅 Esta Semana</button>
                <button class="btn btn-sm btn-ghost" id="btn-filtro-mes" onclick="UI._setFiltroDataCliente('mes')">📆 Este Mês</button>
                <button class="btn btn-sm btn-ghost" id="btn-filtro-todos" onclick="UI._setFiltroDataCliente('todos')">🔍 Todos os Clientes</button>
            </div>
        </div>

        <div id="clientes-lista-container">
            <!-- Renderizado dinamicamente via UI._filtrarClientesLista -->
        </div>
    </div>`;

    document.getElementById('main-content').innerHTML = html;
    setTimeout(() => UI._filtrarClientesLista('todos'), 50);
};

UI._setFiltroDataCliente = function (periodo) {
    const dataInput = document.getElementById('cl-data-input');
    const hoje = new Date().toISOString().substring(0, 10);
    
    // Atualizar visual dos botões
    ['inativos', 'hoje', 'semana', 'mes', 'todos'].forEach(p => {
        const btn = document.getElementById(`btn-filtro-${p}`);
        if (btn) {
            if (p === periodo) {
                btn.className = 'btn btn-sm';
                btn.style.background = p === 'inativos' ? '#f59e0b' : '#00FFA3';
                btn.style.color = '#000';
                btn.style.fontWeight = '800';
            } else {
                btn.className = 'btn btn-sm btn-ghost';
                btn.style.background = '';
                btn.style.color = '';
                btn.style.fontWeight = '';
            }
        }
    });

    if (periodo === 'hoje') {
        if (dataInput) dataInput.value = hoje;
    } else if (periodo === 'todos' || periodo === 'inativos') {
        if (dataInput) dataInput.value = '';
    }
    UI._filtrarClientesLista(periodo);
};

UI._filtrarClientesLista = function (periodoFix) {
    const clientes = UI._obterDadosInatividadeClientes();
    const busca = (document.getElementById('cl-busca-input')?.value || '').toLowerCase().trim();
    const dataFiltro = document.getElementById('cl-data-input')?.value || '';

    const agora = new Date();
    const hojeStr = agora.toISOString().substring(0, 10);

    const filtrados = clientes.filter(c => {
        const nomeMatch = (c.nome || '').toLowerCase().includes(busca);
        const telMatch = (c.telefone || '').includes(busca);
        const cpfMatch = (c.cpf || '').includes(busca);
        const matchBusca = !busca || nomeMatch || telMatch || cpfMatch;

        let matchData = true;
        const dtCad = (c.dataCadastro || '').substring(0, 10);

        if (periodoFix === 'inativos') {
            matchData = c.isInativo30Dias;
        } else if (periodoFix === 'semana') {
            const seteDiasAtras = new Date(agora);
            seteDiasAtras.setDate(agora.getDate() - 7);
            const dt7Str = seteDiasAtras.toISOString().substring(0, 10);
            matchData = dtCad >= dt7Str && dtCad <= hojeStr;
        } else if (periodoFix === 'mes') {
            const mesAtualStr = hojeStr.substring(0, 7);
            matchData = dtCad.startsWith(mesAtualStr);
        } else if (dataFiltro) {
            matchData = dtCad === dataFiltro;
        }

        return matchBusca && matchData;
    });

    const cont = document.getElementById('clientes-lista-container');
    if (!cont) return;

    if (filtrados.length === 0) {
        cont.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;font-size:15px;">Nenhum cliente encontrado para os filtros selecionados.</p>';
        return;
    }

    let html = '';
    // Se estiver filtrando inativos, ordenar pelos que estão há mais tempo sem comprar
    if (periodoFix === 'inativos') {
        filtrados.sort((a, b) => b.diasSemComprar - a.diasSemComprar);
    } else {
        filtrados.sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || ''));
    }

    filtrados.forEach(c => {
        const scoreClass = Calculators.classificarScore(c.score);
        const credsDoCliente = dataManager.buscarCrediarioPorCliente(c.nome);
        const temAtraso = credsDoCliente.some(cr => cr.status === 'inadimplente' || cr.status === 'atrasado');
        const statusEmoji = temAtraso ? '🔴 Parcela atrasada' : (c.score === 0 && !c.dataCadastro ? '🟢 Novo' : c.score >= 700 ? '🟢 Confiável' : c.score >= 400 ? '🟡 Regular' : '🟢 Novo');
        
        const badgeInativo = c.isInativo30Dias ? `
            <span style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid #f59e0b;font-size:12px;font-weight:800;padding:3px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
                ⏰ ${c.diasSemComprar >= 900 ? '+90 dias sem comprar' : `${c.diasSemComprar} dias sem comprar`}
            </span>
        ` : `
            <span style="background:rgba(0,255,163,0.1);color:#00FFA3;font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px;">
                🛍️ Ativo (${c.diasSemComprar}d)
            </span>
        `;

        html += `
        <div class="cliente-card" style="background:var(--card-bg);border:1px solid ${c.isInativo30Dias ? 'rgba(245,158,11,0.3)' : 'var(--border-color)'};border-radius:14px;padding:16px;margin-bottom:12px;">
            <div class="cliente-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
                <div style="flex:1;min-width:240px;" onclick="UI.abrirFichaCliente('${c.nome.replace(/'/g, "\\'")}')" style="cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span class="cliente-name" style="font-size:18px;font-weight:700;color:#FFF;">${c.nome}</span>
                        ${badgeInativo}
                    </div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
                        📞 <strong>${c.telefone || 'Sem telefone'}</strong> | 🆔 CPF: ${c.cpf || '—'} | 📅 Última compra/atend.: <strong>${c.ultimaDataStr}</strong>
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                        📦 Último item: <em>${c.ultimoProduto}</em> ${c.ultimoValor > 0 ? `(${UI.R(c.ultimoValor)})` : ''}
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <div class="cliente-score" style="color:${scoreClass.cor};font-size:15px;font-weight:800;">${scoreClass.emoji} Score: ${c.score}</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-sm" style="background:#25D366;color:#FFF;font-weight:800;font-size:13px;padding:6px 12px;border-radius:8px;display:flex;align-items:center;gap:4px;" onclick="UI._enviarMensagemReativacaoCliente('${c.nome.replace(/'/g, "\\'")}', '${c.telefone || ''}', ${c.diasSemComprar})">
                            📲 Chamar no Zap
                        </button>
                        <button class="btn btn-sm btn-ghost" title="Copiar mensagem personalizada" style="font-size:13px;padding:6px 10px;" onclick="UI._copiarMensagemReativacaoCliente('${c.nome.replace(/'/g, "\\'")}', ${c.diasSemComprar})">
                            📋 Copiar Texto
                        </button>
                        <button class="btn btn-sm btn-ghost" style="font-size:13px;padding:6px 10px;" onclick="UI.abrirFichaCliente('${c.nome.replace(/'/g, "\\'")}')">
                            🔍 Ficha
                        </button>
                    </div>
                </div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:8px;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px;display:flex;justify-content:space-between;align-items:center;">
                <span>${statusEmoji}</span>
                <span style="color:#00FFA3;font-size:11px;">✨ Toque em 'Chamar no Zap' para enviar convite e novidades personalizadas</span>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
};

UI.modalNovoCliente = function () {
    UI.openModal('👤 Novo Cliente', `
        <h4 style="font-size:13px;color:var(--accent-cyan);margin-bottom:10px">DADOS PRINCIPAIS</h4>
        <div class="form-float"><input class="form-input" id="cl-nome" placeholder=" "><label for="cl-nome">Nome completo *</label></div>
        <div class="form-row">
            <div class="form-float"><input class="form-input" id="cl-tel" placeholder=" "><label for="cl-tel">Telefone</label></div>
            <div class="form-float"><input class="form-input" id="cl-cpf" placeholder=" "><label for="cl-cpf">CPF</label></div>
        </div>
        <div class="form-float"><input class="form-input" id="cl-nasc" type="date"><label for="cl-nasc">Data de nascimento</label></div>

        <h4 style="font-size:13px;color:var(--accent-cyan);margin:16px 0 10px">ENDEREÇO</h4>
        <div class="form-float"><input class="form-input" id="cl-rua" placeholder=" "><label for="cl-rua">Rua</label></div>
        <div class="form-row">
            <div class="form-float"><input class="form-input" id="cl-num" placeholder=" "><label for="cl-num">Número</label></div>
            <div class="form-float"><input class="form-input" id="cl-bairro" placeholder=" "><label for="cl-bairro">Bairro</label></div>
        </div>
        <div class="form-row">
            <div class="form-float"><input class="form-input" id="cl-cidade" value="Amargosa" placeholder=" "><label for="cl-cidade">Cidade</label></div>
            <div class="form-float"><input class="form-input" id="cl-uf" value="BA" maxlength="2" placeholder=" "><label for="cl-uf">UF</label></div>
        </div>

        <h4 style="font-size:13px;color:var(--accent-cyan);margin:16px 0 10px">INFORMAÇÕES ADICIONAIS</h4>
        <div class="form-row">
            <div class="form-float"><input class="form-input" id="cl-email" type="email" placeholder=" "><label for="cl-email">E-mail</label></div>
            <div class="form-float"><input class="form-input" id="cl-insta" placeholder=" "><label for="cl-insta">Instagram (@usuario)</label></div>
        </div>
        <div class="form-group">
            <label class="form-label">Como conheceu a loja</label>
            <select class="form-select" id="cl-como"><option value="">Selecione</option><option>Indicação</option><option>Redes sociais</option><option>Passou na frente</option><option>Anúncio</option><option>Outro</option></select>
        </div>
        <div class="form-group"><label class="form-label">Observações</label><textarea class="form-textarea" id="cl-obs" placeholder="Ex: Gosta de iPhone, sempre paga em dia..."></textarea></div>

        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" onclick="UI._salvarCliente()">✅ Salvar</button>
        </div>
    `);
};

UI._salvarCliente = function () {
    const nome = document.getElementById('cl-nome').value.trim();
    if (!nome) return UI.toast('Informe o nome', 'error');
    const dados = {
        nome, telefone: document.getElementById('cl-tel').value.trim(),
        cpf: document.getElementById('cl-cpf').value.trim(),
        nascimento: document.getElementById('cl-nasc').value,
        endereco: {
            rua: document.getElementById('cl-rua').value.trim(),
            numero: document.getElementById('cl-num').value.trim(),
            bairro: document.getElementById('cl-bairro').value.trim(),
            cidade: document.getElementById('cl-cidade').value.trim(),
            uf: document.getElementById('cl-uf').value.trim().toUpperCase()
        },
        email: document.getElementById('cl-email').value.trim(),
        instagram: document.getElementById('cl-insta').value.trim(),
        comoConheceu: document.getElementById('cl-como').value,
        observacoes: document.getElementById('cl-obs').value.trim()
    };
    const r = dataManager.cadastrarCliente(dados);
    if (r.sucesso) { UI.toast('✅ Cliente cadastrado!', 'success'); UI.closeModal(); UI.navigate('clientes'); }
    else UI.toast(r.erro, 'error');
};

UI.abrirFichaCliente = function (nome) {
    const cl = dataManager.buscarCliente(nome);
    if (!cl) return UI.toast('Cliente não encontrado', 'error');
    const hist = dataManager.getHistoricoCliente(nome);
    const scoreClass = Calculators.classificarScore(cl.score);
    const credsAtivos = hist.crediarios.filter(c => c.status !== 'quitado');
    const credsQuit = hist.crediarios.filter(c => c.status === 'quitado');
    const credsInadim = hist.crediarios.filter(c => c.status === 'inadimplente' || c.status === 'atrasado');

    let html = `
        <div style="text-align:center;padding:16px 0;border-bottom:1px solid var(--border-color);margin-bottom:16px">
            <div style="font-size:36px">👤</div>
            <h3>${cl.nome}</h3>
            <p style="color:var(--text-muted);font-size:13px">${cl.telefone || '—'} | Desde: ${cl.dataCadastro}</p>
            <div style="font-size:20px;font-weight:700;color:${scoreClass.cor};margin-top:8px">${scoreClass.emoji} Score: ${cl.score}/1000</div>
        </div>

        ${cl.endereco && cl.endereco.rua ? `<div class="analise-ponto"><div class="analise-ponto-title">🏠 Endereço</div><div class="analise-ponto-info">${cl.endereco.rua}, ${cl.endereco.numero} — ${cl.endereco.bairro}<br>${cl.endereco.cidade}-${cl.endereco.uf}</div></div>` : ''}
        ${cl.email || cl.instagram ? `<div class="analise-ponto"><div class="analise-ponto-title">📧 Contato</div><div class="analise-ponto-info">${cl.email || ''} ${cl.instagram ? '| ' + cl.instagram : ''}</div></div>` : ''}

        <div class="analise-ponto">
            <div class="analise-ponto-title">📊 Histórico de Compras</div>
            <div class="analise-ponto-info">Total gasto: ${UI.R(hist.totalGasto)} | ${hist.vendas.length} compras</div>
            ${hist.vendas.slice(-5).reverse().map(v => `<div class="analise-ponto-info">${new Date(v.data).toLocaleDateString('pt-BR')} — ${v.produto} — ${UI.R(v.valorVenda || v.valorBruto || 0)} — ${v.tipo}</div>`).join('')}
        </div>

        <div class="analise-ponto">
            <div class="analise-ponto-title">💳 Crediários</div>
            <div class="analise-ponto-info">Ativos: ${credsAtivos.length} | Quitados: ${credsQuit.length} | Inadimplentes: ${credsInadim.length}</div>
            ${credsAtivos.length > 0 ? `<div class="analise-ponto-info" style="font-weight:700">Saldo devedor: ${UI.R(credsAtivos.reduce((s, c) => s + c.valorTotal - c.parcelasPagas * c.valorParcela, 0))}</div>` : ''}
        </div>

        ${hist.ordensServico.length > 0 ? `<div class="analise-ponto"><div class="analise-ponto-title">🔧 Assistências</div><div class="analise-ponto-info">${hist.ordensServico.length} serviços</div>${hist.ordensServico.slice(-3).map(o => `<div class="analise-ponto-info">${new Date(o.dataCriacao || '').toLocaleDateString('pt-BR') || ''} — ${o.servico} — ${o.modelo} — Total: ${UI.R(o.valorFinal || 0)} | Pago: ${UI.R(o.pago || 0)} | Falta: ${UI.R((o.valorFinal || 0) - (o.pago || 0))} — <em>${o.status}</em></div>`).join('')}</div>` : ''}

        ${cl.historico && cl.historico.length > 0 ? `<div class="analise-ponto"><div class="analise-ponto-title">📋 Orçamentos e Pontos</div>${cl.historico.slice(-5).reverse().map(h => {
        if (h.tipo === 'orcamento_troca') return `<div class="analise-ponto-info">🔄 Troca: ${h.produtoNovo} por ${h.celularUsado} — ${UI.R(h.clientePagaria || 0)} — <em>${h.status}</em> (${h.data})</div>`;
        if (h.tipo === 'orcamento_pelicula') return `<div class="analise-ponto-info">📱 Película: ${h.servico} (${h.modelo}) — ${UI.R(h.valor || 0)} — <em>${h.status}</em> (${h.data})</div>`;
        if (h.tipo === 'pelicula') return `<div class="analise-ponto-info">✅ Película: ${h.servico} (${h.modelo}) — ${UI.R(h.valor || 0)} (+${h.pontos || 0}pts) (${h.data})</div>`;
        return `<div class="analise-ponto-info">${h.tipo} — ${UI.R(h.valor || 0)} (${h.data || ''})</div>`;
    }).join('')}</div>` : ''}

        ${cl.observacoes ? `<div class="analise-ponto"><div class="analise-ponto-title">📝 Observações</div><div class="analise-ponto-info">${cl.observacoes}</div></div>` : ''}

        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
            <a href="https://wa.me/55${(cl.telefone || '').replace(/\D/g, '')}" target="_blank" class="btn btn-success" ${!cl.telefone ? 'style="display:none"' : ''}>📞 WhatsApp</a>
            <button class="btn btn-danger btn-sm" onclick="if(confirm('Excluir ${cl.nome}?')){dataManager.excluirCliente('${cl.nome}');UI.closeModal();UI.navigate('clientes');UI.toast('Excluído','info');}">🗑️</button>
        </div>`;
    UI.openModal(`👤 ${cl.nome}`, html);
};

// === CAMPANHAS — Complemento 5 ===
UI.renderCampanhas = function () {
    const analise = Calculators.analisarProntidaoCampanha();
    const f = dataManager.data.financeiro;
    const celulares = dataManager.getEstoqueCelulares();
    const isCompleto = UI.getModo() === 'completo';

    let html = `<h2 style="margin-bottom:4px">📢 Campanhas — IA de Tráfego Pago</h2>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Baseado no seu histórico e situação atual</p>`;

    // Status
    html += `<div class="analise-ponto">
        <div class="analise-ponto-title">📊 SITUAÇÃO ATUAL</div>
        <div class="analise-ponto-info">✅ Estoque: ${celulares.length} produtos (${UI.R(celulares.reduce((s, p) => s + p.custo, 0))})</div>
        <div class="analise-ponto-info">✅ Caixa livre: ${UI.R(f.caixaPrincipal)}</div>
    </div>`;

    // Decisão
    const cor = analise.pronto ? 'var(--accent-green)' : 'var(--accent-red)';
    html += `<div class="decisao-banner" style="background:${analise.pronto ? 'rgba(0,217,126,0.1)' : 'rgba(230,55,87,0.1)'};border:2px solid ${cor};color:${cor}">
        ${analise.pronto ? '✅ PRONTO PARA CAMPANHA' : '❌ NÃO FAZER CAMPANHA AGORA'}
    </div>`;

    // Checklist
    html += `<div class="analise-ponto">
        <div class="analise-ponto-title">📋 CHECKLIST (${analise.prontos}/${analise.total})</div>
        <ul class="campanha-checklist">`;
    analise.itens.forEach(i => {
        html += `<li class="${i.status ? 'ok' : 'pendente'}">
            ${i.status ? '✅' : '⬜'}
            ${i.label}
            ${!i.auto ? `<button class="btn btn-ghost btn-sm" style="margin-left:auto;font-size:11px" onclick="dataManager.atualizarChecklist('${i.key}',${!i.status});UI.navigate('campanhas');">${i.status ? 'Desmarcar' : 'Marcar'}</button>` : '<span style="margin-left:auto;font-size:11px;color:var(--text-dim)">auto</span>'}
        </li>`;
    });
    html += `</ul></div>`;

    if (isCompleto) {
        // Cenário hipotético
        const c = analise.cenarios;
        html += `<div class="cenario-card">
            <div class="analise-ponto-title">💰 CENÁRIO HIPOTÉTICO (investindo ${UI.R(c.investimento)})</div>
            <div class="analise-ponto-info">📊 Conversão: 2-3% | Leads: ${c.leadsEsperados.min}-${c.leadsEsperados.max}</div>
            <div class="analise-ponto-info">🛒 Vendas: ${c.vendasEsperadas.min}-${c.vendasEsperadas.max} aparelhos</div>
            <div class="analise-ponto-info">💵 Faturamento: ${UI.R(c.faturamento.min)}-${UI.R(c.faturamento.max)}</div>
            <div class="analise-ponto-info" style="font-weight:700;color:var(--accent-green)">💰 Lucro: ${UI.R(c.lucro.min)}-${UI.R(c.lucro.max)} | ROI: ${c.roi.min}x-${c.roi.max}x</div>
        </div>`;

        // Produtos sugeridos
        if (analise.produtosSugeridos.length > 0) {
            html += `<div class="analise-ponto">
                <div class="analise-ponto-title">📱 PRODUTOS PARA ANUNCIAR</div>
                ${analise.produtosSugeridos.map(p => {
                const m = p.custo > 0 ? Math.round((p.precoVenda - p.custo) / p.custo * 100) : 100;
                return `<div class="analise-ponto-info">${p.nome} — ${UI.R(p.precoVenda)} (margem ${m}%)</div>`;
            }).join('')}
            </div>`;
        }

        // Plano sugerido
        html += `<div class="analise-ponto">
            <div class="analise-ponto-title">💡 PLANO SUGERIDO</div>
            <div class="analise-ponto-info"><strong>Fase 1 — Preparação (2-3 meses):</strong> Acumular R$ 10k, contratar funcionário, 20+ aparelhos</div>
            <div class="analise-ponto-info"><strong>Fase 2 — Teste (R$ 300-500):</strong> Amargosa + 30km, iPhones R$ 1.500-2.500, 7 dias</div>
            <div class="analise-ponto-info"><strong>Fase 3 — Escalar:</strong> Budget R$ 1.000-1.500/mês, raio 50km, meta 5-8 vendas</div>
        </div>`;
    }

    // Histórico
    const campanhasHist = dataManager.data.campanhas.historico;
    if (campanhasHist.length > 0) {
        html += `<div class="analise-ponto">
            <div class="analise-ponto-title">📜 HISTÓRICO</div>
            ${campanhasHist.map(c => `<div class="analise-ponto-info">${c.data} — Investiu ${UI.R(c.investimento)} — ${c.vendas} vendas — ${c.resultado}</div>`).join('')}
        </div>`;
    }

    document.getElementById('main-content').innerHTML = html;
};
