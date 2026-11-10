const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mockStorage = {};
const sandbox = {
    console: console,
    Date: Date,
    Math: Math,
    String: String,
    Number: Number,
    Array: Array,
    Object: Object,
    Set: Set,
    Map: Map,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    JSON: JSON,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Intl: Intl,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    UI: {
        R: (v) => 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ','),
        toast: () => {}
    },
    localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; },
        clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
    },
    document: {
        getElementById: (id) => ({
            id,
            clientWidth: 500,
            innerHTML: '',
            appendChild: () => {},
            style: {}
        }),
        createElement: () => ({
            getContext: () => ({
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 1,
                beginPath: () => {},
                roundRect: () => {},
                fill: () => {},
                stroke: () => {},
                moveTo: () => {},
                lineTo: () => {},
                closePath: () => {},
                arc: () => {},
                fillText: () => {},
                createLinearGradient: () => ({ addColorStop: () => {} })
            }),
            style: {}
        }),
        querySelector: () => null,
        querySelectorAll: () => []
    }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

vm.createContext(sandbox);

const dataCode = fs.readFileSync(path.join(__dirname, 'js', 'data.js'), 'utf8');
const calcCode = fs.readFileSync(path.join(__dirname, 'js', 'calculators.js'), 'utf8');

vm.runInContext(dataCode, sandbox);
vm.runInContext(calcCode, sandbox);

const dm = sandbox.dataManager;

console.log('=== TESTE 1: MESCLAGEM INTELIGENTE DE NUVEM COM VENDAS LOCAIS RECENTES ===');
dm.data = dm.getDefaultData();
dm.data._ultimoSaveLocal = Date.now();

// Simulate 3 local sales made today
const hoje = dm.hojeLocal();
dm.data.historico.vendas = [
    { id: 'venda_local_1', data: hoje + 'T10:00:00', produto: 'Cabo Tipo-C', valorVenda: 25, custo: 8 },
    { id: 'venda_local_2', data: hoje + 'T11:30:00', produto: 'Pelicula 3D A54', valorVenda: 30, custo: 5 },
    { id: 'venda_local_3', data: hoje + 'T14:15:00', produto: 'Fone Bluetooth', valorVenda: 60, custo: 20 }
];
dm.data.financeiro.caixaSecundario = 115;

// Cloud payload from past with 2 sales from yesterday
const cloudPayload = {
    _ultimoSaveLocal: Date.now() + 1000,
    historico: {
        vendas: [
            { id: 'venda_cloud_1', data: '2026-10-22T09:00:00', produto: 'Capa Silicone', valorVenda: 35, custo: 10 },
            { id: 'venda_cloud_2', data: '2026-10-22T15:00:00', produto: 'Pelicula Privacidade', valorVenda: 40, custo: 12 }
        ]
    },
    financeiro: {
        caixaSecundario: 75
    }
};

// Apply smart merge
dm._mesclarDadosNuvemInteligente(cloudPayload, cloudPayload._ultimoSaveLocal);

console.log('Total de vendas após mesclagem:', dm.data.historico.vendas.length);
if (dm.data.historico.vendas.length === 5) {
    console.log('✅ [PASSOU] União inteligente manteve todas as 3 vendas locais de hoje + 2 da nuvem!');
} else {
    console.error('❌ [FALHOU] Vendas locais foram perdidas na mesclagem!', dm.data.historico.vendas.length);
    process.exit(1);
}

// Check local cash register preservation
console.log('Saldo caixa secundário mantido:', dm.data.financeiro.caixaSecundario);
if (dm.data.financeiro.caixaSecundario === 115) {
    console.log('✅ [PASSOU] Saldo de caixa secundário local preservado!');
} else {
    console.error('❌ [FALHOU] Saldo de caixa foi sobrescrito pela nuvem antiga!', dm.data.financeiro.caixaSecundario);
    process.exit(1);
}

console.log('\n=== TESTE 2: SIMULAÇÃO DO FECHAMENTO DIÁRIO COM VENDAS ===');
const vendasHojeFiltro = (dm.data.historico.vendas || []).filter(v => {
    const ts = dm.parseDataSafe(v.data);
    const dStr = ts > 0 ? dm.hojeLocal(new Date(ts)) : (v.data || '').substring(0, 10);
    return dStr === hoje;
});
console.log('Vendas encontradas para o fechamento de hoje:', vendasHojeFiltro.length);
if (vendasHojeFiltro.length === 3) {
    console.log('✅ [PASSOU] Fechamento identificou todas as 3 vendas reais de hoje!');
} else {
    console.error('❌ [FALHOU] Fechamento não encontrou as vendas de hoje!');
    process.exit(1);
}

