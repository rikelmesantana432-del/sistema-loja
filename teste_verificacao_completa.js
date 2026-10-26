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

// TESTE 9: Roteamento estrito PIX/Cartão (caixaPrincipal) vs Dinheiro (caixaSecundario)
dm.data.financeiro.caixaSecundario = 200;
dm.data.financeiro.caixaPrincipal = 1000;
dm._registrarSincronizacaoFinanceira({
    tipo: 'venda_celular_avista',
    produto: 'iPhone 13 128GB',
    valorVenda: 2800,
    custo: 2100,
    caixaDestino: 'caixaPrincipal',
    cliente: 'Cliente PIX'
});
assert(dm.data.financeiro.caixaSecundario === 200, `Venda via PIX (caixaPrincipal) NÃO alterou a gaveta física caixaSecundario (permaneceu R$ ${dm.data.financeiro.caixaSecundario})`);
assert(dm.data.financeiro.caixaPrincipal === 3800, `Venda via PIX creditou corretamente o caixaPrincipal (esperado: 3800, obtido: ${dm.data.financeiro.caixaPrincipal})`);

// TESTE 10: Ordem de Serviço - Entrada em PIX vs Entrada em Dinheiro
const gavetaAntesOS = dm.data.financeiro.caixaSecundario;
const principalAntesOS = dm.data.financeiro.caixaPrincipal;
dm.criarOrdemServico({
    clienteNome: 'Maria OS PIX',
    aparelho: 'Samsung A54',
    servico: 'Troca de Tela',
    valorOrcamento: 350,
    custoPeca: 140,
    valorEntrada: 150,
    formaPagamentoEntrada: 'pix'
});
assert(dm.data.financeiro.caixaSecundario === gavetaAntesOS, `Sinal de OS em PIX NÃO entrou na gaveta física`);
assert(dm.data.financeiro.caixaPrincipal === principalAntesOS + 150, `Sinal de OS em PIX entrou no caixaPrincipal (+R$ 150)`);

dm.criarOrdemServico({
    clienteNome: 'José OS Dinheiro',
    aparelho: 'Moto G84',
    servico: 'Troca de Bateria',
    valorOrcamento: 180,
    custoPeca: 60,
    valorEntrada: 80,
    formaPagamentoEntrada: 'dinheiro'
});
assert(dm.data.financeiro.caixaSecundario === gavetaAntesOS + 80, `Sinal de OS em Dinheiro entrou na gaveta física (+R$ 80)`);

// TESTE 11: Venda de Película roteando entre Gaveta (Dinheiro) e Conta (PIX)
const gavetaAntesPel = dm.data.financeiro.caixaSecundario;
const principalAntesPel = dm.data.financeiro.caixaPrincipal;
dm.venderPelicula('iPhone 13', 'Frente', 25, 'hd_hidrogel', 'Cliente Película PIX', 'caixaPrincipal');
assert(dm.data.financeiro.caixaSecundario === gavetaAntesPel, `Película paga no PIX NÃO somou na gaveta física`);
assert(dm.data.financeiro.caixaPrincipal === principalAntesPel + 25, `Película paga no PIX somou no caixaPrincipal (+R$ 25)`);

// TESTE 12: Verificação de ausência do nome "Ilanna" nas telas de atendimento e HTMLs
const arquivosVisiveis = ['index.html', 'cesinha-vendedor.html', 'js/ui-vendedor.js', 'js/ui-vendedor-fluxos.js', 'js/ui-venda-avulsa.js', 'js/ui-tabela-precos.js'];
let ocorrenciasIlannaUI = 0;
for (const arq of arquivosVisiveis) {
    const conteudo = fs.readFileSync(path.join(__dirname, arq), 'utf8');
    // Ignora chaves técnicas de retrocompatibilidade e classes CSS/comentários internos
    const limpo = conteudo
        .replace(/\/\/.*$/gm, '')
        .replace(/comissaoIlannaMensal/g, '')
        .replace(/comissaoIlannaHistorico/g, '')
        .replace(/calcularComissaoIlannaReal/g, '')
        .replace(/_obterWidgetMetaIlanna/g, '')
        .replace(/barra-meta-ilanna/g, '')
        .replace(/fecharTurnoIlanna/g, '')
        .replace(/_confirmarSangriaIlanna/g, '');
    if (/ilanna/i.test(limpo)) {
        ocorrenciasIlannaUI++;
        console.error(`Aviso: 'Ilanna' encontrado em ${arq}`);
    }
}
assert(ocorrenciasIlannaUI === 0, `Zero ocorrências visíveis do nome "Ilanna" nos arquivos de interface e fluxo vendedor`);

// TESTE 13: Filtro estrito de Venda Real (Transferências, Suprimentos e Fechamentos NÃO inflam vendas da semana)
dm.data.movimentacoesCaixa = [
    { id: 5001, data: dStr, tipo: 'venda', descricao: 'Venda Capinha', valor: 60, custo: 20, lucro: 40, caixa: 'caixaSecundario' },
    { id: 5002, data: dStr, tipo: 'transferencia', descricao: 'Transferência entre caixas', valor: 500, custo: 0, lucro: 0, caixa: 'caixaPrincipal' },
    { id: 5003, data: dStr, tipo: 'fechamento_caixa', descricao: 'Fechamento de Caixa Diário', valor: 300, custo: 0, lucro: 0, caixa: 'caixaSecundario' },
    { id: 5004, data: dStr, tipo: 'suprimento', descricao: 'Troco de Gaveta', valor: 100, custo: 0, lucro: 0, caixa: 'caixaSecundario' }
];
dm.data.historico.vendas = [];
const fechSemTransferencia = dm.getFechamentoSemanal();
assert(fechSemTransferencia.vendasSemana === 60, `Fechamento semanal ignora transferências/fechamentos/suprimentos (esperado: R$ 60, obtido: R$ ${fechSemTransferencia.vendasSemana})`);

