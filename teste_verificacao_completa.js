/**
 * TESTE DE VERIFICAÇÃO COMPLETA - STRATEGYOS 3.0
 * Executa simulação com sandbox isolado para validar regras de negócio,
 * caixas, comissão, precificação de conserto, fiado e fechamentos.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock DOM e LocalStorage
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
        getElementById: () => null,
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
const Calculators = sandbox.Calculators;

console.log('=================================================================');
console.log('🧪 INICIANDO BATERIA DE TESTES DE INTEGRAÇÃO - STRATEGYOS 3.0');
console.log('=================================================================\n');

let passados = 0;
let total = 0;

function assert(cond, nome) {
    total++;
    if (cond) {
        passados++;
        console.log(`✅ [PASSOU] ${nome}`);
    } else {
        console.error(`❌ [FALHOU] ${nome}`);
    }
}

// TESTE 1: Timezone Local Bahia
const dStr = dm.hojeLocal();
const hStr = dm.horaLocal();
assert(typeof dStr === 'string' && dStr.length === 10 && dStr.includes('-'), `Timezone Local Bahia hojeLocal(): ${dStr}`);
assert(typeof hStr === 'string' && hStr.length >= 5 && hStr.includes(':'), `Hora Local Bahia horaLocal(): ${hStr}`);

// TESTE 2: Precificação de Consertos (Régua de 3 Faixas)
const faixas60 = Calculators._calcularPrecoConsertoEscalonado(60, 20);
assert(faixas60.ideal === 180, `Conserto com custo R$ 60 -> Preço Ideal deve ser R$ 180 (recebido: ${faixas60.ideal})`);
assert(faixas60.minimo >= 120, `Conserto com custo R$ 60 -> Preço Mínimo deve ser >= R$ 120 (recebido: ${faixas60.minimo})`);

const faixas120 = Calculators._calcularPrecoConsertoEscalonado(120, 30);
assert(faixas120.ideal === 280, `Conserto com custo R$ 120 -> Preço Ideal deve ser R$ 280 (recebido: ${faixas120.ideal})`);

const faixas300 = Calculators._calcularPrecoConsertoEscalonado(300, 50);
assert(faixas300.ideal === 530, `Conserto com custo R$ 300 -> Preço Ideal deve ser R$ 530 (recebido: ${faixas300.ideal})`);

// TESTE 3: Sincronização de Caixa Físico (Dinheiro)
dm.data.financeiro.caixaSecundario = 100;
dm.data.historico.vendas = [];
dm.data.movimentacoesCaixa = [];

dm._registrarSincronizacaoFinanceira({
    tipo: 'venda_avista',
    produto: 'Capinha Teste',
    valorVenda: 50,
    custo: 15,
    caixaDestino: 'caixaSecundario',
    cliente: 'Cliente Teste'
});

assert(dm.data.financeiro.caixaSecundario === 150, `Venda em dinheiro de R$ 50 adicionada ao caixa físico (esperado: 150, obtido: ${dm.data.financeiro.caixaSecundario})`);

// TESTE 4: Não Duplicação de Movimentações
// Adiciona a mesma venda em historico.vendas para verificar se getTodosMovimentacoesHistorico ignora duplicatas
dm.data.historico.vendas.push({
    data: dm.data.movimentacoesCaixa[0].data,
    produto: 'Capinha Teste',
    valorVenda: 50,
    custo: 15
});

const todosMov = dm.getTodosMovimentacoesHistorico();
const vendasMov = todosMov.filter(m => m.descricao && m.descricao.toLowerCase().includes('venda'));
assert(vendasMov.length === 1, `Venda não foi duplicada no histórico unificado (esperado: 1, obtido: ${vendasMov.length})`);

// TESTE 5: Receber Fiado
dm.data.fiados = [{
    id: 999,
    cliente: 'Seu João',
    produto: 'Cabo Tipo-C',
    valor: 35.0,
    status: 'pendente',
    dataRegistro: '2026-10-01'
}];

const saldoAntesFiado = dm.data.financeiro.caixaSecundario;
dm.receberFiado(999, 'dinheiro');
const fiadoItem = dm.data.fiados.find(f => f.id === 999);
assert(fiadoItem.status === 'recebido', 'Status do fiado atualizado para "recebido"');
assert(dm.data.financeiro.caixaSecundario === saldoAntesFiado + 35, `Caixa físico creditado em R$ 35 (esperado: ${saldoAntesFiado + 35}, obtido: ${dm.data.financeiro.caixaSecundario})`);

// TESTE 6: Limpar Estoque Vendido existe
assert(typeof dm.limparEstoqueVendido === 'function', 'Método dm.limparEstoqueVendido existe e é função');

// TESTE 7: Fechamento Semanal Métrica Top Constante e Custo de Reposição
dm.data.movimentacoesCaixa = [];
dm.data.historico.vendas = [
    { data: dStr, valor: 100, valorVenda: 100, lucro: 40, custo: 60, produto: 'Película 3D' },
    { data: dStr, valor: 50, valorVenda: 50, lucro: 20, custo: 30, produto: 'Película 3D' }
];
const fechSemanal = dm.getFechamentoSemanal();
assert(fechSemanal.vendasSemana === 150, `Fechamento semanal total vendas: R$ ${fechSemanal.vendasSemana}`);
assert(fechSemanal.custoSemana === 90, `Custo de reposição semanal: R$ ${fechSemanal.custoSemana}`);
assert(fechSemanal.topVolume && fechSemanal.topVolume.nome === 'Película 3D', `Top volume identificado corretamente: ${fechSemanal.topVolume?.nome}`);

// TESTE 8: Virada de Mês e Reset do Caixa Físico
dm.data.ultimoMesFechado = '2026-09';
dm.data.financeiro.caixaSecundario = 500;
dm.verificarViradaDeMes();
assert(dm.data.financeiro.caixaSecundario === 0, `Caixa físico zerado após virada de mês (esperado: 0, obtido: ${dm.data.financeiro.caixaSecundario})`);
assert(dm.data.historicoFechamentoMensal && dm.data.historicoFechamentoMensal.length > 0, 'Histórico mensal arquivado no fechamento');

console.log('\n=================================================================');
console.log(`🎯 RESULTADO FINAL: ${passados} / ${total} TESTES PASSARAM COM SUCESSO!`);
console.log('=================================================================');

if (passados === total) {
    process.exit(0);
} else {
    process.exit(1);
}