console.log('\n=== TESTE 3: RENDERIZAÇÃO DO GRÁFICO DE VENDAS ===');
vm.runInContext(fs.readFileSync('js/ui-melhorias.js', 'utf8'), sandbox);

if (typeof sandbox.UI._renderGraficoVendas === 'function') {
    sandbox.UI._renderGraficoVendas();
    console.log('✅ [PASSOU] UI._renderGraficoVendas executou com fallback sem erros!');
} else {
    console.error('❌ [FALHOU] UI._renderGraficoVendas não é uma função!');
    process.exit(1);
}

console.log('\n=== TESTE 4: PAGAMENTO DIVIDIDO (MULTI) + RECONCILIAÇÃO SEM DUPLICAÇÃO ===');
dm.data = dm.getDefaultData();
dm.data.financeiro.caixaPrincipal = 0;
dm.data.financeiro.caixaSecundario = 0;
dm.data.estoqueAcessorios = [{ id: 777, nome: 'Cabo Turbo Teste', custo: 10, precoVenda: 50, quantidade: 3, status: 'disponivel' }];
dm.venderCarrinho(
    [{ id: 777, _tipo: 'acess', nome: 'Cabo Turbo Teste', precoVenda: 100, precoFinal: 100 }],
    [
        { forma: 'dinheiro', valor: 40, caixa: 'caixaSecundario' },
        { forma: 'pix', valor: 60, caixa: 'caixaPrincipal' }
    ],
    'Cliente Multi Teste'
);
const qtdMovsAntes = dm.data.movimentacoesCaixa.length;
const qtdVendasAntes = dm.data.historico.vendas.length;
dm.reconciliarFinanceiroCicloAtual(dm.data);
if (dm.data.movimentacoesCaixa.length !== qtdMovsAntes || dm.data.historico.vendas.length !== qtdVendasAntes) {
    console.error('❌ [FALHOU] reconciliarFinanceiroCicloAtual duplicou venda multi!', dm.data.movimentacoesCaixa.length, qtdMovsAntes, dm.data.historico.vendas.length, qtdVendasAntes);
    process.exit(1);
}
if (dm.data.financeiro.caixaSecundario !== 40 || dm.data.financeiro.caixaPrincipal !== 60) {
    console.error('❌ [FALHOU] Saldos multi incorretos!', dm.data.financeiro);
    process.exit(1);
}
console.log('✅ [PASSOU] Venda dividida PIX+Dinheiro reconciliou sem duplicar (Sec=40, Prin=60)!');

console.log('\n=== TESTE 5: DUAS VENDAS IDÊNTICAS NO MESMO DIA + TOTAL DIÁRIO PARA GRÁFICOS ===');
const hojeYMD = dm.hojeLocal();
dm.data.movimentacoesCaixa.push({ id: 'man_1', data: hojeYMD + 'T09:00:00', tipo: 'entrada', motivo: 'Venda Manual', caixa: 'caixaSecundario', valor: 25, custo: 10 });
dm.data.movimentacoesCaixa.push({ id: 'man_2', data: hojeYMD + 'T16:00:00', tipo: 'entrada', motivo: 'Venda Manual', caixa: 'caixaSecundario', valor: 25, custo: 10 });
dm.reconciliarFinanceiroCicloAtual(dm.data);
const totalHojeDia = dm.calcularTotalVendidoDiaLocal(hojeYMD);
if (Math.abs(totalHojeDia - 150) > 0.01 || Math.abs(dm.data.financeiro.caixaSecundario - 90) > 0.01) {
    console.error('❌ [FALHOU] Vendas manuais idênticas no mesmo dia não somaram corretamente:', totalHojeDia, dm.data.financeiro.caixaSecundario);
    process.exit(1);
}
console.log('✅ [PASSOU] Duas vendas manuais idênticas (25+25) + venda multi (100) somaram exatos R$ 150 no gráfico e R$ 90 na gaveta!');