// TESTE 14: Estorno Completo de Venda (estornarMovimentacao / estornarVendaERetroagirCaixa)
dm.data.financeiro.caixaSecundario = 200;
dm.data.fundoCustoEstoque = { totalAcumulado: 100, saldoGuardado: 100, historicoCusto: [] };
dm.data.divisaoLucro = { totalLucroAcumulado: 50, acumuladoLoja40: 20, acumuladoPai60: 30, historicoDivisao: [] };
dm.data.movimentacoesCaixa = [];
dm.data.historico.vendas = [];

dm._registrarSincronizacaoFinanceira({
    tipo: 'venda_avista',
    produto: 'Fone Bluetooth Pro',
    valorVenda: 100,
    custo: 40,
    caixaDestino: 'caixaSecundario',
    cliente: 'Cliente Estorno'
});
const idMovGerada = dm.data.movimentacoesCaixa[0].id;
assert(dm.data.financeiro.caixaSecundario === 300, `Antes do estorno: Caixa Secundário = R$ 300 (obtido: ${dm.data.financeiro.caixaSecundario})`);

const resultadoEstorno = dm.estornarMovimentacao(idMovGerada);
assert(resultadoEstorno.sucesso === true, `estornarMovimentacao executou sem erro`);
assert(dm.data.financeiro.caixaSecundario === 200, `Após estorno: Valor integral (R$ 100) foi deduzido do Caixa Secundário (esperado: 200, obtido: ${dm.data.financeiro.caixaSecundario})`);
assert(dm.data.fundoCustoEstoque.saldoGuardado === 100, `Após estorno: Custo (R$ 40) foi revertido do Fundo de Reposição (esperado: 100, obtido: ${dm.data.fundoCustoEstoque.saldoGuardado})`);
assert(dm.data.divisaoLucro.totalLucroAcumulado === 50, `Após estorno: Lucro Líquido (R$ 60) foi revertido da Divisão de Lucros (esperado: 50, obtido: ${dm.data.divisaoLucro.totalLucroAcumulado})`);


// TESTE 15: Motor Unificado do Telegram + Hidratação do Backup 2026-10-23
const tgCfg = dm.getConfigTelegram();
assert(Boolean(tgCfg.botToken && tgCfg.chatId), `Configuração do Telegram unificada e pré-carregada com credenciais da loja`);
assert(tgCfg.notificarVendas === true && tgCfg.notificarOS === true, `Piloto Automático do Telegram habilitado por padrão para Vendas e OS`);
const backupPath = path.join(__dirname, 'backup_recuperado_2026-10-23.json');
assert(fs.existsSync(backupPath), `Arquivo backup_recuperado_2026-10-23.json presente e íntegro no projeto`);
const bkpRaw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
assert(Array.isArray(bkpRaw.produtosProcurados) && bkpRaw.produtosProcurados.length === 21, `Backup 2026-10-23 contém todos os 21 pedidos/produtos procurados recuperados`);
assert(bkpRaw.clientes.length >= 390 && bkpRaw.historico.vendas.length >= 560, `Backup 2026-10-23 contém base histórica completa (${bkpRaw.clientes.length} clientes, ${bkpRaw.historico.vendas.length} vendas)`);


// TESTE 16: Correção de Preço Justo de Consertos Blindada contra Sobrescrita de Backup Antigo
const orcIp11 = Calculators.getOrcamentoServico('iPhone 11', 'tela');
assert(orcIp11.custoPeca === 130 && orcIp11.ideal === 300, `iPhone 11 Tela com Preço Justo corrigido (Custo Peça: R$ ${orcIp11.custoPeca} | Venda Ideal: R$ ${orcIp11.ideal})`);
const orcA14 = Calculators.getOrcamentoServico('Samsung A14', 'tela');
assert(orcA14.custoPeca === 120 && orcA14.ideal === 280, `Samsung A14 Tela com Preço Justo corrigido (Custo Peça: R$ ${orcA14.custoPeca} | Venda Ideal: R$ ${orcA14.ideal})`);
const orcA15 = Calculators.getOrcamentoServico('Samsung A15', 'tela');
assert(orcA15.custoPeca === 115 && orcA15.ideal === 270, `Samsung A15 Tela cadastrado com Preço Justo (Custo Peça: R$ ${orcA15.custoPeca} | Venda Ideal: R$ ${orcA15.ideal})`);
const totalModelosCatalogo = Object.keys(dm.data.tabelaServicosModelo || {}).length;
assert(totalModelosCatalogo >= 130, `Catálogo expandido de consertos com ${totalModelosCatalogo} modelos ativos`);

console.log('\n=================================================================');
console.log(`🎯 RESULTADO FINAL: ${passados} / ${total} TESTES PASSARAM COM SUCESSO!`);
console.log('=================================================================');

if (passados === total) {
    process.exit(0);
} else {
    process.exit(1);
}
