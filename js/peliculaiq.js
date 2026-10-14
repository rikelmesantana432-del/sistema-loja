// StrategyOS 7.7.0 — Módulo de Inteligência de Compatibilidade de Películas 3D & Cruzamento de Estoque
// Módulo preparado para integração futura com busca por IA e cruzamento de estoque ativo.

window.PeliculAIQ = {
    db: [],
    loaded: false,

    async init() {
        if (this.loaded) return;
        try {
            const response = await fetch('js/peliculas-compatibilidade-db.json');
            this.db = await response.json();
            this.loaded = true;
            console.log(`📱 PeliculAIQ carregado: ${this.db.length} modelos na base de dados (1.302 base + 52 expandidos pela IA).`);
        } catch (e) {
            console.error('Erro ao carregar banco de dados do PeliculAIQ:', e);
        }
    },

    // Algoritmo Oficial de Comparação de Telas (Proporção, Resolução, Polegadas, Densidade PPI e Área cm²)
    compararAparelhos(target, candidate) {
        if (!target || !candidate || target.model === candidate.model) {
            return { score: 0, percentage: 0, details: {} };
        }

        let maxPoints = 0;
        let earnedPoints = 0;
        const details = { screenSize: false, resolution: false, displayArea: false, aspectRatio: false, ppi: false };

        const targetRatio = target.display_ratio || '';
        const candidateRatio = candidate.display_ratio || '';

        // 1. Aspect Ratio (Peso 5)
        if (targetRatio && candidateRatio) {
            maxPoints += 5;
            if (targetRatio === candidateRatio) {
                earnedPoints += 5;
                details.aspectRatio = true;
            }
        }

        // 2. PPI / Densidade (Peso 4)
        const targetPPI = parseFloat(target.ppi);
        const candidatePPI = parseFloat(candidate.ppi);
        if (!isNaN(targetPPI) && !isNaN(candidatePPI)) {
            maxPoints += 4;
            const diffPPI = Math.abs(targetPPI - candidatePPI);
            if (diffPPI <= 5) {
                earnedPoints += 4;
                details.ppi = true;
            }
        }

        // 3. Tamanho da Tela em Polegadas (Peso 4)
        const targetSize = parseFloat((target.screen_size || '').replace(/['"]/g, ''));
        const candidateSize = parseFloat((candidate.screen_size || '').replace(/['"]/g, ''));
        if (!isNaN(targetSize) && !isNaN(candidateSize)) {
            maxPoints += 4;
            const diffSize = Math.abs(targetSize - candidateSize);
            if (diffSize <= 0.025) {
                earnedPoints += 4;
                details.screenSize = true;
            } else if (diffSize <= 0.05) {
                earnedPoints += 2;
                details.screenSize = 'partial';
            }
        }

        // 4. Resolução (Peso 3)
        const targetRes = (target.resolution || '').replace(/\s+/g, '');
        const candidateRes = (candidate.resolution || '').replace(/\s+/g, '');
        if (targetRes && candidateRes) {
            maxPoints += 3;
            if (targetRes === candidateRes) {
                earnedPoints += 3;
                details.resolution = true;
            }
        }

        // 5. Área de Tela cm² (Peso 2)
        const targetArea = parseFloat(target.display_area_cm2);
        const candidateArea = parseFloat(candidate.display_area_cm2);
        if (!isNaN(targetArea) && !isNaN(candidateArea)) {
            maxPoints += 2;
            const diffArea = Math.abs(targetArea - candidateArea);
            if (diffArea <= 0.5) {
                earnedPoints += 2;
                details.displayArea = true;
            } else if (diffArea <= 1.0) {
                earnedPoints += 1;
                details.displayArea = 'partial';
            }
        }

        if (maxPoints === 0) return { score: 0, percentage: 0, details };

        // Fator de Penalização se tamanho ou proporção forem incompatíveis
        if (!details.aspectRatio || !details.resolution) {
            if (details.ppi && details.screenSize === true) {
                earnedPoints *= 0.7;
            } else {
                earnedPoints *= 0.3;
            }
        }

        const percentage = Math.round((earnedPoints / maxPoints) * 100);
        return { score: Math.round((earnedPoints / maxPoints) * 4), percentage, details };
    },

    // Buscar Aparelho e Calcular Compatibilidades com Cruzamento de Estoque Ativo da Loja
    buscarCompatibilidades(nomeModel, minMatchPercent = 70) {
        if (!this.loaded || !this.db.length) return { sucesso: false, erro: 'Banco de Dados PeliculAIQ ainda não carregado' };

        const buscaStr = (nomeModel || '').toLowerCase().trim();
        const alvo = this.db.find(p => p.model.toLowerCase() === buscaStr || p.model.toLowerCase().includes(buscaStr));

        if (!alvo) {
            return { sucesso: false, erro: `Aparelho "${nomeModel}" não encontrado no catálogo.` };
        }

        // Obter Estoque Atual de Películas Cadastradas no StrategyOS
        const estoqueAcessorios = typeof dataManager !== 'undefined' ? dataManager.getEstoqueAcessorios() : [];

        const compatíveis = [];

        this.db.forEach(candidato => {
            if (candidato.model === alvo.model) return;
            const comp = this.compararAparelhos(alvo, candidato);
            if (comp.percentage >= minMatchPercent) {
                
                // Cruzamento com Estoque Ativo da Loja
                const emEstoque = estoqueAcessorios.filter(item => {
                    const nomeItem = (item.nome || '').toLowerCase();
                    const modCand = candidato.model.toLowerCase();
                    return (nomeItem.includes('película') || nomeItem.includes('pelicula') || item.tipo === 'pelicula') &&
                           (nomeItem.includes(modCand) || modCand.includes(nomeItem.replace('película', '').replace('3d', '').trim()));
                });

                const totalQtdEstoque = emEstoque.reduce((s, i) => s + (i.quantidade || 1), 0);

                compatíveis.push({
                    modelo: candidato.model,
                    marca: candidato.brand,
                    percentualCompatibilidade: comp.percentage,
                    origemBase: candidato.source || 'InfinitoConteudo_Base',
                    detalhes: comp.details,
                    estoqueLoja: {
                        disponivel: totalQtdEstoque > 0,
                        quantidade: totalQtdEstoque,
                        itensEstoque: emEstoque.map(e => ({ id: e.id, nome: e.nome, quantidade: e.quantidade, precoVenda: e.precoVenda }))
                    }
                });
            }
        });

        // Ordenar do maior % de compatibilidade para o menor
        compatíveis.sort((a, b) => b.percentualCompatibilidade - a.percentualCompatibilidade);

        return {
            sucesso: true,
            aparelhoAlvo: {
                modelo: alvo.model,
                marca: alvo.brand,
                tela: alvo.screen_size,
                resolucao: alvo.resolution,
                origemBase: alvo.source || 'InfinitoConteudo_Base'
            },
            totalCompativeisEncontrados: compatíveis.length,
            compativeis: compatíveis
        };
    }
};

// Inicializar ao carregar
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => { window.PeliculAIQ.init(); });
}