console.log('\n=== TESTE 6: UI._estoqueVender SEM BAIXA DUPLA & IARecaptura NO VENDEDOR ===');
vm.runInContext(fs.readFileSync('js/ui-estoque.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/ia-recaptura-mensagens.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/ui-ia-recaptura.js', 'utf8'), sandbox);
dm.data.estoqueAcessorios = [{ id: 'ac_99', nome: 'Capa Silicone', custo: 8, precoVenda: 35, quantidade: 5, status: 'disponivel' }];
dm.data.estoqueCelulares = [{ id: 'cel_99', nome: 'iPhone Teste', custo: 1500, precoVenda: 2200, quantidade: 1, status: 'disponivel' }];
sandbox.UI.renderEstoque = () => {};
sandbox.UI.render = () => {};
sandbox.UI._estoqueVender('ac_99', 'acess');
if (dm.data.estoqueAcessorios[0].quantidade !== 4) {
    console.error('❌ [FALHOU] Baixa de acessório incorreta:', dm.data.estoqueAcessorios[0].quantidade);
    process.exit(1);
}
sandbox.UI._estoqueVender('cel_99', 'celular');
if (dm.data.estoqueCelulares[0].quantidade !== 0 || dm.data.estoqueCelulares[0].status !== 'vendido') {
    console.error('❌ [FALHOU] Celular vendido pelo estoque não zerou/marcou vendido:', dm.data.estoqueCelulares[0]);
    process.exit(1);
}
dm.data.clientes = [{ nome: 'Maria Silva', telefone: '75999112233', historico: [{ data: '2026-10-15', produto: 'iPhone 11', valor: 1900 }] }];
const htmlRecap = sandbox.IARecaptura.renderPainelRecaptura();
if (!htmlRecap.includes('IARecaptura.trocarEtapa') || !htmlRecap.includes('https://chat.whatsapp.com/FcuY7wDt7u3F1LusMdlko9')) {
    console.error('❌ [FALHOU] IARecaptura sem trocarEtapa ou link do grupo VIP!');
    process.exit(1);
}
console.log('✅ [PASSOU] UI._estoqueVender (1x baixa) e IARecaptura validados com sucesso!');

console.log('\n=== TESTE 7: ANTI-DUPLICIDADE CRÉDITO + ISOLAMENTO DE FOGOS NA GAVETA ===');
const vendCode = fs.readFileSync('js/ui-vendedor.js', 'utf8');
if (vendCode.includes('<label class="vendedor-radio-parcela"') && vendCode.includes('onclick="UI._vndConfirmar')) {
    console.error('❌ [FALHOU] Parcelas de cartão ainda usam <label onclick> propenso a duplo disparo!');
    process.exit(1);
}
dm.data = dm.getDefaultData();
dm.data.financeiro.caixaPrincipal = 0;
dm.data.financeiro.caixaSecundario = 0;
dm.data.financeiro.caixaFogos = 0;
dm.venderCarrinho(
    [{ tipo: 'avulso', nome: 'Fogos Bomba Test', precoVenda: 60, precoFinal: 60, custo: 20 }],
    [{ forma: 'dinheiro', valor: 60, caixa: 'caixaSecundario' }],
    'Cliente Fogos'
);
dm.venderCarrinho(
    [{ tipo: 'avulso', nome: 'Capinha Silicone', precoVenda: 35, precoFinal: 35, custo: 5 }],
    [{ forma: 'dinheiro', valor: 35, caixa: 'caixaSecundario' }],
    'Cliente Capa'
);
dm.reconciliarFinanceiroCicloAtual(dm.data);
if (Math.abs(dm.data.financeiro.caixaFogos - 60) > 0.01 || Math.abs(dm.data.financeiro.caixaSecundario - 35) > 0.01) {
    console.error('❌ [FALHOU] Fogos contaminou caixaSecundario ou não separou corretamente!', dm.data.financeiro);
    process.exit(1);
}
const movFogos = dm.data.movimentacoesCaixa.find(m => (m.descricao || '').includes('Fogos Bomba Test'));
if (!movFogos || movFogos.caixa !== 'caixaFogos') {
    console.error('❌ [FALHOU] Movimentação de Fogos não gravou caixaFogos!', movFogos);
    process.exit(1);
}
console.log('✅ [PASSOU] Parcelas sem <label onclick> e venda de Fogos isolada (Fogos=60, Gaveta=35)!');

