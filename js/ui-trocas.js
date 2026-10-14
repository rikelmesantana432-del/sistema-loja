// ====================================
// STRATEGYOS 2.0 - AVALIADOR DE TROCAS v3
// Banco de preços + Inteligência contextual
// ====================================

const TrocaEngine = {
    // === BANCO DE PREÇOS INICIAIS ===
    precosIniciais: {
        'iphone 11 64gb': 2200, 'iphone 11 128gb': 2500,
        'iphone 12 64gb': 2600, 'iphone 12 128gb': 2900,
        'iphone 13 128gb': 3500, 'iphone 13 256gb': 3900,
        'iphone 14 128gb': 4500, 'iphone 8 64gb': 900,
        'iphone 8 plus 64gb': 1100, 'iphone x 64gb': 1500,
        'iphone xs 64gb': 1700, 'iphone xr 64gb': 1600,
        'samsung a54 128gb': 1600, 'samsung a54 256gb': 1800,
        'samsung a34 128gb': 1300, 'samsung a14 128gb': 900,
        'samsung a24 128gb': 1100, 'samsung s21 128gb': 2200,
        'samsung s22 128gb': 2800, 'samsung s23 128gb': 3400,
        'xiaomi redmi note 10': 900, 'xiaomi redmi note 11': 1100,
        'xiaomi redmi note 12': 1300, 'xiaomi redmi 9': 600,
        'xiaomi redmi 9a': 500, 'xiaomi poco x5': 1500,
        'xiaomi poco f5': 2000, 'motorola moto g10': 550,
        'motorola moto g20': 700, 'motorola moto g30': 800,
    },

    reparos: {
        'iphone_tela_8': 220, 'iphone_tela_x': 320, 'iphone_tela_11': 280,
        'iphone_tela_12': 400, 'iphone_tela_13': 550, 'iphone_tela_14': 600,
        'iphone_bateria': 120, 'iphone_camera': 200, 'iphone_botao': 150,
        'samsung_a_tela_basico': 150, 'samsung_a_tela_medio': 200,
        'samsung_a_tela_avancado': 280, 'samsung_a_bateria': 80,
        'samsung_s_tela_basico': 350, 'samsung_s_tela_avancado': 450,
        'samsung_s_tela_topo': 550, 'samsung_s_bateria': 100,
        'xiaomi_tela_basico': 130, 'xiaomi_tela_avancado': 250,
        'xiaomi_tela_poco': 150, 'xiaomi_bateria': 70,
        'generico_tela': 180, 'generico_bateria': 90, 'generico_camera': 150
    },

    descBateria(saude) {
        if (saude >= 90) return 0;
        if (saude >= 80) return 5;
        if (saude >= 70) return 10;
        if (saude >= 60) return 15;
        if (saude >= 50) return 20;
        return 25;
    },
    descMarcas: { nenhuma: 0, leves: 5, medias: 10, graves: 20 },
    descAcessorios: { completo: 0, carregador: 3, caixa: 4, nada: 8 },
    descDefeitos: {
        tela_trincada_leve: 15, tela_trincada_grave: 25, tela_manchada: 30,
        face_id: 15, touch_id: 10, camera_embacada: 10, camera_quebrada: 20,
        botoes_travados: 12, nao_liga: 40, nao_pega_chip: 30,
        alto_falante: 8, microfone: 8, bateria_viciada: 15, carcaca_danificada: 12
    },
    descPecasTrocadas: { tela: 10, bateria: 5, camera: 8 },
    nomeDefeito: {
        tela_trincada_leve: 'Tela trincada (leve)', tela_trincada_grave: 'Tela trincada (grave)',
        tela_manchada: 'Tela manchada/queimada', face_id: 'Face ID não funciona',
        touch_id: 'Touch ID não funciona', camera_embacada: 'Câmera embaçada',
        camera_quebrada: 'Câmera quebrada', botoes_travados: 'Botões travados',
        nao_liga: 'Não liga', nao_pega_chip: 'Não pega chip/sinal',
        alto_falante: 'Alto-falante', microfone: 'Microfone',
        bateria_viciada: 'Bateria viciada', carcaca_danificada: 'Carcaça danificada'
    },

    // Detectar se é iPhone e qual geração
    isIphone(modelo) { return modelo.toLowerCase().includes('iphone'); },
    temFaceId(modelo) {
        const m = modelo.toLowerCase();
        if (!m.includes('iphone')) return false;
        const semFaceId = ['iphone 5', 'iphone 6', 'iphone 7', 'iphone 8', 'iphone se'];
        return !semFaceId.some(s => m.includes(s));
    },
    isAndroid(modelo) {
        const m = modelo.toLowerCase();
        return m.includes('samsung') || m.includes('xiaomi') || m.includes('redmi') ||
            m.includes('poco') || m.includes('motorola') || m.includes('moto') ||
            m.includes('infinix') || m.includes('realme') || m.includes('lg');
    },

    // === MEMÓRIA DE PREÇOS ===
    salvarPreco(modelo, preco) {
        const mem = JSON.parse(localStorage.getItem('strategyos_precos') || '{}');
        mem[modelo.toLowerCase().trim()] = { preco, data: new Date().toISOString().split('T')[0] };
        localStorage.setItem('strategyos_precos', JSON.stringify(mem));
    },
    buscarPreco(modelo) {
        const key = modelo.toLowerCase().trim();
        // Primeiro buscar na memória do usuário
        const mem = JSON.parse(localStorage.getItem('strategyos_precos') || '{}');
        if (mem[key]) return mem[key];
        // Buscar no banco inicial
        if (this.precosIniciais[key]) return { preco: this.precosIniciais[key], data: '18/02/2026', fonte: 'banco' };
        // Buscar parcial
        for (const k in this.precosIniciais) {
            if (key.includes(k) || k.includes(key)) return { preco: this.precosIniciais[k], data: '18/02/2026', fonte: 'parcial' };
        }
        for (const k in mem) {
            if (key.includes(k) || k.includes(key)) return { ...mem[k], fonte: 'parcial' };
        }
        return null;
    },

    contarTrocasModelo(modelo) {
        const h = dataManager.getHistorico();
        const agora = new Date();
        return (h.movimentacoes || []).filter(m =>
            m.tipo === 'troca' && m.modeloUsado &&
            m.modeloUsado.toLowerCase().includes(modelo.toLowerCase()) &&
            (agora - new Date(m.data)) < 30 * 24 * 60 * 60 * 1000
        ).length;
    },

    estimarReparo(modelo, defeito) {
        const m = modelo.toLowerCase();
        const isIp = m.includes('iphone');
        const isSA = m.includes('samsung') && /a[1-7]/i.test(m);
        const isSS = m.includes('samsung') && /s[1-2]/i.test(m);
        const isXi = m.includes('xiaomi') || m.includes('redmi') || m.includes('poco');
        if (defeito.includes('tela')) {
            if (isIp) {
                if (m.includes('14')) return this.reparos.iphone_tela_14;
                if (m.includes('13')) return this.reparos.iphone_tela_13;
                if (m.includes('12')) return this.reparos.iphone_tela_12;
                if (m.includes('11')) return this.reparos.iphone_tela_11;
                if (m.includes('x') || m.includes('xs')) return this.reparos.iphone_tela_x;
                return this.reparos.iphone_tela_8;
            }
            if (isSA) return this.reparos.samsung_a_tela_medio;
            if (isSS) return this.reparos.samsung_s_tela_avancado;
            if (isXi) return m.includes('poco') ? this.reparos.xiaomi_tela_poco : this.reparos.xiaomi_tela_basico;
            return this.reparos.generico_tela;
        }
        if (defeito.includes('bateria') || defeito === 'bateria_viciada') {
            if (isIp) return this.reparos.iphone_bateria;
            if (isSA) return this.reparos.samsung_a_bateria;
            if (isSS) return this.reparos.samsung_s_bateria;
            if (isXi) return this.reparos.xiaomi_bateria;
            return this.reparos.generico_bateria;
        }
        if (defeito === 'camera_embacada') return 80;
        if (defeito.includes('camera')) { return isIp ? this.reparos.iphone_camera : this.reparos.generico_camera; }
        if (defeito === 'botoes_travados' && isIp) return this.reparos.iphone_botao;
        if (defeito === 'face_id' || defeito === 'nao_liga') return 0;
        return 100;
    },

    // Validar defeitos (tela trincada + manchada = só o pior)
    validarDefeitos(defeitos) {
        const d = [...defeitos];
        if (d.includes('tela_trincada_grave') && d.includes('tela_trincada_leve')) {
            d.splice(d.indexOf('tela_trincada_leve'), 1);
        }
        if (d.includes('tela_manchada') && d.includes('tela_trincada_leve')) {
            d.splice(d.indexOf('tela_trincada_leve'), 1);
        }
        return d;
    },

    calcular(dados) {
        const { modelo, bateriaSaude, marcasUso, acessorios, defeitos, pecasTrocadas, precoRef } = dados;
        const defeitosValidados = this.validarDefeitos(defeitos);
        let desvTotal = 0;
        const detalhes = [];
        const dBat = this.descBateria(bateriaSaude);
        desvTotal += dBat;
        detalhes.push({ item: `Bateria ${bateriaSaude}%`, desc: dBat, valor: precoRef * dBat / 100 });
        const dM = this.descMarcas[marcasUso] || 0;
        desvTotal += dM;
        detalhes.push({ item: `Marcas: ${marcasUso}`, desc: dM, valor: precoRef * dM / 100 });
        const dA = this.descAcessorios[acessorios] || 0;
        desvTotal += dA;
        const nAc = { completo: 'Completo', carregador: 'Só carregador', caixa: 'Só caixa', nada: 'Sem caixa/carregador' };
        detalhes.push({ item: nAc[acessorios] || acessorios, desc: dA, valor: precoRef * dA / 100 });

        const reparosDetalhes = [];
        let custoReparo = 0;
        defeitosValidados.forEach(d => {
            const desc = this.descDefeitos[d] || 0;
            desvTotal += desc;
            const custo = this.estimarReparo(modelo, d);
            custoReparo += custo;
            reparosDetalhes.push({ defeito: d, nome: this.nomeDefeito[d] || d, desc, custo, obs: d === 'face_id' ? 'SEM REPARO viável' : '' });
            detalhes.push({ item: this.nomeDefeito[d] || d, desc, valor: precoRef * desc / 100, reparo: custo, obs: d === 'face_id' ? 'SEM REPARO' : '' });
        });
        pecasTrocadas.forEach(p => {
            const desc = this.descPecasTrocadas[p] || 0;
            desvTotal += desc;
            detalhes.push({ item: `Peça trocada: ${p}`, desc, valor: precoRef * desc / 100 });
        });

        desvTotal = Math.min(85, desvTotal);
        const valorJusto = Math.max(0, precoRef * (1 - desvTotal / 100));
        const tVenda = valorJusto < 500 ? 10 : valorJusto < 1000 ? 20 : 35;
        const tReparo = custoReparo > 300 ? 10 : custoReparo > 0 ? 5 : 0;
        this.salvarPreco(modelo, precoRef);

        return {
            modelo, precoRef, desvTotal, detalhes, valorJusto, custoReparo, reparosDetalhes,
            revendaSemReparo: valorJusto * 0.85,
            revendaReparado: precoRef * 0.95,
            tempoReparo: tReparo, tempoVendaSemReparo: Math.round(tVenda),
            tempoVendaReparado: Math.round(tReparo + tVenda * 0.7)
        };
    },

    analisarTroca(analise, custoNovo, precoNovo, desconto) {
        const precoFinal = precoNovo - desconto;
        const margemNovo = precoFinal - custoNovo;
        const margemNovoPct = custoNovo > 0 ? (margemNovo / custoNovo * 100) : 0;
        const prejuizoNovo = margemNovo < 0;
        const lucroUsadoA = analise.revendaSemReparo;
        const lucroTotalA = margemNovo + lucroUsadoA;
        const lucroUsadoB = analise.revendaReparado - analise.custoReparo;
        const lucroTotalB = margemNovo + lucroUsadoB;
        const cenarioMelhor = lucroTotalA >= lucroTotalB ? 'A' : 'B';
        const melhorLucro = Math.max(lucroTotalA, lucroTotalB);

        let recomendacao, motivo;
        if (melhorLucro < custoNovo * 0.15) {
            recomendacao = 'recusar'; motivo = 'Margem total muito baixa.';
        } else if (melhorLucro < custoNovo * 0.25) {
            recomendacao = 'cautela'; motivo = prejuizoNovo ? 'Lucro aceitável mas PREJUÍZO no produto novo. Reduza o desconto.' : 'Margem apertada.';
        } else {
            recomendacao = 'aceitar'; motivo = prejuizoNovo ? 'Boa margem total, mas cuidado: novo sai no prejuízo.' : 'Margem boa!';
        }

        const melhorLucroUsado = Math.max(lucroUsadoA, lucroUsadoB);
        const descontoMax = Math.max(0, (precoNovo - custoNovo) + melhorLucroUsado - (custoNovo * 0.30));
        const descontoOferta = Math.round(descontoMax * 0.5 / 10) * 10;

        const alertas = [];
        if (prejuizoNovo) alertas.push({ tipo: 'vermelho', msg: `⚠️ PREJUÍZO no produto novo: ${UI.R(margemNovo)}` });
        if (desconto > descontoMax) alertas.push({ tipo: 'amarelo', msg: `Desconto ${UI.R(desconto)} está ${UI.R(desconto - descontoMax)} acima do seguro` });
        if ((desconto / precoNovo * 100) > 30) alertas.push({ tipo: 'vermelho', msg: '🚨 Desconto > 30%!' });
        else if ((desconto / precoNovo * 100) > 20) alertas.push({ tipo: 'amarelo', msg: '⚠️ Desconto > 20%' });
        const trocasRep = this.contarTrocasModelo(analise.modelo);
        if (trocasRep >= 3) alertas.push({ tipo: 'amarelo', msg: `📊 ${trocasRep} trocas deste modelo em 30 dias` });

        return {
            precoFinal, margemNovo, margemNovoPct, desconto, prejuizoNovo,
            cenarioA: { lucroUsado: lucroUsadoA, lucroTotal: lucroTotalA, pct: custoNovo > 0 ? lucroTotalA / custoNovo * 100 : 0, revenda: analise.revendaSemReparo, tempo: analise.tempoVendaSemReparo },
            cenarioB: { lucroUsado: lucroUsadoB, lucroTotal: lucroTotalB, pct: custoNovo > 0 ? lucroTotalB / custoNovo * 100 : 0, revenda: analise.revendaReparado, custoReparo: analise.custoReparo, tempo: analise.tempoVendaReparado },
            recomendacao, cenarioMelhor, motivo, descontoMax, alertas, custoNovo, precoNovo,
            opcoes: {
                atual: { desconto, preco: precoFinal, lucro: cenarioMelhor === 'A' ? lucroTotalA : lucroTotalB },
                seguro: { desconto: Math.round(descontoMax), preco: precoNovo - Math.round(descontoMax), lucro: (precoNovo - Math.round(descontoMax) - custoNovo) + melhorLucroUsado },
                oferta: { desconto: descontoOferta, preco: precoNovo - descontoOferta, lucro: (precoNovo - descontoOferta - custoNovo) + melhorLucroUsado }
            }
        };
    }
};
