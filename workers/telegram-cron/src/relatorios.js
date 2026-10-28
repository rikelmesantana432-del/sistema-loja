// Montagem dos relatórios enviados pelo servidor (fechamento diário e ciclo mensal do dia 6)
import { R, dataYMDDeValor, formatarBR, chaveCicloMensal, mesAnterior, META_OBJETIVO, DIA_ZERAMENTO } from './datas.js';

function classificarVenda(v) {
    const tipo = String(v.tipo || '').toLowerCase();
    if (v.caixaDestino === 'caixaFogos' || tipo.includes('fogos')) return 'fogos';
    if (tipo.includes('conserto')) return 'conserto';
    return 'loja';
}

function valorVenda(v) {
    const val = parseFloat(v.valorVenda || v.liquido || v.valor || 0);
    return Number.isFinite(val) && val < 50000 ? val : 0;
}

export function montarFechamentoDiario(state, ymd) {
    const vendas = ((state.historico && state.historico.vendas) || []).filter(v => dataYMDDeValor(v.data) === ymd);
    const totais = { loja: 0, fogos: 0, conserto: 0 };
    let lucroTotal = 0;
    const linhas = vendas.map(v => {
        const val = valorVenda(v);
        const lucro = parseFloat(v.lucro || 0) || 0;
        totais[classificarVenda(v)] += val;
        lucroTotal += lucro;
        return `   • ${v.produto || 'Item'} — ${R(val)} (Lucro: ${R(lucro)}) [${v.formaPagamento || v.tipo || ''}]`;
    });

    const movsDia = (state.movimentacoesCaixa || []).filter(m => dataYMDDeValor(m.data) === ymd);
    let despesas = 0;
    const linhasDespesas = [];
    movsDia.forEach(m => {
        if (m.tipo !== 'despesa') return;
        const val = Math.abs(parseFloat(m.valor || 0) || 0);
        despesas += val;
        linhasDespesas.push(`   • ${m.descricao || m.motivo || 'Despesa'} — ${R(val)}`);
    });

    const f = state.financeiro || {};
    const totalDia = totais.loja + totais.fogos + totais.conserto;
    const celulares = (state.estoqueCelulares || []).filter(c => c.status === 'disponivel').length;
    const acessorios = (state.estoqueAcessorios || []).filter(a => a.status !== 'vendido').length;
    const listaVendas = linhas.length ? linhas.slice(0, 40).join('\n') + (linhas.length > 40 ? `\n   … e mais ${linhas.length - 40} itens` : '') : '   _Nenhuma venda registrada hoje._';

    const texto = `📊 *FECHAMENTO DE CAIXA AUTOMÁTICO* 📊\n` +
        `📅 *Data:* ${formatarBR(ymd)}\n` +
        `🏪 *Loja:* Cesinha Acessórios\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 *VENDAS DO DIA (${vendas.length} itens):*\n${listaVendas}\n\n` +
        `📈 *RESUMO FINANCEIRO:*\n` +
        `   🛒 Loja/Balcão: *${R(totais.loja)}*\n` +
        `   🎆 Fogos: *${R(totais.fogos)}*\n` +
        `   🔧 Consertos/OS: *${R(totais.conserto)}*\n` +
        `   💵 *TOTAL DO DIA: ${R(totalDia)}*\n` +
        `   📊 Lucro estimado: *${R(lucroTotal)}*\n\n` +
        `💸 *DESPESAS:*\n${linhasDespesas.length ? linhasDespesas.join('\n') : '   _Nenhuma despesa registrada._'}\n` +
        `   Total: *-${R(despesas)}*\n\n` +
        `🏦 *SALDOS NOS CAIXAS:*\n` +
        `   🏦 Caixa Principal: *${R(f.caixaPrincipal)}*\n` +
        `   💚 Gaveta (Secundário): *${R(f.caixaSecundario)}*\n` +
        `   🎆 Caixa de Fogos: *${R(f.caixaFogos)}*\n\n` +
        `🎯 *META DO CICLO:* ${R(state.comissaoIlannaMensal)} de ${R(META_OBJETIVO)}\n` +
        `📦 *Estoque:* ${celulares} celulares | ${acessorios} acessórios\n\n` +
        `🤖 _Enviado automaticamente pelo servidor StrategyOS (sem depender de celular ligado)_`;

    return { texto, qtdVendas: vendas.length, totalDia };
}

function inicioCicloAnterior(ymdHoje) {
    const anoMes = ymdHoje.substring(0, 7);
    return `${mesAnterior(anoMes)}-0${DIA_ZERAMENTO}`;
}

export function montarResumoCiclo(state, ymdHoje) {
    const cicloAtual = chaveCicloMensal(ymdHoje);
    const jaZerado = state.ultimoCicloZerado === cicloAtual;
    const historico = state.historicoFechamentoMensal || [];
    const ultimo = jaZerado && historico.length ? historico[historico.length - 1] : null;

    const f = state.financeiro || {};
    const caixaPrincipal = ultimo ? (ultimo.saldoCaixaPrincipalFinal || 0) : (f.caixaPrincipal || 0);
    const gaveta = ultimo ? (ultimo.saldoGavetaFinal || 0) : (f.caixaSecundario || 0);
    const meta = ultimo ? (ultimo.metaAcumuladaFinal || 0) : (state.comissaoIlannaMensal || 0);
    const pct = Math.min(100, (meta / META_OBJETIVO) * 100);
    const bonus = Math.max(0, meta - META_OBJETIVO) * 0.1;

    const inicio = inicioCicloAnterior(ymdHoje);
    const vendasCiclo = ((state.historico && state.historico.vendas) || []).filter(v => {
        const d = dataYMDDeValor(v.data);
        return d >= inicio && d < ymdHoje;
    });
    const faturamento = vendasCiclo.reduce((s, v) => s + valorVenda(v), 0);
    const lucro = vendasCiclo.reduce((s, v) => s + (parseFloat(v.lucro || 0) || 0), 0);

    const ontem = new Date(Date.parse(ymdHoje + 'T12:00:00Z') - 86400000).toISOString().substring(0, 10);
    const texto = `🔒 *CICLO MENSAL ENCERRADO — DIA ${DIA_ZERAMENTO}* 🔒\n` +
        `📅 Período: ${formatarBR(inicio)} até ${formatarBR(ontem)}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🏦 *Caixa Principal:* ${R(caixaPrincipal)}\n` +
        `💚 *Gaveta (Secundário):* ${R(gaveta)}\n` +
        `🎯 *Meta Batida:* ${R(meta)} de ${R(META_OBJETIVO)} (${pct.toFixed(1)}%)\n` +
        `${meta >= META_OBJETIVO ? `🏆 *META ATINGIDA!* Bônus de 10%: ${R(bonus)}` : `⚠️ Faltaram ${R(META_OBJETIVO - meta)} para a meta`}\n\n` +
        `🛒 *Vendas no ciclo:* ${vendasCiclo.length} itens\n` +
        `💵 *Faturamento:* ${R(faturamento)}\n` +
        `📊 *Lucro estimado:* ${R(lucro)}\n\n` +
        `🚀 *Novo ciclo de ${R(META_OBJETIVO)} iniciado!* Caixa Principal, Gaveta e Meta zerados.\n\n` +
        `🤖 _Enviado automaticamente pelo servidor StrategyOS_`;

    return { texto, cicloAtual };
}