console.log('\n=== TESTE 8: MERGE DE NUVEM NAO COLIDE VENDAS NO MESMO MINUTO NEM OS REPETIDA HISTORICA ===');
dm.data = dm.getDefaultData();
dm.data.historico.vendas = [
    { data: '2026-07-06T19:44:24.750Z', produto: 'Venda Avulsa: Cabo', valorVenda: 20, custo: 3 }
];
dm.data.assistencia.ordensServico = [
    { numero: 35, cliente: 'Valnilene Santos', dataCriacao: '2026-08-04T15:56:02.463Z', status: 'pronto' }
];
dm._mesclarDadosNuvemInteligente({
    _ultimoSaveLocal: Date.now() + 5000,
    historico: {
        vendas: [
            { data: '2026-07-06T19:44:47.258Z', produto: 'Venda Avulsa: Cabo', valorVenda: 20, custo: 3 }
        ]
    },
    assistencia: {
        ordensServico: [
            { numero: 35, cliente: 'Welington', dataCriacao: '2026-08-21T15:53:23.538Z', status: 'aguardando_peca' }
        ]
    }
}, Date.now() + 5000);
if (dm.data.historico.vendas.length !== 2 || dm.data.assistencia.ordensServico.length !== 2) {
    console.error('❌ [FALHOU] Colisão indevida no merge de vendas/OS históricas!', dm.data.historico.vendas.length, dm.data.assistencia.ordensServico.length);
    process.exit(1);
}
console.log('✅ [PASSOU] Merge preservou 2 vendas do mesmo minuto e 2 OS históricas sem colisão!');

console.log('\n=== TESTE 9: NAVEGADOR LIMPO HIDRATADO COM SEED NÃO RESSUSCITA SALDO ANTIGO DA SEMENTE ===');
sandbox.localStorage.clear();
sandbox.INITIAL_BACKUP_DATA = {
    versao: '3.1.0',
    financeiro: { caixaPrincipal: 5917.14, caixaSecundario: 5618.64, caixaFogos: 4945.74 },
    comissaoIlannaMensal: 6693.99,
    historico: { vendas: [{ id: 'old_oct', data: '2026-10-20T12:00:00Z', produto: 'Antiga', valorVenda: 50 }] },
    movimentacoesCaixa: [],
    assistencia: { ordensServico: [], proximoNumero: 1 },
    clientes: [],
    estoqueCelulares: [],
    estoqueAcessorios: []
};
dm.data = dm.loadData();
delete sandbox.INITIAL_BACKUP_DATA;
dm._mesclarDadosNuvemInteligente({
    _ultimoSaveLocal: Date.now() + 2000,
    dataInicioCicloMeta: dm.data.dataInicioCicloMeta,
    ultimoZeramentoId: dm.data.ultimoZeramentoId,
    financeiro: { caixaPrincipal: 1274.29, caixaSecundario: 128, caixaFogos: 5135.74 },
    historico: { vendas: [{ id: 'nov_1', data: hoje + 'T11:00:00Z', produto: 'Capinha', valorVenda: 128, custo: 10 }] },
    movimentacoesCaixa: []
}, Date.now() + 2000);
if (Math.abs(dm.data.financeiro.caixaPrincipal - 1274.29) > 0.01 || Math.abs(dm.data.financeiro.caixaSecundario - 128) > 0.01) {
    console.error('❌ [FALHOU] Seed inicial contaminou saldos da nuvem!', dm.data.financeiro);
    process.exit(1);
}
console.log('✅ [PASSOU] Seed inicial respeitou saldos da nuvem (CP=1274.29, CS=128.00) sem ressuscitar 5917.14!');

