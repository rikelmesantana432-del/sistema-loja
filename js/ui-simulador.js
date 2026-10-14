// ====================================
// STRATEGYOS 3.0 - SIMULADOR PREMIUM
// ====================================

const UISimulador = {
    render: function () {
        const title = '💳 Simulador de Parcelamento';

        let html = `
            <div class="page-section simulator-section">
                <div class="card p-4" style="text-align: center;">
                    <h2 style="color: #FFD700; margin-bottom: 20px;">${title}</h2>
                    
                    <div style="margin-bottom: 24px;">
                        <label class="form-label" style="display: block; text-align: left;">VALOR TOTAL DO SERVIÇO/PRODUTO (R$)</label>
                        <input type="number" id="simulador-valor" class="form-input" placeholder="0,00" style="font-size: 32px; text-align: center; font-weight: bold; height: 60px;" step="0.01">
                    </div>
                    
                    <hr style="border-color: rgba(255,215,0,0.2); margin: 24px 0;">
                    
                    <label class="form-label" style="display: block; text-align: left; margin-bottom: 12px;">PARCELAS:</label>
                    <div class="simulator-installments-grid" id="simulador-grid">
                        <!-- Gerado via JS -->
                    </div>
                    
                    <div id="simulador-resultado" style="display: none;"></div>
                </div>
            </div>
        `;

        UI.setContent(title, html);

        // Gerar grid de parcelas
        this.renderGrid();

        // Event listener para o input de valor
        document.getElementById('simulador-valor').addEventListener('input', () => {
            const btnAtivo = document.querySelector('.simulator-installment-btn.active');
            if (btnAtivo) {
                this.calcularSimulacao(btnAtivo.dataset.parcela, btnAtivo.dataset.nome);
            }
        });
    },

    renderGrid: function () {
        const grid = document.getElementById('simulador-grid');
        const opcoes = [
            { id: 'debito', nome: 'Débito' },
            { id: 'credito', nome: 'Crédito 1x' }
        ];

        for (let i = 2; i <= 18; i++) {
            opcoes.push({ id: `${i}x`, nome: `${i}x` });
        }

        let html = '';
        opcoes.forEach(op => {
            html += `<div class="simulator-installment-btn" data-parcela="${op.id}" data-nome="${op.nome}" onclick="UISimulador.selecionarParcela('${op.id}', '${op.nome}')">
                ${op.nome}
            </div>`;
        });

        grid.innerHTML = html;
    },

    selecionarParcela: function (id, nome) {
        // Remover classe active de todos
        document.querySelectorAll('.simulator-installment-btn').forEach(btn => btn.classList.remove('active'));
        // Adicionar active no clicado
        const btn = document.querySelector('.simulator-installment-btn[data-parcela="' + id + '"]');
        if (btn) btn.classList.add('active');

        this.calcularSimulacao(id, nome);
    },

    calcularSimulacao: function (parcelaId, parcelaNome) {
        const valorInput = document.getElementById('simulador-valor').value;
        const valorOriginal = parseFloat(valorInput);
        const resultadoDiv = document.getElementById('simulador-resultado');

        if (!valorInput || isNaN(valorOriginal) || valorOriginal <= 0) {
            resultadoDiv.style.display = 'none';
            return;
        }

        // Obter taxa (usando taxas normais da Tuoli)
        const taxas = UI.data.data.taxasCartao;
        const taxaPct = taxas[parcelaId] || 0;

        // MARKUP INVERSO: garante que você receba EXATAMENTE o valorOriginal líquido.
        // Fórmula: valorCliente = valorOriginal / (1 - taxaPct / 100)
        // A máquina desconta taxaPct% sobre valorCliente, sobrando exatamente valorOriginal.
        const valorCliente = taxaPct < 100 ? valorOriginal / (1 - taxaPct / 100) : valorOriginal;
        const valorJuros = valorCliente - valorOriginal;
        const recebimentoLiquido = valorOriginal; // EXATAMENTE o que você pediu

        let qtdParcelas = 1;
        if (parcelaId.includes('x')) {
            qtdParcelas = parseInt(parcelaId.replace('x', ''));
        }

        const valorPorParcela = valorCliente / qtdParcelas;

        let parcelasTexto = `${qtdParcelas}x de ${Utils.formatMoney(valorPorParcela)}`;
        if (parcelaId === 'debito') parcelasTexto = `Débito: ${Utils.formatMoney(valorCliente)}`;
        else if (parcelaId === 'credito') parcelasTexto = `Crédito 1x: ${Utils.formatMoney(valorCliente)}`;

        let html = `
            <div class= "simulator-result-card" >
                <h3 style="color: rgba(255,255,255,0.7); text-transform: uppercase;">SIMULAÇÃO PARA ${parcelaNome}</h3>
                
                <p style="margin-top: 20px; font-size: 16px;">Cliente paga:</p>
                <div class="huge-price">${parcelasTexto}</div>
                
                <hr style="border-color: rgba(255,215,0,0.2); margin: 20px 0;">
                
                <div style="text-align: left;">
                    <p style="color: rgba(255,255,255,0.8); margin-bottom: 5px; font-weight: 600;">RESUMO:</p>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Valor que você quer receber:</span> <span>${Utils.formatMoney(valorOriginal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #DC143C;">
                        <span>Taxa (${taxaPct.toFixed(2).replace('.', ',')}%):</span> <span>+ ${Utils.formatMoney(valorJuros)}</span>
                    </div>
                    <div style="border-bottom: 1px dashed rgba(255,255,255,0.2); margin: 8px 0;"></div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 16px; color: #FFD700;">
                        <span>Total a pagar pelo Cliente:</span> <span>${Utils.formatMoney(valorCliente)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-weight: bold; color: #50C878; font-size: 20px;">
                        <span>✅ Você recebe líquido:</span> <span style="font-weight: 900;">${Utils.formatMoney(recebimentoLiquido)}</span>
                    </div>
                    <p style="font-size: 12px; color: #50C878; text-align: right; margin-top: 4px; font-weight: 600;">(valor exato que você pediu - sem perda)</p>
                </div>
                <hr style="border-color: rgba(255,215,0,0.2); margin: 20px 0;">

            <div style="background: rgba(255,215,0,0.1); border-left: 3px solid #FFD700; padding: 10px; border-radius: 4px; text-align: left;">
                💡 Cliente paga ${Utils.formatMoney(valorJuros)} de juros
            </div>

            <div style="margin-top: 24px; display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-outline" onclick="document.getElementById('simulador-valor').value=''; document.getElementById('simulador-resultado').style.display='none'; document.querySelectorAll('.simulator-installment-btn').forEach(btn => btn.classList.remove('active'));">
                    🔄 Nova Simulação
                </button>
                <button class="btn btn-primary" onclick="UISimulador.copiarResultado()">
                    📋 Copiar
                </button>
            </div>
        </div>
        `;

        resultadoDiv.innerHTML = html;
        resultadoDiv.style.display = 'block';
        resultadoDiv.style.animation = 'fadeSlideUp 0.4s ease-out';
    },

    copiarResultado: function () {
        const btnAtivo = document.querySelector('.simulator-installment-btn.active');
        if (!btnAtivo) return;

        const valorInput = document.getElementById('simulador-valor').value;
        const valorOriginal = parseFloat(valorInput);
        const parcelaId = btnAtivo.dataset.parcela;
        const parcelaNome = btnAtivo.dataset.nome;
        const taxas = UI.data.data.taxasCartao;
        const taxaPct = taxas[parcelaId] || 0;

        const valorCliente = taxaPct < 100 ? valorOriginal / (1 - taxaPct / 100) : valorOriginal;
        const valorJuros = valorCliente - valorOriginal;

        let qtdParcelas = 1;
        if (parcelaId.includes('x')) {
            qtdParcelas = parseInt(parcelaId.replace('x', ''));
        }

        const valorPorParcela = valorCliente / qtdParcelas;

        let textoCopiar = `* Orçamento *\nValor do Produto: ${Utils.formatMoney(valorOriginal)}\n\n * Opção Parcelada(${parcelaNome}) *\nPagamento: ${qtdParcelas}x de ${Utils.formatMoney(valorPorParcela)} \nTotal: ${Utils.formatMoney(valorCliente)} `;
        if (parcelaId === 'debito' || parcelaId === 'credito') {
            textoCopiar = `* Orçamento *\nValor do Produto: ${Utils.formatMoney(valorOriginal)}\n\n * Opção ${parcelaNome}*\nPagamento: ${Utils.formatMoney(valorCliente)} `;
        }

        navigator.clipboard.writeText(textoCopiar).then(() => {
            UI.showToast('Copiado para a área de transferência!', 'success');
        });
    }
};

// Adicionar a rota 'simulador' à inicialização do UI
const originalUINavigate = UI.navigate;
UI.navigate = function (page) {
    if (page === 'simulador') {
        this.renderSidebar(); // Update active class
        const content = document.getElementById('main-content');
        content.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px" class="spin">⏳</div><p>Carregando Simulador...</p></div>';

        setTimeout(() => {
            UISimulador.render();
        }, 100);
        return;
    }
    originalUINavigate.call(UI, page);
};
