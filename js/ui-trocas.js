// ====================================
// STRATEGYOS 3.1 - MOTOR DE AVALIAÇÃO DE TROCAS (TRADE-IN ENGINE v4.0)
// Precificação de Captação (Compra pela Loja) vs Vitrine (Anúncio) + Custo Real de Reparo
// ====================================

const TrocaEngine = {
    // TABELA DE PREÇOS DE VITRINE / ANÚNCIO (SEMINOVO PERFEITO)
    // O valor de CAPTAÇÃO (quanto a loja paga na troca) aplica automaticamente o fator de margem da loja (~50% a 62% da vitrine).
    precosVitrineSeminovo: {
        'iphone 7': 450, 'iphone 7 plus': 580, 'iphone 8': 580, 'iphone 8 plus': 750,
        'iphone se 2020': 680, 'iphone se 2022': 1050,
        'iphone x': 800, 'iphone xr': 900, 'iphone xs': 950, 'iphone xs max': 1100,
        'iphone 11': 1250, 'iphone 11 pro': 1550, 'iphone 11 pro max': 1750,
        'iphone 12 mini': 1050, 'iphone 12': 1350, 'iphone 12 pro': 1700, 'iphone 12 pro max': 2100,
        'iphone 13 mini': 1400, 'iphone 13': 1890, 'iphone 13 pro': 2390, 'iphone 13 pro max': 2800,
        'iphone 14': 2450, 'iphone 14 plus': 2700, 'iphone 14 pro': 3200, 'iphone 14 pro max': 3800,
        'iphone 15': 3300, 'iphone 15 plus': 3650, 'iphone 15 pro': 4300, 'iphone 15 pro max': 5000,
        'iphone 16': 4700, 'iphone 16 plus': 5200, 'iphone 16 pro': 5900, 'iphone 16 pro max': 6800,
        'samsung a04': 420, 'samsung a05': 500, 'samsung a10': 350, 'samsung a10s': 360,
        'samsung a12': 480, 'samsung a13': 550, 'samsung a14': 650, 'samsung a15': 780,
        'samsung a20': 400, 'samsung a21s': 480, 'samsung a22': 550, 'samsung a23': 650, 'samsung a24': 750, 'samsung a25': 900,
        'samsung a30': 420, 'samsung a31': 500, 'samsung a32': 580, 'samsung a33': 700, 'samsung a34': 880, 'samsung a35': 1050,
        'samsung a50': 480, 'samsung a51': 580, 'samsung a52': 700, 'samsung a53': 850, 'samsung a54': 1100, 'samsung a55': 1350,
        'samsung s20 fe': 850, 'samsung s21': 1150, 'samsung s21 fe': 1000, 'samsung s21 ultra': 1650,
        'samsung s22': 1500, 'samsung s22 ultra': 2200, 'samsung s23': 2100, 'samsung s23 fe': 1650, 'samsung s23 ultra': 3100,
        'samsung s24': 2700, 'samsung s24 ultra': 4100,
        'redmi 9': 400, 'redmi 9a': 320, 'redmi 9c': 350, 'redmi 10': 480, 'redmi 10c': 450,
        'redmi 12': 650, 'redmi 12c': 520, 'redmi 13': 780, 'redmi 13c': 650, 'redmi 15c': 950, 'redmi 15': 1150,
        'redmi note 8': 420, 'redmi note 9': 480, 'redmi note 10': 580, 'redmi note 10s': 620,
        'redmi note 11': 680, 'redmi note 11s': 720, 'redmi note 12': 780, 'redmi note 12 pro': 980,
        'redmi note 13': 920, 'redmi note 13 pro': 1200,
        'poco c55': 500, 'poco c65': 620, 'poco m5': 550, 'poco x4 pro': 800, 'poco x5': 880, 'poco x5 pro': 1050, 'poco x6': 1150, 'poco x6 pro': 1450,
        'moto e7': 280, 'moto e13': 380, 'moto e22': 440,
        'moto g8': 350, 'moto g9 play': 380, 'moto g10': 420, 'moto g20': 460, 'moto g22': 520, 'moto g23': 600, 'moto g24': 680,
        'moto g30': 480, 'moto g31': 520, 'moto g32': 580, 'moto g34': 680, 'moto g52': 650, 'moto g53': 720, 'moto g54': 820, 'moto g84': 1050,
        'realme c11': 350, 'realme c35': 520, 'realme c53': 650, 'realme c55': 720, 'realme c67': 820, 'realme c73': 980,
        'realme 60x': 680, 'realme note 50': 550, 'realme note 70': 780,
        'infinix smart 8': 450, 'infinix hot 30': 580, 'infinix note 30': 780
    },

    init() {
        this.carregarPrecos();
    },

    carregarPrecos() {
        try { localStorage.removeItem('strategyos_precos'); } catch (e) {}
    },

    fatorCaptacaoBase(precoVitrine) {
        if (precoVitrine <= 500) return 0.50;
        if (precoVitrine <= 1200) return 0.55;
        if (precoVitrine <= 2500) return 0.58;
        return 0.62;
    },

    normalizarModelo(raw) {
        if (!raw) return { baseKey: '', gb: 128, teveGbExplicito: false };
        const str = String(raw).toLowerCase().trim();
        let gb = 128;
        let teveGbExplicito = false;
        const gbMatch = str.match(/\b(32|64|128|256|512|1024)\s*(gb)?\b/i) || (str.includes('1tb') ? [null, '1024'] : null);
        if (gbMatch) {
            gb = parseInt(gbMatch[1], 10);
            teveGbExplicito = true;
        }
        const limpo = str
            .replace(/\b(32|64|128|256|512|1024)\s*(gb)?\b/gi, '')
            .replace(/\b1\s*tb\b/gi, '')
            .replace(/\b(preto|branco|azul|verde|roxo|rosa|dourado|grafite|estelar|meia-noite|vermelho|amarelo|titânio|titanio|natural|prata|cinza)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        return { baseKey: limpo, gb, teveGbExplicito };
    },

    ajusteMemoriaPct(modeloKey, gb) {
        if (gb >= 512) return 0.10;
        if (gb === 256) return 0.06;
        if (gb === 64 && modeloKey.includes('iphone')) return -0.06;
        if (gb === 32) return -0.10;
        return 0;
    },

    // Tetos diretos calibrados (-R$ 300 aplicado do iPhone 12 ao 15 conforme diretriz da loja)
    tetosCaptacaoDiretos: {
        'iphone 12 mini': 480, 'iphone 12': 660, 'iphone 12 pro': 860, 'iphone 12 pro max': 1090,
        'iphone 13 mini': 690, 'iphone 13': 970, 'iphone 13 pro': 1370, 'iphone 13 pro max': 1620,
        'iphone 14': 1410, 'iphone 14 plus': 1560, 'iphone 14 pro': 1870, 'iphone 14 pro max': 2240,
        'iphone 15': 1930, 'iphone 15 plus': 2150, 'iphone 15 pro': 2550, 'iphone 15 pro max': 2990
    },

    buscarAvaliacaoBase(modeloInput) {
        const { baseKey, gb, teveGbExplicito } = this.normalizarModelo(modeloInput);
        if (!baseKey) return null;

        const estoque = (window.dataManager && typeof dataManager.getEstoqueCelulares === 'function')
            ? dataManager.getEstoqueCelulares() : [];
        const chavesOrdenadas = Object.keys(this.precosVitrineSeminovo).sort((a, b) => b.length - a.length);

        let matchKey = null;
        let precoVitrine = 0;
        let fonte = 'tabela_loja';

        for (const k of chavesOrdenadas) {
            if (baseKey === k || baseKey.includes(k)) {
                matchKey = k;
                precoVitrine = this.precosVitrineSeminovo[k];
                break;
            }
        }

        if (!matchKey && window.dataManager && dataManager.data && dataManager.data.precosReferenciaUsados) {
            const refTab = dataManager.data.precosReferenciaUsados;
            const refKeys = Object.keys(refTab).sort((a, b) => b.length - a.length);
            for (const rk of refKeys) {
                if (baseKey === rk || baseKey.includes(rk)) {
                    matchKey = rk;
                    const valRef = refTab[rk];
                    precoVitrine = valRef < 1000 ? Math.round(valRef * 1.25) : Math.round(valRef * 1.20);
                    fonte = 'referencia_sistema';
                    break;
                }
            }
        }

        const itemEstoque = estoque.find(p => {
            const n = this.normalizarModelo(p.nome).baseKey;
            return n && (n === baseKey || (matchKey && n === matchKey));
        });
        if (!matchKey && itemEstoque && itemEstoque.precoVenda > 0) {
            precoVitrine = Math.round(itemEstoque.precoVenda);
            fonte = 'estoque_atual';
        }

        if (!precoVitrine) return null;

        const multGb = 1 + this.ajusteMemoriaPct(matchKey || baseKey, gb);
        precoVitrine = Math.round((precoVitrine * multGb) / 10) * 10;

        const fator = this.fatorCaptacaoBase(precoVitrine);
        const tetoDireto = matchKey && this.tetosCaptacaoDiretos[matchKey]
            ? Math.round((this.tetosCaptacaoDiretos[matchKey] * multGb) / 10) * 10
            : null;
        let precoCaptacao = tetoDireto || (Math.round((precoVitrine * fator) / 10) * 10);

        if (!tetoDireto && itemEstoque && itemEstoque.custo > 300) {
            const tetoAtacado = Math.round((itemEstoque.custo * 0.85) / 10) * 10;
            if (precoCaptacao > tetoAtacado) precoCaptacao = tetoAtacado;
        }

        const modeloKey = matchKey || baseKey;
        return {
            encontrado: true,
            key: modeloKey,
            modeloKey,
            gb,
            capacidadeLabel: teveGbExplicito ? `${gb}GB` : '',
            preco: precoVitrine,
            precoVitrine,
            precoCaptacao,
            fatorCaptacao: fator,
            fatorCaptacaoPct: Math.round(fator * 100),
            fonte,
            data: '2026'
        };
    },

    buscarPreco(modelo) { return this.buscarAvaliacaoBase(modelo); },
    salvarPreco() { this.carregarPrecos(); },
    isIphone(modelo) { return String(modelo || '').toLowerCase().includes('iphone'); },
    temFaceId(modelo) {
        const m = String(modelo || '').toLowerCase();
        return m.includes('iphone') && !['iphone 5', 'iphone 6', 'iphone 7', 'iphone 8', 'iphone se'].some(s => m.includes(s));
    },

    estimarReparo(modelo, defeito) {
        const { baseKey } = this.normalizarModelo(modelo);
        const tabModelo = (window.dataManager && dataManager.data && dataManager.data.tabelaServicosModelo) || {};
        const chaves = Object.keys(tabModelo).sort((a, b) => b.length - a.length);
        let srv = null;
        for (const k of chaves) {
            if (baseKey === k || baseKey.includes(k)) { srv = tabModelo[k]; break; }
        }
        const d = String(defeito || '').toLowerCase();
        if (d.includes('tela')) {
            if (srv && srv.tela && srv.tela.p) return srv.tela.p + 50;
            if (baseKey.includes('iphone 14') || baseKey.includes('iphone 15')) return 450;
            if (baseKey.includes('iphone 13')) return 350;
            if (baseKey.includes('iphone 12')) return 280;
            if (baseKey.includes('iphone 11') || baseKey.includes('iphone xr')) return 190;
            return 150;
        }
        if (d.includes('bateria') || d.includes('bat_')) {
            if (srv && srv.bateria && srv.bateria.p) return srv.bateria.p + 35;
            return baseKey.includes('iphone') ? 120 : 85;
        }
        if (d.includes('camera')) {
            if (srv && srv.camera && srv.camera.p) return srv.camera.p + 40;
            return baseKey.includes('iphone') ? 210 : 120;
        }
        if (d.includes('carga') || d.includes('conector')) {
            if (srv && srv.conector && srv.conector.p) return srv.conector.p + 35;
            return baseKey.includes('iphone') ? 110 : 75;
        }
        if (d.includes('carcaca') || d.includes('traseira')) return baseKey.includes('iphone') ? 190 : 110;
        if (d.includes('audio') || d.includes('microfone') || d.includes('alto_falante')) return 95;
        if (d.includes('botoes') || d.includes('botao')) return 90;
        if (d.includes('faceid') || d.includes('face_id')) return 280;
        return 100;
    },

    descBateria(saude) { return saude >= 90 ? 0 : saude >= 80 ? 5 : saude >= 70 ? 12 : 18; },
    descMarcas: { nenhuma: 0, leves: 6, medias: 14, graves: 24 },
    descAcessorios: { completo: 0, carregador: 2, caixa: 3, nada: 5 },
    descDefeitos: {
        tela_trincada: 18, tela_trincada_leve: 15, tela_trincada_grave: 25, tela_manchada: 30,
        face_id: 22, touch_id: 12, camera_embacada: 10, camera_quebrada: 18,
        botoes_travados: 8, nao_liga: 50, nao_pega_chip: 35,
        alto_falante: 8, microfone: 8, bateria_viciada: 12, bat_70_79: 12, carcaca_danificada: 14
    },
    descPecasTrocadas: { tela: 8, bateria: 4, camera: 6 },
    nomeDefeito: {
        tela_trincada: 'Tela trincada', tela_trincada_leve: 'Tela trincada (leve)', tela_trincada_grave: 'Tela trincada (grave)',
        tela_manchada: 'Tela manchada/queimada', face_id: 'Face ID inativo',
        touch_id: 'Biometria inativa', camera_embacada: 'Câmera embaçada',
        camera_quebrada: 'Câmera quebrada', botoes_travados: 'Botões travados',
        nao_liga: 'Não liga', nao_pega_chip: 'Sem sinal/chip',
        alto_falante: 'Alto-falante ruim', microfone: 'Microfone ruim',
        bateria_viciada: 'Bateria manutenção (<80%)', bat_70_79: 'Bateria <80%', carcaca_danificada: 'Carcaça/Traseira trincada'
    },

    validarDefeitos(defeitos) {
        const d = [...(defeitos || [])];
        if (d.includes('tela_trincada_grave') && d.includes('tela_trincada_leve')) d.splice(d.indexOf('tela_trincada_leve'), 1);
        if (d.includes('tela_manchada') && d.includes('tela_trincada_leve')) d.splice(d.indexOf('tela_trincada_leve'), 1);
        return d;
    },

    contarTrocasModelo(modelo) {
        const h = window.dataManager ? dataManager.getHistorico() : {};
        const agora = new Date();
        return (h.movimentacoes || []).filter(m =>
            m.tipo === 'troca' && m.modeloUsado &&
            m.modeloUsado.toLowerCase().includes(String(modelo || '').toLowerCase()) &&
            (agora - new Date(m.data)) < 30 * 24 * 60 * 60 * 1000
        ).length;
    },

    calcular(dadosOuModelo, defeitosArg, precoNovoArg, custoNovoArg) {
        const dados = typeof dadosOuModelo === 'object' && dadosOuModelo !== null
            ? dadosOuModelo
            : { modelo: dadosOuModelo, defeitos: defeitosArg || [], precoNovo: precoNovoArg, custoNovo: custoNovoArg };
        const { modelo, bateriaSaude = 85, marcasUso = 'leves', acessorios = 'nada', defeitos = [], pecasTrocadas = [], precoRef } = dados;
        const avBase = this.buscarAvaliacaoBase(modelo);
        const precoVitrine = precoRef && precoRef > 0 ? precoRef : (avBase ? avBase.precoVitrine : 1200);
        const baseCaptacao = avBase && (!precoRef || precoRef === avBase.precoVitrine)
            ? avBase.precoCaptacao
            : Math.round((precoVitrine * this.fatorCaptacaoBase(precoVitrine)) / 10) * 10;

        const defeitosValidados = this.validarDefeitos(defeitos);
        let desvTotal = 0;
        const detalhes = [];

        const dBat = this.descBateria(bateriaSaude);
        const custoBat = bateriaSaude < 80 ? this.estimarReparo(modelo, 'bateria') : 0;
        desvTotal += dBat;
        detalhes.push({ item: `Bateria ${bateriaSaude}%`, desc: dBat, valor: Math.round(baseCaptacao * dBat / 100) + custoBat, reparo: custoBat });

        const dM = this.descMarcas[marcasUso] || 0;
        desvTotal += dM;
        detalhes.push({ item: `Estética: ${marcasUso}`, desc: dM, valor: Math.round(baseCaptacao * dM / 100) });

        const dA = this.descAcessorios[acessorios] || 0;
        desvTotal += dA;
        detalhes.push({ item: `Acessórios: ${acessorios}`, desc: dA, valor: Math.round(baseCaptacao * dA / 100) });

        const reparosDetalhes = [];
        let custoReparo = custoBat;
        defeitosValidados.forEach(d => {
            const desc = this.descDefeitos[d] || 0;
            desvTotal += desc;
            const custo = this.estimarReparo(modelo, d);
            custoReparo += custo;
            reparosDetalhes.push({ defeito: d, nome: this.nomeDefeito[d] || d, desc, custo, obs: d === 'face_id' ? 'Desvalorização severa' : '' });
            detalhes.push({ item: this.nomeDefeito[d] || d, desc, valor: custo, reparo: custo, obs: d === 'face_id' ? 'SEM REPARO' : '' });
        });

        pecasTrocadas.forEach(p => {
            const desc = this.descPecasTrocadas[p] || 0;
            desvTotal += desc;
            detalhes.push({ item: `Peça paralela: ${p}`, desc, valor: Math.round(baseCaptacao * desc / 100) });
        });

        desvTotal = Math.min(85, desvTotal);
        const descEsteticoReais = Math.round(baseCaptacao * ((dBat + dM + dA) / 100));
        const valorJusto = Math.max(50, Math.round((baseCaptacao - descEsteticoReais - custoReparo) / 10) * 10);

        return {
            modelo, precoRef: precoVitrine, baseCaptacao, desvTotal, detalhes,
            valorJusto, custoReparo, custoReparoPecas: custoReparo, reparosDetalhes,
            revendaSemReparo: Math.max(valorJusto + 150, Math.round(precoVitrine * 0.72)),
            revendaReparado: precoVitrine,
            tempoReparo: custoReparo > 0 ? 3 : 0,
            tempoVendaSemReparo: 20, tempoVendaReparado: 12
        };
    },

    analisarTroca(analise, custoNovo, precoNovo, desconto) {
        const precoFinal = precoNovo - desconto;
        const margemNovo = precoFinal - custoNovo;
        const margemNovoPct = custoNovo > 0 ? (margemNovo / custoNovo * 100) : 0;
        const prejuizoNovo = margemNovo < 0;
        const lucroUsadoA = Math.max(0, analise.revendaSemReparo - analise.valorJusto);
        const lucroTotalA = margemNovo + lucroUsadoA;
        const lucroUsadoB = Math.max(0, analise.revendaReparado - analise.valorJusto - analise.custoReparo);
        const lucroTotalB = margemNovo + lucroUsadoB;
        const cenarioMelhor = lucroTotalB >= lucroTotalA ? 'B' : 'A';
        const melhorLucro = Math.max(lucroTotalA, lucroTotalB);
        const melhorLucroUsado = Math.max(lucroUsadoA, lucroUsadoB);
        const recomendacao = melhorLucro < 200 ? 'recusar' : melhorLucro < 400 ? 'cautela' : 'aceitar';
        const motivo = recomendacao === 'recusar' ? 'Margem combinada muito baixa.' : recomendacao === 'cautela' ? 'Margem moderada; evite dar desconto extra.' : 'Excelente margem combinada para a loja!';
        const descontoMax = Math.max(0, Math.round(margemNovo * 0.35));
        const descontoOferta = Math.round(descontoMax * 0.5 / 10) * 10;
        const alertas = [];
        if (prejuizoNovo) alertas.push({ tipo: 'vermelho', msg: `⚠️ Prejuízo no aparelho da loja: ${UI.R(margemNovo)}` });
        if (analise.custoReparo > 0) alertas.push({ tipo: 'amarelo', msg: `🔧 Custo estimado de reparo na assistência: ${UI.R(analise.custoReparo)} (já descontado da oferta)` });

        return {
            precoFinal, margemNovo, margemNovoPct, desconto, prejuizoNovo,
            cenarioA: { lucroUsado: lucroUsadoA, lucroTotal: lucroTotalA, pct: custoNovo > 0 ? lucroTotalA / custoNovo * 100 : 0, revenda: analise.revendaSemReparo, tempo: analise.tempoVendaSemReparo },
            cenarioB: { lucroUsado: lucroUsadoB, lucroTotal: lucroTotalB, pct: custoNovo > 0 ? lucroTotalB / custoNovo * 100 : 0, revenda: analise.revendaReparado, custoReparo: analise.custoReparo, tempo: analise.tempoVendaReparado },
            recomendacao, cenarioMelhor, motivo, descontoMax, alertas, custoNovo, precoNovo,
            opcoes: {
                atual: { desconto, preco: precoFinal, lucro: melhorLucro },
                seguro: { desconto: descontoMax, preco: precoNovo - descontoMax, lucro: (precoNovo - descontoMax - custoNovo) + melhorLucroUsado },
                oferta: { desconto: descontoOferta, preco: precoNovo - descontoOferta, lucro: (precoNovo - descontoOferta - custoNovo) + melhorLucroUsado }
            }
        };
    }
};
window.TrocaEngine = TrocaEngine;
