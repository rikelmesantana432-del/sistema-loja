const fs = require('fs');
const path = './db.json';

try {
    const rawData = fs.readFileSync(path, 'utf8');
    const db = JSON.parse(rawData);
    
    let novaComissao = 0;
    
    // 1. Recalcular comissaoIlannaMensal de Agosto (2026-08)
    if (db.historico && db.historico.vendas) {
        const vendasAgosto = db.historico.vendas.filter(v => v.data && v.data.startsWith('2026-08'));
        vendasAgosto.forEach(v => {
            const isCelular = v.tipo && v.tipo.toLowerCase().includes('celular') || (v.produto && !v.produto.toLowerCase().includes('acess'));
            const isFogos = v.caixaDestino === 'caixaFogos';
            const isConserto = v.tipo && v.tipo.toLowerCase().includes('conserto');
            
            if (!isFogos && !isConserto) {
                const lucro = parseFloat(v.lucro || 0);
                const valorVenda = parseFloat(v.valorVenda || v.liquido || 0);
                
                if (isCelular) {
                    const cont = lucro > 100 ? (lucro - 100) : 0;
                    novaComissao += cont;
                } else {
                    novaComissao += lucro;
                }
            }
        });
    }
    
    console.log(`[FIX] Comissão recalculada para Agosto: R$ ${novaComissao.toFixed(2)}`);
    db.comissaoIlannaMensal = novaComissao;
    
    // 2. Corrigir caixaSecundario negativo
    let cxSecundario = db.financeiro.caixaSecundario || 0;
    console.log(`[FIX] Caixa Secundário atual: R$ ${cxSecundario.toFixed(2)}`);
    if (cxSecundario < 0) {
        console.log(`[FIX] Corrigindo caixaSecundario negativo para 0 (o prejuízo do estorno será absorvido pelo Principal ou apenas corrigido).`);
        db.financeiro.caixaSecundario = 0;
    }
    
    fs.writeFileSync(path, JSON.stringify(db, null, 2), 'utf8');
    console.log('[FIX] Script concluído com sucesso!');
    
} catch (e) {
    console.error('Erro:', e);
}