console.log('\n=== TESTE 10: SEGMENTAÇÃO BLACK CESINHA, PAGINAÇÃO (>35) E PROXY GEMINI ===');
(async () => {
    vm.runInContext(fs.readFileSync('js/ui-ia-sugestoes.js', 'utf8'), sandbox);
    dm.data.clientes = [
        { nome: 'Marcos', telefone: '75999001122', historico: [{ data: '2026-08-10', produto: 'Venda Avulsa: Capinha Case azul G34', valor: 30 }] },
        { nome: 'Everaldo', telefone: '75999001133', historico: [{ data: '2026-08-11', produto: 'Avulso: Fogos 19x4', valor: 60 }] },
        { nome: 'cliente 09', telefone: '75999001144', historico: [] },
        { nome: 'MISIONARIA', telefone: '75999001155', historico: [] }
    ];
    for (let i = 0; i < 40; i++) {
        dm.data.clientes.push({ nome: `Ana Teste ${i}`, telefone: `7598800${String(1000 + i)}`, historico: [{ data: '2026-09-01', produto: 'Película cerâmica', valor: 25 }] });
    }
    dm.data.historico.vendas = [{ data: '2026-11-06T12:00:00Z', cliente: 'MISIONARIA', produto: 'Avulso: Aparelho celular do Note 70', valorVenda: 998 }];
    const lista = sandbox.IARecaptura.gerarListaRecaptura();
    const marcos = lista.find(c => c.nome === 'Marcos');
    const everaldo = lista.find(c => c.nome === 'Everaldo');
    const cli09 = lista.find(c => c.nome === 'cliente 09');
    const misionaria = lista.find(c => c.nome === 'MISIONARIA');
    if (marcos.categoria !== 'acessorio' || /capinha|tá usando|trocou/i.test(marcos.msgQuebraGelo) || !/Black Cesinha/i.test(marcos.msgQuebraGelo)) {
        console.error('❌ [FALHOU] Segmentação/Msg Capinha incorreta:', marcos.categoria, marcos.msgQuebraGelo);
        process.exit(1);
    }
    if (everaldo.categoria !== 'fogos' || /fogos|tá usando|trocou/i.test(everaldo.msgQuebraGelo)) {
        console.error('❌ [FALHOU] Cliente fogos vazou ou teve texto indevido:', everaldo.categoria, everaldo.msgQuebraGelo);
        process.exit(1);
    }
    if (/Amigo\(a\)|\*Cliente\*/i.test(cli09.msgQuebraGelo)) {
        console.error('❌ [FALHOU] Saudação robótica em nome genérico:', cli09.msgQuebraGelo);
        process.exit(1);
    }
    if (!misionaria || misionaria.categoria !== 'celular' || misionaria.totalGasto !== 998) {
        console.error('❌ [FALHOU] Falhou cruzamento de venda sem c.historico:', misionaria);
        process.exit(1);
    }
    let chamadoUrl = '';
    let payloadEnviado = null;
    sandbox.fetch = async (u, init) => {
        chamadoUrl = u;
        payloadEnviado = init && init.body ? JSON.parse(init.body) : null;
        return { ok: true, json: async () => ({ ok: true, text: 'Oi Marcos, lista VIP Black Cesinha!' }) };
    };
    const rGem = await sandbox.IAGuardian.chamarGemini('teste');
    if (!chamadoUrl.includes('/api/gemini') || !rGem.includes('Black Cesinha') || payloadEnviado?.thinkingBudget !== 0) {
        console.error('❌ [FALHOU] Proxy Gemini não acionado corretamente:', chamadoUrl, payloadEnviado, rGem);
        process.exit(1);
    }
    if (sandbox.IARecaptura.limiteExibicao <= 35 && sandbox.IARecaptura.carregarMais(50) === undefined && sandbox.IARecaptura.limiteExibicao < 90) {
        console.error('❌ [FALHOU] Paginação não expandiu:', sandbox.IARecaptura.limiteExibicao);
        process.exit(1);
    }
    const geminiFnMod = await import('./functions/api/gemini.js');
    let upstreamPayload = null;
    const prevFetch = globalThis.fetch;
    globalThis.fetch = async (u, init) => {
        upstreamPayload = JSON.parse(init.body);
        return {
            ok: true,
            status: 200,
            json: async () => ({
                candidates: [{ content: { parts: [{ thought: true, text: 'rascunho interno' }, { text: 'Resposta limpa Black Cesinha' }] }, finishReason: 'STOP' }]
            })
        };
    };
    try {
        const fnResp = await geminiFnMod.onRequestPost({
            env: { GEMINI_API_KEY: 'dummy-test-only' },
            request: { json: async () => ({ prompt: 'Oi', model: 'gemini-2.5-flash', maxOutputTokens: 350 }) }
        });
        const fnJson = await fnResp.json();
        if (!fnJson.ok || fnJson.text !== 'Resposta limpa Black Cesinha' || upstreamPayload?.generationConfig?.thinkingConfig?.thinkingBudget !== 0) {
            console.error('❌ [FALHOU] Handler /api/gemini falhou no thinkingBudget ou filtro thought:', fnJson, upstreamPayload);
            process.exit(1);
        }
    } finally {
        globalThis.fetch = prevFetch;
    }
    console.log('✅ [PASSOU] Segmentação Black Cesinha, nome genérico, cruzamento vendas->cliente, paginação (>35) e proxy Gemini OK!');
    console.log('\n=== TODOS OS TESTES ESPECÍFICOS DE GRÁFICO, FECHAMENTO E SYNC PASSARAM COM SUCESSO! ===');
    setTimeout(() => process.exit(0), 50);
})().catch(e => { console.error(e); process.exit(1); });
