// ====================================
// STRATEGYOS 3.0 - CALCULADORES
// 11 Complementos Aplicados
// ====================================

const Calculators = {

    // === IRP (Índice de Risco de Parado) ===
    calcularIRP(produto) {
        const dias = dataManager.diasNoEstoque(produto);
        let irp = 0;
        if (produto.giro === 'baixo') irp += 25;
        else if (produto.giro === 'medio') irp += 10;
        if (produto.popularidade === 'baixo') irp += 20;
        else if (produto.popularidade === 'medio') irp += 10;
        if (produto.idadeModelo === 'defasado') irp += 20;
        else if (produto.idadeModelo === 'medio') irp += 8;
        const faixas = dataManager.data.faixasAmargosa;
        const isIphone = produto.nome.toLowerCase().includes('iphone');
        const faixa = isIphone ? faixas.iphone : faixas.android;
        if (produto.precoVenda > faixa.alto) irp += 20;
        else if (produto.precoVenda > faixa.medio) irp += 10;
        if (dias > 60) irp += 15;
        else if (dias > 30) irp += 8;
        return Math.min(100, irp);
    },

    classificarIRP(irp) {
        if (irp <= 30) return { emoji: '✅', texto: 'Vende rápido (7-20 dias)', cor: 'var(--accent-green)' };
        if (irp <= 60) return { emoji: '⚠️', texto: 'Venda média (30-45 dias)', cor: 'var(--accent-yellow)' };
        return { emoji: '🚨', texto: 'Pode travar (60+ dias)', cor: 'var(--accent-red)' };
    },

    // === ISF (Índice de Segurança Financeira) ===
    calcularISF() {
        const f = dataManager.data.financeiro || {};
        const fundo = dataManager.data.fundoCustoEstoque || {};
        const totalLiquidoDisponivel = (f.caixaSecundario || 0) + (f.caixaPrincipal || 0) + (f.caixaAssistencia || 0) + (fundo.saldoGuardado || 0);

        const sem = dataManager.getFechamentoSemanal ? dataManager.getFechamentoSemanal() : { lucroLiquidoReal: 290 };
        let score = 75; // Pontuação base saudável da loja

        // 1. Disponibilidade de Liquidez e Caixa Físico
        if (totalLiquidoDisponivel >= 500) score += 15;
        else if (totalLiquidoDisponivel >= 200) score += 10;

        // 2. Lucro da Semana e Fechamento
        if (sem.lucroLiquidoReal > 0) score += 10;

        // 3. Inadimplência de Crediário
        const atraso = dataManager.calcularCrediariosAtraso ? dataManager.calcularCrediariosAtraso() : 0;
        const totalReceber = dataManager.calcularTotalAReceber ? dataManager.calcularTotalAReceber() : 1;
        if (totalReceber > 0 && (atraso / totalReceber) > 0.5) score -= 15;
        else if (atraso === 0) score += 10;

        return Math.max(0, Math.min(100, score));
    },

    classificarISF(isf) {
        if (isf >= 70) return { emoji: '🟢', texto: 'Boa', cor: 'var(--accent-green)' };
        if (isf >= 40) return { emoji: '🟡', texto: 'Atenção', cor: 'var(--accent-yellow)' };
        return { emoji: '🔴', texto: 'Urgente', cor: 'var(--accent-red)' };
    },

    // === DESCONTO INTELIGENTE (TEMPO + MARGEM) — Complemento 6 ===
    calcularDescontoTempo(produto) {
        const dias = dataManager.diasNoEstoque(produto);
        const margem = produto.custo > 0 ? ((produto.precoVenda - produto.custo) / produto.custo * 100) : 100;
        let pctDesconto = 0;
        let motivo = '';
        let acao = '';

        if (dias < 15) {
            pctDesconto = 0; motivo = 'Manter preço'; acao = 'manter';
        } else if (dias <= 30) {
            if (margem > 35) { pctDesconto = 5; motivo = 'Tem folga (5%)'; }
            else if (margem >= 25) { pctDesconto = 3; motivo = 'Cuidado (3%)'; }
            else { pctDesconto = 0; motivo = 'Margem apertada'; }
            acao = 'baixar';
        } else if (dias <= 45) {
            if (margem > 40) { pctDesconto = 8; motivo = 'Urgente, tem margem (8%)'; }
            else if (margem >= 30) { pctDesconto = 5; motivo = 'Desconto moderado (5%)'; }
            else if (margem >= 20) { pctDesconto = 3; motivo = 'Desconto mínimo (3%)'; }
            else { pctDesconto = 0; motivo = 'Não pode descontar'; }
            acao = 'baixar';
        } else if (dias <= 60) {
            if (margem > 40) { pctDesconto = 10; motivo = 'Vender rápido (10%)'; }
            else if (margem >= 30) { pctDesconto = 7; motivo = 'Desconto forte (7%)'; }
            else if (margem >= 20) { pctDesconto = 4; motivo = 'Desconto leve (4%)'; }
            else { pctDesconto = 0; motivo = '⚠️ Considere troca'; acao = 'troca'; }
            acao = acao || 'baixar';
        } else {
            if (margem > 40) { pctDesconto = 15; motivo = 'Liquidar (15%)'; }
            else if (margem >= 30) { pctDesconto = 10; motivo = 'Desconto máximo (10%)'; }
            else if (margem >= 20) { pctDesconto = 5; motivo = 'Desconto leve (5%)'; }
            else { pctDesconto = 0; motivo = '🚨 Aceite troca ou venda no prejuízo'; acao = 'troca'; }
            acao = acao || 'liquidar';
        }

        const novoPreco = Math.round(produto.precoVenda * (1 - pctDesconto / 100) * 100) / 100;
        const novaMargem = produto.custo > 0 ? ((novoPreco - produto.custo) / produto.custo * 100) : 100;

        // Proteção: nunca menos que 15% de margem
        if (novaMargem < 15 && pctDesconto > 0) {
            const precoMinimo = Math.round(produto.custo * 1.15 * 100) / 100;
            return {
                dias, pctDesconto: 0, novoPreco: produto.precoVenda,
                margem: Math.round(margem), novaMargem: Math.round(margem),
                margemOk: margem >= 15, motivo: '⚠️ Desconto bloqueado (margem < 15%)',
                acao: margem < 20 ? 'troca' : 'manter', precoMinimo
            };
        }

        return {
            dias, pctDesconto, novoPreco, margem: Math.round(margem),
            novaMargem: Math.round(novaMargem), margemOk: novaMargem >= 15,
            motivo, acao: acao || 'manter'
        };
    },

    // === AUTODETECÇÃO DE TIPO DE PRODUTO — Complemento 2 ===
    detectarTipoProduto(nome) {
        const n = nome.toLowerCase();
        const celulares = ['iphone', 'samsung', 'galaxy', 'xiaomi', 'motorola', 'moto ', 'realme', 'poco', 'redmi', 'lg', 'asus', 'positivo', 'infinix', 'tecno'];
        const acessorios = ['carregador', 'cabo', 'capinha', 'película', 'pelicula', 'fone', 'suporte', 'power bank', 'powerbank', 'adaptador', 'relógio', 'relogio', 'smartwatch', 'pulseira', 'watch'];
        const equipamentos = ['caixa de som', 'jbl', 'harman', 'speaker', 'som bluetooth'];
        const tablets = ['tablet', 'ipad'];

        if (celulares.some(t => n.includes(t))) return { tipo: 'celular', estoque: 'estoqueCelulares', icone: '📱', label: 'Celular (para venda)' };
        if (tablets.some(t => n.includes(t))) return { tipo: 'tablet', estoque: 'estoqueCelulares', icone: '📱', label: 'Tablet (para venda)' };
        if (equipamentos.some(t => n.includes(t))) return { tipo: 'equipamento', estoque: 'estoqueUsoLoja', icone: '🏪', label: 'Equipamento da loja' };
        if (acessorios.some(t => n.includes(t))) return { tipo: 'acessorio', estoque: 'estoqueAcessorios', icone: '📦', label: 'Acessório (giro rápido)' };
        return null; // não reconhecido
    },

    // === ANÁLISE DE COMPRA PROFUNDA (8 PONTOS) ===
    analisarCompra(modelo, custo, precoVenda) {
        const f = dataManager.data.financeiro;
        const meta = dataManager.calcularProgressoMeta();
        const lucro = precoVenda - custo;
        const margem = custo > 0 ? (lucro / custo * 100) : 100;
        const isIphone = modelo.toLowerCase().includes('iphone');
        const faixas = dataManager.data.faixasAmargosa;
        const faixa = isIphone ? faixas.iphone : faixas.android;

        const aposCaixa = f.caixaPrincipal - custo;
        let capacidade;
        if (aposCaixa >= 1000) capacidade = { emoji: '✅', texto: 'Tem dinheiro', ok: true };
        else if (aposCaixa >= 300) capacidade = { emoji: '⚠️', texto: 'Ficará justo', ok: true };
        else capacidade = { emoji: '❌', texto: 'Não tem dinheiro', ok: false };

        const mercado = dataManager.buscarPrecoMercado(modelo);
        let precoMercado = { media: null, tendencia: 'desconhecido', classificacao: '🟡 Sem dados' };
        if (mercado) {
            const diff = precoVenda - mercado.mediaAtual;
            precoMercado = { media: mercado.mediaAtual, tendencia: mercado.tendencia };
            if (diff < -mercado.mediaAtual * 0.05) precoMercado.classificacao = '🟢 Competitivo (abaixo da média)';
            else if (diff <= mercado.mediaAtual * 0.05) precoMercado.classificacao = '🟡 Na média';
            else precoMercado.classificacao = '🔴 Acima da média';
        }

        let adequacao;
        if (precoVenda <= faixa.ideal) adequacao = { emoji: '✅', texto: 'IDEAL para Amargosa' };
        else if (precoVenda <= faixa.medio) adequacao = { emoji: '⚠️', texto: 'MÉDIO — vende, mas demora' };
        else adequacao = { emoji: '❌', texto: 'ALTO — risco de encalhar' };

        let margemClass;
        if (margem >= 40) margemClass = { emoji: '✅', texto: 'EXCELENTE' };
        else if (margem >= 30) margemClass = { emoji: '🟢', texto: 'BOA' };
        else if (margem >= 20) margemClass = { emoji: '🟡', texto: 'ACEITÁVEL' };
        else margemClass = { emoji: '❌', texto: 'RUIM' };

        const prodSimulado = { nome: modelo, precoVenda, custo, giro: precoVenda > 1500 ? 'baixo' : 'alto', popularidade: isIphone ? 'alto' : 'medio', idadeModelo: 'medio', dataCompra: new Date().toISOString().split('T')[0] };
        const irp = this.calcularIRP(prodSimulado);
        const irpClass = this.classificarIRP(irp);

        const tempoVenda = irp <= 30 ? 15 : irp <= 60 ? 37 : 75;
        const contribuicaoMensal = tempoVenda > 0 ? Math.round(lucro * (30 / tempoVenda)) : 0;
        const hist = dataManager.buscarHistoricoModelo(modelo);
        const celulares = dataManager.getEstoqueCelulares();
        const totalTravado = celulares.reduce((s, p) => s + p.custo, 0);
        let estoqueStatus;
        if (celulares.length <= 5) estoqueStatus = { emoji: '✅', texto: 'Pode comprar (estoque baixo)' };
        else if (celulares.length <= 10) estoqueStatus = { emoji: '⚠️', texto: 'Venda algo antes de comprar' };
        else estoqueStatus = { emoji: '❌', texto: 'Estoque cheio — NÃO compre' };

        let pontos = 0;
        if (capacidade.ok) pontos++;
        if (margem >= 25) pontos++;
        if (precoVenda <= faixa.medio) pontos++;
        if (irp <= 50) pontos++;
        if (celulares.length <= 8) pontos++;

        let decisao;
        if (pontos >= 4) decisao = { emoji: '✅', texto: 'COMPRAR', cor: 'var(--accent-green)' };
        else if (pontos >= 2) decisao = { emoji: '⚠️', texto: 'COMPRAR COM CAUTELA', cor: 'var(--accent-yellow)' };
        else decisao = { emoji: '❌', texto: 'NÃO COMPRAR', cor: 'var(--accent-red)' };

        return {
            modelo, custo, precoVenda, lucro, margem: Math.round(margem),
            capacidade, aposCaixa, precoMercado, adequacao, margemClass,
            irp, irpClass, tempoVenda, contribuicaoMensal, hist,
            estoqueAtual: celulares.length, totalTravado, estoqueStatus,
            decisao,
            maxSeguro: Math.round(precoVenda / 1.25),
            minRentavel: Math.round(custo * 1.20),
            precoIdeal: Math.round(custo * 1.35),
            meta
        };
    },

    // === PELÍCULA ===
    classificarAparelhoPelicula(modelo) {
        const m = modelo.toLowerCase();
        const top = ['iphone 15 pro', 'iphone 16', 'iphone 17', 's24 ultra', 's25'];
        if (top.some(t => m.includes(t))) return 'top';
        const premium = ['iphone', 's21', 's22', 's23', 's24', 'poco f'];
        if (premium.some(t => m.includes(t))) return 'premium';
        const basico = ['j2', 'j4', 'j5', 'j7', 'moto e', 'moto c', 'redmi 9a', 'redmi 8', 'a01', 'a02', 'a03'];
        if (basico.some(t => m.includes(t))) return 'basico';
        if (m.includes('tablet') || m.includes('ipad')) return 'tablet';
        if (m.includes('relogio') || m.includes('watch') || m.includes('smartwatch')) return 'relogio';
        return 'medio';
    },

    getPrecosPelicula(modelo) {
        const cat = this.classificarAparelhoPelicula(modelo);
        const pp = dataManager.data.precoPelicula;
        if (cat === 'tablet') return { categoria: 'Tablet', frontalHD: pp.tablet9, frontalForca: pp.tablet11, completa: null };
        if (cat === 'relogio') return { categoria: 'Relógio', frontalHD: pp.relogio_basico, frontalForca: pp.relogio_premium, completa: null };
        const precos = pp[cat] || pp.medio;
        return { categoria: cat, ...precos };
    },

    // === ORÇAMENTO SERVIÇO (modelo exato → fallback marca) ===
    detectarMarca(modelo) {
        const m = modelo.toLowerCase();
        if (m.includes('iphone') || m.includes('apple')) return 'iphone';
        if (m.includes('samsung') || m.includes('galaxy')) return 'samsung';
        if (m.includes('xiaomi') || m.includes('redmi') || m.includes('poco')) return 'xiaomi';
        if (m.includes('motorola') || m.includes('moto')) return 'motorola';
        return 'generico';
    },

    _normalizarModelo(modelo) {
        return modelo.toLowerCase()
            .replace(/\s+/g, ' ').trim()
            .replace('galaxy ', 'samsung ')
            .replace('xiaomi redmi', 'redmi')
            .replace('xiaomi poco', 'poco');
    },

    _buscarModeloExato(modelo) {
        const n = this._normalizarModelo(modelo);
        const tabela = dataManager.data.tabelaServicosModelo;
        // Busca exata
        if (tabela[n]) return tabela[n];
        // Busca parcial — encontra o modelo mais próximo
        for (const key in tabela) {
            if (n.includes(key) || key.includes(n)) return tabela[key];
        }
        return null;
    },

    _calcularPrecoConsertoEscalonado(custoPeca, custoMaoObra) {
        const custo = Number(custoPeca) || 0;
        const totalBase = custo + (Number(custoMaoObra) || 0);
        if (custo <= 0) {
            return {
                minimo: Math.max(Math.round(totalBase * 1.3), 30),
                ideal: Math.max(Math.round(totalBase * 1.5), 50),
                maximo: Math.max(Math.round(totalBase * 1.8), 60)
            };
        }
        if (custo <= 80) {
            return {
                minimo: Math.max(Math.ceil((custo * 2.0) / 10) * 10, 60),
                ideal: Math.max(Math.ceil((custo * 3.0) / 10) * 10, 80),
                maximo: Math.max(Math.ceil((custo * 3.2) / 10) * 10, 90)
            };
        }
        if (custo <= 200) {
            return {
                minimo: Math.ceil((custo * 1.5 + 20) / 10) * 10,
                ideal: Math.ceil((custo * 2.0 + 40) / 10) * 10,
                maximo: Math.ceil((custo * 2.2 + 50) / 10) * 10
            };
        }
        return {
            minimo: Math.ceil((custo * 1.3 + 30) / 10) * 10,
            ideal: Math.ceil((custo * 1.5 + 80) / 10) * 10,
            maximo: Math.ceil((custo * 1.7 + 90) / 10) * 10
        };
    },

    getOrcamentoServico(modelo, servico, qualidade = '1aLinha') {
        // 1. Tentar modelo exato
        const modeloExato = this._buscarModeloExato(modelo);
        let srvKey = servico;
        if (modeloExato && (modeloExato[srvKey] || modeloExato[servico] || modeloExato['tela'])) {
            const srv = modeloExato[srvKey] || modeloExato[servico] || modeloExato['tela'];
            const total = srv.p + srv.m;
            const faixas = this._calcularPrecoConsertoEscalonado(srv.p, srv.m);
            return {
                fonte: 'modelo', marca: this.detectarMarca(modelo), servico, qualidade,
                custoPeca: srv.p, maoObra: srv.m, total, prazo: srv.d,
                minimo: faixas.minimo,
                ideal: faixas.ideal,
                maximo: faixas.maximo
            };
        }
        // 2. Fallback: tabela genérica por marca
        const marca = this.detectarMarca(modelo);
        const tabelaMarca = dataManager.data.tabelaServicosMarca[marca] || dataManager.data.tabelaServicosMarca.generico;
        const srv = tabelaMarca[servico];
        if (!srv) return null;
        const total = srv.p + srv.m;
        const faixas = this._calcularPrecoConsertoEscalonado(srv.p, srv.m);
        return {
            fonte: 'marca', marca, servico, qualidade,
            custoPeca: srv.p, maoObra: srv.m, total, prazo: srv.d,
            minimo: faixas.minimo,
            ideal: faixas.ideal,
            maximo: faixas.maximo
        };
    },

    // === TAXA MÁQUINA + PIX ===
    calcularTaxaMaquina(valor, parcelas, bandeira = 'normal') {
        let taxa;
        if (bandeira === 'pix') {
            taxa = dataManager.data.taxasCartao.pix;
        } else {
            const chave = parcelas === 0 ? 'debito' : parcelas === 1 ? 'credito' : `${parcelas}x`;
            const chaveElo = bandeira === 'elo' ? chave + '_elo' : chave;
            taxa = dataManager.data.taxasCartao[chaveElo] || dataManager.data.taxasCartao[chave] || 0;
        }
        const desconto = valor * (taxa / 100);
        const liquido = valor - desconto;
        return { taxa, desconto: Math.round(desconto * 100) / 100, liquido: Math.round(liquido * 100) / 100 };
    },

    // === SCORE CLIENTE ===
    classificarScore(score) {
        if (score >= 700) return { emoji: '🟢', texto: 'BOM', cor: 'var(--accent-green)' };
        if (score >= 400) return { emoji: '🟡', texto: 'MÉDIO', cor: 'var(--accent-yellow)' };
        return { emoji: '🔴', texto: 'ARRISCADO', cor: 'var(--accent-red)' };
    },

    recomendarCrediario(score, valor) {
        if (score < 300) return { aprovar: false, emoji: '❌', texto: 'RECUSAR — Score muito baixo' };
        if (score < 500 && valor > 1000) return { aprovar: false, emoji: '⚠️', texto: 'CAUTELA — Valor alto para score médio' };
        if (score >= 600) return { aprovar: true, emoji: '✅', texto: 'APROVAR' };
        return { aprovar: true, emoji: '⚠️', texto: 'CAUTELA — Limite as parcelas' };
    },

    // === CAMPANHAS IA — Complemento 5 ===
    analisarProntidaoCampanha() {
        const f = dataManager.data.financeiro;
        const celulares = dataManager.getEstoqueCelulares();
        const totalEstoque = celulares.reduce((s, p) => s + p.custo, 0);
        const checklist = dataManager.data.campanhas.checklist;

        const itens = [
            { key: 'funcionario', label: 'Contratar funcionário (atendimento presencial + online)', status: checklist.funcionario, auto: false },
            { key: 'estoque15k', label: 'Estoque de pelo menos R$ 15.000 (20+ aparelhos)', status: totalEstoque >= 15000 && celulares.length >= 20, auto: true },
            { key: 'caixa5k', label: 'R$ 5.000 em caixa livre (segurança)', status: f.caixaPrincipal >= 5000, auto: true },
            { key: 'whatsappAuto', label: 'Sistema de respostas automáticas no WhatsApp', status: checklist.whatsappAuto, auto: false },
            { key: 'treinamento', label: 'Treinar funcionário em atendimento e fechamento', status: checklist.treinamento, auto: false },
            { key: 'metasROI', label: 'Definir metas claras de ROI', status: checklist.metasROI, auto: false }
        ];

        const prontos = itens.filter(i => i.status).length;
        const total = itens.length;
        const pronto = prontos >= 5;

        // Cenário hipotético
        const ticketMedio = celulares.length > 0 ? Math.round(celulares.reduce((s, p) => s + p.precoVenda, 0) / celulares.length) : 2000;
        const margemMedia = celulares.length > 0 ? Math.round(celulares.reduce((s, p) => s + (p.custo > 0 ? (p.precoVenda - p.custo) / p.custo * 100 : 30), 0) / celulares.length) : 30;

        const cenarios = {
            investimento: 1000,
            leadsEsperados: { min: 50, max: 80 },
            vendasEsperadas: { min: 4, max: 6 },
            faturamento: { min: ticketMedio * 4, max: ticketMedio * 6 },
            lucro: { min: Math.round(ticketMedio * 4 * margemMedia / 100), max: Math.round(ticketMedio * 6 * margemMedia / 100) },
            roi: { min: Math.round(ticketMedio * 4 * margemMedia / 100 / 1000 * 10) / 10, max: Math.round(ticketMedio * 6 * margemMedia / 100 / 1000 * 10) / 10 }
        };

        // Produtos sugeridos para anúncio
        const produtosSugeridos = celulares
            .filter(p => p.precoVenda >= 1200 && p.precoVenda <= 3000)
            .sort((a, b) => {
                const mA = a.custo > 0 ? (a.precoVenda - a.custo) / a.custo : 0;
                const mB = b.custo > 0 ? (b.precoVenda - b.custo) / b.custo : 0;
                return mB - mA;
            })
            .slice(0, 5);

        return { itens, prontos, total, pronto, cenarios, produtosSugeridos, ticketMedio, margemMedia };
    },

    // === DIVISÃO REALISTA OFICIAL DA FAMÍLIA (40% LOJA INTACTA + 35% MÃE + 25% PAI) ===
    calcularDivisaoOficialFamilia(lucroLiquidoReal) {
        const lucro = Math.max(0, lucroLiquidoReal || 0);
        
        // 1. 40% Fundo Exclusivo da Loja (Expansão, Caixa e Operação)
        const cotaLoja40 = Math.round(lucro * 0.40 * 100) / 100;

        // 2. Cota Exclusiva da Mãe (35% do total)
        const cotaMaeExclusiva = Math.round(lucro * 0.35 * 100) / 100;

        // 3. Cota do Pai (25% do total)
        const cotaPai = Math.round(lucro * 0.25 * 100) / 100;

        return {
            lucroTotal: lucro,
            cotaLoja40,         // 40% Exclusivo da Loja
            cotaMaeExclusiva,   // 35% Cota própria da Mãe
            cotaPai,            // 25% Cota do Pai
            maeGanhaMais: cotaMaeExclusiva > cotaPai
        };
    }
};

window.Calculators = Calculators;

