// ============================================================================
// STRATEGYOS — RELATÓRIOS DO TELEGRAM NO SERVIDOR (Cloudflare Worker)
// Fechamento Diário Pontual (18:00 Bahia) & Resumo Mensal do Ciclo (Dia 6)
// ============================================================================
import { R, dataYMDDeValor, formatarBR, chaveCicloMensal, mesAnterior, META_OBJETIVO, DIA_ZERAMENTO } from './datas.js';

export function sanitizarMD(txt) {
    if (txt === null || txt === undefined) return '';
    return String(txt).replace(/([_*`\[\]])/g, '');
}

export function classificarVenda(v) {
    const tipo = String(v.tipo || '').toLowerCase();
    const prod = String(v.produto || '').toLowerCase();
    const caixa = String(v.caixaDestino || (v.pagamentoDivisao && v.pagamentoDivisao[0] && v.pagamentoDivisao[0].caixa) || '').toLowerCase();

    // 1. Fogos de Artifício
    if (caixa === 'caixafogos' || tipo.includes('fogos') || /fogos?|bomba|12x1|19x4|foguete|traque|rojao/.test(prod)) {
        return 'fogos';
    }
    // 2. Consertos & Serviços Técnicos
    if (tipo.includes('conserto') || /conserto|manut|bateria|tela|conector|reparo|troca de|daginitico|diagnostico|solda|desoxida/.test(prod)) {
        return 'conserto';
    }
    // 3. Celulares / Aparelhos Novos ou Seminovos
    if (tipo === 'celular' || ((/iphone|samsung|xiaomi|motorola|redmi|poco/.test(prod)) && !/capa|capinha|pelicula|cabo|fone|carregador/.test(prod))) {
        return 'celular';
    }
    // 4. Balcão Loja / Acessórios
    return 'loja';
}

export function identificarPagamento(v) {
    if (Array.isArray(v.pagamentoDivisao) && v.pagamentoDivisao.length > 0) {
        const partes = v.pagamentoDivisao.map(p => {
            const f = String(p.forma || '').toLowerCase();
            if (f === 'dinheiro') return '💵 Dinheiro (Gaveta)';
            if (f === 'pix') return '📱 PIX';
            if (f.includes('cartao') || f.includes('credito') || f.includes('debito')) return '💳 Cartão';
            return sanitizarMD(p.forma);
        });
        return partes.join(' + ');
    }
    const f = String(v.formaPagamento || v.tipo || '').toLowerCase();
    if (f === 'dinheiro' || f === 'avista') return '💵 Dinheiro (Gaveta)';
    if (f === 'pix') return '📱 PIX';
    if (f.includes('cartao') || f.includes('parcelado')) return '💳 Cartão';
    return sanitizarMD(v.formaPagamento || v.tipo || 'Balcão');
}

export function valorVenda(v) {
    const val = parseFloat(v.valorVenda || v.liquido || v.valor || 0);
    return Number.isFinite(val) && val < 50000 ? val : 0;
}

export function montarFechamentoDiario(state, ymd) {
    const vendas = ((state.historico && state.historico.vendas) || []).filter(v => dataYMDDeValor(v.data) === ymd);
    const categorias = { loja: 0, fogos: 0, conserto: 0, celular: 0 };
    const formas = { dinheiro: 0, pix: 0, cartao: 0 };
    let lucroTotal = 0;
    let custoTotal = 0;

    const linhas = vendas.map((v, idx) => {
        const val = valorVenda(v);
        const custo = parseFloat(v.custo || v.custoPeca || 0) || 0;
        let lucro = parseFloat(v.lucro !== undefined ? v.lucro : (val - custo));
        if (isNaN(lucro) || lucro < 0) lucro = Math.max(0, val - custo);

        custoTotal += custo;
        lucroTotal += lucro;

        const cat = classificarVenda(v);
        categorias[cat] = (categorias[cat] || 0) + val;

        // Totalização de meios de pagamento
        if (Array.isArray(v.pagamentoDivisao) && v.pagamentoDivisao.length > 0) {
            v.pagamentoDivisao.forEach(p => {
                const forma = String(p.forma || '').toLowerCase();
                const vPart = parseFloat(p.valor || 0) || 0;
                if (forma === 'dinheiro') formas.dinheiro += vPart;
                else if (forma === 'pix') formas.pix += vPart;
                else formas.cartao += vPart;
            });
        } else {
            const f = String(v.formaPagamento || v.tipo || '').toLowerCase();
            if (f === 'dinheiro' || f === 'avista') formas.dinheiro += val;
            else if (f === 'pix') formas.pix += val;
            else formas.cartao += val;
        }

        const formaLabel = identificarPagamento(v);
        const cliLabel = v.cliente && v.cliente !== 'Não Identificado' ? ` | 👤 ${sanitizarMD(v.cliente)}` : '';
        const emojiCat = cat === 'conserto' ? '🔧' : cat === 'fogos' ? '🎆' : cat === 'celular' ? '📱' : '🛒';

        return `   ${idx + 1}. ${emojiCat} ${sanitizarMD(v.produto || 'Item')} — *${R(val)}* [Lucro: ${R(lucro)}]\n      └─ ${formaLabel}${cliLabel}`;
    });

    // Despesas do dia
    const movsDia = (state.movimentacoesCaixa || []).filter(m => dataYMDDeValor(m.data) === ymd);
    let despesas = 0;
    const linhasDespesas = [];
    movsDia.forEach(m => {
        if (m.tipo !== 'despesa') return;
        const val = Math.abs(parseFloat(m.valor || 0) || 0);
        despesas += val;
        linhasDespesas.push(`   • ${sanitizarMD(m.descricao || m.motivo || 'Despesa')} — *-${R(val)}*`);
    });

    const f = state.financeiro || {};
    const totalBruto = categorias.loja + categorias.fogos + categorias.conserto + (categorias.celular || 0);
    const lucroLiquidoReal = Math.max(0, lucroTotal - despesas);
    const parteLoja40 = Math.round(lucroLiquidoReal * 0.40 * 100) / 100;
    const partePai60 = Math.round(lucroLiquidoReal * 0.60 * 100) / 100;

    const celulares = (state.estoqueCelulares || []).filter(c => c.status === 'disponivel').length;
    const acessorios = (state.estoqueAcessorios || []).filter(a => a.status !== 'vendido').length;
    const listaVendas = linhas.length ? linhas.slice(0, 30).join('\n') + (linhas.length > 30 ? `\n   … e mais ${linhas.length - 30} itens vendidos` : '') : '   _Nenhuma venda registrada hoje._';

    const texto = `📊 *FECHAMENTO DE CAIXA DIÁRIO — STRATEGYOS* 📊\n` +
        `📅 *Data:* ${formatarBR(ymd)} (18:00 Bahia)\n` +
        `🏪 *Loja:* Cesinha Acessórios\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💵 *FATURAMENTO BRUTO: ${R(totalBruto)}* (${vendas.length} itens)\n` +
        `📈 *LUCRO LÍQUIDO REAL DO DIA: ${R(lucroLiquidoReal)}*\n` +
        `   ├─ 🏬 *40% Loja (Capital/Giro):* ${R(parteLoja40)}\n` +
        `   └─ 👨 *60% Pai (Retirada Parceiro):* ${R(partePai60)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💳 *DIVISÃO POR MEIO DE PAGAMENTO:*\n` +
        `   💵 Dinheiro (Gaveta Física): *${R(formas.dinheiro)}*\n` +
        `   📱 PIX (Caixa Principal / Conta): *${R(formas.pix)}*\n` +
        `   💳 Cartão (Débito/Crédito): *${R(formas.cartao)}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ *FATURAMENTO POR CATEGORIA:*\n` +
        `   🔧 Consertos & Serviços: *${R(categorias.conserto)}*\n` +
        `   🎆 Fogos de Artifício: *${R(categorias.fogos)}*\n` +
        `   🛒 Acessórios Balcão: *${R(categorias.loja)}*\n` +
        `   📱 Celulares: *${R(categorias.celular || 0)}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📝 *DISCRIMINAÇÃO DETALHADA DAS VENDAS:*\n${listaVendas}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💸 *DESPESAS DO DIA:*\n${linhasDespesas.length ? linhasDespesas.join('\n') : '   _Nenhuma despesa registrada hoje._'}\n` +
        `   *Total Despesas:* -${R(despesas)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏦 *SALDO DOS CAIXAS NO SISTEMA:*\n` +
        `   💚 Gaveta Física (Caixa Secundário): *${R(f.caixaSecundario)}*\n` +
        `   📊 Caixa Principal (PIX / Cartão): *${R(f.caixaPrincipal)}*\n` +
        `   🎆 Caixa de Fogos: *${R(f.caixaFogos)}*\n` +
        `   👨 Caixa Terciário (Pai): *${R(f.caixaTerciario || 0)}*\n\n` +
        `🎯 *META DO CICLO (Até Dia 06):* ${R(state.comissaoIlannaMensal || 0)} de ${R(META_OBJETIVO)}\n` +
        `📦 *Estoque:* ${celulares} celulares | ${acessorios} acessórios\n\n` +
        `🤖 _Relatório pontual emitido pelo servidor StrategyOS v3.9_`;

    return { texto, qtdVendas: vendas.length, totalDia: totalBruto, lucroReal: lucroLiquidoReal };
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
