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

console.log('\n=== TODOS OS TESTES ESPECÍFICOS DE GRÁFICO, FECHAMENTO E SYNC PASSARAM COM SUCESSO! ===');
setTimeout(() => process.exit(0), 50);
