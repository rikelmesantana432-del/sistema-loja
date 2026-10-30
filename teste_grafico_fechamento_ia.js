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

console.log('\n=== TODOS OS TESTES ESPECÍFICOS DE GRÁFICO, FECHAMENTO E SYNC PASSARAM COM SUCESSO! ===');
