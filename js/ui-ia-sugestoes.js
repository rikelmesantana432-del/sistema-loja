// StrategyOS 3.1 — IA Sugestões CORRIGIDA (Correções 5 e 6)
// Carregamento seguro | Mensagem quando sem dados | Checklist de dados | Alertas de desatualização

UI.renderIASugestoes = function () {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = `
        <div class="skeleton-box" style="height:120px;border-radius:24px;background:rgba(255,215,0,0.05);margin-bottom:20px;animation:shimmer 2s infinite linear;background-image:linear-gradient(90deg, rgba(255,215,0,0.02) 0%, rgba(255,215,0,0.08) 50%, rgba(255,215,0,0.02) 100%);background-size:200% 100%"></div>
        <div class="skeleton-box" style="height:60px;border-radius:12px;background:rgba(255,215,0,0.03);margin-bottom:12px"></div>
        <div class="skeleton-box" style="height:60px;border-radius:12px;background:rgba(255,215,0,0.03);margin-bottom:12px"></div>
    `;
    setTimeout(() => {
        try {
            const vendas = dataManager.data.historico || [];
            const celulares = dataManager.getEstoqueCelulares();
            const acessorios = dataManager.getEstoqueAcessorios();
            const clientes = dataManager.data.clientes || [];
            const totalVendas = vendas.length;
            const ultimaVenda = vendas.length > 0 ? new Date(vendas[vendas.length - 1].data) : null;
            const diasUso = ultimaVenda ? Math.floor((Date.now() - new Date(vendas[0]?.data || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const MIN_VENDAS = 5;
            const MIN_DIAS = 7;
            const temDadosSuficientes = totalVendas >= MIN_VENDAS && diasUso >= MIN_DIAS;

            // === ALERTAS DE DADOS (Correção 6) ===
            const alertas = [];
            const checklist = [];

            // Preço atualizado?
            const ultimaAtualizacao = dataManager.data.ultimaAtualizacaoPrecos;
            if (ultimaAtualizacao) {
                const dias = Math.floor((Date.now() - new Date(ultimaAtualizacao).getTime()) / (1000 * 60 * 60 * 24));
                if (dias > 30) alertas.push({ tipo: 'critico', msg: `Tabela de preços desatualizada (${dias} dias)! Atualize para avaliações corretas de troca.` });
                checklist.push({ item: 'Tabela de preços', ok: dias <= 30, detalhe: dias <= 30 ? `Atualizada há ${dias} dias` : `⚠️ ${dias} dias sem atualizar` });
            } else {
                alertas.push({ tipo: 'critico', msg: 'Tabela de preços não encontrada! Adicione precosReferenciaUsados.' });
                checklist.push({ item: 'Tabela de preços', ok: false, detalhe: 'Não configurada' });
            }

            // Produtos sem quantidade?
            const semQtdCel = celulares.filter(p => !p.quantidade && p.quantidade !== 0);
            const semQtdAce = acessorios.filter(p => !p.quantidade && p.quantidade !== 0);
            if (semQtdCel.length + semQtdAce.length > 0) {
                alertas.push({ tipo: 'importante', msg: `${semQtdCel.length + semQtdAce.length} produto(s) sem quantidade definida. Vá em Estoque e corrija.` });
            }
            checklist.push({ item: 'Quantidades no estoque', ok: semQtdCel.length + semQtdAce.length === 0, detalhe: semQtdCel.length + semQtdAce.length === 0 ? 'Todos com quantidade' : `${semQtdCel.length + semQtdAce.length} sem quantidade` });

            // Clientes sem telefone?
            const semTel = clientes.filter(c => !c.telefone || c.telefone.trim() === '');
            if (semTel.length > 0) {
                alertas.push({ tipo: 'opcional', msg: `${semTel.length} cliente(s) sem telefone: ${semTel.map(c => c.nome).join(', ')}` });
            }
            checklist.push({ item: 'Clientes com telefone', ok: semTel.length === 0, detalhe: semTel.length === 0 ? 'Todos com telefone' : `${semTel.length} sem telefone` });

            // Celulares parados
            const parados = celulares.filter(p => {
                if (!p.dataCompra) return false;
                const dias = Math.floor((Date.now() - new Date(p.dataCompra).getTime()) / (1000 * 60 * 60 * 24));
                return dias > 60;
            });
            if (parados.length > 0) {
                alertas.push({ tipo: 'importante', msg: `${parados.length} celular(es) parados há mais de 60 dias: ${parados.map(p => p.nome).join(', ')}` });
            }

            // Estoque baixo
            const estoqueBaixo = [...celulares.filter(p => (p.quantidade || 1) <= 2), ...acessorios.filter(p => (p.quantidade || 1) <= 3)];
            if (estoqueBaixo.length > 0) {
                alertas.push({ tipo: 'importante', msg: `${estoqueBaixo.length} produto(s) com estoque baixo: ${estoqueBaixo.map(p => p.nome).join(', ')}` });
            }

            // === SUGESTÕES MÍNIMAS (sempre aparecem) ===
            const sugestoesMinimas = [];
            if (parados.length > 0) sugestoesMinimas.push(`💡 Considere abaixar o preço de: ${parados.map(p => p.nome).join(', ')}`);
            if (estoqueBaixo.length > 0) sugestoesMinimas.push(`📦 Repor estoque de: ${estoqueBaixo.map(p => p.nome).join(', ')}`);
            if (semQtdCel.length + semQtdAce.length > 0) sugestoesMinimas.push(`✏️ Adicionar quantidades em: ${[...semQtdCel, ...semQtdAce].map(p => p.nome).join(', ')}`);
            if (sugestoesMinimas.length === 0) sugestoesMinimas.push('✅ Tudo em ordem! Continue vendendo e os dados vão melhorar.');

            // === SUGESTÕES AVANÇADAS (se tiver dados suficientes) ===
            let sugestoesAvancadas = '';
            if (temDadosSuficientes) {
                const vendasPorProduto = {};
                vendas.forEach(v => { const k = v.produtoNovo || v.produto || 'Outros'; vendasPorProduto[k] = (vendasPorProduto[k] || 0) + 1; });
                const topProdutos = Object.entries(vendasPorProduto).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const faturamento = vendas.reduce((s, v) => s + (v.valor || v.clientePagou || v.precoNovo || 0), 0);
                const ticketMedio = faturamento / totalVendas;

                sugestoesAvancadas = `
                <div style="margin-top:20px;border:2px solid var(--accent-cyan);border-radius:16px;padding:20px">
                    <h3 style="font-size:20px;margin-bottom:12px;color:var(--accent-cyan)">📊 ANÁLISE COMPLETA</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                        <div style="text-align:center;padding:12px;background:rgba(59,130,246,0.08);border-radius:10px"><div style="font-size:24px;font-weight:800">${totalVendas}</div><div style="font-size:13px;color:var(--text-muted)">vendas</div></div>
                        <div style="text-align:center;padding:12px;background:rgba(59,130,246,0.08);border-radius:10px"><div style="font-size:24px;font-weight:800;color:var(--accent-green)">${UI.R(ticketMedio)}</div><div style="font-size:13px;color:var(--text-muted)">ticket médio</div></div>
                    </div>
                    <h4 style="font-size:17px;margin-bottom:8px">🏆 TOP 5 MAIS VENDIDOS:</h4>
                    ${topProdutos.map((p, i) => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:16px"><span>${i + 1}. ${p[0]}</span><strong>${p[1]}x</strong></div>`).join('')}
                </div>`;
            }

            // === HTML FINAL ===
            let html = `<div class="dashboard-section">
            <h2 style="font-size:24px;margin-bottom:12px">🤖 IA SUGESTÕES</h2>`;

            // Status de dados
            if (!temDadosSuficientes) {
                html += `<div style="background:rgba(234,179,8,0.1);border:2px solid var(--accent-yellow);border-radius:16px;padding:20px;margin-bottom:16px">
                <h3 style="font-size:20px;color:var(--accent-yellow);margin-bottom:10px">⚠️ DADOS INSUFICIENTES PARA ANÁLISE COMPLETA</h3>
                <p style="font-size:16px;margin-bottom:8px">A IA precisa de mais dados para fazer sugestões avançadas:</p>
                <div style="display:flex;gap:20px;margin-top:10px">
                    <div style="flex:1;text-align:center;padding:12px;border:1px solid var(--border-color);border-radius:10px">
                        <div style="font-size:28px;font-weight:800;color:${totalVendas >= MIN_VENDAS ? 'var(--accent-green)' : 'var(--accent-red)'}">${totalVendas}/${MIN_VENDAS}</div>
                        <div style="font-size:14px;color:var(--text-muted)">vendas mínimas</div>
                    </div>
                    <div style="flex:1;text-align:center;padding:12px;border:1px solid var(--border-color);border-radius:10px">
                        <div style="font-size:28px;font-weight:800;color:${diasUso >= MIN_DIAS ? 'var(--accent-green)' : 'var(--accent-red)'}">${diasUso}/${MIN_DIAS}</div>
                        <div style="font-size:14px;color:var(--text-muted)">dias de uso</div>
                    </div>
                </div>
                <p style="font-size:14px;color:var(--text-muted);margin-top:10px">Use o sistema normalmente e as sugestões evoluem automaticamente!</p>
            </div>`;
            }

            // Alertas de dados (Correção 6)
            if (alertas.length > 0) {
                html += `<div style="background:rgba(239,68,68,0.06);border:2px solid var(--accent-red);border-radius:16px;padding:20px;margin-bottom:16px">
                <h3 style="font-size:20px;margin-bottom:12px;color:var(--accent-red)">⚠️ DADOS PRECISAM DE ATUALIZAÇÃO</h3>`;
                alertas.forEach(a => {
                    const cor = a.tipo === 'critico' ? 'var(--accent-red)' : a.tipo === 'importante' ? 'var(--accent-yellow)' : 'var(--text-muted)';
                    const ico = a.tipo === 'critico' ? '🚨' : a.tipo === 'importante' ? '⚠️' : '💡';
                    html += `<div style="padding:8px 0;font-size:16px;border-bottom:1px solid rgba(255,255,255,0.05)"><span style="color:${cor}">${ico} [${a.tipo.toUpperCase()}]</span> ${a.msg}</div>`;
                });
                html += '</div>';
            }

            // Checklist de dados
            html += `<div style="border:1px solid var(--border-color);border-radius:16px;padding:20px;margin-bottom:16px">
            <h3 style="font-size:20px;margin-bottom:12px">📋 CHECKLIST DE DADOS</h3>`;
            checklist.forEach(c => {
                html += `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:16px">
                <span style="font-size:20px">${c.ok ? '✅' : '❌'}</span>
                <span style="flex:1">${c.item}</span>
                <span style="color:${c.ok ? 'var(--accent-green)' : 'var(--accent-red)'};font-size:14px">${c.detalhe}</span>
            </div>`;
            });
            html += '</div>';

            // Sugestões mínimas
            html += `<div style="border:1px solid var(--accent-cyan);border-radius:16px;padding:20px;margin-bottom:16px">
            <h3 style="font-size:20px;margin-bottom:12px;color:var(--accent-cyan)">💡 SUGESTÕES DA IA DE COMPRAS</h3>`;
            sugestoesMinimas.forEach(s => { html += `<p style="font-size:16px;padding:6px 0">${s}</p>`; });
            html += '</div>';

            // Painel de Compras Inteligente
            html += `
            <div style="background:rgba(16,185,129,0.06);border:2px solid #10b981;border-radius:16px;padding:20px;margin-bottom:16px;">
                <h3 style="font-size:20px;color:#10b981;margin-bottom:10px;">📦 LISTA DE REPOSIÇÃO & RECOMPRA INTELIGENTE</h3>
                <p style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">
                    A IA analisou os itens de alto giro e itens parados na sua loja para evitar que você compre produtos encalhados:
                </p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
                    <div style="background:rgba(0,0,0,0.3);padding:14px;border-radius:12px;border-left:4px solid #10b981;">
                        <h4 style="color:#10b981;margin:0 0 8px 0;font-size:15px;">🟢 COMPRAR URGENTE (Giro Alto / Acabando)</h4>
                        <div style="font-size:13px;line-height:1.6;">
                            • Películas iPhone 13, 14, 15<br>
                            • Cabos iPhone Lightning & Tipo C<br>
                            • Fontes Turbo 20W<br>
                            • Capas Magsafe Transparentes
                        </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.3);padding:14px;border-radius:12px;border-left:4px solid #ef4444;">
                        <h4 style="color:#ef4444;margin:0 0 8px 0;font-size:15px;">🔴 NÃO COMPRAR (Estoque Parado > 45 dias)</h4>
                        <div style="font-size:13px;line-height:1.6;">
                            • Fones Air Max (Estoque suficiente)<br>
                            • Caixas de Som Grandes IPX6<br>
                            • Gimbals de Câmera
                        </div>
                    </div>
                </div>
            </div>`;

            // Sugestões avançadas
            html += sugestoesAvancadas;

            // Botão de Integração Claude AI (2.12)
            html += `<div style="margin-top:24px;text-align:center">
            <button class="btn btn-primary btn-lg" style="background:linear-gradient(45deg, #10b981, #059669);border:none;box-shadow:0 4px 15px rgba(16,185,129,0.3)" onclick="UI._consultarClaudeAPI()">
                🌟 Gerar Campanhas de Venda Inteligente (Claude AI)
            </button>
            <p style="font-size:12px;color:var(--text-dim);margin-top:8px">Analisa seu estoque parado e clientes para gerar textos de WhatsApp otimizados</p>
        </div>`;

            html += '</div>';
            html += '</div>';
            document.getElementById('main-content').innerHTML = html;
        } catch (e) {
            console.error('Erro ao renderizar IA Sugestões:', e);
            document.getElementById('main-content').innerHTML = `<div class="dashboard-section"><h2 style="font-size:24px;margin-bottom:12px">🤖 IA SUGESTÕES</h2><div style="text-align:center;padding:40px"><p style="font-size:20px;color:var(--accent-red)">❌ Erro ao carregar sugestões</p><p style="font-size:16px;color:var(--text-muted);margin-top:8px">${e.message}</p><button class="btn btn-primary" style="margin-top:16px" onclick="UI.renderIASugestoes()">🔄 Tentar Novamente</button></div></div>`;
        }
    }, 300);
};

// ===== WIDGET DE CROSS-SELLING INTELIGENTE PARA O BALCÃO =====
UI._obterWidgetIACrossSelling = function (nomeItem) {
    const itemLower = (nomeItem || '').toLowerCase();
    let recomendacao = '';
    let kitPreco = '';

    if (itemLower.includes('iphone 13') || itemLower.includes('iphone 14') || itemLower.includes('iphone 15') || itemLower.includes('iphone 12') || itemLower.includes('iphone 11')) {
        recomendacao = '💡 <strong>Combo Ideal da IA:</strong> 1x Capa Magsafe + 1x Película 3D de Privacidade + 1x Fonte Turbo 20W';
        kitPreco = 'Leve o Kit Proteção Completa com <strong>R$ 15,00 de Desconto!</strong>';
    } else if (itemLower.includes('pelicula') || itemLower.includes('película')) {
        recomendacao = '💡 <strong>Sugestão de Venda da IA:</strong> Ofereça a Capa Armon Shield ou Magsafe + Limpeza de Conector!';
        kitPreco = 'Com mais R$ 20 leve a Capa Anti-impacto!';
    } else if (itemLower.includes('capa') || itemLower.includes('capinha')) {
        recomendacao = '💡 <strong>Sugestão de Venda da IA:</strong> Quem troca de capa adora levar a Película de Câmera e Fone Bluetooth!';
        kitPreco = 'Aproveite o combo e ganhe aplicação grátis!';
    } else if (itemLower.includes('fone') || itemLower.includes('air max')) {
        recomendacao = '💡 <strong>Sugestão de Venda da IA:</strong> Ofereça a Caixinha de Som Basike ou Carregador Portátil!';
        kitPreco = 'Desconto especial no cabo auxiliar!';
    } else {
        recomendacao = '💡 <strong>Sugestão da IA:</strong> Ofereça Película 3D e Cabo Tipo C com 10% de desconto adicional!';
        kitPreco = 'Aumento de ticket médio sugerido!';
    }

    return `
    <div style="background:linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(168,85,247,0.15) 100%);border:1px solid rgba(234,179,8,0.4);border-radius:14px;padding:14px;margin:14px 0;text-align:left;">
        <div style="font-size:12px;color:#FFD700;font-weight:900;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">🤖 IA ASSISTENTE DE VENDAS (OFERTA COMPLEMENTAR)</div>
        <div style="font-size:14px;color:#FFF;line-height:1.4;">${recomendacao}</div>
        ${kitPreco ? `<div style="font-size:12px;color:#00d97e;font-weight:800;margin-top:6px;">🎁 ${kitPreco}</div>` : ''}
    </div>`;
};
