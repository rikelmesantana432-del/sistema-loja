// ====================================
// STRATEGYOS 3.0 - MODELO DE DADOS
// Cesinha Acessórios — Amargosa-BA
// Melhorias Finais + Modo Vendedor
// ====================================

class DataManager {
    constructor() {
        this.storageKey = 'strategyos_v3';
        this.data = this.loadData();
        this.verificarViradaDeMes();
        this.verificarFechamentoDiarioAutomatico();
        this.verificarZeramentoSegunda();
        this.supabase = null;
        this.initCloudRedundancy();
    }

    hojeLocal(dataObj = new Date()) {
        try {
            return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dataObj);
        } catch (e) {
            const d = new Date(dataObj.getTime() - (3 * 3600000));
            return d.toISOString().substring(0, 10);
        }
    }

    horaLocal(dataObj = new Date()) {
        try {
            return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia', hour: '2-digit', minute: '2-digit' }).format(dataObj);
        } catch (e) {
            return dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    verificarFechamentoDiarioAutomatico() {
        try {
            const hoje = this.hojeLocal();
            if (!this.data.ultimoFechamentoDiario) {
                this.data.ultimoFechamentoDiario = hoje;
                this.saveData();
                return;
            }
            if (this.data.ultimoFechamentoDiario !== hoje) {
                const dataAnterior = this.data.ultimoFechamentoDiario;
                const movsDiaAnterior = (this.data.movimentacoesCaixa || []).filter(m => (m.data || '').startsWith(dataAnterior));
                
                let vendasTotal = 0;
                let despesasTotal = 0;
                movsDiaAnterior.forEach(m => {
                    const val = parseFloat(m.valor || 0);
                    if (val > 50000) return; // ignora valores anômalos
                    const tp = String(m.tipo || '');
                    if (tp === 'despesa') despesasTotal += Math.abs(val);
                    else if (val > 0 && !tp.includes('fechamento') && tp !== 'zerado' && tp !== 'reset') {
                        vendasTotal += val;
                    }
                });
                
                const lucroEstimado = Math.max(0, vendasTotal - despesasTotal);
                const parteLoja40 = Math.round(lucroEstimado * 0.40 * 100) / 100;
                const partePai60 = Math.round(lucroEstimado * 0.60 * 100) / 100;

                this.data.movimentacoesCaixa.push({
                    tipo: 'fechamento_diario_auto',
                    caixa: 'caixaSecundario',
                    data: new Date().toISOString(),
                    descricao: `🔒 FECHAMENTO AUTOMÁTICO DO DIA (${dataAnterior}): Vendas: R$ ${vendasTotal.toFixed(2)} | Despesas: R$ ${despesasTotal.toFixed(2)} | 40% Loja: R$ ${parteLoja40.toFixed(2)} | 60% Pai: R$ ${partePai60.toFixed(2)}`,
                    vendasTotal,
                    despesasTotal,
                    parteLoja40,
                    partePai60
                });

                this.data.ultimoFechamentoDiario = hoje;
                this.saveData();
                console.log(`[StrategyOS] Fechamento automático do dia ${dataAnterior} realizado! Vendas: R$ ${vendasTotal}, Despesas: R$ ${despesasTotal}`);

                // Envio automático desativado no boot para evitar fechamentos fantasmas no Telegram
                
                if (typeof Integrations !== 'undefined') {
                    if (this.data.configIntegracoes?.driveAutoDiario) {
                        Integrations.fazerBackupGoogleDrive(true);
                    }
                    if (this.data.configIntegracoes?.emailAutoDiario) {
                        Integrations.enviarEmailRelatorio(true);
                    }
                }
            }
        } catch (e) {
            console.error('Erro no fechamento automático diário:', e);
        }
    }

    executarZeramentoCicloMensal(cicloId, dataRefYMD = null, motivo = 'Zeramento Automático Mensal (Dia 30 / Início de Mês)') {
        const hojeYMD = dataRefYMD || this.hojeLocal();
        const saldoPrincipalAnterior = this.data.financeiro?.caixaPrincipal || 0;
        const saldoGavetaAnterior = this.data.financeiro?.caixaSecundario || 0;
        const metaAnterior = this.data.comissaoIlannaMensal || 0;

        if (!this.data.historicoFechamentoMensal) this.data.historicoFechamentoMensal = [];
        this.data.historicoFechamentoMensal.push({
            mes: cicloId,
            saldoCaixaPrincipalFinal: saldoPrincipalAnterior,
            saldoGavetaFinal: saldoGavetaAnterior,
            metaAcumuladaFinal: metaAnterior,
            objetivoMeta: 7000,
            motivo,
            dataFechamento: new Date().toISOString()
        });

        if (!this.data.historicoFechamentoComissao) this.data.historicoFechamentoComissao = [];
        this.data.historicoFechamentoComissao.push({
            ciclo: cicloId,
            comissaoFinal: metaAnterior,
            logDetalhado: this.data.logComissaoMensal || [],
            dataFechamento: new Date().toISOString()
        });

        // Zera Caixa Principal, Caixa Secundário (Gaveta) e Meta para o novo ciclo
        if (!this.data.financeiro) this.data.financeiro = {};
        this.data.financeiro.caixaPrincipal = 0;
        this.data.financeiro.caixaSecundario = 0;
        this.data.comissaoIlannaMensal = 0;
        this.data.logComissaoMensal = [];
        this.data.dataInicioCicloMeta = hojeYMD;
        this.data.timestampInicioCicloMeta = new Date().toISOString();
        this.data.ultimoCicloZeradoDia30 = cicloId;

        if (!this.data.meta) this.data.meta = {};
        this.data.meta.nome = '🎯 Meta Mensal da Loja';
        this.data.meta.objetivo = 7000;
        this.data.meta.diaZeramento = 30;
        this.data.meta.progressoAtual = 0;
        this.data.meta.ultimoZeramento = hojeYMD;

        // Marca vendas anteriores como pertencentes ao ciclo fechado (preserva histórico sem acumular na nova meta)
        if (this.data.historico && Array.isArray(this.data.historico.vendas)) {
            this.data.historico.vendas.forEach(v => {
                if (!v._cicloMetaFechado) {
                    v._cicloMetaFechado = cicloId;
                }
            });
        }

        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];
        this.data.movimentacoesCaixa.push({
            tipo: 'virada_mes_auto',
            caixa: 'caixaPrincipal_e_Meta',
            valorAnterior: saldoPrincipalAnterior,
            saldoGavetaAnterior,
            metaAnterior,
            descricao: `🔒 ${motivo} (${cicloId}): Caixa Principal, Gaveta e Meta (Alvo R$ 7.000,00) zerados para novo ciclo.`,
            data: new Date().toISOString()
        });

        this.saveData();
        console.log(`[StrategyOS] Zeramento automático do ciclo (${cicloId}) concluído: Caixa Principal, Gaveta e Meta zerados.`);
        return {
            sucesso: true,
            cicloId,
            saldoPrincipalAnterior,
            saldoGavetaAnterior,
            metaAnterior
        };
    }

    verificarViradaDeMes() {
        try {
            const hojeYMD = this.hojeLocal();
            const anoMes = hojeYMD.substring(0, 7); // ex: '2026-10'
            const dia = parseInt(hojeYMD.substring(8, 10), 10);

            // Garante alvo da meta em R$ 7.000,00 e regra do dia 30
            if (!this.data.meta) this.data.meta = {};
            this.data.meta.objetivo = 7000;
            this.data.meta.diaZeramento = 30;

            // 1. REGRA DO DIA 30: Todo dia 30 (ou >= 30), zera automaticamente Caixa Principal, Gaveta e Meta
            if (dia >= 30) {
                const cicloDia30 = `${anoMes}-dia30`;
                if (this.data.ultimoCicloZeradoDia30 !== cicloDia30) {
                    this.executarZeramentoCicloMensal(
                        cicloDia30,
                        hojeYMD,
                        `FECHAMENTO AUTOMÁTICO DIA 30 (${hojeYMD})`
                    );
                    this.data.ultimoMesFechado = anoMes;
                    this.saveData();
                }
            }

            // 2. REGRA DE VIRADA DE MÊS (Dia 01 / Início de novo mês):
            if (!this.data.ultimoMesFechado) {
                this.data.ultimoMesFechado = anoMes;
                this.saveData();
            } else if (this.data.ultimoMesFechado !== anoMes) {
                const mesAnterior = this.data.ultimoMesFechado;
                const cicloDia30MesAnterior = `${mesAnterior}-dia30`;
                const jaZerouNoDia30Anterior = (this.data.ultimoCicloZeradoDia30 === cicloDia30MesAnterior);

                if (!jaZerouNoDia30Anterior) {
                    this.executarZeramentoCicloMensal(
                        `${anoMes}-inicio`,
                        hojeYMD,
                        `FECHAMENTO AUTOMÁTICO DE INÍCIO DE MÊS (${mesAnterior} -> ${anoMes})`
                    );
                }
                this.data.ultimoMesFechado = anoMes;
                this.saveData();
            }

            // 3. Snapshot adicional pós-dia 25 para histórico de comissão
            if (dia > 25) {
                const cicloId = `${anoMes}-pos25`;
                if (!this.data.ultimoCicloComissaoIlanna) {
                    this.data.ultimoCicloComissaoIlanna = cicloId;
                    this.saveData();
                    return;
                }
                if (this.data.ultimoCicloComissaoIlanna !== cicloId) {
                    if (!this.data.historicoFechamentoComissao) this.data.historicoFechamentoComissao = [];
                    this.data.historicoFechamentoComissao.push({
                        ciclo: this.data.ultimoCicloComissaoIlanna,
                        comissaoFinal: this.data.comissaoIlannaMensal || 0,
                        logDetalhado: this.data.logComissaoMensal || [],
                        dataFechamento: new Date().toISOString()
                    });
                    this.data.ultimoCicloComissaoIlanna = cicloId;
                    this.saveData();
                }
            }
        } catch (e) {
            console.error('Erro na verificação de virada de mês / dia 30:', e);
        }
    }

    calcularComissaoIlanna(modo = 'liquida', meta = 7000) {
        const dataInicioCiclo = this.data.dataInicioCicloMeta || '';
        const vendasHist = (this.data.historico?.vendas || []).filter(v => {
            if (v._cicloMetaFechado) return false;
            if (dataInicioCiclo && (v.data || '').substring(0, 10) < dataInicioCiclo) return false;
            return true;
        });
        const vendasIlanna = vendasHist.filter(v => /(ilanna|atendente|vendedor)/i.test(v.vendedor || '') || v._modo === 'vendedor');
        const totalBruto = vendasIlanna.reduce((s, v) => s + (v.valorVenda || v.valorFinal || v.valor || 0), 0);
        const totalCusto = vendasIlanna.reduce((s, v) => s + (v.custo || 0), 0);
        const fiadosPendentes = (this.data.crediarios || []).filter(c => /(ilanna|atendente|vendedor)/i.test(c.vendedor || '') && c.status === 'inadimplente').reduce((s, c) => s + (c.valorTotal - (c.valorPago || 0)), 0);

        const baseCalculo = modo === 'bruta' ? totalBruto : Math.max(0, totalBruto - totalCusto - fiadosPendentes);
        const atingiuMeta = baseCalculo >= meta;
        const excedente = Math.max(0, baseCalculo - meta);
        const valorComissao = excedente * 0.10;

        return {
            totalBruto,
            totalCusto,
            fiadosPendentes,
            baseCalculo,
            meta,
            atingiuMeta,
            excedente,
            valorComissao,
            modo
        };
    }

    _getISOWeek(d) {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }

    verificarViradaDeSemana() {
        try {
            const hoje = new Date();
            const anoSemana = this._getISOWeek(hoje);

            if (!this.data.ultimaSemanaFechada) {
                this.data.ultimaSemanaFechada = anoSemana;
                this.saveData();
                return;
            }

            // Se mudou a semana (ex: Domingo/Segunda de novo ciclo)
            if (this.data.ultimaSemanaFechada !== anoSemana) {
                this.fecharSemanaManualmente(true);
            }
        } catch (e) {
            console.error('Erro na verificação de virada de semana:', e);
        }
    }

    fecharSemanaManualmente(automatico = false) {
        try {
            const hoje = new Date();
            const anoSemana = this._getISOWeek(hoje);

            // Snapshot do Estoque
            const celulares = this.getEstoqueCelulares ? this.getEstoqueCelulares() : (this.data.estoqueCelulares || []);
            const totalAparelhos = celulares.length;
            const totalCustoEstoque = celulares.reduce((s, c) => s + (c.custo || 0), 0);
            const totalVendaEstoque = celulares.reduce((s, c) => s + (c.precoVenda || 0), 0);

            // Vendas
            const vendas = (this.data.historico?.vendas || []);
            const totalVendasSemana = vendas.reduce((s, v) => s + (v.valorVenda || v.liquido || 0), 0);
            const lucroSemana = vendas.reduce((s, v) => s + (v.lucro || 0), 0);

            // Divisão de lucros oficial (40% loja, 35% mãe, 25% pai)
            const divisao = typeof Calculators !== 'undefined' && Calculators.calcularDivisaoOficialFamilia ? Calculators.calcularDivisaoOficialFamilia(lucroSemana) : { cotaLoja40: lucroSemana*0.4, cotaMaeExclusiva: lucroSemana*0.35, cotaPai: lucroSemana*0.25 };

            if (!this.data.fechamentosSemanais) this.data.fechamentosSemanais = [];
            const registroSemanal = {
                semana: anoSemana,
                dataFechamento: hoje.toISOString(),
                totalAparelhos,
                totalCustoEstoque,
                totalVendaEstoque,
                totalVendasSemana,
                lucroSemana,
                divisao,
                origem: automatico ? 'automatico_domingo_segunda' : 'manual'
            };
            this.data.fechamentosSemanais.push(registroSemanal);
            this.data.ultimaSemanaFechada = anoSemana;
            this.saveData();

            // Disparar integrações
            if (typeof Integrations !== 'undefined') {
                if (this.data.configIntegracoes?.telegramAutoDiario) Integrations.enviarTelegram(true);
                if (this.data.configIntegracoes?.driveAutoDiario) Integrations.fazerBackupGoogleDrive(true);
                if (this.data.configIntegracoes?.emailAutoDiario) Integrations.enviarEmailRelatorio(true);
            }

            console.log(`[StrategyOS] Fechamento/Reset Semanal (${anoSemana}) executado com sucesso!`);
            return registroSemanal;
        } catch (e) {
            console.error('Erro ao executar fechamento semanal:', e);
            return null;
        }
    }

    // ===== BUSCA ULTRA RÁPIDA NO ESTOQUE (POR LETRA OU TERMOS) =====
    buscarEstoqueInteligente(query) {
        return this.buscarProdutos(query);
    }

    buscarProdutos(query) {
        if (!query || typeof query !== 'string') return [];
        
        function norm(txt) {
            return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        }

        const q = norm(query);
        if (q.length === 0) return [];
        const termos = q.split(/\s+/).filter(t => t.length > 0);

        const resultados = [];

        // 1. Buscar em Acessórios
        const acessorios = this.data.estoqueAcessorios || [];
        acessorios.forEach(a => {
            const txt = norm(`${a.nome || ''} ${a.categoria || ''} ${a.marca || ''} ${a.codigoBarras || ''}`);
            if (termos.every(t => txt.includes(t))) {
                resultados.push({
                    tipo: 'acessorio',
                    id: a.id,
                    nome: a.nome,
                    categoria: a.categoria || 'Acessório',
                    preco: a.precoVenda || a.preco || 0,
                    custo: a.custo || 0,
                    quantidade: a.quantidade !== undefined ? a.quantidade : (a.status === 'disponivel' ? 1 : 0),
                    status: (a.quantidade !== undefined ? a.quantidade > 0 : a.status === 'disponivel') ? 'disponivel' : 'esgotado'
                });
            }
        });

        // 2. Buscar em Celulares
        const celulares = this.data.estoqueCelulares || [];
        celulares.forEach(c => {
            const txt = norm(`${c.nome || ''} ${c.capacidade || ''} ${c.cor || ''} ${c.condicao || ''} ${c.imei || ''}`);
            if (termos.every(t => txt.includes(t))) {
                resultados.push({
                    tipo: 'celular',
                    id: c.id,
                    nome: `${c.nome} ${c.capacidade || ''} (${c.cor || 'Normal'})`,
                    categoria: 'Celular',
                    preco: c.precoVenda || c.preco || 0,
                    custo: c.custo || 0,
                    quantidade: c.status === 'disponivel' ? 1 : 0,
                    status: c.status || 'disponivel'
                });
            }
        });

        // 3. Buscar em Películas de Proteção
        if (norm('pelicula').includes(q) || q.includes('pelic') || q.includes('3d') || q.includes('ceramica') || q.includes('privacidade')) {
            resultados.push({
                tipo: 'pelicula',
                id: 'pelicula_geral',
                nome: 'Película 3D / Cerâmica / Blindagem (Geral)',
                categoria: 'Película',
                preco: this.data.precoPelicula || 15.00,
                custo: 3.00,
                quantidade: 999,
                status: 'disponivel'
            });
        }

        return resultados.sort((a, b) => {
            const aStarts = norm(a.nome).startsWith(q) ? 1 : 0;
            const bStarts = norm(b.nome).startsWith(q) ? 1 : 0;
            if (aStarts !== bStarts) return bStarts - aStarts;
            return a.nome.localeCompare(b.nome);
        }).slice(0, 20);
    }

    getDefaultData() {
        return {
            versao: '3.1.0',
            dataBase: '2026-02-19',

            // === CONFIGURAÇÕES DE INTEGRAÇÕES & AUTOMAÇÃO ===
            configIntegracoes: {
                telegramToken: '',
                telegramChatId: '',
                telegramAutoDiario: true,
                googleDriveScriptUrl: '',
                driveAutoDiario: true,
                emailDestino: '',
                emailScriptUrl: '',
                emailAutoDiario: true
            },

            // === PREFERÊNCIAS ===
            preferencias: {
                tema: 'escuro',      // escuro / claro
                modo: 'simplificado', // simplificado / completo
                modoTreino: false    // modo treino (nada salva de verdade)
            },

            // === CAIXAS SEPARADOS (INÍCIO LIMPO ZERADO) ===
            comissaoIlannaMensal: 0,
            financeiro: {
                caixaPrincipal: 0,
                caixaSecundario: 0,
                caixaTerciario: 0,
                caixaFogos: 0,
                caixaAcessorios: 0,
                caixaAssistencia: 0,
                reservaEmergencia: 0
            },

            // === META MENSAL (ALVO R$ 7.000,00 — ZERA DIA 30 / INÍCIO DO MÊS) ===
            meta: {
                nome: '🎯 Meta Mensal da Loja',
                objetivo: 7000,
                diaZeramento: 30,
                prazo: '2026-12-31',
                descricao: 'Meta mensal de R$ 7.000,00 — Zera automaticamente todo dia 30 / início de mês',
                dataInicio: '2026-10-01'
            },

            // === 3 ESTOQUES ===
            estoqueCelulares: [],
            estoqueAcessorios: [
                { id: 101, nome: 'Caixa Basike IPX6', custo: 390, precoVenda: 697.90, tipo: 'equipamento_loja', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 2 },
                { id: 102, nome: 'Gimbal XZY', custo: 240, precoVenda: 347.90, tipo: 'acessorio', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 1 },
                { id: 103, nome: 'S9 Ultra (Relógio)', custo: 59.90, precoVenda: 189.90, tipo: 'relogio', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 5 },
                { id: 104, nome: 'Air Max (Fone)', custo: 89.90, precoVenda: 149.90, tipo: 'fone', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 3 },
                { id: 105, nome: 'Caixa 12 por 1', custo: 35.00, precoVenda: 45.00, tipo: 'fogos', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 0 },
                { id: 106, nome: 'Caixa 19 por 4', custo: 48.00, precoVenda: 60.00, tipo: 'fogos', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 0 },
                { id: 107, nome: 'Giranda 468', custo: 150.00, precoVenda: 200.00, tipo: 'fogos', dataCompra: '2025-12-20', status: 'disponivel', quantidade: 0 }
            ],
            estoqueUsoLoja: [],
            produtosProcurados: [],

            // === CREDIÁRIOS ===
            crediarios: [
                { id: 1, cliente: 'Jaqueline', valorTotal: 947, parcelasTotal: 3, parcelasPagas: 0, valorParcela: 315.67, proximaParcela: 'vencido', status: 'inadimplente', diasAtraso: 0, historicoPagamentos: [], custoProduto: 0, dataInicio: '2025-11-01', produtoVendido: 'Diversos' },
                { id: 2, cliente: 'Aline', valorTotal: 1450.45, parcelasTotal: 5, parcelasPagas: 0, valorParcela: 290.09, proximaParcela: '2026-02-20', diaVencimento: 20, status: 'em_dia', diasAtraso: 0, historicoPagamentos: [], custoProduto: 0, dataInicio: '2026-02-20', produtoVendido: 'Diversos' },
                { id: 3, cliente: 'Rapaz do Vidro', valorTotal: 200, parcelasTotal: 1, parcelasPagas: 0, valorParcela: 200, proximaParcela: '2025-12-01', status: 'atrasado', diasAtraso: 0, historicoPagamentos: [], custoProduto: 0, dataInicio: '2025-12-01', produtoVendido: 'Vidro' }
            ],

            // === CLIENTES EXPANDIDOS ===
            clientes: [
                { nome: 'Jaqueline', telefone: '', cpf: '', nascimento: '', endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: 'Amargosa', uf: 'BA', cep: '' }, email: '', instagram: '', comoConheceu: '', observacoes: '', score: 320, parcelasEmDia: 0, parcelasAtrasadas: 3, crediariosQuitados: 0, dataCadastro: '2025-11-01' },
                { nome: 'Aline', telefone: '', cpf: '', nascimento: '', endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: 'Amargosa', uf: 'BA', cep: '' }, email: '', instagram: '', comoConheceu: '', observacoes: '', score: 700, parcelasEmDia: 0, parcelasAtrasadas: 0, crediariosQuitados: 2, dataCadastro: '2025-06-01' },
                { nome: 'Rapaz do Vidro', telefone: '', cpf: '', nascimento: '', endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: 'Amargosa', uf: 'BA', cep: '' }, email: '', instagram: '', comoConheceu: '', observacoes: '', score: 250, parcelasEmDia: 0, parcelasAtrasadas: 1, crediariosQuitados: 0, dataCadastro: '2025-12-01' },
                { nome: 'Eliane', telefone: '(75) 99999-9999', cpf: '', nascimento: '', endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: 'Amargosa', uf: 'BA', cep: '' }, email: '', instagram: '', comoConheceu: '', observacoes: 'Veio fazer orçamento de conserto - não finalizou', score: 50, parcelasEmDia: 0, parcelasAtrasadas: 0, crediariosQuitados: 0, dataCadastro: '2026-02-15', historico: [{ data: '2026-02-15', tipo: 'orcamento_conserto', detalhes: { aparelho: 'iPhone 11', servico: 'Trocar tela', valor_orcado: 330.00, status: 'nao_finalizado' } }] }
            ],

            // === ASSISTÊNCIA TÉCNICA ===
            assistencia: { ordensServico: [], proximoNumero: 1 },

            // === TAXAS MÁQUINA TUOLI (até 18x + PIX) ===
            taxasCartao: {
                debito: 1.39, debito_elo: 1.79,
                credito: 2.91, credito_elo: 3.24,
                '2x': 4.68, '2x_elo': 4.83,
                '3x': 5.45, '3x_elo': 5.60,
                '4x': 6.21, '4x_elo': 6.36,
                '5x': 6.95, '5x_elo': 7.10,
                '6x': 7.69, '6x_elo': 7.84,
                '7x': 8.47, '7x_elo': 8.67,
                '8x': 9.19, '8x_elo': 9.39,
                '9x': 9.91, '9x_elo': 10.11,
                '10x': 10.61, '10x_elo': 10.81,
                '11x': 11.32, '11x_elo': 11.52,
                '12x': 12.01, '12x_elo': 12.21,
                '13x': 12.70, '13x_elo': 12.90,
                '14x': 13.38, '14x_elo': 13.58,
                '15x': 14.05, '15x_elo': 14.25,
                '16x': 14.72, '16x_elo': 14.92,
                '17x': 15.38, '17x_elo': 15.58,
                '18x': 16.03, '18x_elo': 16.23,
                pix: 0.50
            },

            // === PREÇOS DE REFERÊNCIA — CELULARES USADOS EM ESTADO PERFEITO (Amargosa-BA, Fev/2026) ===
            precosReferenciaUsados: {
                // iPhones
                'iphone 7': 400, 'iphone 7 plus': 500, 'iphone 8': 500, 'iphone 8 plus': 650,
                'iphone x': 700, 'iphone xr': 750, 'iphone xs': 800, 'iphone xs max': 900,
                'iphone 11': 900, 'iphone 11 pro': 1200, 'iphone 11 pro max': 1400,
                'iphone se 2020': 600, 'iphone se 2022': 900,
                'iphone 12': 1200, 'iphone 12 mini': 1000, 'iphone 12 pro': 1500, 'iphone 12 pro max': 1800,
                'iphone 13': 1600, 'iphone 13 mini': 1300, 'iphone 13 pro': 2000, 'iphone 13 pro max': 2400,
                'iphone 14': 2200, 'iphone 14 plus': 2500, 'iphone 14 pro': 2800, 'iphone 14 pro max': 3200,
                'iphone 15': 3000, 'iphone 15 plus': 3400, 'iphone 15 pro': 3800, 'iphone 15 pro max': 4500,
                // iPhone 16
                'iphone 16': 4500, 'iphone 16 plus': 4900, 'iphone 16 pro': 5900, 'iphone 16 pro max': 6800,
                // iPhone 17 (projeção)
                'iphone 17': 5200, 'iphone 17 plus': 5600, 'iphone 17 pro': 6800, 'iphone 17 pro max': 7800,
                // Samsung Linha A
                'samsung a04': 350, 'samsung a10': 300, 'samsung a10s': 300, 'samsung a12': 400, 'samsung a13': 450,
                'samsung a14': 500, 'samsung a20': 350, 'samsung a20s': 350, 'samsung a21s': 400, 'samsung a22': 450,
                'samsung a23': 500, 'samsung a24': 550, 'samsung a25': 600, 'samsung a30': 350, 'samsung a30s': 380,
                'samsung a31': 400, 'samsung a32': 450, 'samsung a33': 550, 'samsung a34': 650, 'samsung a35': 750,
                'samsung a50': 400, 'samsung a51': 450, 'samsung a52': 550, 'samsung a52s': 600, 'samsung a53': 650,
                'samsung a54': 800, 'samsung a55': 900, 'samsung a70': 450, 'samsung a71': 500, 'samsung a72': 600,
                'samsung a73': 700,
                // Samsung Linha S
                'samsung s10': 600, 'samsung s10 plus': 700, 'samsung s20': 800, 'samsung s20 fe': 700,
                'samsung s21': 900, 'samsung s21 fe': 800, 'samsung s21 plus': 1000, 'samsung s21 ultra': 1300,
                'samsung s22': 1200, 'samsung s22 plus': 1400, 'samsung s22 ultra': 1800,
                'samsung s23': 1600, 'samsung s23 plus': 1900, 'samsung s23 ultra': 2500,
                'samsung s24': 2200, 'samsung s24 plus': 2600, 'samsung s24 ultra': 3200,
                // Samsung Linha M/J
                'samsung m12': 350, 'samsung m22': 400, 'samsung m23': 450, 'samsung m32': 450, 'samsung m33': 500,
                'samsung j5': 150, 'samsung j7': 180, 'samsung j7 prime': 200,
                // Motorola
                'moto g7': 250, 'moto g7 play': 220, 'moto g7 plus': 280, 'moto g7 power': 260,
                'moto g8': 280, 'moto g8 play': 250, 'moto g8 plus': 300, 'moto g8 power': 320,
                'moto g9': 300, 'moto g9 play': 280, 'moto g9 plus': 350, 'moto g9 power': 320,
                'moto g10': 300, 'moto g20': 350, 'moto g22': 400, 'moto g23': 450,
                'moto g30': 350, 'moto g31': 380, 'moto g32': 420, 'moto g34': 500,
                'moto g42': 450, 'moto g52': 500, 'moto g53': 550, 'moto g54': 600,
                'moto g60': 500, 'moto g71': 550, 'moto g73': 600, 'moto g84': 750,
                'moto e7': 200, 'moto e13': 300, 'moto e22': 350,
                'moto edge 20': 500, 'moto edge 30': 600, 'moto edge 40': 800,
                // Xiaomi/Redmi/Poco
                'redmi 9': 350, 'redmi 9a': 280, 'redmi 9c': 300, 'redmi 9t': 350,
                'redmi 10': 400, 'redmi 10c': 380, 'redmi 10 5g': 400,
                'redmi 12': 500, 'redmi 12c': 450, 'redmi 13': 550, 'redmi 13c': 500,
                'redmi note 9': 400, 'redmi note 9 pro': 450, 'redmi note 9s': 420,
                'redmi note 10': 450, 'redmi note 10 pro': 550, 'redmi note 10s': 480,
                'redmi note 11': 500, 'redmi note 11 pro': 600, 'redmi note 11s': 520,
                'redmi note 12': 550, 'redmi note 12 pro': 700, 'redmi note 12s': 580,
                'redmi note 13': 650, 'redmi note 13 pro': 850, 'redmi note 13 pro plus': 1000,
                'xiaomi 9a': 280, 'xiaomi note 9': 400, 'xiaomi a3': 300,
                'poco c40': 350, 'poco c55': 400, 'poco c65': 450,
                'poco m3': 350, 'poco m4 pro': 500, 'poco m5': 400, 'poco m5s': 450,
                'poco x3': 450, 'poco x3 pro': 500, 'poco x4 pro': 600, 'poco x5': 550, 'poco x5 pro': 650,
                'poco x6': 700, 'poco x6 pro': 850, 'poco f3': 600, 'poco f4': 700, 'poco f5': 800,
                // LG
                'lg k10': 150, 'lg k12': 180, 'lg k22': 200, 'lg k40': 200, 'lg k41': 220,
                'lg k50': 250, 'lg k51': 250, 'lg k52': 300, 'lg k61': 350, 'lg k62': 350,
                // Infinix
                'infinix smart 7': 300, 'infinix smart 8': 350, 'infinix smart 10': 450,
                'infinix hot 11': 350, 'infinix hot 12': 400, 'infinix hot 30': 450,
                'infinix note 12': 500, 'infinix note 30': 600,
                // Realme
                'realme c11': 300, 'realme c15': 350, 'realme c25': 400, 'realme c35': 450,
                'realme 8': 450, 'realme 9': 500, 'realme 10': 550, 'realme 11': 600,
                // Tecno
                'tecno spark 8': 300, 'tecno spark 10': 400, 'tecno pop 7': 250
            },

            // Data da última atualização de preços
            ultimaAtualizacaoPrecos: '2026-07-20',

            // === TABELA SERVIÇOS AMPLIADA (50+ modelos com preços reais 2026) ===
            tabelaServicosModelo: {
                // === IPHONES ANTIGOS (REVISADOS COM ALTA MARGEM DE LUCRO E PREÇO JUSTO) ===
                'iphone 6': { tela: { p: 55, m: 35, d: 2 }, tela2aLinha: { p: 40, m: 30, d: 2 }, telaOriginal: { p: 95, m: 45, d: 2 }, bateria: { p: 40, m: 30, d: 1 }, conector: { p: 35, m: 35, d: 1 } },
                'iphone 6s': { tela: { p: 60, m: 35, d: 2 }, tela2aLinha: { p: 45, m: 30, d: 2 }, telaOriginal: { p: 105, m: 45, d: 2 }, bateria: { p: 45, m: 30, d: 1 }, conector: { p: 35, m: 35, d: 1 } },
                'iphone 6 plus': { tela: { p: 65, m: 40, d: 2 }, tela2aLinha: { p: 50, m: 35, d: 2 }, telaOriginal: { p: 115, m: 50, d: 2 }, bateria: { p: 50, m: 35, d: 1 }, conector: { p: 40, m: 35, d: 1 } },
                'iphone 6s plus': { tela: { p: 70, m: 40, d: 2 }, tela2aLinha: { p: 55, m: 35, d: 2 }, telaOriginal: { p: 125, m: 50, d: 2 }, bateria: { p: 50, m: 35, d: 1 }, conector: { p: 40, m: 35, d: 1 } },
                // === IPHONES RECENTES (COM 3 VARIAÇÕES DE TELA E PREÇOS REAIS DE AMARGOSA) ===
                'iphone 7': { tela: { p: 50, m: 40, d: 2 }, tela2aLinha: { p: 40, m: 35, d: 2 }, telaOriginal: { p: 90, m: 50, d: 2 }, bateria: { p: 40, m: 30, d: 1 }, conector: { p: 35, m: 35, d: 1 } },
                'iphone 7 plus': { tela: { p: 60, m: 45, d: 2 }, tela2aLinha: { p: 50, m: 40, d: 2 }, telaOriginal: { p: 110, m: 55, d: 2 }, bateria: { p: 45, m: 35, d: 1 }, conector: { p: 40, m: 35, d: 1 } },
                'iphone 8': { tela: { p: 60, m: 45, d: 2 }, tela2aLinha: { p: 50, m: 40, d: 2 }, telaOriginal: { p: 110, m: 55, d: 2 }, bateria: { p: 45, m: 35, d: 1 }, conector: { p: 40, m: 35, d: 1 } },
                'iphone 8 plus': { tela: { p: 70, m: 45, d: 2 }, tela2aLinha: { p: 55, m: 40, d: 2 }, telaOriginal: { p: 125, m: 60, d: 2 }, bateria: { p: 50, m: 35, d: 1 }, conector: { p: 45, m: 35, d: 1 } },
                'iphone x': { tela: { p: 120, m: 60, d: 3 }, tela2aLinha: { p: 90, m: 50, d: 2 }, telaOriginal: { p: 260, m: 90, d: 3 }, bateria: { p: 65, m: 40, d: 2 }, conector: { p: 50, m: 40, d: 2 } },
                'iphone xr': { tela: { p: 110, m: 60, d: 3 }, tela2aLinha: { p: 85, m: 50, d: 2 }, telaOriginal: { p: 240, m: 85, d: 3 }, bateria: { p: 65, m: 40, d: 2 }, conector: { p: 50, m: 40, d: 2 } },
                'iphone xs': { tela: { p: 130, m: 60, d: 3 }, tela2aLinha: { p: 95, m: 50, d: 2 }, telaOriginal: { p: 280, m: 90, d: 3 }, bateria: { p: 70, m: 40, d: 2 }, conector: { p: 55, m: 40, d: 2 } },
                'iphone xs max': { tela: { p: 150, m: 70, d: 3 }, tela2aLinha: { p: 110, m: 60, d: 2 }, telaOriginal: { p: 320, m: 100, d: 3 }, bateria: { p: 75, m: 45, d: 2 }, conector: { p: 60, m: 40, d: 2 } },
                'iphone 11': { tela: { p: 130, m: 70, d: 3 }, tela2aLinha: { p: 90, m: 60, d: 2 }, telaOriginal: { p: 280, m: 90, d: 3 }, bateria: { p: 70, m: 50, d: 2 }, camera_traseira: { p: 110, m: 50, d: 3 }, conector: { p: 55, m: 45, d: 3 } },
                'iphone 11 pro': { tela: { p: 190, m: 80, d: 4 }, tela2aLinha: { p: 130, m: 70, d: 3 }, telaOriginal: { p: 420, m: 120, d: 4 }, bateria: { p: 85, m: 55, d: 2 }, camera_traseira: { p: 150, m: 60, d: 3 } },
                'iphone 11 pro max': { tela: { p: 240, m: 90, d: 4 }, tela2aLinha: { p: 160, m: 80, d: 3 }, telaOriginal: { p: 490, m: 130, d: 4 }, bateria: { p: 95, m: 60, d: 3 }, camera_traseira: { p: 180, m: 70, d: 4 } },
                'iphone 12': { tela: { p: 210, m: 90, d: 4 }, tela2aLinha: { p: 140, m: 80, d: 3 }, telaOriginal: { p: 480, m: 120, d: 4 }, bateria: { p: 85, m: 55, d: 2 }, camera_traseira: { p: 150, m: 60, d: 4 }, conector: { p: 70, m: 50, d: 3 } },
                'iphone 12 pro': { tela: { p: 230, m: 95, d: 4 }, tela2aLinha: { p: 150, m: 85, d: 3 }, telaOriginal: { p: 520, m: 130, d: 4 }, bateria: { p: 90, m: 60, d: 2 }, camera_traseira: { p: 180, m: 70, d: 4 } },
                'iphone 12 pro max': { tela: { p: 270, m: 110, d: 5 }, tela2aLinha: { p: 180, m: 90, d: 4 }, telaOriginal: { p: 620, m: 150, d: 5 }, bateria: { p: 105, m: 65, d: 3 }, camera_traseira: { p: 220, m: 80, d: 4 } },
                'iphone 13': { tela: { p: 320, m: 110, d: 4 }, tela2aLinha: { p: 200, m: 100, d: 3 }, telaOriginal: { p: 620, m: 180, d: 5 }, bateria: { p: 95, m: 65, d: 2 }, camera_traseira: { p: 180, m: 70, d: 4 } },
                'iphone 13 pro': { tela: { p: 400, m: 150, d: 5 }, tela2aLinha: { p: 240, m: 110, d: 4 }, telaOriginal: { p: 780, m: 220, d: 6 }, bateria: { p: 110, m: 70, d: 3 }, camera_traseira: { p: 280, m: 90, d: 5 } },
                'iphone 13 pro max': { tela: { p: 450, m: 160, d: 5 }, tela2aLinha: { p: 280, m: 120, d: 4 }, telaOriginal: { p: 890, m: 240, d: 6 }, bateria: { p: 125, m: 75, d: 3 }, camera_traseira: { p: 320, m: 100, d: 5 } },
                'iphone 14': { tela: { p: 420, m: 150, d: 5 }, tela2aLinha: { p: 260, m: 120, d: 4 }, telaOriginal: { p: 820, m: 230, d: 6 }, bateria: { p: 115, m: 75, d: 3 }, camera_traseira: { p: 240, m: 80, d: 5 } },
                'iphone 14 pro': { tela: { p: 580, m: 190, d: 6 }, tela2aLinha: { p: 360, m: 140, d: 4 }, telaOriginal: { p: 1150, m: 300, d: 7 }, bateria: { p: 135, m: 85, d: 3 }, camera_traseira: { p: 380, m: 120, d: 6 } },
                'iphone 14 pro max': { tela: { p: 640, m: 210, d: 6 }, tela2aLinha: { p: 400, m: 150, d: 4 }, telaOriginal: { p: 1280, m: 320, d: 7 }, bateria: { p: 145, m: 90, d: 3 }, camera_traseira: { p: 420, m: 130, d: 6 } },
                'iphone 15': { tela: { p: 580, m: 180, d: 6 }, tela2aLinha: { p: 360, m: 140, d: 5 }, telaOriginal: { p: 1050, m: 280, d: 7 }, bateria: { p: 140, m: 80, d: 3 }, camera_traseira: { p: 290, m: 90, d: 5 } },
                'iphone 15 pro': { tela: { p: 720, m: 220, d: 7 }, tela2aLinha: { p: 450, m: 160, d: 5 }, telaOriginal: { p: 1420, m: 350, d: 8 }, bateria: { p: 160, m: 90, d: 3 }, camera_traseira: { p: 480, m: 140, d: 6 } },
                'iphone 15 pro max': { tela: { p: 850, m: 250, d: 7 }, tela2aLinha: { p: 520, m: 180, d: 5 }, telaOriginal: { p: 1650, m: 380, d: 8 }, bateria: { p: 180, m: 100, d: 4 }, camera_traseira: { p: 550, m: 160, d: 7 } },
                'iphone 16': { tela: { p: 680, m: 200, d: 7 }, tela2aLinha: { p: 420, m: 150, d: 5 }, telaOriginal: { p: 1250, m: 300, d: 8 }, bateria: { p: 150, m: 90, d: 3 }, camera_traseira: { p: 350, m: 120, d: 6 } },
                'iphone 16 plus': { tela: { p: 750, m: 220, d: 7 }, tela2aLinha: { p: 480, m: 160, d: 5 }, telaOriginal: { p: 1350, m: 320, d: 8 }, bateria: { p: 165, m: 95, d: 3 }, camera_traseira: { p: 380, m: 130, d: 6 } },
                'iphone 16 pro': { tela: { p: 920, m: 260, d: 8 }, tela2aLinha: { p: 580, m: 190, d: 6 }, telaOriginal: { p: 1750, m: 400, d: 9 }, bateria: { p: 180, m: 100, d: 4 }, camera_traseira: { p: 580, m: 160, d: 7 } },
                'iphone 16 pro max': { tela: { p: 1050, m: 290, d: 8 }, tela2aLinha: { p: 650, m: 210, d: 6 }, telaOriginal: { p: 1950, m: 450, d: 9 }, bateria: { p: 200, m: 110, d: 4 }, camera_traseira: { p: 650, m: 180, d: 8 } },
                'iphone 17': { tela: { p: 1270, m: 280, d: 9 }, tela2aLinha: { p: 780, m: 220, d: 7 }, telaOriginal: { p: 2540, m: 400, d: 11 }, bateria: { p: 250, m: 120, d: 5 }, camera_traseira: { p: 600, m: 160, d: 8 } },
                'iphone 17 plus': { tela: { p: 1200, m: 300, d: 10 }, tela2aLinha: { p: 740, m: 230, d: 8 }, telaOriginal: { p: 2400, m: 420, d: 12 }, bateria: { p: 270, m: 130, d: 5 }, camera_traseira: { p: 650, m: 170, d: 8 } },
                'iphone 17 pro': { tela: { p: 1850, m: 380, d: 12 }, tela2aLinha: { p: 1100, m: 280, d: 9 }, telaOriginal: { p: 3700, m: 550, d: 14 }, bateria: { p: 300, m: 140, d: 5 }, camera_traseira: { p: 1000, m: 230, d: 10 } },
                'iphone 17 pro max': { tela: { p: 2200, m: 440, d: 14 }, tela2aLinha: { p: 1320, m: 320, d: 10 }, telaOriginal: { p: 4400, m: 620, d: 16 }, bateria: { p: 350, m: 150, d: 6 }, camera_traseira: { p: 1200, m: 260, d: 11 } },
                'samsung a03 core': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 70, m: 50, d: 2 }, telaOriginal: { p: 165, m: 65, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a03s': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 75, m: 50, d: 2 }, telaOriginal: { p: 175, m: 65, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a04': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 50, d: 3 }, telaOriginal: { p: 180, m: 70, d: 5 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 35, m: 45, d: 3 } },
                'samsung a10': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 50, d: 3 }, telaOriginal: { p: 175, m: 65, d: 5 }, bateria: { p: 60, m: 50, d: 2 } },
                'samsung a12': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 85, m: 55, d: 3 }, telaOriginal: { p: 200, m: 70, d: 5 }, bateria: { p: 65, m: 50, d: 3 } },
                'samsung a13': { tela: { p: 110, m: 60, d: 4 }, tela2aLinha: { p: 90, m: 55, d: 3 }, telaOriginal: { p: 220, m: 75, d: 5 }, bateria: { p: 65, m: 50, d: 3 } },
                'samsung a14': { tela: { p: 120, m: 60, d: 5 }, tela2aLinha: { p: 95, m: 55, d: 4 }, telaOriginal: { p: 240, m: 80, d: 6 }, bateria: { p: 70, m: 50, d: 3 } },
                'samsung a21s': { tela: { p: 115, m: 60, d: 4 }, tela2aLinha: { p: 90, m: 55, d: 3 }, telaOriginal: { p: 220, m: 75, d: 5 }, bateria: { p: 65, m: 50, d: 3 } },
                'samsung a31': { tela: { p: 140, m: 60, d: 5 }, tela2aLinha: { p: 105, m: 55, d: 4 }, telaOriginal: { p: 260, m: 80, d: 6 }, bateria: { p: 70, m: 50, d: 3 } },
                'samsung a32': { tela: { p: 150, m: 65, d: 5 }, tela2aLinha: { p: 110, m: 55, d: 4 }, telaOriginal: { p: 280, m: 85, d: 6 }, bateria: { p: 75, m: 50, d: 3 } },
                'samsung a51': { tela: { p: 160, m: 65, d: 5 }, tela2aLinha: { p: 120, m: 60, d: 4 }, telaOriginal: { p: 300, m: 90, d: 6 }, bateria: { p: 75, m: 50, d: 3 } },
                'samsung a52': { tela: { p: 175, m: 70, d: 5 }, tela2aLinha: { p: 130, m: 60, d: 4 }, telaOriginal: { p: 330, m: 95, d: 6 }, bateria: { p: 80, m: 55, d: 3 } },
                'samsung a53': { tela: { p: 190, m: 70, d: 6 }, tela2aLinha: { p: 140, m: 65, d: 5 }, telaOriginal: { p: 360, m: 100, d: 7 }, bateria: { p: 80, m: 55, d: 3 } },
                'samsung a54': { tela: { p: 230, m: 80, d: 6 }, tela2aLinha: { p: 160, m: 70, d: 5 }, telaOriginal: { p: 440, m: 110, d: 7 }, bateria: { p: 85, m: 60, d: 3 } },
                'samsung galaxy s10': { tela: { p: 170, m: 65, d: 5 }, tela2aLinha: { p: 120, m: 55, d: 4 }, telaOriginal: { p: 300, m: 85, d: 6 }, bateria: { p: 80, m: 55, d: 3 }, camera: { p: 120, m: 50, d: 5 } },
                'samsung galaxy s10 plus': { tela: { p: 190, m: 70, d: 5 }, tela2aLinha: { p: 135, m: 60, d: 4 }, telaOriginal: { p: 360, m: 95, d: 6 }, bateria: { p: 85, m: 55, d: 3 }, camera: { p: 140, m: 55, d: 5 } },
                'samsung galaxy s20': { tela: { p: 230, m: 80, d: 6 }, tela2aLinha: { p: 160, m: 70, d: 5 }, telaOriginal: { p: 440, m: 110, d: 7 }, bateria: { p: 90, m: 60, d: 3 }, camera: { p: 160, m: 60, d: 5 } },
                'samsung galaxy s20 fe': { tela: { p: 200, m: 75, d: 5 }, tela2aLinha: { p: 145, m: 65, d: 4 }, telaOriginal: { p: 390, m: 100, d: 6 }, bateria: { p: 85, m: 55, d: 3 }, camera: { p: 150, m: 55, d: 5 } },
                'samsung galaxy s21': { tela: { p: 250, m: 85, d: 6 }, tela2aLinha: { p: 175, m: 75, d: 5 }, telaOriginal: { p: 500, m: 120, d: 7 }, bateria: { p: 95, m: 60, d: 3 }, camera: { p: 180, m: 65, d: 6 } },
                'samsung galaxy s21 fe': { tela: { p: 230, m: 80, d: 6 }, tela2aLinha: { p: 160, m: 70, d: 5 }, telaOriginal: { p: 450, m: 110, d: 7 }, bateria: { p: 90, m: 60, d: 3 }, camera: { p: 160, m: 60, d: 5 } },
                'samsung galaxy s22': { tela: { p: 300, m: 95, d: 7 }, tela2aLinha: { p: 205, m: 85, d: 5 }, telaOriginal: { p: 600, m: 140, d: 8 }, bateria: { p: 105, m: 65, d: 4 }, camera: { p: 200, m: 75, d: 6 } },
                'samsung galaxy s23': { tela: { p: 410, m: 115, d: 8 }, tela2aLinha: { p: 275, m: 95, d: 6 }, telaOriginal: { p: 850, m: 170, d: 10 }, bateria: { p: 125, m: 70, d: 4 }, camera: { p: 240, m: 85, d: 7 } },
                'samsung galaxy s23 ultra': { tela: { p: 600, m: 160, d: 10 }, tela2aLinha: { p: 400, m: 130, d: 8 }, telaOriginal: { p: 1220, m: 230, d: 12 }, bateria: { p: 145, m: 80, d: 5 }, camera: { p: 320, m: 100, d: 8 } },
                'samsung galaxy note 20': { tela: { p: 380, m: 115, d: 8 }, tela2aLinha: { p: 255, m: 95, d: 6 }, telaOriginal: { p: 780, m: 160, d: 10 }, bateria: { p: 115, m: 70, d: 4 }, camera: { p: 220, m: 80, d: 7 } },
                'samsung galaxy z flip 4': { tela: { p: 540, m: 165, d: 9 }, tela2aLinha: { p: 360, m: 135, d: 7 }, telaOriginal: { p: 1100, m: 230, d: 11 }, bateria: { p: 135, m: 75, d: 4 }, camera: { p: 230, m: 80, d: 7 } },
                'samsung galaxy z fold 4': { tela: { p: 1150, m: 290, d: 12 }, tela2aLinha: { p: 740, m: 230, d: 9 }, telaOriginal: { p: 2300, m: 420, d: 14 }, bateria: { p: 185, m: 90, d: 5 }, camera: { p: 360, m: 110, d: 8 } },
                // === MOTOROLAS ===
                'moto e4': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 70, m: 50, d: 2 }, telaOriginal: { p: 160, m: 60, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto e5': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 70, m: 50, d: 2 }, telaOriginal: { p: 160, m: 60, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 38, m: 35, d: 2 } },
                'moto e6': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 75, m: 50, d: 2 }, telaOriginal: { p: 165, m: 60, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 38, m: 35, d: 2 } },
                'moto e7': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 75, m: 50, d: 2 }, telaOriginal: { p: 165, m: 60, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 40, m: 38, d: 2 } },
                'moto g4': { tela: { p: 100, m: 60, d: 3 }, tela2aLinha: { p: 70, m: 50, d: 2 }, telaOriginal: { p: 160, m: 60, d: 4 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 38, m: 35, d: 2 } },
                'moto g5': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 50, d: 3 }, telaOriginal: { p: 165, m: 60, d: 5 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 40, m: 38, d: 2 } },
                'moto g5 plus': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 50, d: 3 }, telaOriginal: { p: 170, m: 60, d: 5 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 42, m: 38, d: 2 } },
                'moto g6': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 50, d: 3 }, telaOriginal: { p: 175, m: 60, d: 5 }, bateria: { p: 60, m: 50, d: 2 }, conector: { p: 42, m: 38, d: 2 } },
                'moto g6 plus': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 50, d: 3 }, telaOriginal: { p: 185, m: 65, d: 5 }, bateria: { p: 65, m: 48, d: 3 }, conector: { p: 45, m: 40, d: 2 } },
                'moto g7': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 50, d: 3 }, telaOriginal: { p: 190, m: 65, d: 5 }, bateria: { p: 65, m: 48, d: 3 }, conector: { p: 45, m: 40, d: 3 } },
                'moto g7 plus': { tela: { p: 110, m: 60, d: 4 }, tela2aLinha: { p: 85, m: 50, d: 3 }, telaOriginal: { p: 200, m: 70, d: 5 }, bateria: { p: 65, m: 48, d: 3 }, conector: { p: 48, m: 40, d: 3 } },
                'moto g8': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 50, d: 3 }, telaOriginal: { p: 175, m: 60, d: 5 }, bateria: { p: 60, m: 50, d: 2 } },
                'moto g8 plus': { tela: { p: 120, m: 60, d: 4 }, tela2aLinha: { p: 90, m: 55, d: 3 }, telaOriginal: { p: 220, m: 75, d: 5 }, bateria: { p: 70, m: 48, d: 3 }, conector: { p: 50, m: 42, d: 3 } },
                'moto g9': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 50, d: 3 }, telaOriginal: { p: 185, m: 65, d: 5 }, bateria: { p: 60, m: 50, d: 2 } },
                'moto g9 plus': { tela: { p: 135, m: 60, d: 5 }, tela2aLinha: { p: 100, m: 55, d: 4 }, telaOriginal: { p: 250, m: 80, d: 6 }, bateria: { p: 75, m: 50, d: 3 }, conector: { p: 52, m: 45, d: 3 } },
                'moto g10': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 50, d: 3 }, telaOriginal: { p: 190, m: 65, d: 5 }, bateria: { p: 62, m: 45, d: 2 } },
                'moto g20': { tela: { p: 110, m: 60, d: 4 }, tela2aLinha: { p: 85, m: 50, d: 3 }, telaOriginal: { p: 200, m: 68, d: 5 }, bateria: { p: 65, m: 48, d: 3 } },
                'moto g30': { tela: { p: 115, m: 60, d: 5 }, tela2aLinha: { p: 90, m: 50, d: 4 }, telaOriginal: { p: 210, m: 70, d: 6 }, bateria: { p: 70, m: 50, d: 3 } },
                'moto g40': { tela: { p: 150, m: 65, d: 5 }, tela2aLinha: { p: 115, m: 55, d: 4 }, telaOriginal: { p: 280, m: 85, d: 6 }, bateria: { p: 78, m: 52, d: 3 }, conector: { p: 55, m: 45, d: 3 } },
                'moto g50': { tela: { p: 125, m: 60, d: 5 }, tela2aLinha: { p: 95, m: 50, d: 4 }, telaOriginal: { p: 230, m: 72, d: 6 }, bateria: { p: 72, m: 50, d: 3 } },
                'moto g60': { tela: { p: 135, m: 60, d: 5 }, tela2aLinha: { p: 100, m: 52, d: 4 }, telaOriginal: { p: 250, m: 78, d: 6 }, bateria: { p: 75, m: 52, d: 3 } },
                'moto g100': { tela: { p: 250, m: 80, d: 6 }, tela2aLinha: { p: 170, m: 70, d: 5 }, telaOriginal: { p: 470, m: 110, d: 7 }, bateria: { p: 98, m: 58, d: 3 }, conector: { p: 65, m: 50, d: 3 } },
                'moto g200': { tela: { p: 290, m: 90, d: 7 }, tela2aLinha: { p: 200, m: 80, d: 5 }, telaOriginal: { p: 560, m: 125, d: 8 }, bateria: { p: 110, m: 62, d: 4 }, conector: { p: 70, m: 52, d: 3 } },
                // === XIAOMIS (BATERIA COM PEÇA A PARTIR DE R$ 60 + MÃO DE OBRA) ===
                'xiaomi redmi 9': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 45, d: 3 }, telaOriginal: { p: 175, m: 65, d: 5 }, bateria: { p: 60, m: 50, d: 2 } },
                'xiaomi redmi 9a': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 70, m: 42, d: 3 }, telaOriginal: { p: 165, m: 60, d: 5 }, bateria: { p: 60, m: 50, d: 2 } },
                'xiaomi redmi 10': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 45, d: 3 }, telaOriginal: { p: 190, m: 68, d: 5 }, bateria: { p: 65, m: 50, d: 2 } },
                'xiaomi redmi note 8': { tela: { p: 100, m: 60, d: 4 }, tela2aLinha: { p: 75, m: 50, d: 3 }, telaOriginal: { p: 180, m: 70, d: 5 }, bateria: { p: 60, m: 50, d: 2 } },
                'xiaomi redmi note 9': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 48, d: 3 }, telaOriginal: { p: 195, m: 70, d: 5 }, bateria: { p: 65, m: 50, d: 3 } },
                'xiaomi redmi note 10': { tela: { p: 120, m: 60, d: 5 }, tela2aLinha: { p: 90, m: 50, d: 4 }, telaOriginal: { p: 220, m: 75, d: 6 }, bateria: { p: 70, m: 50, d: 3 } },
                'xiaomi redmi note 11': { tela: { p: 135, m: 60, d: 5 }, tela2aLinha: { p: 100, m: 52, d: 4 }, telaOriginal: { p: 250, m: 80, d: 6 }, bateria: { p: 75, m: 50, d: 3 } },
                'xiaomi poco x3': { tela: { p: 145, m: 62, d: 5 }, tela2aLinha: { p: 105, m: 55, d: 4 }, telaOriginal: { p: 270, m: 85, d: 6 }, bateria: { p: 80, m: 55, d: 3 } },
                                'xiaomi poco m3': { tela: { p: 105, m: 60, d: 4 }, tela2aLinha: { p: 80, m: 45, d: 3 }, telaOriginal: { p: 190, m: 68, d: 5 }, bateria: { p: 65, m: 50, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                // === MODELOS POPULARES 2024-2026 COM PREÇO JUSTO REVISADO ===
                'samsung a05': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a05s': { tela: { p: 95, m: 50, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a06': { tela: { p: 100, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a15': { tela: { p: 115, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'samsung a22': { tela: { p: 115, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a23': { tela: { p: 115, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a24': { tela: { p: 125, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'samsung a25': { tela: { p: 135, m: 65, d: 3 }, bateria: { p: 70, m: 50, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'samsung a30': { tela: { p: 115, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a30s': { tela: { p: 115, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a33': { tela: { p: 155, m: 65, d: 4 }, bateria: { p: 75, m: 50, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'samsung a34': { tela: { p: 165, m: 70, d: 4 }, bateria: { p: 75, m: 50, d: 2 }, conector: { p: 45, m: 40, d: 2 } },
                'samsung a35': { tela: { p: 185, m: 75, d: 4 }, bateria: { p: 80, m: 50, d: 2 }, conector: { p: 45, m: 45, d: 2 } },
                'samsung a50': { tela: { p: 130, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'samsung a55': { tela: { p: 220, m: 80, d: 4 }, bateria: { p: 85, m: 55, d: 2 }, conector: { p: 50, m: 45, d: 2 } },
                'moto e13': { tela: { p: 85, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto e20': { tela: { p: 85, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto e22': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto e32': { tela: { p: 95, m: 50, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g04': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g05': { tela: { p: 95, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g06': { tela: { p: 100, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g14': { tela: { p: 100, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g22': { tela: { p: 95, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g23': { tela: { p: 100, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g24': { tela: { p: 100, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g31': { tela: { p: 115, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g32': { tela: { p: 105, m: 55, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'moto g34': { tela: { p: 110, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 35, d: 2 } },
                'moto g42': { tela: { p: 120, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 35, d: 2 } },
                'moto g52': { tela: { p: 125, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 35, d: 2 } },
                'moto g53': { tela: { p: 115, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 35, d: 2 } },
                'moto g54': { tela: { p: 120, m: 60, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'moto g84': { tela: { p: 165, m: 70, d: 4 }, bateria: { p: 75, m: 50, d: 2 }, conector: { p: 45, m: 40, d: 2 } },
                'xiaomi redmi 9c': { tela: { p: 85, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi 10c': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi 12': { tela: { p: 105, m: 55, d: 3 }, bateria: { p: 65, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi 12c': { tela: { p: 85, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi 13c': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi a3': { tela: { p: 85, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi a5': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 55, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi redmi note 12': { tela: { p: 125, m: 60, d: 3 }, bateria: { p: 70, m: 50, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'xiaomi redmi note 13': { tela: { p: 140, m: 65, d: 4 }, bateria: { p: 75, m: 50, d: 2 }, conector: { p: 45, m: 40, d: 2 } },
                'xiaomi redmi note 14': { tela: { p: 160, m: 70, d: 4 }, bateria: { p: 80, m: 50, d: 2 }, conector: { p: 45, m: 45, d: 2 } },
                'xiaomi redmi note 15': { tela: { p: 175, m: 75, d: 4 }, bateria: { p: 85, m: 55, d: 2 }, conector: { p: 45, m: 45, d: 2 } },
                'xiaomi poco c65': { tela: { p: 90, m: 50, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'xiaomi poco x5': { tela: { p: 145, m: 65, d: 4 }, bateria: { p: 75, m: 50, d: 2 }, conector: { p: 40, m: 40, d: 2 } },
                'xiaomi poco x6': { tela: { p: 165, m: 70, d: 4 }, bateria: { p: 80, m: 50, d: 2 }, conector: { p: 45, m: 40, d: 2 } },
                'realme c53': { tela: { p: 95, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } },
                'realme c55': { tela: { p: 100, m: 55, d: 3 }, bateria: { p: 60, m: 45, d: 2 }, conector: { p: 35, m: 35, d: 2 } }
            },

            // Fallback por marca (se modelo exato não encontrado)
            tabelaServicosMarca: {
                'iphone': { tela: { p: 200, m: 50, d: 5 }, tela2aLinha: { p: 135, m: 45, d: 4 }, telaOriginal: { p: 400, m: 75, d: 5 }, bateria: { p: 90, m: 30, d: 3 }, camera: { p: 150, m: 40, d: 5 }, conector: { p: 60, m: 40, d: 3 }, botao: { p: 50, m: 40, d: 3 }, software: { p: 0, m: 50, d: 1 } },
                'samsung': { tela: { p: 180, m: 40, d: 5 }, tela2aLinha: { p: 120, m: 35, d: 4 }, telaOriginal: { p: 360, m: 60, d: 5 }, bateria: { p: 60, m: 25, d: 3 }, camera: { p: 120, m: 35, d: 5 }, conector: { p: 30, m: 35, d: 3 }, software: { p: 0, m: 40, d: 1 } },
                'xiaomi': { tela: { p: 130, m: 35, d: 5 }, tela2aLinha: { p: 90, m: 30, d: 4 }, telaOriginal: { p: 250, m: 50, d: 5 }, bateria: { p: 45, m: 25, d: 2 }, camera: { p: 100, m: 30, d: 5 }, conector: { p: 25, m: 30, d: 2 }, software: { p: 0, m: 35, d: 1 } },
                'motorola': { tela: { p: 80, m: 30, d: 3 }, tela2aLinha: { p: 55, m: 25, d: 2 }, telaOriginal: { p: 160, m: 45, d: 4 }, bateria: { p: 45, m: 25, d: 2 }, conector: { p: 30, m: 35, d: 3 }, software: { p: 0, m: 30, d: 1 } },
                'lg': { tela: { p: 75, m: 25, d: 3 }, tela2aLinha: { p: 50, m: 20, d: 2 }, telaOriginal: { p: 150, m: 40, d: 4 }, bateria: { p: 42, m: 20, d: 2 }, conector: { p: 28, m: 25, d: 3 }, software: { p: 0, m: 30, d: 1 } },
                'asus': { tela: { p: 110, m: 30, d: 4 }, tela2aLinha: { p: 75, m: 25, d: 3 }, telaOriginal: { p: 220, m: 45, d: 5 }, bateria: { p: 55, m: 22, d: 2 }, conector: { p: 32, m: 25, d: 3 }, software: { p: 0, m: 30, d: 1 } },
                'generico': { tela: { p: 100, m: 35, d: 4 }, tela2aLinha: { p: 70, m: 30, d: 3 }, telaOriginal: { p: 200, m: 50, d: 4 }, bateria: { p: 50, m: 25, d: 2 }, camera: { p: 80, m: 30, d: 4 }, conector: { p: 25, m: 30, d: 2 }, software: { p: 0, m: 30, d: 1 }, limpeza: { p: 10, m: 40, d: 2 } }
            },

            // === PREÇOS PELÍCULA COM CUSTOS REAIS ===
            precoPelicula: {
                custosReais: {
                    hd_hidrogel: 3.00,  // Custo fixo R$ 3,00 solicitado pelo usuário
                    fosca: 3.00
                },
                basico: { frontalHD: 39.90, frontalFosca: 49.90, traseira: 39.90, completa: 120 },
                medio: { frontalHD: 49.90, frontalFosca: 59.90, traseira: 49.90, completa: 160 },
                premium: { frontalHD: 59.90, frontalFosca: 69.90, traseira: 59.90, completa: 180 },
                top: { frontalHD: 69.90, frontalFosca: 84.90, traseira: 69.90, completa: 198.90 },
                tablet7: 49.90, tablet9: 59.90, tablet11: 69.90,
                relogio_basico: 29.90, relogio_premium: 39.90
            },

            // === TABELA RECONHECIMENTO PELÍCULAS (100+ modelos) ===
            tabelaPeliculasModelo: {
                // IPHONE
                'iphone 6': 'basico', 'iphone 6 plus': 'basico', 'iphone 6s': 'basico', 'iphone 6s plus': 'basico',
                'iphone 7': 'basico', 'iphone 7 plus': 'basico',
                'iphone 8': 'medio', 'iphone 8 plus': 'medio',
                'iphone x': 'premium', 'iphone xr': 'premium', 'iphone xs': 'premium', 'iphone xs max': 'premium',
                'iphone 11': 'premium', 'iphone 11 pro': 'premium', 'iphone 11 pro max': 'premium',
                'iphone 12': 'premium', 'iphone 12 mini': 'premium', 'iphone 12 pro': 'premium', 'iphone 12 pro max': 'premium',
                'iphone 13': 'premium', 'iphone 13 mini': 'premium', 'iphone 13 pro': 'premium', 'iphone 13 pro max': 'premium',
                'iphone 14': 'top', 'iphone 14 plus': 'top', 'iphone 14 pro': 'top', 'iphone 14 pro max': 'top',
                'iphone 15': 'top', 'iphone 15 plus': 'top', 'iphone 15 pro': 'top', 'iphone 15 pro max': 'top',
                'iphone 16': 'top', 'iphone 16 plus': 'top', 'iphone 16 pro': 'top', 'iphone 16 pro max': 'top',
                // SAMSUNG S
                'samsung s10': 'medio', 'samsung s10 plus': 'medio',
                'samsung s20': 'premium', 'samsung s20 fe': 'premium', 'samsung s20 plus': 'premium',
                'samsung s21': 'premium', 'samsung s21 fe': 'premium', 'samsung s21 plus': 'premium',
                'samsung s22': 'top', 'samsung s22 plus': 'top', 'samsung s23': 'top', 'samsung s23 fe': 'top',
                'samsung s23 plus': 'top', 'samsung s24': 'top', 'samsung s24 plus': 'top',
                // SAMSUNG A
                'samsung a01': 'basico', 'samsung a02': 'basico', 'samsung a03': 'basico',
                'samsung a04': 'basico', 'samsung a04s': 'basico', 'samsung a05': 'basico', 'samsung a05s': 'basico',
                'samsung a10': 'basico', 'samsung a10s': 'basico', 'samsung a11': 'basico',
                'samsung a12': 'basico', 'samsung a13': 'basico', 'samsung a14': 'basico', 'samsung a15': 'basico',
                'samsung a20': 'basico', 'samsung a20s': 'basico', 'samsung a21s': 'basico',
                'samsung a22': 'medio', 'samsung a23': 'medio', 'samsung a24': 'medio',
                'samsung a30': 'medio', 'samsung a30s': 'medio', 'samsung a31': 'medio',
                'samsung a32': 'medio', 'samsung a33': 'medio', 'samsung a34': 'medio',
                'samsung a50': 'medio', 'samsung a51': 'medio',
                'samsung a52': 'premium', 'samsung a53': 'premium', 'samsung a54': 'premium', 'samsung a55': 'premium',
                'samsung a70': 'medio', 'samsung a71': 'medio', 'samsung a72': 'premium',
                // MOTO E
                'moto e6': 'basico', 'moto e7': 'basico', 'moto e20': 'basico', 'moto e22': 'basico', 'moto e32': 'basico', 'moto e40': 'basico',
                // MOTO G
                'moto g8': 'basico', 'moto g9': 'basico', 'moto g10': 'basico', 'moto g20': 'basico',
                'moto g30': 'medio', 'moto g40': 'medio', 'moto g50': 'medio', 'moto g60': 'medio',
                'moto g71': 'medio', 'moto g72': 'medio', 'moto g82': 'medio',
                'moto g100': 'premium', 'moto g200': 'premium',
                // XIAOMI REDMI
                'redmi 9': 'basico', 'redmi 9a': 'basico', 'redmi 9c': 'basico',
                'redmi 10': 'basico', 'redmi 10a': 'basico', 'redmi 10c': 'basico',
                'redmi 12': 'basico', 'redmi 13': 'basico',
                'redmi note 9': 'basico', 'redmi note 10': 'medio', 'redmi note 11': 'medio',
                'redmi note 12': 'medio', 'redmi note 13': 'medio',
                // POCO
                'poco x3': 'medio', 'poco x4': 'medio', 'poco x5': 'medio',
                'poco m3': 'basico', 'poco m4': 'basico', 'poco m5': 'basico',
                'poco c3': 'basico', 'poco c40': 'basico', 'poco c55': 'basico',
                'poco f3': 'premium', 'poco f4': 'premium', 'poco f5': 'premium',
                // REALME
                'realme c3': 'basico', 'realme c11': 'basico', 'realme c15': 'basico', 'realme c21': 'basico',
                'realme 6': 'basico', 'realme 7': 'medio', 'realme 8': 'medio', 'realme 9': 'medio'
            },

            // === CAMPANHAS ===
            campanhas: {
                historico: [
                    {
                        data: '2025-04-01',
                        investimento: 1500,
                        duracao: 30,
                        resultado: 'zero_a_zero',
                        vendas: 5,
                        faturamento: 10000,
                        lucro: 1600,
                        problemas: ['Gestão WhatsApp sobrecarregada', 'Falta de estoque']
                    }
                ],
                checklist: {
                    funcionario: false,
                    estoque15k: false,
                    caixa5k: false,
                    whatsappAuto: false,
                    treinamento: false,
                    metasROI: false
                }
            },

            // === HISTÓRICO ===
            historico: { vendas: [], compras: [], movimentacoes: [] },

            // === VENDAS FIADO ===
            fiados: [],

            // === AUTO-APRENDIZADO ===
            aprendizado: {
                precosHistorico: {},
                vendasModelo: {},
                sazonalidade: {
                    '12': { nome: 'Dezembro', mult: 1.4 },
                    '01': { nome: 'Janeiro', mult: 0.8 },
                    '02': { nome: 'Fevereiro', mult: 0.8 },
                    '03': { nome: 'Março', mult: 0.9 },
                    '06': { nome: 'Junho (São João)', mult: 1.6 }
                }
            },

            // === FAIXAS DE PREÇO AMARGOSA ===
            faixasAmargosa: {
                android: { ideal: 1200, medio: 2000, alto: 2500 },
                iphone: { ideal: 2500, medio: 3500, alto: 4500 }
            },

            // === ENCOMENDAS ===
            encomendas: [],

            // === DESPESAS FIXAS DA LOJA ===
            despesasFixas: [
                { id: 1, nome: 'Aluguel da Loja', valor: 600, vencimento: 'Dia 10' },
                { id: 2, nome: 'Energia Elétrica / Luz', valor: 150, vencimento: 'Dia 15' },
                { id: 3, nome: 'Salário / Comissão (Vendedor)', valor: 1200, vencimento: 'Mensal' },
                { id: 4, nome: 'Internet Fibra', valor: 100, vencimento: 'Dia 05' },
                { id: 5, nome: 'Segurança / Alarme', valor: 80, vencimento: 'Dia 20' }
            ],

            // === CONFIGURAÇÕES DA LOJA ===
            configuracoes: {
                nomeLoja: 'Cesinha Acessórios',
                cidadeLoja: 'Amargosa',
                telefoneLoja: '',
                chavePIX: '',
                nomeBeneficiario: '',
                pixTipo: 'telefone',
                taxaJuros: 0,
                metaDiaria: 77,
                estoqueMinimo: 3,
                diasParado: 60,
                obsRecibo: '',
                ultimoRelatorio: '',
                backupUrl: '',
                backupEncrypt: false,
                backupKey: '',
                relatorioSemanalUrl: '',
                whatsappUrl: '',
                whatsappInstance: '',
                whatsappToken: '',
                telegramChatId: '1969798643',
                telegramChatIdEquipe: '-5232346648',
                telegramBotToken: '8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34',
                primeiroAcesso: true
            },

            // === MIGRAÇÕES ===
            migrations: { precosFev2026: true },

            // === FIDELIDADE ===
            fidelidade: { clientes: {} },

            // === FUNDO DE CUSTO & DIVISÃO DE LUCRO (v3.4.0) ===
            fundoCustoEstoque: {
                totalAcumulado: 0,
                historicoCusto: []
            },
            // === FUNDO DE REPOSIÇÃO EXCLUSIVO DE FOGOS DE ARTIFÍCIO ===
            fundoReposicaoFogos: {
                totalAcumulado: 0,
                saldoGuardado: 0,
                historicoCusto: [],
                historicoMovimentacoes: []
            },
            divisaoLucro: {
                totalLucroAcumulado: 0,
                porcentagemLoja: 40,
                porcentagemPai: 60,
                acumuladoLoja40: 0,
                acumuladoPai60: 0,
                historicoDivisao: []
            },

            // === BLOCO DE NOTAS ===
            blocoNotas: {},
            filaTelegramPendente: [],

            // === TIMESTAMPS ===
            ultimoBackupAutomatico: '',
            ultimoBackupDiario: '',
            ultimoMesZeroCaixaSecundario: '',
            ultimoMesEmailRelatorio: '',
            ultimoUploadBackupRemoto: '',
            ultimaAtualizacaoPrecos: '2026-02-20'
        };
    }

    // ===== CARREGAR E SALVAR =====
    loadData() {
        try {
            let saved = localStorage.getItem(this.storageKey);
            // Se não houver localStorage ou ainda não tiver sido hidratado com o backup oficial de 23/10/2026:
            if (typeof window !== 'undefined' && window.INITIAL_BACKUP_DATA) {
                let precisaHidratar = !saved;
                if (saved) {
                    try {
                        const pCheck = JSON.parse(saved);
                        if (!pCheck._hidratadoBackup20261023_v2) precisaHidratar = true;
                    } catch (e) { precisaHidratar = true; }
                }
                if (precisaHidratar) {
                    const defData = this.getDefaultData();
                    const bkp = JSON.parse(JSON.stringify(window.INITIAL_BACKUP_DATA));
                    // Preservar a tabela expandida de peças de conserto do código novo + customizações do backup
                    bkp.tabelaServicosModelo = { ...(bkp.tabelaServicosModelo || {}), ...(defData.tabelaServicosModelo || {}) };
                    bkp.tabelaServicosMarca = { ...(bkp.tabelaServicosMarca || {}), ...(defData.tabelaServicosMarca || {}) };
                    bkp.tabelaPeliculasModelo = { ...(defData.tabelaPeliculasModelo || {}), ...(bkp.tabelaPeliculasModelo || {}) };
                    bkp._hidratadoBackup20261023 = true;
                    bkp._hidratadoBackup20261023_v2 = true;
                    saved = JSON.stringify(bkp);
                    try { localStorage.setItem(this.storageKey, saved); } catch (e) {}
                }
            }
            if (saved) {
                const parsed = JSON.parse(saved);
                const defRef = this.getDefaultData();
                const merged = this._merge(defRef, parsed);
                merged.tabelaServicosModelo = { ...(parsed.tabelaServicosModelo || {}), ...(defRef.tabelaServicosModelo || {}) };
                merged.tabelaServicosMarca = { ...(parsed.tabelaServicosMarca || {}), ...(defRef.tabelaServicosMarca || {}) };
                if (!merged.fundoCustoEstoque) merged.fundoCustoEstoque = { totalAcumulado: 0, historicoCusto: [] };
                if (!merged.fundoReposicaoFogos) merged.fundoReposicaoFogos = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
                if (!merged.divisaoLucro) merged.divisaoLucro = { totalLucroAcumulado: 0, porcentagemLoja: 40, porcentagemPai: 60, acumuladoLoja40: 0, acumuladoPai60: 0, historicoDivisao: [] };
                if (!merged.financeiro) merged.financeiro = {};
                if (merged.financeiro.caixaTerciario === undefined) merged.financeiro.caixaTerciario = 0;
                if (!merged.migrations) merged.migrations = {};

                this.limparDuplicatasHistorico(merged);
                
                // === FAXINA DE MOVIMENTAÇÕES E FECHAMENTOS COM VALORES ANÔMALOS (> R$ 50.000) ===
                if (merged.movimentacoesCaixa && Array.isArray(merged.movimentacoesCaixa)) {
                    merged.movimentacoesCaixa = merged.movimentacoesCaixa.filter(m => {
                        const vTotal = parseFloat(m.vendasTotal || 0);
                        const val = parseFloat(m.valor || 0);
                        if (vTotal > 50000 || val > 50000) return false;
                        return true;
                    });
                }
                if (merged.historico && merged.historico.vendas && Array.isArray(merged.historico.vendas)) {
                    merged.historico.vendas = merged.historico.vendas.filter(v => {
                        const val = parseFloat(v.valorVenda || v.valor || 0);
                        if (val > 50000) return false;
                        return true;
                    });
                }
                // ==============================================================================
                
                // === META MENSAL FIXADA EM R$ 7.000,00 COM ZERAMENTO AUTOMÁTICO DIA 30 ===
                if (!merged.meta) merged.meta = {};
                merged.meta.objetivo = 7000;
                merged.meta.diaZeramento = 30;
                merged.meta.nome = '🎯 Meta Mensal da Loja';

                // === CÁLCULO DINÂMICO E AUDITORIA DA META / COMISSÃO (CICLO CORRENTE) ===
                const mesAtual = (merged.ultimoMesFechado || this.hojeLocal().substring(0, 7));
                const dataInicioCiclo = merged.dataInicioCicloMeta || '';
                let comissaoCalculada = 0;
                if (merged.historico && Array.isArray(merged.historico.vendas)) {
                    merged.historico.vendas.forEach(v => {
                        if (v._cicloMetaFechado) return;
                        const dataYMD = (v.data || '').substring(0, 10);
                        if (dataInicioCiclo && dataYMD < dataInicioCiclo) return;
                        const dt = (v.data || '').substring(0, 7);
                        if (dt === mesAtual || (dataInicioCiclo && dataYMD >= dataInicioCiclo)) {
                            const prod = (v.produto || '').toLowerCase();
                            const tipo = (v.tipo || '').toLowerCase();
                            const isFogos = tipo === 'fogos' || prod.includes('fogo') || prod.includes('19x4') || prod.includes('12x1') || prod.includes('foguete');
                            
                            if (!isFogos) {
                                const val = parseFloat(v.valorVenda || v.valor || v.valorTotal || 0);
                                const isCelular = tipo === 'celular' || tipo === 'avista' || tipo === 'parcelado_maquina' || tipo === 'pix' || prod.includes('iphone') || prod.includes('samsung') || prod.includes('xiaomi') || prod.includes('motorola') || prod.includes('redmi');
                                
                                if (isCelular) {
                                    comissaoCalculada += Math.round(val * 0.03 * 100) / 100;
                                } else {
                                    const custo = parseFloat(v.custo || v.custoPeca || 0);
                                    let lucro = parseFloat(v.lucro !== undefined ? v.lucro : (val - custo));
                                    if (isNaN(lucro) || lucro < 0) lucro = 0; // Prejuízo não gera comissão
                                    comissaoCalculada += Math.round(lucro * 100) / 100;
                                }
                            }
                        }
                    });
                }

                merged.comissaoIlannaMensal = Math.round(comissaoCalculada * 100) / 100;
                
                // Garantir sanitização do saldo de caixa da gaveta (sem valores hardcoded)
                if (merged.financeiro) {
                    if (merged.financeiro.caixaSecundario === undefined || isNaN(merged.financeiro.caixaSecundario)) {
                        merged.financeiro.caixaSecundario = 0;
                    }
                }

                // === AUTO-UNIFICAÇÃO E AUTO-CONEXÃO DO TELEGRAM ===
                if (!merged.configuracoes) merged.configuracoes = {};
                if (!merged.configIntegracoes) merged.configIntegracoes = {};
                const defaultCfg = this.getDefaultData().configuracoes;
                let savedTg = {};
                try { savedTg = JSON.parse(localStorage.getItem('strategyos_telegram_config') || '{}'); } catch (e) {}

                const tokenFinal = merged.configuracoes.telegramBotToken || merged.configIntegracoes.telegramToken || savedTg.botToken || defaultCfg.telegramBotToken;
                const chatIdFinal = merged.configuracoes.telegramChatId || merged.configIntegracoes.telegramChatId || savedTg.chatId || defaultCfg.telegramChatId;
                const equipeFinal = merged.configuracoes.telegramChatIdEquipe || savedTg.chatIdEquipe || defaultCfg.telegramChatIdEquipe;

                merged.configuracoes.telegramBotToken = tokenFinal;
                merged.configuracoes.telegramChatId = chatIdFinal;
                merged.configuracoes.telegramChatIdEquipe = equipeFinal;
                if (merged.configuracoes.telegramAutoVendas === undefined) merged.configuracoes.telegramAutoVendas = true;
                if (merged.configuracoes.telegramAutoCaixa === undefined) merged.configuracoes.telegramAutoCaixa = true;
                if (merged.configuracoes.telegramAutoFechamento === undefined) merged.configuracoes.telegramAutoFechamento = true;
                if (merged.configuracoes.telegramAutoAlertas === undefined) merged.configuracoes.telegramAutoAlertas = true;

                merged.configIntegracoes.telegramToken = tokenFinal;
                merged.configIntegracoes.telegramChatId = chatIdFinal;
                merged.configIntegracoes.telegramAutoDiario = merged.configuracoes.telegramAutoFechamento;
                merged.ultimoFechamentoDiario = this.hojeLocal();
                merged.ultimoFechamentoAutoTelegram = this.hojeLocal();
                merged.ultimoBackupDiarioTelegram = this.hojeLocal();
                merged.filaTelegramPendente = [];

                return merged;
            }
        } catch (e) { console.error('Erro ao carregar dados:', e); }

        return this.getDefaultData();
    }

    _mesclarNovosDadosBackup(target, backup) {
        if (!target || !backup) return;

        // REGRA ABSOLUTA DO PROJETO: Os dados existentes do usuário (localStorage/Supabase) têm PRIORIDADE TOTAL.
        // Nunca sobrescrever nem reinjetar itens em tabelas/arrays que o usuário já utiliza.

        // 1. Clientes: Apenas preenche se a lista estiver vazia ou mescla novos sem alterar os existentes
        if (backup.clientes && Array.isArray(backup.clientes)) {
            if (!target.clientes) target.clientes = [];
            if (target.clientes.length === 0) {
                target.clientes = [...backup.clientes];
            } else {
                const nomesExistentes = new Set(target.clientes.map(c => (c.nome || '').toLowerCase().trim()));
                backup.clientes.forEach(c => {
                    const n = (c.nome || '').toLowerCase().trim();
                    if (n && !nomesExistentes.has(n)) {
                        nomesExistentes.add(n);
                        target.clientes.push(c);
                    }
                });
            }
        }

        // 2. Histórico de Vendas: Apenas se o histórico estiver totalmente vazio
        if ((!target.historico || !target.historico.vendas || target.historico.vendas.length === 0) && backup.historico?.vendas) {
            if (!target.historico) target.historico = { vendas: [], compras: [], movimentacoes: [] };
            target.historico.vendas = [...backup.historico.vendas];
        }

        // 3. Movimentações de Caixa: Apenas se a lista de movimentações estiver totalmente vazia
        if ((!target.movimentacoesCaixa || target.movimentacoesCaixa.length === 0) && backup.movimentacoesCaixa) {
            target.movimentacoesCaixa = [...backup.movimentacoesCaixa];
        }

        // 5. Preservar Produtos Procurados
        if (backup.produtosProcurados && Array.isArray(backup.produtosProcurados)) {
            if (!target.produtosProcurados) target.produtosProcurados = [];
            const idsExistentes = new Set(target.produtosProcurados.map(p => String(p.id)));
            backup.produtosProcurados.forEach(p => {
                if (!idsExistentes.has(String(p.id))) target.produtosProcurados.push(p);
            });
        }
    }

    _merge(def, saved) {
        const result = { ...def };
        for (const key in saved) {
            if (saved[key] !== null && typeof saved[key] === 'object' && !Array.isArray(saved[key])) {
                result[key] = this._merge(def[key] || {}, saved[key]);
            } else {
                result[key] = saved[key];
            }
        }
        return result;
    }

    saveData() {
        try {
            this.data._ultimoSaveLocal = Date.now();
            const jsonStr = JSON.stringify(this.data);
            localStorage.setItem(this.storageKey, jsonStr);
            localStorage.setItem(this.storageKey + '_backup', jsonStr);

            // Camada 2: Cofre Local IndexedDB (Alta capacidade e resistente a limpeza simples)
            this._salvarIndexedDB(jsonStr);

            // Camada 3: Sincronização Automática com Banco em Nuvem Cloudflare KV (debounce 2.5s)
            if (!this.isModoTreino()) {
                this._agendarSyncCloudflare();
            }

            // Camada 4: Backup automático local em disco via servidor PowerShell (quando em localhost)
            if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                if (!this._lastDiskBackup || Date.now() - this._lastDiskBackup > 60000) {
                    this._lastDiskBackup = Date.now();
                    fetch('/api/backup-auto', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: jsonStr
                    }).catch(function(){});
                }
            }
        } catch (e) { console.error('Erro ao salvar dados:', e); }
    }

    initCloudRedundancy() {
        if (typeof window === 'undefined') return;
        this.cloudSyncUrl = 'https://cesinha-acessorios.pages.dev/api/cloud-sync';
        setTimeout(() => {
            this.sincronizarNuvemCloudflare();
        }, 1500);
        if (!this._intervalCloudSync) {
            this._intervalCloudSync = setInterval(() => {
                if (typeof document !== 'undefined' && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
                this.sincronizarNuvemCloudflare();
            }, 45000);
        }
    }

    _salvarIndexedDB(jsonStr) {
        try {
            if (typeof indexedDB === 'undefined') return;
            const req = indexedDB.open('StrategyOS_SafeVault', 1);
            req.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('backups')) {
                    db.createObjectStore('backups');
                }
            };
            req.onsuccess = function(e) {
                try {
                    const db = e.target.result;
                    const tx = db.transaction('backups', 'readwrite');
                    const store = tx.objectStore('backups');
                    store.put(jsonStr, 'latest');
                    store.put(jsonStr, 'snapshot_' + new Date().toISOString().substring(0, 10));
                } catch (errIdb) {}
            };
        } catch (e) {}
    }

    _agendarSyncCloudflare() {
        if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
        if (this._timerSyncCF) clearTimeout(this._timerSyncCF);
        this._timerSyncCF = setTimeout(() => {
            this.salvarNuvemCloudflare();
        }, 2500);
    }

    async salvarNuvemCloudflare() {
        if (typeof window === 'undefined' || this.isModoTreino()) return;
        try {
            const url = this.cloudSyncUrl || 'https://cesinha-acessorios.pages.dev/api/cloud-sync';
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: this.data })
            });
        } catch (e) {}
    }

    async sincronizarNuvemCloudflare() {
        if (typeof window === 'undefined' || this.isModoTreino()) return;
        try {
            const url = this.cloudSyncUrl || 'https://cesinha-acessorios.pages.dev/api/cloud-sync';
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.ok) return;
            if (json.empty || !json.payload) {
                await this.salvarNuvemCloudflare();
                return;
            }
            const cloudPayload = json.payload;
            const localSaveTime = this.data._ultimoSaveLocal || 0;
            const cloudSaveTime = cloudPayload._ultimoSaveLocal || (json.updated_at ? new Date(json.updated_at).getTime() : 0);

            if (cloudSaveTime > localSaveTime) {
                const defCloud = this.getDefaultData();
                const merged = this._merge(defCloud, cloudPayload);
                merged.tabelaServicosModelo = { ...(cloudPayload.tabelaServicosModelo || {}), ...(defCloud.tabelaServicosModelo || {}) };
                merged.ultimoFechamentoDiario = this.hojeLocal();
                merged.ultimoFechamentoAutoTelegram = this.hojeLocal();
                merged.ultimoBackupDiarioTelegram = this.hojeLocal();
                merged.filaTelegramPendente = [];
                this.data = merged;
                localStorage.setItem(this.storageKey, JSON.stringify(this.data));
                if (typeof UI !== 'undefined' && typeof UI._atualizarAlertas === 'function') {
                    UI._atualizarAlertas();
                }
            } else if (localSaveTime > cloudSaveTime + 5000) {
                await this.salvarNuvemCloudflare();
            }
        } catch (e) {}
    }

    // ===== PRODUTOS SEM CUSTO =====
    getProdutosSemCusto() {
        const celulares = (this.data.estoqueCelulares || []).filter(p => p.status === 'disponivel' && (!p.custo || parseFloat(p.custo) <= 0));
        const acessorios = (this.data.estoqueAcessorios || []).filter(p => p.status === 'disponivel' && (!p.custo || parseFloat(p.custo) <= 0));
        return { celulares, acessorios, total: celulares.length + acessorios.length };
    }

    // ===== ZERAR FINANCEIRO (INÍCIO LIMPO) =====
    zerarDadosFinanceiros() {
        this.data.financeiro = {
            caixaPrincipal: 0,
            caixaSecundario: 0,
            caixaTerciario: 0,
            caixaAcessorios: 0,
            caixaAssistencia: 0,
            reservaEmergencia: 0
        };
        this.data.fundoCustoEstoque = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
        this.data.fundoReposicaoFogos = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
        this.data.divisaoLucro = {
            totalLucroAcumulado: 0,
            porcentagemLoja: 40,
            porcentagemPai: 60,
            acumuladoLoja40: 0,
            acumuladoPai60: 0,
            historicoDivisao: []
        };
        this.data.movimentacoesCaixa = [];
        if (this.data.historico) {
            this.data.historico.vendas = [];
            this.data.historico.movimentacoes = [];
        }
        this.data.alertasProdutosSemCusto = [];
        this.saveData();
        if (this.supabase) this.salvarSupabase();
    }

    // ===== GETTERS =====
    getEstoqueCelulares() {
        return (this.data.estoqueCelulares || []);
    }
    getEstoqueAcessorios() {
        return (this.data.estoqueAcessorios || []);
    }
    getEstoque() { return this.getEstoqueCelulares(); }
    getEstoqueUsoLoja() { return this.data.estoqueUsoLoja; }
    getEstoqueCompleto() { return this.data.estoqueCelulares; }
    getCrediarios() { return this.data.crediarios; }
    getCrediariosAtivos() { return this.data.crediarios.filter(c => c.status !== 'quitado'); }
    getClientes() { return this.data.clientes; }
    getHistorico() { return this.data.historico; }

    // ===== PRODUTOS PROCURADOS / DEMANDA EM FALTA =====
    getProdutosProcurados() {
        if (!this.data.produtosProcurados) this.data.produtosProcurados = [];
        return this.data.produtosProcurados
            .filter(p => p.status !== 'comprado' && p.status !== 'resolvido')
            .sort((a, b) => (b.solicitacoes || 1) - (a.solicitacoes || 1));
    }

    adicionarProdutoProcurado(nome, obs = '', vendedor = 'Atendente') {
        if (!this.data.produtosProcurados) this.data.produtosProcurados = [];
        const nomeTrim = (nome || '').trim();
        if (!nomeTrim) return { sucesso: false, erro: 'Informe o nome do produto' };

        const normalizar = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
        const normNovo = normalizar(nomeTrim);

        const existente = this.data.produtosProcurados.find(p => normalizar(p.nome) === normNovo && p.status !== 'comprado' && p.status !== 'resolvido');
        if (existente) {
            existente.solicitacoes = (existente.solicitacoes || 1) + 1;
            existente.ultimaData = new Date().toISOString();
            if (obs && !existente.observacao.includes(obs)) {
                existente.observacao += (existente.observacao ? ' | ' : '') + obs;
            }
        } else {
            this.data.produtosProcurados.push({
                id: Date.now(),
                nome: nomeTrim,
                observacao: obs,
                solicitacoes: 1,
                dataRegistro: new Date().toISOString(),
                ultimaData: new Date().toISOString(),
                vendedor: vendedor,
                status: 'pendente'
            });
        }
        this.saveData();
        return { sucesso: true };
    }

    incrementarProdutoProcurado(id) {
        if (!this.data.produtosProcurados) return;
        const item = this.data.produtosProcurados.find(p => String(p.id) === String(id));
        if (item) {
            item.solicitacoes = (item.solicitacoes || 1) + 1;
            item.ultimaData = new Date().toISOString();
            this.saveData();
        }
    }

    concluirProdutoProcurado(id) {
        if (!this.data.produtosProcurados) return;
        const item = this.data.produtosProcurados.find(p => String(p.id) === String(id));
        if (item) {
            item.status = 'comprado';
            this.saveData();
        }
    }

    deletarProdutoProcurado(id) {
        if (!this.data.produtosProcurados) return;
        this.data.produtosProcurados = this.data.produtosProcurados.filter(p => String(p.id) !== String(id));
        this.saveData();
    }

    zerarProdutosProcurados() {
        const anteriores = Array.isArray(this.data.produtosProcurados) ? this.data.produtosProcurados.length : 0;
        if (anteriores > 0) {
            if (!this.data.historicoPedidosFaltas) this.data.historicoPedidosFaltas = [];
            this.data.historicoPedidosFaltas.push({
                dataPedido: new Date().toISOString(),
                quantidadeItens: anteriores,
                itens: [...this.data.produtosProcurados]
            });
        }
        this.data.produtosProcurados = [];
        this.data._ultimoSaveLocal = Date.now();
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        return { sucesso: true, zerados: anteriores };
    }

    zerarEncomendasClientes() {
        const anteriores = Array.isArray(this.data.encomendas) ? this.data.encomendas.length : 0;
        if (anteriores > 0) {
            if (!this.data.historicoEncomendas) this.data.historicoEncomendas = [];
            this.data.historicoEncomendas.push({
                dataPedido: new Date().toISOString(),
                quantidadeItens: anteriores,
                itens: [...this.data.encomendas]
            });
        }
        this.data.encomendas = [];
        this.data._ultimoSaveLocal = Date.now();
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        return { sucesso: true, zerados: anteriores };
    }

    zerarBlocoNotas() {
        const anteriores = this.data.blocoNotas ? Object.keys(this.data.blocoNotas).length : 0;
        this.data.blocoNotas = {};
        this.data._ultimoSaveLocal = Date.now();
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        return { sucesso: true, zerados: anteriores };
    }

    // ===== LIMPEZA AUTOMÁTICA DE DUPLICATAS DE OS =====
    limparDuplicatasHistorico(targetData) {
        const d = targetData || this.data;
        if (!d) return;

        let alterado = false;

        if (d.historico && Array.isArray(d.historico.vendas)) {
            const vistasOS = new Set();
            const vendasLimpas = [];
            d.historico.vendas.forEach(v => {
                vendasLimpas.push(v);
            });
            d.historico.vendas = vendasLimpas;
        }

        if (d.divisaoLucro && Array.isArray(d.divisaoLucro.historicoDivisao)) {
            const vistasDiv = new Set();
            const divLimpa = [];
            d.divisaoLucro.historicoDivisao.forEach(div => {
                const match = (div.produto || '').match(/OS #\d+/i);
                if (match) {
                    const key = match[0].toUpperCase();
                    if (vistasDiv.has(key)) {
                        alterado = true;
                        return;
                    }
                    vistasDiv.add(key);
                }
                divLimpa.push(div);
            });
            d.divisaoLucro.historicoDivisao = divLimpa;
        }

        if (d.fundoCustoEstoque && Array.isArray(d.fundoCustoEstoque.historicoCusto)) {
            const vistasCusto = new Set();
            const custoLimpo = [];
            d.fundoCustoEstoque.historicoCusto.forEach(c => {
                const match = (c.produto || '').match(/OS #\d+/i);
                if (match) {
                    const key = match[0].toUpperCase();
                    if (vistasCusto.has(key)) {
                        alterado = true;
                        return;
                    }
                    vistasCusto.add(key);
                }
                custoLimpo.push(c);
            });
            d.fundoCustoEstoque.historicoCusto = custoLimpo;
        }

        if (alterado && !targetData) {
            this.saveData();
        }
    }

    // ===== FOTOS DE ORDENS DE SERVIÇO =====
    adicionarFotoOS(numero, base64Data, descricao = '') {
        const os = this.data.assistencia.ordensServico.find(o => o.numero === numero);
        if (!os) return { sucesso: false, erro: 'OS não encontrada' };
        if (!os.fotos) os.fotos = [];
        if (os.fotos.length >= 5) return { sucesso: false, erro: 'Limite máximo de 5 fotos por OS atingido' };
        os.fotos.push({
            id: Date.now(),
            data: new Date().toISOString(),
            base64: base64Data,
            descricao: descricao || `Foto ${os.fotos.length + 1} - Entrada`
        });
        this.saveData();
        return { sucesso: true, totalFotos: os.fotos.length };
    }

    removerFotoOS(numero, fotoId) {
        const os = this.data.assistencia.ordensServico.find(o => o.numero === numero);
        if (!os || !os.fotos) return { sucesso: false };
        os.fotos = os.fotos.filter(f => f.id !== fotoId);
        this.saveData();
        return { sucesso: true };
    }

    getFotosOS(numero) {
        const os = this.data.assistencia.ordensServico.find(o => o.numero === numero);
        return (os && os.fotos) ? os.fotos : [];
    }

    // ===== CONSOLIDAÇÃO COMPLETA DE TODO O HISTÓRICO (SEM DUPLA CONTAGEM) =====
    getTodosMovimentacoesHistorico() {
        const lista = [];
        const idsVistos = new Set();
        const vendasVistas = new Set();

        // 1. Movimentações diretas de caixa (Ledger oficial do sistema)
        (this.data.movimentacoesCaixa || []).forEach(m => {
            const osMatch = (m.descricao || '').match(/OS #\d+/i);
            const idKey = osMatch ? `OS_${osMatch[0].toUpperCase()}_${m.valor}` : (m.id || `${(m.data || '').substring(0, 16)}_${m.valor}_${m.tipo}_${(m.descricao || '').substring(0, 30)}`);
            if (!idsVistos.has(idKey)) {
                idsVistos.add(idKey);
                
                // Assinatura para evitar que a mesma venda seja contada 2x ao ler historico.vendas
                const sig = `${(m.data || '').substring(0, 16)}_${parseFloat(m.valor || 0).toFixed(2)}`;
                vendasVistas.add(sig);

                lista.push({
                    data: m.data || new Date().toISOString(),
                    tipo: m.tipo || 'movimentacao',
                    motivo: m.motivo || '',
                    descricao: m.descricao || m.motivo || m.obs || 'Movimentação de Caixa',
                    valor: m.valor || 0,
                    custo: m.custo || 0,
                    lucro: m.lucro || (m.valor ? Math.max(0, m.valor - (m.custo || 0)) : 0),
                    parteLoja: m.parteLoja || 0,
                    partePai: m.partePai || 0,
                    caixa: m.caixa || m.caixaDestino || 'caixaSecundario',
                    cliente: m.cliente || 'Não Identificado',
                    origem: 'movimentacoesCaixa'
                });
            }
        });

        // 2. Histórico de Vendas (Apenas vendas que NÃO constam em movimentacoesCaixa)
        (this.data.historico?.vendas || []).forEach(v => {
            const sig = `${(v.data || '').substring(0, 16)}_${parseFloat(v.valorVenda || v.valor || 0).toFixed(2)}`;
            const idKey = v.id || `${v.data}_${v.valorVenda || v.valor}_${v.produto}`;
            if (!idsVistos.has(idKey) && !vendasVistas.has(sig)) {
                idsVistos.add(idKey);
                vendasVistas.add(sig);
                const val = parseFloat(v.valorVenda || v.valor || 0);
                const c = parseFloat(v.custo || 0);
                const luc = Math.max(0, val - c);
                lista.push({
                    data: v.data || new Date().toISOString(),
                    tipo: v.tipo || 'venda',
                    descricao: `VENDA: ${v.produto || 'Item'} — R$ ${val.toFixed(2)}`,
                    valor: val,
                    custo: c,
                    lucro: luc,
                    parteLoja: Math.round(luc * 0.40 * 100) / 100,
                    partePai: Math.round(luc * 0.60 * 100) / 100,
                    caixa: v.caixaDestino || v.caixa || 'caixaSecundario',
                    cliente: v.cliente || 'Cliente Backup',
                    origem: 'historicoVendas'
                });
            }
        });

        // 3. Histórico de Compras do Backup
        (this.data.historico?.compras || []).forEach(c => {
            const idKey = c.id || `${c.data}_${c.custo || c.valor}_${c.produto}`;
            if (!idsVistos.has(idKey)) {
                idsVistos.add(idKey);
                const val = parseFloat(c.custo || c.valor || 0);
                lista.push({
                    data: c.data || new Date().toISOString(),
                    tipo: 'compra_estoque',
                    descricao: `COMPRA DE ESTOQUE: ${c.produto || 'Mercadoria'}`,
                    valor: -val,
                    custo: val,
                    lucro: 0,
                    parteLoja: 0,
                    partePai: 0,
                    caixa: 'fundoCustoEstoque',
                    cliente: c.fornecedor || 'Fornecedor',
                    origem: 'historicoCompras'
                });
            }
        });

        // 4. Histórico de Movimentações Gerais do Backup
        (this.data.historico?.movimentacoes || []).forEach(m => {
            const idKey = m.id || `${m.data}_${m.valor}_${m.descricao}`;
            if (!idsVistos.has(idKey)) {
                idsVistos.add(idKey);
                lista.push({
                    data: m.data || new Date().toISOString(),
                    tipo: m.tipo || 'movimentacao',
                    descricao: m.descricao || 'Movimentação Geral',
                    valor: m.valor || 0,
                    custo: m.custo || 0,
                    lucro: m.lucro || 0,
                    parteLoja: m.parteLoja || 0,
                    partePai: m.partePai || 0,
                    caixa: m.caixa || 'caixaPrincipal',
                    origem: 'historicoMovimentacoes'
                });
            }
        });

        return lista.sort((a, b) => this.parseDataSafe(b.data) - this.parseDataSafe(a.data));
    }

    isMovimentacaoVendaReal(m) {
        if (!m || (parseFloat(m.valor || 0) <= 0)) return false;
        const t = (m.tipo || '').toLowerCase();
        const tiposNaoVenda = [
            'despesa', 'saida', 'sangria', 'transferencia', 'fechamento_caixa',
            'fechamento_semanal', 'zerado', 'deposito_fundo', 'uso_fundo',
            'compra_estoque', 'suprimento', 'alteracao_sistema'
        ];
        if (tiposNaoVenda.includes(t)) return false;
        if (t === 'entrada' && (m.motivo || '').toLowerCase() !== 'venda manual') return false;
        return true;
    }

    parseDataSafe(d) {
        if (!d) return 0;
        if (d instanceof Date) return d.getTime();
        if (typeof d === 'number') {
            // Se maior que ano 2033 em ms (evita IDs como 17844000000000)
            if (d > 2000000000000) return 0;
            return d;
        }
        let s = String(d).trim();
        // Se for um ID numérico longo ou concatenated string
        if (/^\d{13,}$/.test(s)) return 0;

        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const t = new Date(s + 'T12:00:00').getTime();
            if (!isNaN(t) && t > 1577836800000 && t < 1988150400000) return t;
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const t = new Date(s).getTime();
            if (!isNaN(t) && t > 1577836800000 && t < 1988150400000) return t;
        }
        if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
            const parts = s.split(/[\s/:]/);
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (year >= 2020 && year <= 2033) {
                const hour = parts[3] ? parseInt(parts[3], 10) : 0;
                const min = parts[4] ? parseInt(parts[4], 10) : 0;
                const sec = parts[5] ? parseInt(parts[5], 10) : 0;
                return new Date(year, month, day, hour, min, sec).getTime();
            }
        }
        const t = new Date(s).getTime();
        if (!isNaN(t) && t > 1577836800000 && t < 1988150400000) return t;
        return 0;
    }

    // ===== REGISTRO UNIVERSAL DE HISTÓRICO (GARANTIA DE REGISTRO DE 100% DAS AÇÕES DO SISTEMA) =====
    registrarLogHistorico(dados) {
        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];
        if (!this.data.historico) this.data.historico = { vendas: [], compras: [], movimentacoes: [] };
        if (!this.data.historico.movimentacoes) this.data.historico.movimentacoes = [];

        const logEntry = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            data: dados.data || new Date().toISOString(),
            tipo: dados.tipo || 'alteracao_sistema',
            descricao: dados.descricao || 'Alteração realizada no sistema',
            valor: parseFloat(dados.valor || 0),
            custo: parseFloat(dados.custo || 0),
            lucro: parseFloat(dados.lucro || 0),
            parteLoja: parseFloat(dados.parteLoja || 0),
            partePai: parseFloat(dados.partePai || 0),
            caixa: dados.caixa || 'caixaSecundario',
            cliente: dados.cliente || 'Sistema'
        };

        this.data.movimentacoesCaixa.push(logEntry);
        this.data.historico.movimentacoes.push(logEntry);
        this.saveData();
        return logEntry;
    }

    // ===== PAINEL DE FECHAMENTO SEMANAL / SÁBADO (SEGUNDA A SÁBADO) =====
    getFechamentoSemanal() {
        const agoraStr = this.hojeLocal();
        const agora = new Date(agoraStr + 'T12:00:00');
        const diaSemana = agora.getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
        inicioSemana.setHours(0, 0, 0, 0);

        const inicioStr = this.hojeLocal(inicioSemana);
        const fimStr = agoraStr;

        const todosMovs = this.getTodosMovimentacoesHistorico();
        const diasNomes = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const tabelaSemanal = [];

        let vendasSemana = 0;
        let custoSemana = 0;
        let despesasSemana = 0;
        let totalTransacoes = 0;
        const itensDespesas = [];

        for (let i = 0; i < 6; i++) {
            const dDate = new Date(inicioSemana);
            dDate.setDate(inicioSemana.getDate() + i);
            const dStr = this.hojeLocal(dDate);
            const dFormat = dDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            tabelaSemanal.push({
                diaNome: diasNomes[i],
                dataStr: dStr,
                dataFormatada: dFormat,
                vendas: 0,
                custo: 0,
                despesas: 0,
                lucroLiquido: 0,
                loja40: 0,
                pai60: 0
            });
        }

        todosMovs.forEach(m => {
            const ts = this.parseDataSafe(m.data);
            const mDateStr = ts > 0 ? this.hojeLocal(new Date(ts)) : (m.data || '').substring(0, 10);
            if (mDateStr >= inicioStr && mDateStr <= fimStr) {
                const diaObj = tabelaSemanal.find(d => d.dataStr === mDateStr);
                if (m.tipo === 'despesa') {
                    const val = Math.abs(parseFloat(m.valor || 0));
                    despesasSemana += val;
                    if (diaObj) diaObj.despesas += val;
                    itensDespesas.push(m.descricao ? m.descricao.replace('DESPESA: ', '') : 'Despesa');
                } else if (this.isMovimentacaoVendaReal(m)) {
                    const valVenda = parseFloat(m.valor || 0);
                    const valCusto = parseFloat(m.custo || 0);
                    vendasSemana += valVenda;
                    custoSemana += valCusto;
                    totalTransacoes++;
                    if (diaObj) {
                        diaObj.vendas += valVenda;
                        diaObj.custo += valCusto;
                    }
                }
            }
        });

        // Análise de Produtos Vendidos (Volume vs Constância de Giro)
        const mapaProdutos = new Map();
        (this.data.historico?.vendas || []).forEach(v => {
            const ts = this.parseDataSafe(v.data);
            const vDateStr = ts > 0 ? this.hojeLocal(new Date(ts)) : (v.data || '').substring(0, 10);
            if (vDateStr >= inicioStr && vDateStr <= fimStr) {
                const itensLista = (v.itens && Array.isArray(v.itens) && v.itens.length > 0) ? v.itens : [{ nome: v.produto || 'Item', quantidade: v.quantidade || 1, precoVenda: v.valorVenda || v.valor || 0 }];
                itensLista.forEach(item => {
                    const nome = (item.nome || item.produto || v.produto || 'Item').trim();
                    const qtd = parseInt(item.quantidade || 1);
                    const val = parseFloat(item.precoVenda || item.valor || v.valorVenda || v.valor || 0);
                    if (!mapaProdutos.has(nome)) {
                        mapaProdutos.set(nome, { nome, qtd: 0, valorTotal: 0, dias: new Set() });
                    }
                    const entry = mapaProdutos.get(nome);
                    entry.qtd += qtd;
                    entry.valorTotal += val;
                    entry.dias.add(vDateStr);
                });
            }
        });

        let topVolume = null;
        let topConstante = null;
        for (let entry of mapaProdutos.values()) {
            if (!topVolume || entry.qtd > topVolume.qtd) {
                topVolume = { nome: entry.nome, qtd: entry.qtd, valorTotal: entry.valorTotal };
            }
            const diasAtivos = entry.dias.size;
            if (!topConstante || diasAtivos > topConstante.dias || (diasAtivos === topConstante.dias && entry.qtd > topConstante.qtd)) {
                topConstante = { nome: entry.nome, dias: diasAtivos, qtd: entry.qtd, valorTotal: entry.valorTotal };
            }
        }

        tabelaSemanal.forEach(d => {
            d.lucroLiquido = Math.max(0, d.vendas - d.custo - d.despesas);
            d.loja40 = Math.round(d.lucroLiquido * 0.40 * 100) / 100;
            d.mae58 = Math.round(d.lucroLiquido * 0.35 * 100) / 100;
            d.pai42 = Math.round(d.lucroLiquido * 0.25 * 100) / 100;
        });

        const lucroLiquidoReal = Math.max(0, vendasSemana - custoSemana - despesasSemana);
        const parteLoja40 = Math.round(lucroLiquidoReal * 0.40 * 100) / 100;
        const parteMae58 = Math.round(lucroLiquidoReal * 0.35 * 100) / 100;
        const partePai42 = Math.round(lucroLiquidoReal * 0.25 * 100) / 100;
        const partePai60 = Math.round(lucroLiquidoReal * 0.60 * 100) / 100;
        const ticketMedio = totalTransacoes > 0 ? (vendasSemana / totalTransacoes) : 0;

        return {
            inicioSemanaStr: inicioSemana.toLocaleDateString('pt-BR'),
            fimSemanaStr: agora.toLocaleDateString('pt-BR'),
            vendasSemana,
            custoSemana,
            despesasSemana,
            itensDespesas,
            lucroLiquidoReal,
            parteLoja40,
            parteMae58,
            partePai42,
            partePai60,
            tabelaSemanal,
            totalTransacoes,
            ticketMedio,
            topVolume,
            topConstante,
            gavetaAtual: this.data.financeiro?.caixaSecundario || 0
        };
    }
    getOrdens() { return this.data.assistencia.ordensServico; }
    getOrdensAtivas() { return this.getOrdens().filter(o => o.status !== 'entregue'); }
    getPreferencias() { return this.data.preferencias; }
    getCampanhas() { return this.data.campanhas; }

    // ===== PREFERÊNCIAS =====
    setPreferencia(key, value) {
        this.data.preferencias[key] = value;
        this.saveData();
    }

    // ===== CÁLCULOS FINANCEIROS =====
    calcularValorEstoqueCelulares() { return this.getEstoqueCelulares().reduce((s, p) => s + p.custo, 0); }
    calcularValorEstoqueAcessorios() { return this.getEstoqueAcessorios().reduce((s, p) => s + p.custo, 0); }
    calcularTotalAReceber() {
        return this.getCrediariosAtivos().reduce((s, c) => {
            return s + Math.max(0, c.valorTotal - (c.parcelasPagas * c.valorParcela));
        }, 0);
    }
    calcularCrediariosEmDia() {
        return this.getCrediariosAtivos().filter(c => c.status === 'em_dia')
            .reduce((s, c) => s + (c.valorTotal - c.parcelasPagas * c.valorParcela), 0);
    }
    calcularCrediariosAtraso() {
        return this.getCrediariosAtivos().filter(c => c.status !== 'em_dia')
            .reduce((s, c) => s + (c.valorTotal - c.parcelasPagas * c.valorParcela), 0);
    }

    calcularProgressoMeta() {
        const caixa = this.data.financeiro?.caixaPrincipal || 0;
        const metaVendas = this.data.comissaoIlannaMensal || 0;
        const progresso = Math.max(caixa, metaVendas);
        const objetivo = 7000;
        if (this.data.meta) {
            this.data.meta.objetivo = 7000;
            this.data.meta.diaZeramento = 30;
        }
        const falta = Math.max(0, objetivo - progresso);
        const pct = Math.min(100, (progresso / objetivo) * 100);
        const hoje = new Date();
        const diaAtual = hoje.getDate();
        const diasAteDia30 = diaAtual < 30 ? (30 - diaAtual) : 30;
        const metaMensal = falta;
        return { progresso, caixaPrincipal: caixa, metaVendas, objetivo, falta, pct, metaMensal, mesesRestantes: 1, diasAteDia30 };
    }

    calcularPatrimonioTotal() {
        const f = this.data.financeiro;
        return f.caixaPrincipal + f.caixaAcessorios + f.caixaAssistencia +
            this.calcularValorEstoqueCelulares() + this.calcularValorEstoqueAcessorios() +
            this.calcularTotalAReceber();
    }

    diasNoEstoque(produto) {
        if (!produto || !produto.dataCompra) return 0;
        const diff = new Date() - new Date(produto.dataCompra);
        return isNaN(diff) ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    removerCelularesAntigos(diasLimite = 60) {
        const celulares = this.getEstoqueCelulares();
        const antigos = celulares.filter(p => this.diasNoEstoque(p) >= diasLimite);
        if (antigos.length === 0) return { removidos: 0, lista: [] };
        
        const idsAntigos = new Set(antigos.map(a => String(a.id)));
        this.data.estoqueCelulares = (this.data.estoqueCelulares || []).filter(p => !idsAntigos.has(String(p.id)));
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        return { removidos: antigos.length, lista: antigos };
    }

    limparApenasDadosDeTesteRobo() {
        if (!this.data) return { removidosVendas: 0, removidosOS: 0 };
        const eTest = str => /carlos silva e2e|silicone a54 preta teste/i.test(str || '');
        
        let removidosVendas = 0;
        if (this.data.historico && this.data.historico.vendas) {
            const antes = this.data.historico.vendas.length;
            this.data.historico.vendas = this.data.historico.vendas.filter(v => !eTest(v.produto) && !eTest(v.cliente));
            removidosVendas = antes - this.data.historico.vendas.length;
        }

        let removidosOS = 0;
        if (this.data.assistencia && this.data.assistencia.ordensServico) {
            const antes = this.data.assistencia.ordensServico.length;
            this.data.assistencia.ordensServico = this.data.assistencia.ordensServico.filter(o => !eTest(o.cliente) && !eTest(o.modelo) && !eTest(o.servico));
            removidosOS = antes - this.data.assistencia.ordensServico.length;
        }

        if (this.data.movimentacoesCaixa) {
            this.data.movimentacoesCaixa = this.data.movimentacoesCaixa.filter(m => !eTest(m.descricao) && !eTest(m.cliente) && !eTest(m.produto));
        }

        if (this.data.divisaoLucro && this.data.divisaoLucro.historicoDivisao) {
            this.data.divisaoLucro.historicoDivisao = this.data.divisaoLucro.historicoDivisao.filter(d => !eTest(d.produto) && !eTest(d.cliente));
        }

        this.saveData();
        if (this.supabase) this.salvarSupabase();
        console.log(`[StrategyOS] Limpeza de dados de teste executada: ${removidosVendas} vendas e ${removidosOS} OS atreladas ao robô foram purgadas.`);
        return { removidosVendas, removidosOS };
    }

    // ===== VERIFICAR INADIMPLÊNCIA =====
    verificarInadimplencia() {
        const alertas = [];
        const hoje = new Date();
        this.data.crediarios.forEach(c => {
            if (c.status === 'quitado') return;
            if (c.proximaParcela === 'vencido' || (c.proximaParcela && new Date(c.proximaParcela) < hoje)) {
                const dias = c.proximaParcela === 'vencido' ? 90 : Math.floor((hoje - new Date(c.proximaParcela)) / 86400000);
                if (dias > 0) {
                    c.diasAtraso = dias;
                    c.status = dias > 30 ? 'inadimplente' : 'atrasado';
                    alertas.push({ cliente: c.cliente, dias, valor: c.valorParcela, status: c.status });
                }
            }
        });
        if (alertas.length > 0) this.saveData();
        return alertas;
    }

    // ===== COMPRAR CELULAR =====
    comprarProduto(produto) {
        const f = this.data.financeiro;
        if (produto.custo > f.caixaPrincipal) return { sucesso: false, erro: 'Dinheiro insuficiente no caixa principal' };
        const novoId = Math.max(0, ...this.data.estoqueCelulares.map(p => p.id)) + 1;
        const novo = { id: novoId, ...produto, dataCompra: new Date().toISOString().split('T')[0], status: 'disponivel' };
        this.data.estoqueCelulares.push(novo);
        f.caixaPrincipal -= produto.custo;
        this.data.historico.compras.push({ data: new Date().toISOString(), produto: produto.nome, custo: produto.custo, tipo: 'celular' });
        this.data.historico.movimentacoes.push({ data: new Date().toISOString(), tipo: 'compra', descricao: `Compra: ${produto.nome}`, valor: -produto.custo, _meta: { produtoId: novo.id, produtoNome: produto.nome, custo: produto.custo, caixa: 'principal' } });
        this.saveData();
        return { sucesso: true, produto: novo, caixaAtual: f.caixaPrincipal };
    }

    // ===== REGISTRAR TROCA (2 entradas: venda + aquisição do usado) =====
    registrarTrocaNoEstoque(produtoId, precoFinal, valorJusto, descricaoHistorico) {
        const idx = this.data.estoqueCelulares.findIndex(p => String(p.id) === String(produtoId));
        if (idx === -1) return { sucesso: false, erro: 'Produto não encontrado' };
        const prod = this.data.estoqueCelulares[idx];
        prod.status = 'vendido';

        // O produto novo saiu do estoque pelo precoFinal
        this.data.financeiro.caixaPrincipal += precoFinal;
        this.data.financeiro.caixaSecundario += precoFinal;
        // O produto usado entrou: custo = valorJusto (saiu do caixa virtualmente)
        this.data.financeiro.caixaPrincipal -= valorJusto;

        const valorLiquido = precoFinal - valorJusto;

        this.data.historico.vendas.push({
            data: new Date().toISOString(), produto: prod.nome,
            custo: prod.custo, valorVenda: precoFinal,
            lucro: precoFinal - prod.custo, tipo: 'troca',
            dias: this.diasNoEstoque(prod)
        });

        // Entrada: venda do produto novo
        this.data.historico.movimentacoes.push({
            data: new Date().toISOString(), tipo: 'troca',
            descricao: `${descricaoHistorico} — Venda: ${prod.nome} (R$ ${precoFinal.toFixed(2).replace('.', ',')})`,
            valor: precoFinal,
            _meta: { produtoId, produtoNome: prod.nome, valorVenda: precoFinal, caixa: 'principal', eTroca: true }
        });

        // Saída: aquisição do aparelho usado
        if (valorJusto > 0) {
            this.data.historico.movimentacoes.push({
                data: new Date().toISOString(), tipo: 'troca',
                descricao: `Troca — Aparelho usado recebido (valor: R$ ${valorJusto.toFixed(2).replace('.', ',')})`,
                valor: -valorJusto,
                _meta: { valorJusto, caixa: 'principal', eAquisicaoUsado: true }
            });
        }

        this._aprenderVenda(prod, precoFinal);
        this.saveData();
        return { sucesso: true, produto: prod.nome, valorLiquido };
    }

    limparEstoqueVendido() {
        if (this.data.estoqueCelulares && Array.isArray(this.data.estoqueCelulares)) {
            this.data.estoqueCelulares.forEach(c => {
                if (c.quantidade !== undefined && c.quantidade <= 0) {
                    c.status = 'vendido';
                }
            });
        }
        if (this.data.estoqueAcessorios && Array.isArray(this.data.estoqueAcessorios)) {
            this.data.estoqueAcessorios.forEach(a => {
                if (a.quantidade !== undefined && a.quantidade <= 0) {
                    a.status = 'vendido';
                }
            });
        }
    }

    // ===== VENDER CARRINHO COMPLETO (MULTI-PRODUTOS E MULTI-PAGAMENTOS) =====
    venderCarrinho(itens, pagamentos, cliente = '') {
        try {
            let custoTotal = 0;
            let valorVendaTotal = 0;
            let nomes = [];

            // 1. Processar itens (reduzir estoque)
            for (let item of itens) {
                const isAvulso = (item.tipo === 'avulso' || item._tipo === 'avulso' || !item.id || String(item.id).startsWith('avulso'));
                if (isAvulso) {
                    custoTotal += parseFloat(item.custo || item.precoCusto || 0);
                    valorVendaTotal += parseFloat(item.precoFinal || item.precoVenda || item.valor || 0);
                    nomes.push("Avulso: " + (item.nome || 'Item Avulso'));
                    continue;
                }
                const lista = item._tipo === 'acess' ? this.data.estoqueAcessorios : this.data.estoqueCelulares;
                const idx = lista.findIndex(p => String(p.id) === String(item.id));
                if (idx >= 0) {
                    const prod = lista[idx];
                    custoTotal += parseFloat(prod.custo || 0);
                    valorVendaTotal += parseFloat(item.precoFinal || item.precoVenda || prod.precoVenda || 0);
                    nomes.push(prod.nome);

                    if (prod.quantidade && prod.quantidade > 1) {
                        prod.quantidade -= 1;
                    } else {
                        prod.quantidade = 0;
                        prod.status = 'vendido';
                    }
                } else {
                    custoTotal += parseFloat(item.custo || item.precoCusto || 0);
                    valorVendaTotal += parseFloat(item.precoFinal || item.precoVenda || item.valor || 0);
                    nomes.push(item.nome || 'Item');
                }
            }

            const totalPagamentosSum = (pagamentos || []).reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
            if (valorVendaTotal <= 0 && totalPagamentosSum > 0) {
                valorVendaTotal = totalPagamentosSum;
            }

            const lucroTotal = Math.max(0, valorVendaTotal - custoTotal);
            const nomeComposto = nomes.length > 0 ? nomes.join(' + ') : 'Venda Avulsa';

            // 2. Registrar no Histórico de Vendas (como uma única venda composta)
            this.data.historico.vendas.push({
                data: new Date().toISOString(),
                produto: nomeComposto + ` (${itens.length || 1} itens)`,
                custo: custoTotal,
                valorVenda: valorVendaTotal,
                lucro: lucroTotal,
                tipo: 'multi',
                cliente: cliente || 'Não Identificado',
                pagamentoDivisao: pagamentos // Array de pagamentos pra histórico
            });

            // 3. Processar Movimentações Financeiras
            for (let pag of pagamentos) {
                const valPag = parseFloat(pag.valor) || 0;
                const proporcao = valorVendaTotal > 0 ? (valPag / valorVendaTotal) : 1;
                const lucroPag = Math.round(lucroTotal * proporcao * 100) / 100;
                const custoPag = Math.round(custoTotal * proporcao * 100) / 100;

                // Registra pro fechamento e relatórios diários
                this._registrarSincronizacaoFinanceira({
                    tipo: 'venda_multi',
                    produto: nomeComposto,
                    valorVenda: valPag,
                    lucro: lucroPag,
                    custo: custoPag,
                    caixaDestino: pag.caixa || 'caixaSecundario',
                    cliente: cliente
                });
            }

            this.limparEstoqueVendido();
            this.saveData();

            // Notificação enviada via _registrarSincronizacaoFinanceira

            return { sucesso: true };
        } catch (e) {
            console.error('Erro ao vender carrinho:', e);
            return { sucesso: false, erro: e.message };
        }
    }

    // ===== VENDER À VISTA =====
    venderAVista(produtoId, valorVenda, cliente = '', caixaDestino = 'caixaSecundario') {
        const idx = this.data.estoqueCelulares.findIndex(p => String(p.id) === String(produtoId));
        if (idx === -1) return { sucesso: false, erro: 'Produto não encontrado' };
        const prod = this.data.estoqueCelulares[idx];
        const lucro = valorVenda - prod.custo;
        if (prod.quantidade && prod.quantidade > 1) {
            prod.quantidade -= 1;
        } else {
            prod.quantidade = 0;
            prod.status = 'vendido';
        }
        this.data.historico.vendas.push({ data: new Date().toISOString(), produto: prod.nome, custo: prod.custo, valorVenda, lucro, tipo: 'avista', dias: this.diasNoEstoque(prod), cliente: cliente || 'Não Identificado', caixaDestino });
        
        this._registrarSincronizacaoFinanceira({
            tipo: 'venda_celular_avista',
            produto: prod.nome,
            valorVenda: valorVenda,
            custo: prod.custo,
            caixaDestino: caixaDestino || 'caixaSecundario',
            cliente: cliente
        });

        this._aprenderVenda(prod, valorVenda);
        this.saveData();

        // Notificação enviada via _registrarSincronizacaoFinanceira

        return { sucesso: true, produto: prod.nome, lucro, caixa: this.data.financeiro.caixaPrincipal };
    }

    // ===== VENDER PARCELADO / PIX =====
    venderParcelado(produtoId, valorBruto, parcelas, bandeira = 'normal', cliente = '') {
        const idx = this.data.estoqueCelulares.findIndex(p => String(p.id) === String(produtoId));
        if (idx === -1) return { sucesso: false, erro: 'Produto não encontrado' };
        const prod = this.data.estoqueCelulares[idx];
        let taxa, chave;
        if (bandeira === 'pix') {
            taxa = this.data.taxasCartao.pix;
            chave = 'pix';
        } else {
            chave = parcelas === 0 ? 'debito' : parcelas === 1 ? 'credito' : `${parcelas}x`;
            const chaveElo = bandeira === 'elo' ? chave + '_elo' : chave;
            taxa = this.data.taxasCartao[chaveElo] || this.data.taxasCartao[chave] || 0;
        }
        const desconto = valorBruto * (taxa / 100);
        const liquido = valorBruto - desconto;
        const lucro = liquido - prod.custo;
        if (prod.quantidade && prod.quantidade > 1) {
            prod.quantidade -= 1;
        } else {
            prod.quantidade = 0;
            prod.status = 'vendido';
        }
        this.data.historico.vendas.push({ data: new Date().toISOString(), produto: prod.nome, custo: prod.custo, valorBruto, taxa, liquido, lucro, tipo: bandeira === 'pix' ? 'pix' : 'parcelado_maquina', parcelas, dias: this.diasNoEstoque(prod), cliente: cliente || 'Não Identificado' });
        
        this._registrarSincronizacaoFinanceira({
            tipo: bandeira === 'pix' ? 'venda_pix' : 'venda_cartao',
            produto: prod.nome,
            valorVenda: liquido,
            custo: prod.custo,
            caixaDestino: 'caixaPrincipal',
            cliente: cliente
        });

        this._aprenderVenda(prod, liquido);
        this.saveData();
        return { sucesso: true, produto: prod.nome, valorBruto, taxa, desconto, liquido, lucro, caixa: this.data.financeiro.caixaPrincipal };
    }

    // ===== VENDER NO CREDIÁRIO =====
    venderCrediario(produtoId, cliente, parcelas, valorTotal, diaVencimento, entrada = 0) {
        const idx = this.data.estoqueCelulares.findIndex(p => String(p.id) === String(produtoId));
        if (idx === -1) return { sucesso: false, erro: 'Produto não encontrado' };
        const prod = this.data.estoqueCelulares[idx];
        const financiado = valorTotal - entrada;
        const valorParcela = financiado / parcelas;
        const novoId = Math.max(0, ...this.data.crediarios.map(c => c.id)) + 1;
        if (entrada > 0) {
            this.data.financeiro.caixaSecundario += entrada;
        }
        const hoje = new Date();
        let proxParcela = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento);
        if (proxParcela <= hoje) proxParcela = new Date(hoje.getFullYear(), hoje.getMonth() + 2, diaVencimento);
        const cred = { id: novoId, cliente, valorTotal: financiado, parcelasTotal: parcelas, parcelasPagas: 0, valorParcela, proximaParcela: proxParcela.toISOString().split('T')[0], diaVencimento, status: 'em_dia', diasAtraso: 0, historicoPagamentos: [], custoProduto: prod.custo, dataInicio: new Date().toISOString().split('T')[0], produtoVendido: prod.nome };
        this.data.crediarios.push(cred);
        if (prod.quantidade && prod.quantidade > 1) {
            prod.quantidade -= 1;
        } else {
            prod.quantidade = 0;
            prod.status = 'vendido';
        }
        let cl = this.data.clientes.find(c => c.nome.toLowerCase() === cliente.toLowerCase());
        if (!cl) { cl = this._criarClientePadrao(cliente); this.data.clientes.push(cl); }
        this.data.historico.vendas.push({ data: new Date().toISOString(), produto: prod.nome, custo: prod.custo, valorVenda: valorTotal, entrada, tipo: 'crediario', parcelas, cliente, dias: this.diasNoEstoque(prod) });
        this.data.historico.movimentacoes.push({ data: new Date().toISOString(), tipo: 'venda', descricao: `Crediário ${parcelas}x: ${prod.nome} → ${cliente}`, valor: entrada, _meta: { produtoId, produtoNome: prod.nome, valorVenda: entrada, crediarioId: novoId, caixa: 'principal' } });
        this._aprenderVenda(prod, valorTotal);
        this.saveData();
        return { sucesso: true, produto: prod.nome, crediario: cred, caixa: this.data.financeiro.caixaPrincipal };
    }

    // ===== RECEBER PARCELA =====
    receberParcela(crediarioId, valorRecebido) {
        const cred = this.data.crediarios.find(c => c.id === crediarioId);
        if (!cred) return { sucesso: false, erro: 'Crediário não encontrado' };
        // Bug 6: Proteção contra valor undefined/NaN
        valorRecebido = parseFloat(valorRecebido) || cred.valorParcela || 0;
        // Corrigir caixa se ficou NaN de bug anterior
        if (isNaN(this.data.financeiro.caixaPrincipal)) this.data.financeiro.caixaPrincipal = 0;
        cred.parcelasPagas++;
        cred.historicoPagamentos.push({ data: new Date().toISOString(), valor: valorRecebido });
        this.data.financeiro.caixaSecundario += valorRecebido;
        if (cred.parcelasPagas >= cred.parcelasTotal) {
            cred.status = 'quitado';
            const cl = this.data.clientes.find(c => c.nome === cred.cliente);
            if (cl) { cl.crediariosQuitados++; cl.score = Math.min(1000, cl.score + 100); }
        } else {
            cred.status = 'em_dia'; cred.diasAtraso = 0;
            const prox = new Date(cred.proximaParcela);
            prox.setMonth(prox.getMonth() + 1);
            cred.proximaParcela = prox.toISOString().split('T')[0];
            const cl = this.data.clientes.find(c => c.nome === cred.cliente);
            if (cl) { cl.parcelasEmDia++; cl.score = Math.min(1000, cl.score + 30); }
        }
        this.data.historico.movimentacoes.push({ data: new Date().toISOString(), tipo: 'parcela', descricao: `Parcela ${cred.parcelasPagas}/${cred.parcelasTotal}: ${cred.cliente}`, valor: valorRecebido, _meta: { crediarioId, valorParcela: valorRecebido, parcela: cred.parcelasPagas, caixa: 'principal' } });
        this.saveData();
        return { sucesso: true, parcela: `${cred.parcelasPagas}/${cred.parcelasTotal}`, status: cred.status, caixa: this.data.financeiro.caixaPrincipal };
    }

    // ===== VINCULAR VENDA AO CADASTRO E HISTÓRICO DO CLIENTE =====
    vincularVendaAoCliente(nomeCliente, produtoNome, valorVenda, tipoVenda = 'venda') {
        if (!nomeCliente || nomeCliente === 'Não Identificado' || nomeCliente === 'Cliente') return;
        if (!this.data.clientes) this.data.clientes = [];
        
        let cliente = this.data.clientes.find(c => (c.nome || '').toLowerCase().trim() === nomeCliente.toLowerCase().trim());
        if (!cliente) {
            cliente = {
                nome: nomeCliente,
                telefone: '',
                cpf: '',
                nascimento: '',
                endereco: { rua: '', numero: '', bairro: 'Amargosa', cidade: 'Amargosa', uf: 'BA' },
                dataCadastro: new Date().toISOString().split('T')[0],
                score: 50,
                parcelasEmDia: 0,
                parcelasAtrasadas: 0,
                crediariosQuitados: 0,
                totalGasto: 0,
                historico: []
            };
            this.data.clientes.push(cliente);
        }

        if (!cliente.historico) cliente.historico = [];
        const valNum = parseFloat(valorVenda) || 0;
        const pontosGanhos = Math.floor(valNum / 10);
        cliente.score = (cliente.score || 0) + pontosGanhos;
        cliente.totalGasto = (cliente.totalGasto || 0) + valNum;

        const dataHoje = new Date().toISOString().split('T')[0];
        const jaExiste = cliente.historico.some(h => h.data === dataHoje && h.produto === produtoNome && Math.abs((h.valor || h.valorVenda || 0) - valNum) < 0.01);
        if (!jaExiste) {
            cliente.historico.push({
                tipo: tipoVenda,
                data: dataHoje,
                produto: produtoNome,
                valor: valNum,
                pontos: pontosGanhos
            });
        }
    }

    // ===== CÁLCULO DE CUSTO DE REPOSIÇÃO DE ESTOQUE =====
    calcularCustoReposicao(produto, tipo, valorTotal) {
        const prodLower = (produto || '').toLowerCase();
        const tipoLower = (tipo || '').toLowerCase();
        const val = parseFloat(valorTotal) || 0;

        // 1. Capa MagSafe / Megasafe (R$ 7,00)
        if (prodLower.includes('magsafe') || prodLower.includes('megasafe')) {
            return Math.min(7.00, val > 0 ? val : 7.00);
        }
        // 2. Capinha / Capa / Case (R$ 3,50)
        if (prodLower.includes('capa') || prodLower.includes('capinha') || prodLower.includes('case')) {
            return Math.min(3.50, val > 0 ? val : 3.50);
        }
        // 3. Película Cerâmica (R$ 3,00)
        if (prodLower.includes('cerâmica') || prodLower.includes('ceramica') || tipoLower.includes('ceramica')) {
            return Math.min(3.00, val > 0 ? val : 3.00);
        }
        // 4. Película 3D / HD / Hidrogel / Genérica (R$ 1,00)
        if (tipoLower.includes('pelicula') || prodLower.includes('película') || prodLower.includes('pelicula') || prodLower.includes('3d')) {
            return Math.min(1.00, val > 0 ? val : 1.00);
        }
        // 5. Fogos 19x4 (R$ 35,00)
        if (prodLower.includes('19x4')) {
            return Math.min(35.00, val > 0 ? val : 35.00);
        }
        // 6. Fogos 12x1 (R$ 20,00)
        if (prodLower.includes('12x1')) {
            return Math.min(20.00, val > 0 ? val : 20.00);
        }
        // 7. Bomba Batom (Caixa R$ 8,00 / Unidade R$ 0,40)
        if (prodLower.includes('batom') || prodLower.includes('bomba')) {
            if (val >= 15 || prodLower.includes('caixa')) {
                return Math.min(8.00, val > 0 ? val : 8.00);
            }
            return Math.min(0.40, val > 0 ? val : 0.40);
        }

        // 8. Busca no Estoque Cadastrado de Celulares e Acessórios por custo real
        if (this.data.estoqueAcessorios) {
            const ace = this.data.estoqueAcessorios.find(a => (a.nome || '').toLowerCase().includes(prodLower) || prodLower.includes((a.nome || '').toLowerCase()));
            if (ace && ace.custo && ace.custo > 0) return parseFloat(ace.custo);
        }
        if (this.data.estoqueCelulares) {
            const cel = this.data.estoqueCelulares.find(c => (c.nome || '').toLowerCase().includes(prodLower) || prodLower.includes((c.nome || '').toLowerCase()));
            if (cel && cel.custo && cel.custo > 0) return parseFloat(cel.custo);
        }

        // Acessórios / Avulsa gerais (35%)
        if (tipoLower.includes('acessorio') || tipoLower.includes('avulsa') || prodLower.includes('fone') || prodLower.includes('cabo') || prodLower.includes('fogos')) {
            return Math.round(val * 0.35 * 100) / 100;
        }
        // Celulares (70%)
        if (tipoLower.includes('celular') || tipoLower.includes('avista')) {
            return Math.round(val * 0.70 * 100) / 100;
        }
        return Math.round(val * 0.35 * 100) / 100;
    }

    // ===== INTEGRAÇÃO OFICIAL BOT TELEGRAM (100% AUTOMÁTICA E RESILIENTE) =====
    restaurarBackupOficial20261023() {
        if (typeof window === 'undefined' || !window.INITIAL_BACKUP_DATA) {
            return { sucesso: false, erro: 'Backup inicial não encontrado.' };
        }
        const defData = this.getDefaultData();
        const bkp = JSON.parse(JSON.stringify(window.INITIAL_BACKUP_DATA));
        bkp.tabelaServicosModelo = { ...(bkp.tabelaServicosModelo || {}), ...(defData.tabelaServicosModelo || {}) };
        bkp.tabelaServicosMarca = { ...(bkp.tabelaServicosMarca || {}), ...(defData.tabelaServicosMarca || {}) };
        bkp.tabelaPeliculasModelo = { ...(defData.tabelaPeliculasModelo || {}), ...(bkp.tabelaPeliculasModelo || {}) };
        bkp._hidratadoBackup20261023 = true;
                    bkp._hidratadoBackup20261023_v2 = true;
        this.data = this._merge(defData, bkp);
        this.saveData();
        return { sucesso: true };
    }

    getConfigTelegram() {
        const cfg = this.data?.configuracoes || {};
        const cfgInt = this.data?.configIntegracoes || {};
        let savedTg = {};
        try { savedTg = JSON.parse(localStorage.getItem('strategyos_telegram_config') || '{}'); } catch (e) {}

        const botToken = cfg.telegramBotToken || cfgInt.telegramToken || savedTg.botToken || '8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34';
        const chatId = cfg.telegramChatId || cfgInt.telegramChatId || savedTg.chatId || '1969798643';
        const chatIdEquipe = cfg.telegramChatIdEquipe !== undefined ? cfg.telegramChatIdEquipe : (savedTg.chatIdEquipe || '-5232346648');

        return {
            botToken,
            chatId,
            chatIdEquipe,
            autoVendas: cfg.telegramAutoVendas !== false,
            notificarVendas: cfg.telegramAutoVendas !== false,
            notificarOS: cfg.telegramAutoVendas !== false,
            autoCaixa: cfg.telegramAutoCaixa !== false,
            autoFechamento: cfg.telegramAutoFechamento !== false,
            autoAlertas: cfg.telegramAutoAlertas !== false
        };
    }

    salvarConfigTelegram(dados = {}) {
        if (!this.data.configuracoes) this.data.configuracoes = {};
        if (!this.data.configIntegracoes) this.data.configIntegracoes = {};
        const atual = this.getConfigTelegram();

        const token = dados.botToken !== undefined ? String(dados.botToken).trim() : atual.botToken;
        const chatId = dados.chatId !== undefined ? String(dados.chatId).trim() : atual.chatId;
        const chatIdEquipe = dados.chatIdEquipe !== undefined ? String(dados.chatIdEquipe).trim() : atual.chatIdEquipe;

        this.data.configuracoes.telegramBotToken = token;
        this.data.configuracoes.telegramChatId = chatId;
        this.data.configuracoes.telegramChatIdEquipe = chatIdEquipe;
        if (dados.autoVendas !== undefined) this.data.configuracoes.telegramAutoVendas = Boolean(dados.autoVendas);
        if (dados.autoCaixa !== undefined) this.data.configuracoes.telegramAutoCaixa = Boolean(dados.autoCaixa);
        if (dados.autoFechamento !== undefined) this.data.configuracoes.telegramAutoFechamento = Boolean(dados.autoFechamento);
        if (dados.autoAlertas !== undefined) this.data.configuracoes.telegramAutoAlertas = Boolean(dados.autoAlertas);

        this.data.configIntegracoes.telegramToken = token;
        this.data.configIntegracoes.telegramChatId = chatId;
        this.data.configIntegracoes.telegramAutoDiario = this.data.configuracoes.telegramAutoFechamento;

        try {
            localStorage.setItem('strategyos_telegram_config', JSON.stringify({
                botToken: token,
                chatId,
                chatIdEquipe
            }));
        } catch (e) {}

        this.saveData();
        return this.getConfigTelegram();
    }

    async enviarTelegram(mensagem, opcoes = {}) {
        // Bloquear disparos em ambiente de teste automatizado Node
        if (typeof window === 'undefined' && process && process.env && process.env.NODE_ENV === 'test') {
            return { sucesso: true, mock: true };
        }
        const { botToken, chatId, chatIdEquipe } = this.getConfigTelegram();

        if (!botToken || !chatId) {
            return { sucesso: false, erro: 'Bot do Telegram não configurado.' };
        }

        // Trava anti-spam: evita enviar exatamente o mesmo texto duas vezes em menos de 45 segundos
        const msgHash = String(mensagem || '').slice(0, 120);
        const agoraMs = Date.now();
        if (this._ultimoHashTelegram === msgHash && this._ultimoEnvioTelegramMs && (agoraMs - this._ultimoEnvioTelegramMs < 45000)) {
            return { sucesso: true, ignoradoDuplicado: true };
        }
        this._ultimoHashTelegram = msgHash;
        this._ultimoEnvioTelegramMs = agoraMs;

        const targets = [chatId];
        if (chatIdEquipe && chatIdEquipe !== chatId && opcoes.apenasDono !== true) {
            targets.push(chatIdEquipe);
        }

        let algumSucesso = false;
        let ultimoData = null;
        for (const idTarget of targets) {
            try {
                const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
                let resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: idTarget,
                        text: mensagem,
                        parse_mode: 'Markdown'
                    })
                });
                let data = await resp.json();
                // Se falhar por causa de caractere especial no Markdown, reenvia em texto puro
                if (!data || !data.ok) {
                    resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: idTarget,
                            text: String(mensagem || '').replace(/[*_`]/g, '')
                        })
                    });
                    data = await resp.json();
                }
                if (data && data.ok) {
                    algumSucesso = true;
                    ultimoData = data;
                }
            } catch (e) {
                console.warn('Aviso ao enviar mensagem no Telegram:', e.message || e);
            }
        }

        return { sucesso: algumSucesso, data: ultimoData };
    }

    async processarFilaTelegram() {
        if (this.data && this.data.filaTelegramPendente && this.data.filaTelegramPendente.length > 0) {
            this.data.filaTelegramPendente = [];
            this.saveData();
        }
    }

    iniciarPilotoAutomaticoTelegram() {
        // IMPORTANTE: Desativado qualquer envio automático de fechamento/backup em background
        // para garantir ZERO mensagens fantasmas. O fechamento e o backup só são enviados
        // quando acionados no botão "Bater Caixa (Fechamento)" ou no botão manual de Backup.
        if (this._pilotoTelegramAtivo) return;
        this._pilotoTelegramAtivo = true;
        if (this.data) {
            this.data.filaTelegramPendente = [];
            this.data.ultimoFechamentoAutoTelegram = this.hojeLocal();
            this.data.ultimoBackupDiarioTelegram = this.hojeLocal();
        }
    }

    async verificarBackupDiarioTelegram() {
        return { sucesso: true };
    }

    async enviarResumoDiarioTelegram() {
        return this.enviarFechamentoDiarioTelegram();
    }

    // ===== NOTIFICAÇÃO INSTANTÂNEA DE VENDA VIA TELEGRAM =====
    async enviarNotificacaoVendaTelegram(prodNome, valorVenda, pagamento = 'À Vista', cliente = '', detalhesExtras = {}) {
        const cfg = this.getConfigTelegram();
        if (!cfg.botToken || !cfg.autoVendas) return;

        const val = Number(valorVenda || 0);
        const custo = Number(detalhesExtras.custo || 0);
        const lucro = detalhesExtras.lucro !== undefined ? Number(detalhesExtras.lucro) : Math.max(0, val - custo);
        const gavetaAtual = Number(this.data.financeiro?.caixaSecundario || 0);

        const msg = `🎉 *NOVA VENDA REGISTRADA! — CESINHA ACESSÓRIOS*\n\n` +
            `📦 *Produto*: ${prodNome}\n` +
            `💰 *Valor Venda*: *R$ ${val.toFixed(2)}*\n` +
            (custo > 0 ? `🏷️ *Custo (CMV)*: R$ ${custo.toFixed(2)} | 💎 *Lucro*: *R$ ${lucro.toFixed(2)}*\n` : '') +
            `🏦 *Destino / Pagto*: ${pagamento}\n` +
            `👤 *Cliente*: ${cliente || 'Consumidor Geral'}\n` +
            `💵 *Saldo Gaveta Após Venda*: R$ ${gavetaAtual.toFixed(2)}\n` +
            `⏰ *Hora*: ${this.horaLocal ? this.horaLocal() : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        await this.enviarTelegram(msg);
    }

    // ===== FECHAMENTO MENSAL DETALHADO TELEGRAM =====
    async enviarFechamentoMensalTelegram() {
        if (!this.data.configuracoes?.telegramBotToken) return { sucesso: false, erro: 'Bot do Telegram não configurado' };
        const agora = new Date();
        const anoMesAtual = this.hojeLocal(agora).substring(0, 7);
        
        let mesAnteriorDate = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        const anoMesAnterior = this.hojeLocal(mesAnteriorDate).substring(0, 7);
        
        const mesNome = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        const todosMovs = this.getTodosMovimentacoesHistorico();
        
        let vendas = 0, custo = 0, despesas = 0, qtdVendas = 0;
        const produtosMes = {};
        
        let vendasAnterior = 0;
        let vendasAnoAtual = 0;
        const anoAtualStr = agora.getFullYear().toString();
        let mesesComVenda = new Set();

        todosMovs.forEach(m => {
            const ts = this.parseDataSafe(m.data);
            const mDateStr = ts > 0 ? this.hojeLocal(new Date(ts)).substring(0, 7) : (m.data || '').substring(0, 7);
            const mYearStr = mDateStr.substring(0, 4);
            const val = parseFloat(m.valor || m.valorVenda || 0);
            const isVenda = this.isMovimentacaoVendaReal(m);
            
            if (mYearStr === anoAtualStr && isVenda) {
                vendasAnoAtual += val;
                mesesComVenda.add(mDateStr);
            }

            if (mDateStr === anoMesAnterior && isVenda) {
                vendasAnterior += val;
            }

            if (mDateStr === anoMesAtual) {
                if (m.tipo === 'despesa') {
                    despesas += Math.abs(parseFloat(m.valor || 0));
                } else if (isVenda) {
                    vendas += val;
                    custo += parseFloat(m.custo || 0);
                    qtdVendas++;
                    
                    let prod = m.produto || m.nome || m.descricao || 'Diversos';
                    produtosMes[prod] = (produtosMes[prod] || 0) + 1;
                }
            }
        });

        const topProdutos = Object.entries(produtosMes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(p => `• ${p[1]}x ${p[0]}`)
            .join('\n');

        const lucroLiquido = Math.max(0, vendas - custo - despesas);
        const ticketMedio = qtdVendas > 0 ? (vendas / qtdVendas) : 0;
        
        let variacaoVendas = 0;
        if (vendasAnterior > 0) variacaoVendas = ((vendas - vendasAnterior) / vendasAnterior) * 100;
        else if (vendas > 0) variacaoVendas = 100;
        
        let variacaoStr = variacaoVendas > 0 ? `📈 +${variacaoVendas.toFixed(1)}%` : (variacaoVendas < 0 ? `📉 ${variacaoVendas.toFixed(1)}%` : `➖ 0%`);

        const mesesAtivos = mesesComVenda.size || 1;
        const mediaMensalAno = vendasAnoAtual / mesesAtivos;
        const projecaoAnual = mediaMensalAno * 12;

        const loja40 = Math.round(lucroLiquido * 0.40 * 100) / 100;
        const dist = Math.round(lucroLiquido * 0.60 * 100) / 100;
        const mae58 = Math.round(dist * 0.58 * 100) / 100;
        const pai42 = Math.round(dist * 0.42 * 100) / 100;
        
        const osConcluidas = (this.data.assistencia?.ordensServico || []).filter(o => o.status === 'entregue' && (o.dataConclusao || '').startsWith(anoMesAtual)).length;
        
        const msg = `🗓️ *FECHAMENTO MENSAL DETALHADO — ${mesNome.toUpperCase()}*\n` +
            `🏪 *Cesinha Acessórios — StrategyOS*\n\n` +
            `📊 *RESUMO FINANCEIRO:*\n` +
            `💰 Receita Bruta: R$ ${vendas.toFixed(2)} (${variacaoStr} vs mês passado)\n` +
            `📦 Custo Mercadoria: -R$ ${custo.toFixed(2)}\n` +
            `💸 Despesas Operacionais: -R$ ${despesas.toFixed(2)}\n` +
            `---------------------------------------\n` +
            `💎 *LUCRO LÍQUIDO REAL*: *R$ ${lucroLiquido.toFixed(2)}*\n\n` +
            `⚖️ *APURAÇÃO (CAIXA / FUNDOS):*\n` +
            `🏪 40% Fundo da Loja: *R$ ${loja40.toFixed(2)}*\n` +
            `💜 Cota da Mãe (~35%): *R$ ${mae58.toFixed(2)}*\n` +
            `👨‍🦳 Cota do Pai (~25%): *R$ ${pai42.toFixed(2)}*\n\n` +
            `🎯 *INSIGHTS E ESTATÍSTICAS:*\n` +
            `🛒 Vendas Realizadas: ${qtdVendas} operações\n` +
            `🎫 Ticket Médio: R$ ${ticketMedio.toFixed(2)} por venda\n` +
            `🔧 Consertos Entregues: ${osConcluidas} OS\n\n` +
            `🏆 *Top Produtos Mais Vendidos:*\n${topProdutos || 'Nenhuma venda registrada'}\n\n` +
            `🔮 *PROJEÇÃO ANUAL (${agora.getFullYear()}):*\n` +
            `Se a loja mantiver a média de R$ ${mediaMensalAno.toFixed(2)}, o faturamento chegará a *R$ ${projecaoAnual.toFixed(2)}* no ano!\n\n` +
            `💾 _Backup Mensal Completo anexado_!`;

        const res = await this.enviarTelegram(msg);
        await this.enviarZipSistemaTelegram();
        return res;
    }

    // ===== ALERTA DE ESTOQUE MÍNIMO / CRÍTICO TELEGRAM =====
    async verificarEAlertarEstoqueBaixoTelegram() {
        if (!this.data.configuracoes?.telegramBotToken) return { sucesso: false, erro: 'Bot do Telegram não configurado' };

        const acessorios = this.data.estoqueAcessorios || [];
        const celulares = this.data.estoqueCelulares || [];

        const criticos = [];

        acessorios.forEach(a => {
            const qtd = a.quantidade !== undefined ? a.quantidade : (a.status === 'disponivel' ? 1 : 0);
            if (qtd >= 0 && qtd <= 3) {
                criticos.push(`• *${a.nome}* — Restam apenas *${qtd} un.* (Preço: R$ ${Number(a.precoVenda || 0).toFixed(2)})`);
            }
        });

        celulares.forEach(c => {
            if (c.status === 'disponivel') {
                const qtd = c.quantidade !== undefined ? c.quantidade : 1;
                if (qtd <= 1) {
                    criticos.push(`• *${c.nome}* (${c.capacidade || ''}) — Única unidade no estoque!`);
                }
            }
        });

        if (criticos.length === 0) {
            return { sucesso: true, mensagem: 'Estoque 100% saudável! Nenhum item com estoque baixo.' };
        }

        const msg = `⚠️ *ALERTA DE ESTOQUE CRÍTICO — REPOSIÇÃO NECESSÁRIA!*\n` +
            `🏪 *Cesinha Acessórios*\n\n` +
            `Atenção! Os seguintes itens estão com 3 ou menos unidades disponíveis:\n\n` +
            criticos.slice(0, 15).join('\n') +
            (criticos.length > 15 ? `\n... e mais ${criticos.length - 15} item(ns)` : '') + `\n\n` +
            `🛒 *Ação recomendada:* Fazer o pedido de reposição com o fornecedor!`;

        const res = await this.enviarTelegram(msg);
        return res;
    }

    // ===== SINCRONIZAÇÃO EM TEMPO REAL: LEITOR CÂMERA CELULAR ➔ CAIXA NOTEBOOK =====
    async enviarBipCelularParaNotebook(codigoBipado, itemObj = null) {
        if (!this.data.bipsRemotos) this.data.bipsRemotos = [];
        const eventoBip = {
            id: Date.now(),
            codigo: codigoBipado,
            produto: itemObj ? itemObj.nome : 'Produto Bipado',
            preco: itemObj ? (itemObj.precoVenda || itemObj.preco) : 0,
            timestamp: new Date().toISOString()
        };
        this.data.bipsRemotos.push(eventoBip);
        if (this.data.bipsRemotos.length > 20) this.data.bipsRemotos.shift();
        this.saveData();

        try {
            if (this.salvarSupabase) await this.salvarSupabase();
        } catch (e) {
            console.warn('Sync bip remoto:', e);
        }
        return eventoBip;
    }

    iniciarEscutaScannerNotebook(callbackBip) {
        if (this._intervaloEscutaBip) clearInterval(this._intervaloEscutaBip);
        let ultimoIdVisto = Date.now();

        this._intervaloEscutaBip = setInterval(async () => {
            if (this.data.bipsRemotos && this.data.bipsRemotos.length > 0) {
                const ultimoBip = this.data.bipsRemotos[this.data.bipsRemotos.length - 1];
                if (ultimoBip && ultimoBip.id > ultimoIdVisto) {
                    ultimoIdVisto = ultimoBip.id;
                    if (callbackBip) callbackBip(ultimoBip);
                }
            }
        }, 1000);
    }

    async enviarBackupDocumentoTelegram(chatIdTarget = null) {
        if (this._ultimoBackupDocMs && (Date.now() - this._ultimoBackupDocMs < 60000)) {
            return { sucesso: true, ignoradoCooldown: true };
        }
        this._ultimoBackupDocMs = Date.now();
        const cfg = this.getConfigTelegram();
        const botToken = cfg.botToken;
        const chatId = chatIdTarget || cfg.chatId;

        if (!botToken || !chatId) return { sucesso: false, erro: 'Bot do Telegram não configurado. Adicione o Token nas configurações.' };

        try {
            const dataStr = this.exportarDados();
            const dataAtual = this.hojeLocal();
            const fileName = `StrategyOS_Backup_Cesinha_${dataAtual}.json`;

            const blob = new Blob([dataStr], { type: 'application/json' });
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', `💾 *BACKUP AUTOMÁTICO STRATEGYOS* — ${dataAtual}\nGuardado permanentemente nos servidores do Telegram!`);
            formData.append('document', blob, fileName);

            const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
            const resp = await fetch(url, {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            return { sucesso: data.ok, data };
        } catch (e) {
            console.error('Erro ao enviar arquivo backup para o Telegram:', e);
            return { sucesso: false, erro: e.message };
        }
    }

    // ===== RECALCULAR FUNDO DE REPOSIÇÃO DE ESTOQUE =====
    recalcularFundoReposicaoExistente() {
        if (!this.data.fundoCustoEstoque) this.data.fundoCustoEstoque = { totalAcumulado: 0, historicoCusto: [] };
        let total = 0;
        const historicoCusto = [];

        const vendas = this.data.historico?.vendas || [];
        vendas.forEach(v => {
            let c = parseFloat(v.custo) || 0;
            const valVenda = parseFloat(v.valorVenda) || parseFloat(v.valor) || 0;
            if (c <= 0 && valVenda > 0) {
                c = this.calcularCustoReposicao(v.produto, v.tipo, valVenda);
                v.custo = c;
                v.lucro = Math.max(0, valVenda - c);
            }
            if (c > 0) {
                total += c;
                historicoCusto.push({
                    data: v.data || new Date().toISOString(),
                    produto: v.produto || 'Item Vendido',
                    custo: c,
                    valorVenda: valVenda,
                    tipo: v.tipo || 'venda'
                });
            }
        });

        this.data.fundoCustoEstoque.totalAcumulado = Math.round(total * 100) / 100;
        if (this.data.fundoCustoEstoque.saldoGuardado === undefined) {
            this.data.fundoCustoEstoque.saldoGuardado = this.data.fundoCustoEstoque.totalAcumulado;
        }
        this.data.fundoCustoEstoque.historicoCusto = historicoCusto;
    }

    // ===== LIMPAR ESTOQUE DE CELULARES (MANTER APENAS IPHONE XR DISPONÍVEL) =====
    limparEstoqueCelularesDisponiveis() {
        if (!this.data.estoqueCelulares) return;
        this.data.estoqueCelulares.forEach(c => {
            const nomeLower = (c.nome || '').toLowerCase();
            if (!nomeLower.includes('iphone xr')) {
                if (c.status === 'disponivel') {
                    c.status = 'vendido';
                }
            }
        });
        this.saveData();
    }



    // ===== MOVIMENTAÇÃO DE DEPOSITAR / SEPARAR DINHEIRO DE REPOSIÇÃO =====
    depositarFundoReposicao(valor, obs = '') {
        if (!this.data.fundoCustoEstoque) this.data.fundoCustoEstoque = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
        if (!this.data.fundoCustoEstoque.historicoMovimentacoes) this.data.fundoCustoEstoque.historicoMovimentacoes = [];
        
        const val = parseFloat(valor) || 0;
        if (val <= 0) return { sucesso: false, erro: 'Valor inválido' };

        this.data.fundoCustoEstoque.saldoGuardado = Math.round(((this.data.fundoCustoEstoque.saldoGuardado || 0) + val) * 100) / 100;
        this.data.fundoCustoEstoque.historicoMovimentacoes.push({
            tipo: 'deposito',
            valor: val,
            obs: obs || 'Guardou dinheiro no Fundo de Reposição',
            data: new Date().toISOString()
        });

        this.saveData();
        return { sucesso: true, saldo: this.data.fundoCustoEstoque.saldoGuardado };
    }

    // ===== MOVIMENTAÇÃO DE RETIRAR DINHEIRO PARA COMPRAR ESTOQUE =====
    usarFundoReposicao(valor, descricao = '') {
        if (!this.data.fundoCustoEstoque) this.data.fundoCustoEstoque = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
        if (!this.data.fundoCustoEstoque.historicoMovimentacoes) this.data.fundoCustoEstoque.historicoMovimentacoes = [];

        const val = parseFloat(valor) || 0;
        if (val <= 0) return { sucesso: false, erro: 'Valor inválido' };

        this.data.fundoCustoEstoque.saldoGuardado = Math.round(Math.max(0, (this.data.fundoCustoEstoque.saldoGuardado || 0) - val) * 100) / 100;
        this.data.fundoCustoEstoque.historicoMovimentacoes.push({
            tipo: 'saida',
            valor: -val,
            obs: descricao || 'Uso do fundo p/ compra de mercadoria',
            data: new Date().toISOString()
        });

        this.saveData();
        return { sucesso: true, saldo: this.data.fundoCustoEstoque.saldoGuardado };
    }

    // ===== MOVIMENTAÇÃO DO FUNDO DE REPOSIÇÃO EXCLUSIVO DE FOGOS DE ARTIFÍCIO =====
    depositarFundoReposicaoFogos(valor, obs = '') {
        if (!this.data.fundoReposicaoFogos) this.data.fundoReposicaoFogos = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
        if (!this.data.fundoReposicaoFogos.historicoMovimentacoes) this.data.fundoReposicaoFogos.historicoMovimentacoes = [];
        
        const val = parseFloat(valor) || 0;
        if (val <= 0) return { sucesso: false, erro: 'Valor inválido' };

        this.data.fundoReposicaoFogos.saldoGuardado = Math.round(((this.data.fundoReposicaoFogos.saldoGuardado || 0) + val) * 100) / 100;
        this.data.fundoReposicaoFogos.historicoMovimentacoes.push({
            tipo: 'deposito',
            valor: val,
            obs: obs || 'Depósito no Fundo de Reposição de Fogos',
            data: new Date().toISOString()
        });

        this.saveData();
        return { sucesso: true, saldo: this.data.fundoReposicaoFogos.saldoGuardado };
    }

    usarFundoReposicaoFogos(valor, descricao = '') {
        if (!this.data.fundoReposicaoFogos) this.data.fundoReposicaoFogos = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
        if (!this.data.fundoReposicaoFogos.historicoMovimentacoes) this.data.fundoReposicaoFogos.historicoMovimentacoes = [];

        const val = parseFloat(valor) || 0;
        if (val <= 0) return { sucesso: false, erro: 'Valor inválido' };

        this.data.fundoReposicaoFogos.saldoGuardado = Math.round(Math.max(0, (this.data.fundoReposicaoFogos.saldoGuardado || 0) - val) * 100) / 100;
        this.data.fundoReposicaoFogos.historicoMovimentacoes.push({
            tipo: 'saida',
            valor: -val,
            obs: descricao || 'Compra de estoque de fogos de artifício',
            data: new Date().toISOString()
        });

        this.saveData();
        return { sucesso: true, saldo: this.data.fundoReposicaoFogos.saldoGuardado };
    }

    // ===== RELATÓRIO MENSAL DE CUSTOS E DESPESAS DIA A DIA =====
    getRelatorioMensalPorDia(mesAno) {
        if (!mesAno) mesAno = this.hojeLocal().substring(0, 7);
        const agrupado = {};
        const todosMovs = this.getTodosMovimentacoesHistorico();

        todosMovs.forEach(m => {
            const ts = this.parseDataSafe(m.data);
            const data = ts > 0 ? this.hojeLocal(new Date(ts)) : (m.data || '').substring(0, 10);
            if (!data || !data.startsWith(mesAno)) return;
            if (!agrupado[data]) agrupado[data] = { data, vendas: 0, custo: 0, despesas: 0, itensDespesas: [] };

            if (m.tipo === 'despesa') {
                const val = Math.abs(parseFloat(m.valor || 0));
                agrupado[data].despesas += val;
                agrupado[data].itensDespesas.push(m.descricao ? m.descricao.replace('DESPESA: ', '') : 'Despesa');
            } else if (this.isMovimentacaoVendaReal(m)) {
                const val = parseFloat(m.valor || 0);
                const c = parseFloat(m.custo || 0);
                agrupado[data].vendas += val;
                agrupado[data].custo += c;
            }
        });

        return Object.keys(agrupado).sort().map(dStr => {
            const d = agrupado[dStr];
            const lucroLiquidoReal = Math.max(0, d.vendas - d.custo - d.despesas);
            const parteLoja40 = Math.round(lucroLiquidoReal * 0.40 * 100) / 100;
            const partePai60 = Math.round(lucroLiquidoReal * 0.60 * 100) / 100;
            return {
                data: dStr,
                vendas: d.vendas,
                custo: d.custo,
                despesas: d.despesas,
                itensDespesas: d.itensDespesas,
                lucroLiquidoReal,
                parteLoja40,
                partePai60
            };
        });
    }

    isModoTreino() {
        return !!(this.data.preferencias && this.data.preferencias.modoTreino);
    }

    // ===== SINCRONIZAÇÃO FINANCEIRA GLOBAL & DIVISÃO DE LUCROS (40% LOJA / 60% PAI) =====
    _registrarSincronizacaoFinanceira({ tipo, produto, valorVenda, custo, caixaDestino, cliente }) {
        if (this.isModoTreino()) {
            console.log('[StrategyOS] Modo Treino ativo — Venda/Movimentação simulada não será registrada no financeiro real.');
            return;
        }
        if (!this.data.fundoCustoEstoque) this.data.fundoCustoEstoque = { totalAcumulado: 0, historicoCusto: [] };
        if (!this.data.divisaoLucro) this.data.divisaoLucro = { totalLucroAcumulado: 0, porcentagemLoja: 40, porcentagemPai: 60, acumuladoLoja40: 0, acumuladoPai60: 0, historicoDivisao: [] };
        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];

        const valorTotal = Math.max(0, parseFloat(valorVenda) || 0);
        let valorCusto = Math.max(0, parseFloat(custo) || 0);

        // Se o produto foi vendido sem custo cadastrado (ex: capinha, película, avulso), calcula custo estimado de reposição
        if (valorCusto <= 0 && valorTotal > 0) {
            valorCusto = this.calcularCustoReposicao(produto, tipo, valorTotal);
        }

        const lucroLiquido = Math.max(0, valorTotal - valorCusto);
        const parteLoja = Math.round(lucroLiquido * 0.40 * 100) / 100;
        const partePai = Math.round(lucroLiquido * 0.60 * 100) / 100;

        // Alerta de produto sem custo cadastrado
        if ((parseFloat(custo) || 0) <= 0 && valorTotal > 0) {
            if (!this.data.alertasProdutosSemCusto) this.data.alertasProdutosSemCusto = [];
            this.data.alertasProdutosSemCusto.push({
                data: new Date().toISOString(),
                produto: produto || 'Item sem nome',
                valorVenda: valorTotal,
                custoEstimadoCalculado: valorCusto
            });
        }

        // Disparo Automático Instantâneo para o Telegram (com destino real e lucro líquido)
        try {
            if (typeof this.enviarNotificacaoVendaTelegram === 'function' && valorTotal > 0) {
                const tipoFormatado = (tipo || 'venda').replace('venda_', '').replace('os_', 'OS ').toUpperCase();
                const labelDestino = caixaDestino === 'caixaSecundario' ? '💵 Dinheiro (Gaveta Física)'
                    : caixaDestino === 'caixaPrincipal' ? '🏦 PIX / Cartão (Conta Principal)'
                    : caixaDestino === 'caixaFogos' ? '🎇 Caixa de Fogos'
                    : caixaDestino === 'caixaTerciario' ? '👨‍🦳 Caixa Terciário (Pai)'
                    : '💵 Gaveta / Caixa';
                setTimeout(() => {
                    this.enviarNotificacaoVendaTelegram(
                        `[${tipoFormatado}] ${produto || 'Produto/Serviço'}`,
                        valorTotal,
                        labelDestino,
                        cliente || 'Consumidor Geral',
                        { custo: valorCusto, lucro: lucroLiquido }
                    );
                }, 50);
            }
        } catch (e) {
            console.warn('[Telegram] Falha ao enviar notificação instantânea:', e);
        }

        // Vincular a venda diretamente ao histórico do cliente
        if (cliente && cliente !== 'Não Identificado') {
            this.vincularVendaAoCliente(cliente, produto, valorTotal, tipo);
        }

        // 1. Reservar o Custo no Fundo de Reposição Específico
        const isFogos = (tipo || '').includes('fogos') || (produto || '').toLowerCase().includes('fogo') || (produto || '').toLowerCase().includes('giranda') || (produto || '').toLowerCase().includes('caixa 12') || (produto || '').toLowerCase().includes('caixa 19');
        const isConsertoOS = (tipo || '').includes('os_') || (tipo || '').includes('conserto') || (produto || '').toLowerCase().includes('os #');

        if (isFogos) {
            if (!this.data.fundoReposicaoFogos) this.data.fundoReposicaoFogos = { totalAcumulado: 0, saldoGuardado: 0, historicoCusto: [], historicoMovimentacoes: [] };
            if (valorCusto > 0) {
                this.data.fundoReposicaoFogos.totalAcumulado += valorCusto;
                this.data.fundoReposicaoFogos.saldoGuardado = (this.data.fundoReposicaoFogos.saldoGuardado || 0) + valorCusto;
                this.data.fundoReposicaoFogos.historicoCusto.push({
                    data: new Date().toISOString(),
                    produto: produto || 'Fogo de Artifício',
                    custo: valorCusto,
                    valorVenda: valorTotal,
                    tipo: 'venda_fogos'
                });
            }
        } else if (valorCusto > 0) {
            this.data.fundoCustoEstoque.totalAcumulado += valorCusto;
            // Se NÃO for conserto (para conserto, a peça já é paga na hora ao fornecedor), guarda o dinheiro de reposição no cofre
            if (!isConsertoOS) {
                this.data.fundoCustoEstoque.saldoGuardado = (this.data.fundoCustoEstoque.saldoGuardado || 0) + valorCusto;
            }
            this.data.fundoCustoEstoque.historicoCusto.push({
                data: new Date().toISOString(),
                produto: produto || 'Item Vendido',
                custo: valorCusto,
                valorVenda: valorTotal,
                tipo: tipo || 'venda',
                pecaPagaNaHora: isConsertoOS
            });
        }

        // 2. Rateio do Lucro Líquido (40% Loja / 60% Pai)
        this.data.divisaoLucro.totalLucroAcumulado += lucroLiquido;
        this.data.divisaoLucro.acumuladoLoja40 += parteLoja;
        this.data.divisaoLucro.acumuladoPai60 += partePai;

        // Bônus/Comissão de vendas da Ilanna — REGRAS:
        // 1. Acessórios/Películas/Avulsas e Consertos/OS: Lucro líquido COMPLETO entra na meta
        // 2. Celulares vendidos por ela: 3% do valor de venda entra na meta
        // 3. Fogos: NÃO entram na meta (caixa exclusivo de fogos)
        const isVendaCelular = (tipo || '').includes('avista') || (tipo || '').includes('parcelado') || (tipo || '').includes('crediario') || (tipo || '').includes('pix');
        if (!isFogos) {
            let comissaoAdicionada = 0;
            if (isVendaCelular) {
                comissaoAdicionada = Math.round(valorTotal * 0.03 * 100) / 100;
            } else {
                comissaoAdicionada = lucroLiquido;
            }
            this.data.comissaoIlannaMensal = (this.data.comissaoIlannaMensal || 0) + comissaoAdicionada;
            
            // LOG DETALHADO DE COMISSÃO
            if (!this.data.logComissaoMensal) this.data.logComissaoMensal = [];
            this.data.logComissaoMensal.push({
                vendaId: Date.now(),
                produto: produto || 'Item Vendido',
                valorVenda: valorTotal,
                lucro: lucroLiquido,
                comissaoAdicionada: comissaoAdicionada,
                tipoCalculo: isVendaCelular ? '3% do valor de venda (celular)' : isConsertoOS ? 'lucro líquido completo (conserto/OS)' : 'lucro líquido completo (acessório)',
                comissaoAcumulada: this.data.comissaoIlannaMensal,
                data: new Date().toISOString()
            });
        }

        // Atualização dos caixas operacionais
        if (this.data.financeiro) {
            if (this.data.financeiro.caixaFogos === undefined) this.data.financeiro.caixaFogos = 0;
            if (this.data.financeiro.caixaPrincipal === undefined) this.data.financeiro.caixaPrincipal = 0;
            if (this.data.financeiro.caixaSecundario === undefined) this.data.financeiro.caixaSecundario = 0;
            
            if (isFogos || caixaDestino === 'caixaFogos') {
                // Vendas de fogos de artifício vão 100% para o Caixa de Fogos
                this.data.financeiro.caixaFogos += valorTotal;
            } else if (caixaDestino === 'caixaTerciario') {
                if (this.data.financeiro.caixaTerciario === undefined) this.data.financeiro.caixaTerciario = 0;
                this.data.financeiro.caixaTerciario += partePai;
            } else {
                // CAIXA SECUNDÁRIO = GAVETA FÍSICA DA LOJA
                // Vendas em dinheiro entram integralmente na gaveta física
                const isDinheiro = (caixaDestino === 'caixaSecundario') || ((tipo || '').includes('dinheiro')) || (!caixaDestino && (tipo || '').includes('avista'));
                if (isDinheiro) {
                    this.data.financeiro.caixaSecundario += valorTotal;
                }
                this.data.financeiro.caixaPrincipal += valorTotal;
            }
        }

        this.data.divisaoLucro.historicoDivisao.push({
            data: new Date().toISOString(),
            produto: produto || 'Item',
            valorVenda: valorTotal,
            custo: valorCusto,
            lucroLiquido: lucroLiquido,
            parteLoja40: parteLoja,
            partePai60: partePai,
            cliente: cliente || 'Não Identificado'
        });

        // 3. Extrato Geral de Movimentações
        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];
        this.data.movimentacoesCaixa.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            data: new Date().toISOString(),
            tipo: tipo || 'venda',
            caixa: caixaDestino || 'caixaPrincipal',
            valor: valorTotal,
            custo: valorCusto,
            lucro: lucroLiquido,
            parteLoja: parteLoja,
            partePai: partePai,
            cliente: cliente || 'Não Identificado',
            descricao: `${(tipo || 'venda').toUpperCase()}: ${produto} — ${UI.R(valorTotal)} (Custo Peça: ${UI.R(valorCusto)} | Lucro Líquido: ${UI.R(lucroLiquido)} [40% Loja: ${UI.R(parteLoja)} | 60% Pai: ${UI.R(partePai)}])`
        });

        this.data._ultimoSaveLocal = Date.now();
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        return { sucesso: true };
    }

    // ===== ESTORNAR / CANCELAR VENDA OU MOVIMENTAÇÃO (CORREÇÃO DE CAIXAS) =====
    estornarVendaERetroagirCaixa(dados = {}) {
        return this.estornarMovimentacao(
            dados.nomeProduto || dados.descricao || '',
            dados.valorVenda !== undefined ? dados.valorVenda : dados.valor,
            dados.dataItem || dados.data || '',
            dados.tipo || 'venda',
            dados.custo,
            dados.caixaOrigem || dados.caixa
        );
    }

    estornarMovimentacao(itemDesc, itemValor, itemData, tipo = 'venda', custoInformado = undefined, caixaInformado = undefined) {
        // Suporte a chamada por ID numérico ou por Objeto direto
        if (typeof itemDesc === 'number' || (typeof itemDesc === 'string' && /^\d+$/.test(itemDesc) && itemValor === undefined)) {
            const idBusca = Number(itemDesc);
            const movEncontrada = (this.data.movimentacoesCaixa || []).find(m => Number(m.id) === idBusca);
            if (!movEncontrada) {
                return { sucesso: false, msg: 'Movimentação não encontrada pelo ID.' };
            }
            itemDesc = movEncontrada.descricao || movEncontrada.motivo || '';
            itemValor = movEncontrada.valor;
            itemData = movEncontrada.data;
            tipo = movEncontrada.tipo || 'venda';
            custoInformado = movEncontrada.custo;
            caixaInformado = movEncontrada.caixa;
        } else if (typeof itemDesc === 'object' && itemDesc !== null) {
            const obj = itemDesc;
            itemDesc = obj.nomeProduto || obj.descricao || obj.produto || '';
            itemValor = obj.valorVenda !== undefined ? obj.valorVenda : obj.valor;
            itemData = obj.dataItem || obj.data || '';
            tipo = obj.tipo || 'venda';
            custoInformado = obj.custo;
            caixaInformado = obj.caixaOrigem || obj.caixa;
        }

        const valRaw = parseFloat(itemValor) || 0;
        const valVenda = Math.abs(valRaw);
        const descClean = (itemDesc || '').toLowerCase().trim();
        const tipoLower = (tipo || '').toLowerCase();
        
        let valorCusto = custoInformado !== undefined ? (parseFloat(custoInformado) || 0) : 0;
        if (valorCusto <= 0 && (descClean.includes('custo peça:') || descClean.includes('custo peca:'))) {
            const matchCusto = descClean.match(/custo pe[çc]a:\s*r\$\s*([\d\.,]+)/i);
            if (matchCusto) valorCusto = parseFloat(matchCusto[1].replace(/\./g, '').replace(',', '.')) || 0;
        }

        let lucroLiquido = Math.max(0, valVenda - valorCusto);
        let parteLoja = Math.round(lucroLiquido * 0.40 * 100) / 100;
        let partePai = Math.round(lucroLiquido * 0.60 * 100) / 100;

        let caixaOrigem = caixaInformado || 'caixaSecundario';
        if (!caixaInformado) {
            if (descClean.includes('caixaterciario') || descClean.includes('terciario') || descClean.includes('pai')) {
                caixaOrigem = 'caixaTerciario';
            } else if (descClean.includes('caixafogos') || descClean.includes('fogos')) {
                caixaOrigem = 'caixaFogos';
            } else if (descClean.includes('caixaprincipal')) {
                caixaOrigem = 'caixaPrincipal';
            }
        }

        const matchItem = (itemText, itemVal, itemTimestamp) => {
            if (itemData && itemTimestamp) {
                const dt1 = new Date(itemData).getTime();
                const dt2 = new Date(itemTimestamp).getTime();
                if (!isNaN(dt1) && !isNaN(dt2) && Math.abs(dt1 - dt2) < 2000) return true;
            }
            const txt = (itemText || '').toLowerCase().trim();
            const textMatch = txt && descClean && (descClean.includes(txt) || txt.includes(descClean) || descClean.includes(txt.substring(0, 15)));
            const valMatch = itemVal === undefined || Math.abs(Math.abs(parseFloat(itemVal) || 0) - valVenda) < 0.05;
            return Boolean(textMatch && valMatch);
        };

        // Se for estorno de Despesa ou Saída, devolve o valor para o caixa de onde saiu
        if (tipoLower === 'despesa' || tipoLower === 'saida' || valRaw < 0) {
            if (this.data.financeiro) {
                const cx = this.data.financeiro[caixaOrigem] !== undefined ? caixaOrigem : 'caixaSecundario';
                this.data.financeiro[cx] = (this.data.financeiro[cx] || 0) + valVenda;
            }
            if (this.data.movimentacoesCaixa) {
                const idxMov = this.data.movimentacoesCaixa.findIndex(m => matchItem(m.descricao || m.motivo, m.valor, m.data));
                if (idxMov !== -1) this.data.movimentacoesCaixa.splice(idxMov, 1);
            }
            this.data._ultimoSaveLocal = Date.now();
            this.saveData();
            if (this.supabase) this.salvarSupabase();
            return { sucesso: true, msg: 'Despesa/Saída estornada e devolvida ao caixa.' };
        }

        // 1. Retroagir Caixas Financeiros (Desconta o valor real da venda que entrou no caixa)
        if (this.data.financeiro) {
            if (caixaOrigem === 'caixaTerciario') {
                this.data.financeiro.caixaTerciario = Math.max(0, (this.data.financeiro.caixaTerciario || 0) - partePai);
            } else if (caixaOrigem === 'caixaFogos') {
                this.data.financeiro.caixaFogos = Math.max(0, (this.data.financeiro.caixaFogos || 0) - valVenda);
            } else if (caixaOrigem === 'caixaPrincipal') {
                this.data.financeiro.caixaPrincipal = Math.max(0, (this.data.financeiro.caixaPrincipal || 0) - valVenda);
            } else {
                this.data.financeiro.caixaSecundario = Math.max(0, (this.data.financeiro.caixaSecundario || 0) - valVenda);
                this.data.financeiro.caixaPrincipal = Math.max(0, (this.data.financeiro.caixaPrincipal || 0) - valVenda);
            }
        }

        // 2. Retroagir Divisão de Lucros
        if (this.data.divisaoLucro) {
            this.data.divisaoLucro.totalLucroAcumulado = Math.max(0, (this.data.divisaoLucro.totalLucroAcumulado || 0) - lucroLiquido);
            this.data.divisaoLucro.acumuladoLoja40 = Math.max(0, (this.data.divisaoLucro.acumuladoLoja40 || 0) - parteLoja);
            this.data.divisaoLucro.acumuladoPai60 = Math.max(0, (this.data.divisaoLucro.acumuladoPai60 || 0) - partePai);
            
            if (Array.isArray(this.data.divisaoLucro.historicoDivisao)) {
                const idxDiv = this.data.divisaoLucro.historicoDivisao.findIndex(d => matchItem(d.produto, d.valorVenda, d.data));
                if (idxDiv !== -1) this.data.divisaoLucro.historicoDivisao.splice(idxDiv, 1);
            }
        }

        // 3. Retroagir Comissão Mensal se aplicável
        const isFogos = (tipo || '').includes('fogos') || descClean.includes('fogo');
        const isVendaCelular = (tipo || '').includes('avista') || (tipo || '').includes('parcelado') || (tipo || '').includes('crediario') || (tipo || '').includes('pix');

        if (!isFogos && this.data.comissaoIlannaMensal) {
            if (isVendaCelular) {
                const contribuicaoCelular = Math.round(valVenda * 0.03 * 100) / 100;
                this.data.comissaoIlannaMensal = Math.max(0, this.data.comissaoIlannaMensal - contribuicaoCelular);
            } else {
                this.data.comissaoIlannaMensal = Math.max(0, this.data.comissaoIlannaMensal - lucroLiquido);
            }
        }

        // 4. Remover das movimentações do caixa
        if (this.data.movimentacoesCaixa) {
            const idxMov = this.data.movimentacoesCaixa.findIndex(m => matchItem(m.descricao || m.motivo, m.valor, m.data));
            if (idxMov !== -1) {
                this.data.movimentacoesCaixa.splice(idxMov, 1);
            }
        }

        // 5. Remover do histórico de vendas e devolver ao estoque se aplicável
        if (this.data.historico && this.data.historico.vendas) {
            const idxVenda = this.data.historico.vendas.findIndex(v => matchItem(v.produto, v.valorVenda || v.valor, v.data));
            if (idxVenda !== -1) {
                const vendaRemovida = this.data.historico.vendas.splice(idxVenda, 1)[0];
                const prodNome = (vendaRemovida?.produto || '').toLowerCase();
                if (prodNome) {
                    const cel = (this.data.estoqueCelulares || []).find(c => c.nome && prodNome.includes(c.nome.toLowerCase()));
                    if (cel && cel.status === 'vendido') {
                        cel.status = 'disponivel';
                        cel.quantidade = (cel.quantidade || 0) + 1;
                    } else {
                        const ac = (this.data.estoqueAcessorios || []).find(a => a.nome && prodNome.includes(a.nome.toLowerCase()));
                        if (ac) {
                            ac.status = 'disponivel';
                            ac.quantidade = (ac.quantidade || 0) + 1;
                        }
                    }
                }
            }
        }

        // 6. Retroagir fundoCustoEstoque se aplicável
        if (this.data.fundoCustoEstoque) {
            if (valorCusto > 0) {
                this.data.fundoCustoEstoque.totalAcumulado = Math.max(0, (this.data.fundoCustoEstoque.totalAcumulado || 0) - valorCusto);
                this.data.fundoCustoEstoque.saldoGuardado = Math.max(0, (this.data.fundoCustoEstoque.saldoGuardado || 0) - valorCusto);
            }
            if (Array.isArray(this.data.fundoCustoEstoque.historicoCusto)) {
                const idxCusto = this.data.fundoCustoEstoque.historicoCusto.findIndex(c => matchItem(c.produto, c.valorVenda, c.data));
                if (idxCusto !== -1) this.data.fundoCustoEstoque.historicoCusto.splice(idxCusto, 1);
            }
        }

        this.data._ultimoSaveLocal = Date.now();
        this.saveData();
        if (this.supabase) this.salvarSupabase();

        try {
            const cfg = this.getConfigTelegram();
            if (cfg.botToken && cfg.autoCaixa) {
                const msgEstorno = `🚨 *ALERTA DE ESTORNO / CANCELAMENTO NO CAIXA*\n\n` +
                    `🗑️ *Item Estornado*: ${itemDesc || 'Movimentação'}\n` +
                    `💰 *Valor Revertido*: R$ ${valVenda.toFixed(2)}\n` +
                    `🏦 *Caixa Afetado*: ${caixaOrigem}\n` +
                    `💵 *Saldo Atual Gaveta*: R$ ${Number(this.data.financeiro?.caixaSecundario || 0).toFixed(2)}\n` +
                    `⏰ *Hora*: ${this.horaLocal ? this.horaLocal() : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                this.enviarTelegram(msgEstorno);
            }
        } catch (e) {}

        return { sucesso: true, msg: 'Movimentação estornada com sucesso.' };
    }

    // ===== VENDER ACESSÓRIO =====
    venderAcessorio(produtoId, valorVenda, cliente = '', caixaDestino = 'caixaSecundario') {
        const idx = this.data.estoqueAcessorios.findIndex(p => String(p.id) === String(produtoId));
        if (idx === -1) return { sucesso: false, erro: 'Acessório não encontrado' };
        const prod = this.data.estoqueAcessorios[idx];
        const lucro = valorVenda - prod.custo;
        if (prod.quantidade && prod.quantidade > 1) {
            prod.quantidade -= 1;
        } else {
            prod.quantidade = 0;
            prod.status = 'vendido';
        }
        this.data.historico.vendas.push({ data: new Date().toISOString(), produto: prod.nome, custo: prod.custo, valorVenda, lucro, tipo: 'acessorio', cliente: cliente || 'Não Identificado', caixaDestino });
        
        this._registrarSincronizacaoFinanceira({
            tipo: 'venda_acessorio',
            produto: prod.nome,
            valorVenda: valorVenda,
            custo: prod.custo,
            caixaDestino: caixaDestino || 'caixaSecundario',
            cliente: cliente
        });

        this.saveData();
        return { sucesso: true, produto: prod.nome, lucro, caixa: this.data.financeiro.caixaAcessorios };
    }

    // ===== VENDER PELÍCULA =====
    venderPelicula(modelo, tipo, preco, tipoPelicula = 'hd_hidrogel', cliente = '', caixaDestino = 'caixaSecundario') {
        const custos = this.data.precoPelicula.custosReais;
        const custo = custos[tipoPelicula] || custos.hd_hidrogel || 5;
        const lucro = preco - custo;
        this.data.historico.vendas.push({ data: new Date().toISOString(), produto: `Película ${tipo} (${tipoPelicula}) — ${modelo}`, custo, valorVenda: preco, lucro, tipo: 'pelicula', cliente: cliente || 'Não Identificado', caixaDestino });
        
        this._registrarSincronizacaoFinanceira({
            tipo: 'venda_pelicula',
            produto: `Película ${tipo} (${tipoPelicula}) — ${modelo}`,
            valorVenda: preco,
            custo: custo,
            caixaDestino: caixaDestino || 'caixaSecundario',
            cliente: cliente
        });

        this.saveData();
        return { sucesso: true, lucro, custo, caixa: this.data.financeiro.caixaAcessorios };
    }

    // ===== ORDEM DE SERVIÇO (ASSISTÊNCIA TÉCNICA) =====
    criarOrdemServico(os) {
        const num = this.data.assistencia.proximoNumero;
        const valorFinal = parseFloat(os.valorFinal || os.preco || os.valorOrcamento || 0);
        const valorEntrada = parseFloat(os.entrada || os.valorEntrada || 0);
        const custoPeca = os.custoPeca !== undefined ? parseFloat(os.custoPeca) : (os.custoTotal !== undefined ? parseFloat(os.custoTotal) : (os.custoInterno !== undefined ? parseFloat(os.custoInterno) : Math.round(valorFinal * 0.35 * 100) / 100));
        const nova = {
            numero: num,
            ...os,
            fotos: os.fotos || [],
            custoPeca: custoPeca,
            custoTotal: custoPeca,
            valorFinal: valorFinal,
            preco: valorFinal,
            dataCriacao: new Date().toISOString(),
            status: os.status || 'aguardando_peca',
            pago: valorEntrada,
            restante: valorFinal - valorEntrada
        };
        this.data.assistencia.ordensServico.push(nova);
        this.data.assistencia.proximoNumero = num + 1;
        
        if (valorEntrada > 0) {
            const propEntrada = valorFinal > 0 ? (valorEntrada / valorFinal) : 1;
            const custoEntrada = Math.round(custoPeca * propEntrada * 100) / 100;
            const formaEnt = (os.formaPagamentoEntrada || 'dinheiro').toLowerCase();
            this._registrarSincronizacaoFinanceira({
                tipo: 'os_entrada',
                produto: `OS #${num} (Entrada): ${os.servico} — ${os.modelo}`,
                valorVenda: valorEntrada,
                custo: custoEntrada,
                caixaDestino: formaEnt === 'dinheiro' ? 'caixaSecundario' : 'caixaPrincipal',
                cliente: os.cliente
            });
        }
        this.saveData();
        if (this.supabase) this.salvarSupabase();

        // Notificação instantânea Telegram a cada conserto registrado
        try {
            const agora = new Date();
            const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const dataStr = agora.toLocaleDateString('pt-BR');
            const msgOS = `🔧 *CONSERTO REGISTRADO*\n⏰ ${hora} de ${dataStr}\n👤 Cliente: ${nova.cliente || 'Não identificado'}\n📱 Aparelho: ${nova.aparelho || nova.modelo || 'Não informado'}\n🔧 Serviço: ${nova.servico || nova.defeito || 'Não informado'}\n💰 Valor cobrado: R$ ${(valorFinal || 0).toFixed(2)}`;
            this.enviarTelegram(msgOS);
        } catch(e) { /* silencioso */ }

        return { sucesso: true, numero: num };
    }

    atualizarStatusOS(numero, novoStatus) {
        const os = this.data.assistencia.ordensServico.find(o => o.numero === numero);
        if (!os) return { sucesso: false, erro: 'OS não encontrada' };

        // GUARDA ANTI-DUPLICAÇÃO: Se já estava entregue e tenta marcar como entregue novamente, aborta o financeiro
        if (os.status === 'entregue' && novoStatus === 'entregue') {
            console.log(`[StrategyOS] OS #${numero} já consta como entregue. Ignorando re-processamento financeiro.`);
            return { sucesso: true, jaEntregue: true };
        }

        const eraEntregue = os.status === 'entregue';
        os.status = novoStatus;

        if (novoStatus === 'entregue' && !eraEntregue) {
            const valorTotalOS = parseFloat(os.valorFinal || os.preco || os.valor || 0);
            const jaFoiPago = parseFloat(os.pago || os.entrada || 0);
            const restante = os.restante !== undefined ? parseFloat(os.restante) : (os.falta !== undefined ? parseFloat(os.falta) : Math.max(0, valorTotalOS - jaFoiPago));

            if (restante > 0) {
                os.pago = jaFoiPago + restante;
                os.restante = 0;
                os.falta = 0;
            }
            os.dataEntrega = new Date().toISOString();

            const custoPecaOS = os.custoPeca !== undefined ? parseFloat(os.custoPeca) : (os.custoTotal !== undefined ? parseFloat(os.custoTotal) : Math.round(valorTotalOS * 0.35 * 100) / 100);

            // Verificar se esta OS já possui registro no histórico de vendas para EVITAR QUALQUER DUPLICAÇÃO
            if (!this.data.historico.vendas) this.data.historico.vendas = [];
            const idOSPadronizado = `OS #${String(numero).padStart(3, '0')}`;
            const idOSCurto = `OS #${numero}`;

            const jaExisteVenda = this.data.historico.vendas.some(v => (v.produto || '').includes(idOSPadronizado) || (v.produto || '').includes(idOSCurto));

            if (!jaExisteVenda) {
                const lucroOS = Math.max(0, valorTotalOS - custoPecaOS);
                this.data.historico.vendas.push({
                    data: new Date().toISOString(),
                    produto: `Conserto ${idOSPadronizado}: ${os.servico || 'Serviço'} — ${os.modelo}`,
                    custo: custoPecaOS,
                    valorVenda: valorTotalOS,
                    valorEntrada: jaFoiPago,
                    valorRestante: restante,
                    lucro: lucroOS,
                    tipo: 'conserto',
                    cliente: os.cliente || 'Cliente Geral'
                });
            }

            // Sincronização financeira apenas se houver saldo restante a receber
            if (restante > 0) {
                const propRestante = valorTotalOS > 0 ? (restante / valorTotalOS) : 1;
                const custoPecaRestante = Math.round(custoPecaOS * propRestante * 100) / 100;
                this._registrarSincronizacaoFinanceira({
                    tipo: 'os_concluida',
                    produto: `${idOSPadronizado}: ${os.servico || 'Serviço'} — ${os.modelo} (pagto. restante)`,
                    valorVenda: restante,
                    custo: custoPecaRestante,
                    caixaDestino: 'caixaSecundario',
                    cliente: os.cliente
                });
            }
        }
        this.saveData();
        return { sucesso: true };
    }

    // ===== EXCLUIR ORDEM DE SERVIÇO E LIMPAR HISTÓRICO =====
    deletarOrdemServico(numero) {
        if (!this.data.assistencia || !Array.isArray(this.data.assistencia.ordensServico)) {
            return { sucesso: false, erro: 'Sem ordens cadastradas' };
        }
        const numStr = String(numero);
        const idx = this.data.assistencia.ordensServico.findIndex(o => String(o.numero) === numStr);
        if (idx === -1) return { sucesso: false, erro: 'OS não encontrada' };

        const idOSPadronizado = `OS #${String(numero).padStart(3, '0')}`;
        const idOSCurto = `OS #${numero}`;

        // Remover do histórico de vendas
        if (this.data.historico && Array.isArray(this.data.historico.vendas)) {
            this.data.historico.vendas = this.data.historico.vendas.filter(v => 
                !(v.produto || '').includes(idOSPadronizado) && !(v.produto || '').includes(idOSCurto)
            );
        }
        // Remover das movimentações de caixa
        if (this.data.movimentacoesCaixa && Array.isArray(this.data.movimentacoesCaixa)) {
            this.data.movimentacoesCaixa = this.data.movimentacoesCaixa.filter(m => 
                !(m.descricao || '').includes(idOSPadronizado) && !(m.descricao || '').includes(idOSCurto)
            );
        }
        // Remover da divisão de lucros
        if (this.data.divisaoLucro && Array.isArray(this.data.divisaoLucro.historicoDivisao)) {
            this.data.divisaoLucro.historicoDivisao = this.data.divisaoLucro.historicoDivisao.filter(d => 
                !(d.produto || '').includes(idOSPadronizado) && !(d.produto || '').includes(idOSCurto)
            );
        }

        // Remover da lista de Ordens de Serviço
        this.data.assistencia.ordensServico.splice(idx, 1);
        
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        return { sucesso: true };
    }

    // ===== REMOVER CAIXA DE SOM DO ESTOQUE =====
    removerCaixaSomEstoque() {
        if (!this.data.estoqueAcessorios) return 0;
        const antes = this.data.estoqueAcessorios.length;
        this.data.estoqueAcessorios = this.data.estoqueAcessorios.filter(p => {
            const nome = (p.nome || '').toLowerCase();
            return !(nome.includes('caixa') && (nome.includes('som') || nome.includes('basike')));
        });
        const removidos = antes - this.data.estoqueAcessorios.length;
        if (removidos > 0) {
            this.saveData();
            if (this.supabase) this.salvarSupabase();
        }
        return removidos;
    }

    // ===== DESPESA =====
    registrarDespesa(valor, descricao, caixa = 'principal') {
        const valNum = Math.abs(parseFloat(valor) || 0);
        if (valNum <= 0) return;

        let key = 'caixaPrincipal';
        if (caixa === 'acessorios' || caixa === 'caixaAcessorios') key = 'caixaAcessorios';
        else if (caixa === 'assistencia' || caixa === 'caixaAssistencia') key = 'caixaAssistencia';
        else if (caixa === 'secundario' || caixa === 'caixaSecundario') key = 'caixaSecundario';
        else if (caixa === 'terciario' || caixa === 'caixaTerciario') key = 'caixaTerciario';
        
        if (!this.data.financeiro) this.data.financeiro = {};
        if (this.data.financeiro[key] === undefined) this.data.financeiro[key] = 0;
        this.data.financeiro[key] = Math.max(0, (this.data.financeiro[key] || 0) - valNum);

        if (this.data[key] !== undefined) {
            this.data[key] = Math.max(0, (this.data[key] || 0) - valNum);
        }

        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];
        this.data.movimentacoesCaixa.push({
            data: new Date().toISOString(),
            tipo: 'despesa',
            caixa: key,
            valor: -valNum,
            descricao: `DESPESA: ${descricao || 'Despesa Avulsa'}`,
            obs: `Paga com ${key === 'caixaTerciario' ? 'Caixa Terciário (Pai)' : key === 'caixaSecundario' ? 'Caixa Secundário (Balcão / Gaveta)' : key}`
        });

        this.saveData();
        if (this.supabase) {
            try { this.salvarSupabase(); } catch (e) { console.warn('Supabase sync despesa:', e); }
        }
        console.log(`[StrategyOS] Despesa registrada: R$ ${valNum.toFixed(2)} (${descricao}) no ${key}`);
        try {
            const cfg = this.getConfigTelegram();
            if (cfg.botToken && cfg.autoCaixa) {
                const msgDesp = `💸 *DESPESA / SAÍDA REGISTRADA NO CAIXA*\n\n` +
                    `📝 *Motivo*: ${descricao || 'Despesa Avulsa'}\n` +
                    `🔴 *Valor Saída*: -R$ ${valNum.toFixed(2)}\n` +
                    `🏦 *Saiu de*: ${key === 'caixaSecundario' ? '💵 Gaveta Física' : key === 'caixaTerciario' ? '👨‍🦳 Caixa Terciário (Pai)' : '🏦 Caixa Principal'}\n` +
                    `💵 *Saldo Atual Gaveta*: R$ ${Number(this.data.financeiro?.caixaSecundario || 0).toFixed(2)}`;
                this.enviarTelegram(msgDesp);
            }
        } catch (e) {}
    }

    // ===== CLIENTES =====
    _criarClientePadrao(nome) {
        return { nome, telefone: '', cpf: '', nascimento: '', endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: 'Amargosa', uf: 'BA', cep: '' }, email: '', instagram: '', comoConheceu: '', observacoes: '', score: 500, parcelasEmDia: 0, parcelasAtrasadas: 0, crediariosQuitados: 0, dataCadastro: new Date().toISOString().split('T')[0] };
    }

    cadastrarCliente(dados) {
        const existe = this.data.clientes.find(c => c.nome.toLowerCase() === dados.nome.toLowerCase());
        if (existe) return { sucesso: false, erro: 'Cliente já cadastrado' };
        const novo = { ...this._criarClientePadrao(dados.nome), ...dados, dataCadastro: new Date().toISOString().split('T')[0] };
        this.data.clientes.push(novo);
        this.saveData();
        return { sucesso: true, cliente: novo };
    }

    atualizarCliente(nome, dados) {
        const cl = this.data.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
        if (!cl) return { sucesso: false, erro: 'Cliente não encontrado' };
        Object.assign(cl, dados);
        this.saveData();
        return { sucesso: true };
    }

    excluirCliente(nome) {
        const idx = this.data.clientes.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());
        if (idx === -1) return { sucesso: false };
        this.data.clientes.splice(idx, 1);
        this.saveData();
        return { sucesso: true };
    }

    getHistoricoCliente(nome) {
        const vendas = this.data.historico.vendas.filter(v => v.cliente && v.cliente.toLowerCase() === nome.toLowerCase());
        const creds = this.data.crediarios.filter(c => c.cliente.toLowerCase() === nome.toLowerCase());
        const oss = this.data.assistencia.ordensServico.filter(o => o.cliente && o.cliente.toLowerCase() === nome.toLowerCase());
        const totalGasto = vendas.reduce((s, v) => s + (v.valorVenda || v.valorBruto || 0), 0);
        return { vendas, crediarios: creds, ordensServico: oss, totalGasto };
    }

    buscarCliente(nome) { return this.data.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase()); }
    calcularScoreCliente(nome) { const cl = this.buscarCliente(nome); return cl ? cl.score : 500; }
    buscarCrediarioPorCliente(nome) { return this.data.crediarios.filter(c => c.cliente.toLowerCase().includes(nome.toLowerCase())); }

    // ===== AUTO-APRENDIZADO =====
    _aprenderVenda(produto, valor) {
        const key = produto.nome.toLowerCase();
        if (!this.data.aprendizado.vendasModelo[key]) this.data.aprendizado.vendasModelo[key] = { vendas: [], mediaDias: 0, mediaMargem: 0 };
        const dias = this.diasNoEstoque(produto);
        const margem = produto.custo > 0 ? ((valor - produto.custo) / produto.custo * 100) : 100;
        const hist = this.data.aprendizado.vendasModelo[key];
        hist.vendas.push({ data: new Date().toISOString(), dias, margem: Math.round(margem), valor });
        hist.mediaDias = Math.round(hist.vendas.reduce((s, v) => s + v.dias, 0) / hist.vendas.length);
        hist.mediaMargem = Math.round(hist.vendas.reduce((s, v) => s + v.margem, 0) / hist.vendas.length);
    }

    atualizarPrecoMercado(modelo, preco, fonte = 'usuario') {
        const key = modelo.toLowerCase().trim();
        if (!this.data.aprendizado.precosHistorico[key]) this.data.aprendizado.precosHistorico[key] = { historico: [], mediaAtual: 0, tendencia: 'estavel' };
        const h = this.data.aprendizado.precosHistorico[key];
        h.historico.push({ data: new Date().toISOString().split('T')[0], preco, fonte });
        h.mediaAtual = Math.round(h.historico.reduce((s, p) => s + p.preco, 0) / h.historico.length);
        if (h.historico.length >= 2) {
            const ultimo = h.historico[h.historico.length - 1].preco;
            const penultimo = h.historico[h.historico.length - 2].preco;
            h.tendencia = ultimo > penultimo ? 'subindo' : ultimo < penultimo ? 'caindo' : 'estavel';
        }
        this.saveData();
    }

    buscarHistoricoModelo(modelo) { return this.data.aprendizado.vendasModelo[modelo.toLowerCase().trim()] || null; }
    buscarPrecoMercado(modelo) { return this.data.aprendizado.precosHistorico[modelo.toLowerCase().trim()] || null; }

    // ===== IMPORTAR PREÇOS CSV =====
    importarPrecosCSV(csvText) {
        const linhas = csvText.trim().split('\n');
        let importados = 0;
        const resultados = [];
        for (let i = 1; i < linhas.length; i++) {
            const cols = linhas[i].split(/[,;|\t]/);
            if (cols.length < 3) continue;
            const modelo = cols[0].trim();
            const min = parseFloat(cols[1]);
            const max = parseFloat(cols[2]);
            const fonte = cols[3] ? cols[3].trim() : 'planilha';
            if (!modelo || isNaN(min) || isNaN(max)) continue;
            const media = Math.round((min + max) / 2);
            this.atualizarPrecoMercado(modelo, media, fonte);
            resultados.push({ modelo, min, max, media });
            importados++;
        }
        return { sucesso: true, importados, resultados };
    }

    // ===== CAMPANHAS =====
    atualizarChecklist(item, valor) {
        this.data.campanhas.checklist[item] = valor;
        this.saveData();
    }

    // ===== MODO TREINO =====
    _backupTreino = null;
    ativarModoTreino() {
        this._backupTreino = JSON.parse(JSON.stringify(this.data));
        this.data.preferencias.modoTreino = true;
    }
    desativarModoTreino() {
        if (this._backupTreino) {
            this.data = this._backupTreino;
            this._backupTreino = null;
            this.saveData();
        }
        this.data.preferencias.modoTreino = false;
    }
    isModoTreino() { return this.data.preferencias.modoTreino === true; }

    // ===== REFERÊNCIA INTELIGENTE DE PREÇOS =====
    buscarReferenciaInteligente(modelo) {
        const key = modelo.toLowerCase().trim();
        // 1. Histórico de vendas
        const hist = this.data.aprendizado.vendasModelo[key];
        if (hist && hist.vendas.length > 0) {
            const ultima = hist.vendas[hist.vendas.length - 1];
            return { preco: ultima.valor, fonte: 'historico', detalhe: `Vendido por ${this._formatR(ultima.valor)} em ${new Date(ultima.data).toLocaleDateString('pt-BR')}`, confianca: 'alta' };
        }
        // 2. Produto similar no estoque
        const similar = this.data.estoqueCelulares.find(p => p.nome.toLowerCase().includes(key.split(' ').slice(0, 2).join(' ')));
        if (similar) {
            return { preco: similar.precoVenda, fonte: 'estoque', detalhe: `${similar.nome} no estoque por ${this._formatR(similar.precoVenda)}`, confianca: 'media' };
        }
        // 3. Banco de preços importados
        const banco = this.data.aprendizado.precosHistorico[key];
        if (banco) {
            return { preco: banco.mediaAtual, fonte: 'banco', detalhe: `Banco de preços: ${this._formatR(banco.mediaAtual)} (${banco.tendencia})`, confianca: 'media' };
        }
        // 4. Não encontrou
        return null;
    }
    _formatR(v) { return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    // ===== GETTERS =====
    getFinanceiro() {
        const f = this.data.financeiro;
        if (f) {
            const somaSubCaixas = (f.caixaSecundario || 0) + (f.caixaTerciario || 0) + (f.caixaAcessorios || 0) + (f.caixaAssistencia || 0);
            if (f.caixaPrincipal < somaSubCaixas) {
                f.caixaPrincipal = somaSubCaixas;
            }
        }
        return f;
    }
    getMeta() { return this.data.meta; }

    // ===== FIADOS =====
    getFiados() { return this.data.fiados || []; }
    registrarFiado(fiado) {
        fiado.id = Date.now();
        fiado.dataRegistro = this.hojeLocal();
        fiado.status = 'pendente';
        this.data.fiados.push(fiado);
        this.saveData();
        try {
            const cfg = this.getConfigTelegram();
            if (cfg.botToken && cfg.autoCaixa) {
                this.enviarTelegram(`📝 *NOVA VENDA FIADO REGISTRADA*\n👤 Cliente: ${fiado.cliente}\n📦 Produto: ${fiado.produto}\n💰 Valor: R$ ${Number(fiado.valor || 0).toFixed(2)}\n📅 Cobrar em: ${fiado.dataCobrar || '-'}`);
            }
        } catch (e) {}
        return fiado;
    }
    receberFiado(id, formaPagamento = 'dinheiro') {
        const f = this.data.fiados.find(x => x.id === id);
        if (!f) return false;
        f.status = 'recebido';
        f.dataRecebimento = this.hojeLocal();
        f.formaPagamentoRecebido = formaPagamento;
        const val = parseFloat(f.valor || 0);

        if (!this.data.financeiro) this.data.financeiro = {};
        if (formaPagamento === 'dinheiro') {
            this.data.financeiro.caixaSecundario = (this.data.financeiro.caixaSecundario || 0) + val;
        }
        this.data.financeiro.caixaPrincipal = (this.data.financeiro.caixaPrincipal || 0) + val;

        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];
        this.data.movimentacoesCaixa.push({
            id: Date.now(),
            data: new Date().toISOString(),
            tipo: 'recebimento_fiado',
            caixa: formaPagamento === 'dinheiro' ? 'caixaSecundario' : 'caixaPrincipal',
            valor: val,
            cliente: f.cliente || 'Cliente Fiado',
            descricao: `💵 RECEBIMENTO DE FIADO: ${f.cliente} — ${f.produto} — R$ ${val.toFixed(2)} (${formaPagamento.toUpperCase()})`
        });

        this.saveData();
        try {
            const cfg = this.getConfigTelegram();
            if (cfg.botToken && cfg.autoCaixa) {
                this.enviarTelegram(`💵 *FIADO RECEBIDO!*\n👤 Cliente: ${f.cliente}\n📦 Produto: ${f.produto}\n💰 Valor: *R$ ${val.toFixed(2)}* (${formaPagamento.toUpperCase()})\n💵 Saldo Gaveta: R$ ${Number(this.data.financeiro?.caixaSecundario || 0).toFixed(2)}`);
            }
        } catch (e) {}
        return true;
    }
    getFiadosAlerta() {
        const hoje = this.hojeLocal();
        const amanha = this.hojeLocal(new Date(Date.now() + 86400000));
        const pendentes = (this.data.fiados || []).filter(f => f.status === 'pendente');
        return {
            hoje: pendentes.filter(f => f.dataCobrar === hoje),
            atrasados: pendentes.filter(f => f.dataCobrar < hoje),
            amanha: pendentes.filter(f => f.dataCobrar === amanha),
            total: pendentes.reduce((s, f) => s + f.valor, 0)
        };
    }

    // ===== PELÍCULAS: BUSCAR CATEGORIA =====
    buscarCategoriaPelicula(modelo) {
        const key = modelo.toLowerCase().trim();
        // Busca exata
        if (this.data.tabelaPeliculasModelo[key]) return this.data.tabelaPeliculasModelo[key];
        // Busca parcial
        for (const [k, v] of Object.entries(this.data.tabelaPeliculasModelo)) {
            if (key.includes(k) || k.includes(key)) return v;
        }
        // Fallback por marca
        if (key.includes('iphone')) return 'premium';
        if (key.includes('samsung s')) return 'premium';
        if (key.includes('samsung a')) return 'basico';
        if (key.includes('poco f') || key.includes('redmi note')) return 'medio';
        return 'basico';
    }

    // ===== INTEGRACÃO COM SUPABASE =====
    initSupabase() {
        if (typeof supabase === 'undefined' || !window.SUPABASE_CONFIG) return;
        const config = window.SUPABASE_CONFIG;
        if (!config.url || !config.anonKey) {
            console.log('StrategyOS: Supabase não configurado. Usando apenas localStorage local.');
            return;
        }

        console.log('StrategyOS: Inicializando conexão com o Supabase...');
        try {
            this.supabase = supabase.createClient(config.url, config.anonKey);
            this.sincronizarSupabase();
            this.verificarZeramentoSegunda();
            if (!this._intervalSync) {
                this._intervalSync = setInterval(() => {
                    this.sincronizarSupabase();
                    this.verificarZeramentoSegunda();
                }, 30000);
            }
        } catch (e) {
            console.error('Erro ao conectar ao Supabase:', e);
        }
    }

    verificarZeramentoSegunda() {
        // REGRA DA LOJA SOLICITADA PELO USUÁRIO: NÃO ZERAR AUTOMATICAMENTE
        // Zeramento semanal de caixaSecundario e comissão agora é 100% MANUAL
        return;
    }

    zerarCaixaSecundarioManual() {
        if (!this.data.financeiro) this.data.financeiro = {};
        const valorAnterior = this.data.financeiro.caixaSecundario || 0;
        this.data.financeiro.caixaSecundario = 0;
        if (!this.data.movimentacoesCaixa) this.data.movimentacoesCaixa = [];
        this.data.movimentacoesCaixa.push({
            tipo: 'zerado_manual',
            caixa: 'caixaSecundario',
            valorAnterior,
            motivo: 'Fechamento e zeramento manual do Caixa Secundário',
            data: new Date().toISOString()
        });
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        console.log('[StrategyOS] Caixa Secundário zerado MANUALMENTE pelo usuário.');
        return valorAnterior;
    }

    zerarComissaoIlannaManual() {
        const valorAnterior = this.data.comissaoIlannaMensal || 0;
        const cicloManual = 'manual_' + this.hojeLocal();
        this.data.comissaoIlannaMensal = 0;
        this.data.dataInicioCicloMeta = this.hojeLocal();
        if (this.data.historico && Array.isArray(this.data.historico.vendas)) {
            this.data.historico.vendas.forEach(v => {
                if (!v._cicloMetaFechado) v._cicloMetaFechado = cicloManual;
            });
        }
        this.saveData();
        if (this.supabase) this.salvarSupabase();
        console.log('[StrategyOS] Meta / Comissão zerada MANUALMENTE pelo usuário.');
        return valorAnterior;
    }

    removerVendaCaixaSom() {
        let removidos = 0;
        if (this.data.historico && this.data.historico.vendas) {
            const antes = this.data.historico.vendas.length;
            this.data.historico.vendas = this.data.historico.vendas.filter(v => {
                const prod = (v.produto || '').toLowerCase();
                return !(prod.includes('caixa') && prod.includes('som'));
            });
            removidos += (antes - this.data.historico.vendas.length);
        }
        if (this.data.movimentacoesCaixa) {
            const antes = this.data.movimentacoesCaixa.length;
            this.data.movimentacoesCaixa = this.data.movimentacoesCaixa.filter(m => {
                const desc = (m.descricao || '').toLowerCase();
                return !(desc.includes('caixa') && desc.includes('som'));
            });
            removidos += (antes - this.data.movimentacoesCaixa.length);
        }
        if (removidos > 0) this.saveData();
        return removidos;
    }

    async sincronizarSupabase() {
        if (!this.supabase) return;
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        try {
            const { data, error } = await this.supabase
                .from('strategyos_data')
                .select('payload, updated_at')
                .eq('id', 1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('StrategyOS: Banco de dados em nuvem vazio. Enviando dados locais atuais...');
                    this.salvarSupabase();
                }
                return;
            }

            if (data && data.payload) {
                const cloudPayload = data.payload || {};
                const localSaveTime = this.data._ultimoSaveLocal || 0;
                const cloudSaveTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;

                // ============================================================
                // REGRA: UNIÃO INTELIGENTE — NUNCA PERDER DADOS
                // Quem tem MAIS dados vence. Arrays nunca encolhem.
                // Financeiro: quem tem timestamp mais recente vence.
                // Se local estiver vazio (localStorage limpou), nuvem restaura tudo.
                // ============================================================
                const defCloud = this.getDefaultData();
                const mergedData = this._merge(defCloud, cloudPayload);
                mergedData.tabelaServicosModelo = { ...(cloudPayload.tabelaServicosModelo || {}), ...(defCloud.tabelaServicosModelo || {}), ...(this.data.tabelaServicosModelo || {}) };
                const localTemDados = this.data._ultimoSaveLocal && this.data._ultimoSaveLocal > 0;

                // === FUNÇÃO AUXILIAR: Merge por ID — mantém a UNIÃO dos dois ===
                const mergeArrayPorId = (localArr, cloudArr, idField) => {
                    const map = new Map();
                    (cloudArr || []).forEach(item => map.set(String(item[idField]), item));
                    (localArr || []).forEach(item => map.set(String(item[idField]), item)); // local sobrescreve itens com mesmo ID
                    return Array.from(map.values());
                };

                // === FUNÇÃO AUXILIAR: Maior array vence (nunca encolher) ===
                const maiorArrayVence = (localArr, cloudArr) => {
                    const l = (localArr || []).length;
                    const c = (cloudArr || []).length;
                    if (l === 0) return cloudArr || [];
                    if (c === 0) return localArr || [];
                    return l >= c ? localArr : cloudArr;
                };

                // 1. Ordens de Serviço (merge inteligente por número)
                if (this.data.assistencia && this.data.assistencia.ordensServico) {
                    const localOS = this.data.assistencia.ordensServico || [];
                    const cloudOS = (cloudPayload.assistencia && cloudPayload.assistencia.ordensServico) || [];
                    const mapOS = new Map();
                    cloudOS.forEach(o => mapOS.set(String(o.numero), o));
                    localOS.forEach(o => {
                        const existing = mapOS.get(String(o.numero));
                        if (!existing || (o.dataEntrega && !existing.dataEntrega) || o.status !== existing.status) {
                            mapOS.set(String(o.numero), o);
                        }
                    });
                    if (!mergedData.assistencia) mergedData.assistencia = {};
                    mergedData.assistencia.ordensServico = Array.from(mapOS.values()).sort((a, b) => b.numero - a.numero);
                } else if (cloudPayload.assistencia && cloudPayload.assistencia.ordensServico) {
                    mergedData.assistencia = cloudPayload.assistencia;
                }

                // 2. Clientes (merge por nome — UNIÃO)
                {
                    const localClientes = (this.data.clientes && Array.isArray(this.data.clientes)) ? this.data.clientes : [];
                    const cloudClientes = cloudPayload.clientes || [];
                    const mapClientes = new Map();
                    cloudClientes.forEach(c => mapClientes.set((c.nome || '').toLowerCase().trim(), c));
                    localClientes.forEach(c => {
                        const key = (c.nome || '').toLowerCase().trim();
                        if (key) {
                            const existing = mapClientes.get(key);
                            if (!existing || (c.historico && c.historico.length > (existing.historico || []).length)) {
                                mapClientes.set(key, c);
                            }
                        }
                    });
                    mergedData.clientes = Array.from(mapClientes.values());
                }

                // 3. Produtos Procurados (UNIÃO por ID)
                {
                    const localProc = (this.data.produtosProcurados && Array.isArray(this.data.produtosProcurados)) ? this.data.produtosProcurados : [];
                    const cloudProc = cloudPayload.produtosProcurados || [];
                    mergedData.produtosProcurados = mergeArrayPorId(localProc, cloudProc, 'id');
                }

                // 4. Histórico de Vendas e Movimentações (MAIOR array vence — nunca encolher)
                {
                    const localVendas = (this.data.historico && this.data.historico.vendas) || [];
                    const cloudVendas = (cloudPayload.historico && cloudPayload.historico.vendas) || [];
                    mergedData.historico.vendas = maiorArrayVence(localVendas, cloudVendas);
                }
                {
                    const localMovs = this.data.movimentacoesCaixa || [];
                    const cloudMovs = cloudPayload.movimentacoesCaixa || [];
                    mergedData.movimentacoesCaixa = maiorArrayVence(localMovs, cloudMovs);
                }

                // 5. DADOS FINANCEIROS — Quem tem timestamp mais recente vence
                if (localTemDados && localSaveTime >= cloudSaveTime) {
                    // Local mais recente: manter local
                    if (this.data.financeiro) mergedData.financeiro = this.data.financeiro;
                    if (this.data.comissaoIlannaMensal !== undefined) mergedData.comissaoIlannaMensal = this.data.comissaoIlannaMensal;
                    if (this.data.logComissaoMensal) mergedData.logComissaoMensal = this.data.logComissaoMensal;
                } else if (!localTemDados) {
                    // Local vazio (localStorage foi limpo): aceitar nuvem completa
                    console.log('[StrategyOS] Local vazio — restaurando financeiro da nuvem.');
                }
                // Se nuvem mais recente E local tem dados, mantém financeiro da nuvem (já está no mergedData)

                // 6. ESTOQUE — Merge inteligente por ID (UNIÃO, nunca perder itens)
                {
                    const localCel = (this.data.estoqueCelulares && Array.isArray(this.data.estoqueCelulares)) ? this.data.estoqueCelulares : [];
                    const cloudCel = cloudPayload.estoqueCelulares || [];
                    mergedData.estoqueCelulares = localTemDados ? mergeArrayPorId(localCel, cloudCel, 'id') : (cloudCel.length > 0 ? cloudCel : localCel);
                }
                {
                    const localAc = (this.data.estoqueAcessorios && Array.isArray(this.data.estoqueAcessorios)) ? this.data.estoqueAcessorios : [];
                    const cloudAc = cloudPayload.estoqueAcessorios || [];
                    mergedData.estoqueAcessorios = localTemDados ? mergeArrayPorId(localAc, cloudAc, 'id') : (cloudAc.length > 0 ? cloudAc : localAc);
                }
                if (this.data.estoqueFogos && Array.isArray(this.data.estoqueFogos) && this.data.estoqueFogos.length > 0) {
                    mergedData.estoqueFogos = this.data.estoqueFogos;
                }
                if (this.data.estoqueUsoLoja && Array.isArray(this.data.estoqueUsoLoja) && this.data.estoqueUsoLoja.length > 0) {
                    mergedData.estoqueUsoLoja = this.data.estoqueUsoLoja;
                }

                // 7. Crediários (UNIÃO por ID)
                {
                    const localCred = (this.data.crediarios && Array.isArray(this.data.crediarios)) ? this.data.crediarios : [];
                    const cloudCred = cloudPayload.crediarios || [];
                    mergedData.crediarios = mergeArrayPorId(localCred, cloudCred, 'id');
                }

                // 8. Checklist, Bloco de Notas, Divisão de Lucro — se local tiver, mantém local
                if (localTemDados) {
                    if (this.data.checklistDiario) mergedData.checklistDiario = this.data.checklistDiario;
                    if (this.data.blocoNotas) mergedData.blocoNotas = this.data.blocoNotas;
                    if (this.data.divisaoLucro) mergedData.divisaoLucro = this.data.divisaoLucro;
                    if (this.data.fundoCustoEstoque) mergedData.fundoCustoEstoque = this.data.fundoCustoEstoque;
                    if (this.data.fundoReposicaoFogos) mergedData.fundoReposicaoFogos = this.data.fundoReposicaoFogos;
                }

                // Se local era mais recente do que nuvem, envia o resultado mesclado para a nuvem
                if (localSaveTime > cloudSaveTime) {
                    mergedData._ultimoSaveLocal = localSaveTime;
                    this.data = mergedData;
                    this.salvarSupabase();
                } else {
                    this.data = mergedData;
                }

                localStorage.setItem(this.storageKey, JSON.stringify(this.data));

                if (typeof UI !== 'undefined') {
                    if (typeof UI._atualizarAlertas === 'function') UI._atualizarAlertas();
                }
            }
        } catch (err) {
            console.error('Erro de rede na sincronização com o Supabase:', err);
        }
    }

    async salvarSupabase() {
        if (!this.supabase || this.isModoTreino()) return;
        try {
            const { error } = await this.supabase
                .from('strategyos_data')
                .upsert({ id: 1, payload: this.data, updated_at: new Date().toISOString() });

            if (error) {
                console.error('Erro ao fazer upload dos dados para o Supabase:', error);
            } else {
                console.log('StrategyOS: Sincronização em nuvem realizada com sucesso!');
            }
        } catch (err) {
            console.error('Erro de rede ao salvar no Supabase:', err);
        }
    }

    // ===== EXCLUIR VENDA OU MOVIMENTAÇÃO DO HISTÓRICO =====
    excluirVenda(index) {
        if (!this.data.historico || !this.data.historico.vendas) return { sucesso: false };
        if (index >= 0 && index < this.data.historico.vendas.length) {
            const removida = this.data.historico.vendas.splice(index, 1)[0];
            
            // 1. Devolver item ao estoque se for celular ou acessório
            if (removida.produto) {
                const prodNome = (removida.produto || '').toLowerCase();
                const cel = (this.data.estoqueCelulares || []).find(c => prodNome.includes((c.nome || '').toLowerCase()) || (c.nome && prodNome.includes(c.nome.toLowerCase())));
                if (cel && cel.status === 'vendido') {
                    cel.status = 'disponivel';
                    cel.quantidade = (cel.quantidade || 0) + 1;
                } else {
                    const ac = (this.data.estoqueAcessorios || []).find(a => prodNome.includes((a.nome || '').toLowerCase()));
                    if (ac) {
                        ac.status = 'disponivel';
                        ac.quantidade = (ac.quantidade || 0) + 1;
                    }
                }
            }

            // 2. Estornar da movimentação de caixa e dos caixas operacionais
            if (this.data.movimentacoesCaixa) {
                const idxMov = this.data.movimentacoesCaixa.findIndex(m => m.descricao && removida.produto && m.descricao.includes(removida.produto) && Math.abs(m.valor - (removida.valorVenda || removida.liquido || 0)) < 0.01);
                if (idxMov !== -1) {
                    const mov = this.data.movimentacoesCaixa.splice(idxMov, 1)[0];
                    if (mov.caixa === 'caixaSecundario' && this.data.financeiro) {
                        this.data.financeiro.caixaSecundario = Math.max(0, (this.data.financeiro.caixaSecundario || 0) - (mov.valor || 0));
                    }
                    if (this.data.financeiro) {
                        this.data.financeiro.caixaPrincipal = Math.max(0, (this.data.financeiro.caixaPrincipal || 0) - (mov.valor || 0));
                    }
                }
            }
            this.saveData();
            return { sucesso: true, removida };
        }
        return { sucesso: false };
    }

    excluirMovimentacao(index) {
        if (!this.data.movimentacoesCaixa) return { sucesso: false };
        if (index >= 0 && index < this.data.movimentacoesCaixa.length) {
            const removida = this.data.movimentacoesCaixa.splice(index, 1)[0];
            this.saveData();
            return { sucesso: true, removida };
        }
        return { sucesso: false };
    }

    async enviarZipSistemaTelegram() {
        try {
            const cfg = this.data.configuracoes || {};
            const botToken = cfg.telegramBotToken || '8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34';
            const chatId = cfg.telegramChatId || '1969798643';

            if (!botToken || !chatId) return { sucesso: false, erro: 'Token ou Chat ID não configurados' };

            // Chama a API do PowerShell local para criar e enviar o zip
            const resp = await fetch('http://localhost:8080/api/backup-zip-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botToken, chatId })
            });

            const json = await resp.json();
            if (json.sucesso) return { sucesso: true, mensagem: json.mensagem };
            return { sucesso: false, erro: json.erro || 'Erro ao gerar ZIP via servidor' };
        } catch (e) {
            console.error('Erro ao enviar requisição ZIP do Telegram pro backend:', e);
            return { sucesso: false, erro: e.message };
        }
    }

    async enviarFechamentoDiarioTelegram(dataAlvo = null) {
        if (this._ultimoFechamentoDiaMs && (Date.now() - this._ultimoFechamentoDiaMs < 60000)) {
            return { sucesso: true, ignoradoCooldown: true };
        }
        this._ultimoFechamentoDiaMs = Date.now();
        try {
            const hojeYMD = dataAlvo || this.hojeLocal();
            const dataFormatada = new Date(hojeYMD + 'T12:00:00').toLocaleDateString('pt-BR');
            const R = (v) => typeof UI !== 'undefined' ? UI.R(v) : 'R$ ' + parseFloat(v || 0).toFixed(2);
            
            // ===== PUXAR VENDAS REAIS DO HISTÓRICO =====
            const vendasHoje = (this.data.historico && this.data.historico.vendas || []).filter(v => {
                const ts = this.parseDataSafe(v.data);
                const dStr = ts > 0 ? this.hojeLocal(new Date(ts)) : (v.data || '').substring(0, 10);
                return dStr === hojeYMD;
            });
            
            let totalVendasLoja = 0;
            let totalVendasFogos = 0;
            let totalConsertos = 0;
            let listaVendas = [];
            
            vendasHoje.forEach(v => {
                const val = parseFloat(v.valorVenda || v.liquido || v.valor || 0);
                const prod = v.produto || 'Item';
                const lucro = parseFloat(v.lucro || 0);
                const forma = v.formaPagamento || v.tipo || '';
                
                if (v.caixaDestino === 'caixaFogos' || (v.tipo && v.tipo.includes('fogos'))) {
                    totalVendasFogos += val;
                } else if (v.tipo && v.tipo.includes('conserto')) {
                    totalConsertos += val;
                } else {
                    totalVendasLoja += val;
                }
                
                listaVendas.push(`   • ${prod} — ${R(val)} (Lucro: ${R(lucro)}) [${forma}]`);
            });
            
            // ===== MOVIMENTAÇÕES DO DIA (despesas, sangrias, etc.) =====
            const movs = this.data.movimentacoesCaixa || [];
            const movsHoje = movs.filter(m => m.data && m.data.startsWith(hojeYMD));
            let despesasTotal = 0;
            let listaDespesas = [];
            let observacoesFechamento = [];
            
            movsHoje.forEach(m => {
                const val = parseFloat(m.valor || 0);
                const desc = m.descricao || m.motivo || '';
                if (m.tipo === 'despesa') {
                    despesasTotal += Math.abs(val);
                    listaDespesas.push(`   • ${desc} — ${R(Math.abs(val))}`);
                }
                if (m.tipo === 'fechamento_diario' || m.tipo === 'fechamento_diario_auto' || m.tipo === 'observacao') {
                    if (desc) observacoesFechamento.push(`   📝 ${desc}`);
                }
            });
            
            // ===== SALDOS DOS CAIXAS =====
            const f = this.data.financeiro || {};
            const saldoSecundario = f.caixaSecundario || 0;
            const saldoFogos = f.caixaFogos || 0;
            const saldoPrincipal = f.caixaPrincipal || 0;
            const saldoTerciario = f.caixaTerciario || 0;
            const comissaoIlanna = this.data.comissaoIlannaMensal || 0;
            
            // ===== ESTOQUE RESUMIDO =====
            const celulares = (this.data.estoqueCelulares || []).filter(c => c.status === 'disponivel');
            const acessorios = (this.data.estoqueAcessorios || []).filter(a => a.status !== 'vendido');
            
            const totalDia = totalVendasLoja + totalVendasFogos + totalConsertos;
            const vendasTexto = listaVendas.length > 0 ? listaVendas.join('\n') : '   _Nenhuma venda registrada hoje._';
            const despesasTexto = listaDespesas.length > 0 ? listaDespesas.join('\n') : '   _Nenhuma despesa registrada._';
            const obsTexto = observacoesFechamento.length > 0 ? observacoesFechamento.join('\n') : '   _Sem observações._';
            
            const mensagem = `📊 *RELATÓRIO DETALHADO DE FECHAMENTO DIÁRIO* 📊\n` +
                `📅 *Data:* ${dataFormatada}\n` +
                `🏪 *Loja:* Cesinha Acessórios\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💰 *VENDAS DO DIA (${vendasHoje.length} itens):*\n` +
                `${vendasTexto}\n\n` +
                `📈 *RESUMO FINANCEIRO:*\n` +
                `   🛒 Vendas Loja/Balcão: *${R(totalVendasLoja)}*\n` +
                `   🎆 Vendas Fogos: *${R(totalVendasFogos)}*\n` +
                `   🔧 Consertos/OS: *${R(totalConsertos)}*\n` +
                `   💵 *TOTAL DO DIA: ${R(totalDia)}*\n\n` +
                `💸 *DESPESAS DO DIA:*\n` +
                `${despesasTexto}\n` +
                `   Total Despesas: *-${R(despesasTotal)}*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🏦 *SALDOS NOS CAIXAS:*\n` +
                `   💚 Caixa Secundário (Gaveta): *${R(saldoSecundario)}*\n` +
                `   🎆 Caixa de Fogos: *${R(saldoFogos)}*\n` +
                `   📊 Caixa Principal: *${R(saldoPrincipal)}*\n` +
                `   👨 Caixa Terciário (Pai): *${R(saldoTerciario)}*\n\n` +
                `💰 *COMISSÃO DE VENDAS (MÊS):* *${R(comissaoIlanna)}*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📦 *ESTOQUE:*\n` +
                `   📱 Celulares disponíveis: *${celulares.length}*\n` +
                `   🎧 Acessórios em estoque: *${acessorios.length}*\n\n` +
                `📝 *OBSERVAÇÕES DO FECHAMENTO:*\n` +
                `${obsTexto}\n\n` +
                `🤖 _Gerado automaticamente pelo StrategyOS v3.9_`;

            // Enviar relatório texto
            const resTexto = await this.enviarTelegram(mensagem);
            
            // Enviar backup em arquivo .json anexado
            await this.enviarBackupDocumentoTelegram();

            return resTexto;
        } catch (e) {
            console.error('Erro ao gerar relatório do Telegram:', e);
            return { sucesso: false, erro: e.message };
        }
    }



    // ===== AUDITORIA E RECÁLCULO DA COMISSÃO DE ILANNA (BASEADO EM VENDAS REAIS) =====
    calcularComissaoIlannaReal(mesAnoPrefix = null) {
        if (!this.data) return 0;
        if (!mesAnoPrefix) {
            const now = new Date();
            const ano = now.getFullYear();
            const mes = String(now.getMonth() + 1).padStart(2, '0');
            mesAnoPrefix = `${ano}-${mes}`;
        }
        let totalComissao = 0;

        const dataInicioCiclo = this.data.dataInicioCicloMeta || '';
        if (this.data.historico && Array.isArray(this.data.historico.vendas)) {
            this.data.historico.vendas.forEach(v => {
                if (v._cicloMetaFechado) return;
                const dataYMD = (v.data || '').substring(0, 10);
                if (dataInicioCiclo && dataYMD < dataInicioCiclo) return;
                const dt = (v.data || '').substring(0, 7);
                if (dt === mesAnoPrefix || (dataInicioCiclo && dataYMD >= dataInicioCiclo)) {
                    const prod = (v.produto || '').toLowerCase();
                    const tipo = (v.tipo || '').toLowerCase();
                    const isFogos = tipo === 'fogos' || prod.includes('fogo') || prod.includes('19x4') || prod.includes('12x1') || prod.includes('foguete');
                    
                    if (!isFogos) {
                        const val = parseFloat(v.valorVenda || v.valor || v.valorTotal || 0);
                        const isCelular = tipo === 'celular' || tipo === 'avista' || tipo === 'parcelado_maquina' || tipo === 'pix' || prod.includes('iphone') || prod.includes('samsung') || prod.includes('xiaomi') || prod.includes('motorola') || prod.includes('redmi');
                        
                        if (isCelular) {
                            totalComissao += Math.round(val * 0.03 * 100) / 100;
                        } else {
                            const custo = parseFloat(v.custo || v.custoPeca || 0);
                            let lucro = parseFloat(v.lucro !== undefined ? v.lucro : (val - custo));
                            if (isNaN(lucro) || lucro < 0) lucro = val;
                            totalComissao += Math.round(lucro * 100) / 100;
                        }
                    }
                }
            });
        }

        return Math.round(totalComissao * 100) / 100;
    }

    recalcularComissaoMensal() {
        const comissaoCalculada = this.calcularComissaoIlannaReal();
        this.data.comissaoIlannaMensal = comissaoCalculada;
        this.saveData();
        return this.data.comissaoIlannaMensal;
    }

    // ===== UTILITÁRIOS =====
    exportarDados() { return JSON.stringify(this.data, null, 2); }
    importarDados(json) { this.data = JSON.parse(json); this.saveData(); }
    resetarDados() {
        localStorage.clear();
        this.data = this.getDefaultData();
        this.saveData();
    }
}

const dataManager = new DataManager();
window.dataManager = dataManager;
