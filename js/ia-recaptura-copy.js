// StrategyOS 3.1 — Motor de Copy Humanizada em 2 Etapas (1ª Pós-Venda Conforto / 2ª Grupo VIP Black)
// Mantém linguagem natural e acolhedora sem citar strings técnicas internas (MAX_LINES <= 350).

const IARecapturaCopy = {
    LINK_GRUPO_PADRAO: 'https://chat.whatsapp.com/FcuY7wDt7u3F1LusMdlko9',

    limparTextoSeguro(raw) {
        return String(raw || '')
            .replace(/^(avulso|venda avulsa):\s*/gi, '')
            .replace(/\(\d+\s*itens?\)/gi, '')
            .replace(/ÃƒÂ£/g, 'ã').replace(/ÃƒÂ§/g, 'ç').replace(/ÃƒÂ©/g, 'é').replace(/ÃƒÂ¡/g, 'á')
            .replace(/Ã£/g, 'ã').replace(/Ã§/g, 'ç').replace(/Ã©/g, 'é').replace(/Ã¡/g, 'á')
            .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã­/g, 'í').replace(/Ãª/g, 'ê').replace(/Ã´/g, 'ô')
            .replace(/(?:Ã°Å¸|ðŸ|âœ|œÂ|Å¸|â€œ|Â±|Â°)[^\s]*/g, '')
            .replace(/[^a-zA-Z0-9À-ÿ\s+\-/.]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    extrairModeloLegivel(cli, normFn) {
        const fontes = [...(cli.osList || []).map(o => o.modelo), ...(cli.compras || []).map(c => c.produto)];
        for (const f of fontes.slice().reverse()) {
            const limpo = this.limparTextoSeguro(f)
                .replace(/\b(aparelho celular do|aparelho celular|celular|combo do|pelicula 3d|pelicula|capinha e o cabo do|capinha do|capinha|capa do|capa|trocar tela|troca de tela|diagnostico|manutencao|conserto|concerto|conector|bateria|limpeza|avaliacao|revisao|solda|botao)\b/gi, '')
                .trim();
            const n = normFn(limpo);
            if (limpo.length >= 4 && !/^(item|itens|venda|avulso|varios|diversos)$/i.test(n)) {
                return limpo.length > 26 ? limpo.slice(0, 26).trim() : limpo;
            }
        }
        return '';
    },

    fraseFormaCompra(cli) {
        if (cli.formaCompra === 'troca') return 'com a troca facilitada que fizemos aqui na loja';
        if (cli.formaCompra === 'combinado') return 'com a forma combinada de pagamento que fechamos juntos';
        if (cli.formaCompra === 'entrada') return 'com a condição de entrada facilitada que organizamos na loja';
        if (cli.formaCompra === 'orcamento') return 'com a avaliação que fizemos com você no balcão';
        return 'com a forma como você comprou e foi atendido(a) na loja';
    },

    gerarPrimeiraMsg(cli, idx, seg, normFn) {
        const nomeSp = cli.primeiroNome ? ` *${cli.primeiroNome}*` : '';
        const forma = this.fraseFormaCompra(cli);
        const mod = this.extrairModeloLegivel(cli, normFn);

        if (seg.categoria === 'os_pronta' && seg.osPronta) {
            const m = this.limparTextoSeguro(seg.osPronta.modelo || 'aparelho').toUpperCase() || 'APARELHO';
            return `Olá${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando pra tranquilizar você sobre o seu *${m}*: finalizamos os últimos testes com todo cuidado aqui na bancada e ele já tá pronto e revisado. Consegue passar hoje pra retirar com calma?`;
        }

        if (seg.ehOrcamentoPendente) {
            if (seg.subPerfil === 'orcamento_troca') {
                const alvo = this.limparTextoSeguro(seg.orcamentoDetalhe || 'seu novo aparelho');
                return `Oi${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Lembrei da simulação que fizemos juntos (${alvo}) e passei só pra saber se você já conseguiu resolver ou se quer que eu veja uma forma ainda mais confortável pra você fechar tranquilo(a) com a gente.`;
            }
            const ref = mod ? `do seu *${mod}*` : 'do seu aparelho';
            return `Oi${nomeSp}, tudo tranquilo? 😊 Aqui é da *Cesinha Acessórios*! Lembrei do orçamento que fizemos aqui na bancada ${ref} e passei só pra saber como ele tá hoje — se ainda precisar resolver sem aperto, a nossa equipe continua à disposição!`;
        }

        if (seg.categoria === 'celular') {
            const refCel = mod ? `*${mod}*` : 'seu celular';
            const opcoes = [
                `Oi${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando no pós-venda pra saber como você tá se sentindo com o ${refCel} aí no dia a dia — ficou tudo 100% ${forma}? Qualquer dúvida de uso ou ajuste, nossa equipe tá sempre por aqui!`,
                `Olá${nomeSp}, tudo joia por aí? 😊 Aqui é da *Cesinha Acessórios*! Lembrei de passar só pra confirmar se o ${refCel} que você garantiu aqui na loja tá te atendendo bem e se ficou confortável ${forma}. Precisando de qualquer suporte, é só chamar!`,
                `Oi${nomeSp}, tudo tranquilo? Aqui é da equipe da *Cesinha Acessórios*! Como você fechou o ${refCel} com a gente, queremos ter certeza de que tá curtindo o aparelho e ficou satisfeito(a) ${forma}. Tá tudo certinho com ele?`
            ];
            return opcoes[idx % opcoes.length];
        }

        if (seg.categoria === 'assistencia') {
            const txtOs = normFn(cli.ultimoResumo || '');
            if (txtOs.includes('conector') || txtOs.includes('carga')) {
                return `Oi${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando aqui no pós-atendimento pra saber como o seu celular tá carregando depois do serviço no conector lá na bancada — ficou firme e você ficou confortável ${forma}?`;
            }
            if (txtOs.includes('tela') || txtOs.includes('display')) {
                const refForma = cli.formaCompra === 'balcao' ? 'a forma do atendimento' : forma.replace(/^com /, '');
                return `Olá${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando pra conferir como ficou o aparelho depois da troca de tela aqui na loja — o toque, a imagem e ${refForma} deixaram você tranquilo(a) no uso?`;
            }
            return `Oi${nomeSp}, tudo joia? 😊 Aqui é da *Cesinha Acessórios*! Passando aqui no pós-venda pra saber se o seu celular segue funcionando 100% depois do serviço na nossa bancada e se você ficou bem atendido(a) aqui na loja!`;
        }

        if (seg.categoria === 'fogos') {
            return `Oi${nomeSp}, tudo bem com você? 😊 Aqui é da *Cesinha Acessórios*! Passando rapidinho pra agradecer pela confiança na compra dos seus fogos aqui com a gente e saber se deu tudo certinho na hora de usar — você ficou satisfeito(a) com o atendimento e com a forma da compra na loja?`;
        }

        if (seg.categoria === 'acessorio') {
            const txtAc = normFn((cli.compras || []).map(c => c.produto).join(' '));
            const soPelicula = txtAc.includes('pelicula') && !/(capa|capinha|cabo|combo|fone|carregador|smartwatch|caixa)/i.test(txtAc);
            if (soPelicula) {
                return `Oi${nomeSp}, tudo bem? 😊 Aqui é da *Cesinha Acessórios*! Passando no pós-venda pra saber se a aplicação da película no seu aparelho ficou bem assentada e confortável no dia a dia — foi tudo tranquilo no atendimento aqui na loja?`;
            }
            const opcoesAc = [
                `Oi${nomeSp}, tudo bem com você? 😊 Aqui é da *Cesinha Acessórios*! Passando aqui rapidinho pra saber se os itens que você levou com a gente te atenderam bem e se você ficou confortável ${forma} aqui na loja!`,
                `Olá${nomeSp}, tudo joia? 😊 Aqui é da equipe da *Cesinha Acessórios*! Pra gente é importante saber como foi depois da compra: deu tudo certo com o acessório que você escolheu aqui e com o atendimento no balcão?`,
                `Opa${nomeSp}, tudo tranquilo por aí? 😊 Aqui é da *Cesinha Acessórios*! Passando pra conferir se o que você garantiu aqui na loja tá te servindo direitinho e se foi tudo leve ${forma}. Se precisar de qualquer ajuda, pode contar com a gente!`
            ];
            return opcoesAc[idx % opcoesAc.length];
        }

        return `Oi${nomeSp}, tudo joia por aí? 😊 Aqui é da *Cesinha Acessórios*! Passando só pra saber como foi sua experiência na última vez que esteve aqui na loja e se você ou o seu celular estão precisando de algum cuidado especial hoje!`;
    },

    gerarSegundaMsgGrupo(cli, seg, linkCustom) {
        const link = linkCustom || this.LINK_GRUPO_PADRAO;
        const nomeSp = cli.primeiroNome ? ` *${cli.primeiroNome}*` : '';

        if (seg.categoria === 'os_pronta' && seg.osPronta) {
            const mod = this.limparTextoSeguro(seg.osPronta.modelo || 'aparelho').toUpperCase() || 'APARELHO';
            return `Combinado${nomeSp}! Já deixamos o seu *${mod}* bem separado aqui pra você. 🙌\n\nInclusive, como cliente da casa, quero te convidar pro nosso *Grupo VIP da Cesinha Acessórios* no WhatsApp: lá a gente solta primeiro os cupons da *Black Cesinha* (como Película Hidrogel Fosca/Blindagem especial na retirada + Urna Premiada na loja), sem spam nenhum.\n\n👇 Só entrar aqui quando quiser: ${link}`;
        }

        if (seg.subPerfil === 'iphone') {
            return `Que bom saber disso${nomeSp}, ficamos muito felizes que deu tudo certo! 🙌\n\nAproveitando que você já confia no nosso trabalho, quero te colocar por dentro do nosso *Grupo VIP da Cesinha Acessórios*! Por lá a gente tá liberando primeiro pro pessoal da casa as vantagens da *Black Cesinha* — inclusive supervalorização de usado na troca (até *R$ 160 OFF à vista* no *iPhone 13 Pro R$ 2.537,90*, *iPhone 13 R$ 2.037,90* e *iPhone 11 Pro Max R$ 1.747,90*) e Capa Magsafe a *R$ 19,90* levando película Hidrogel.\n\n👇 É grupo calmo só de ofertas reais, entra aqui: ${link}`;
        }

        if (seg.categoria === 'assistencia' || seg.ehOrcamentoPendente) {
            return `Muito bom saber disso${nomeSp}! 🙌 Qualquer cuidado com seu aparelho, a nossa bancada tá sempre pronta.\n\nE olha: criamos um *Grupo VIP da Cesinha Acessórios* exclusivo pros clientes da loja receberem em primeira mão os cupons da *Black Cesinha* (tem *Cupom de R$ 20 OFF* na assistência, teste grátis de conector/fonte, troca facilitada em Xiaomi/Realme com até *R$ 100 OFF* e Urna Premiada no balcão).\n\n👇 Entra aqui no Grupo VIP (zero bagunça): ${link}`;
        }

        if (seg.categoria === 'fogos') {
            return `Show demais${nomeSp}, ficamos felizes que deu tudo certo! 🙌\n\nJá que você é cliente nosso, queria te convidar pro *Grupo VIP da Cesinha Acessórios* aqui no WhatsApp: por lá soltamos primeiro as promoções da *Black Cesinha* (Caixa de Som Basike, Fone Air Max *R$ 119,90*, Smartwatch S9 Ultra *R$ 159,90*, celulares e novidades de Fogos) antes de postar aberto.\n\n👇 Entra aqui no grupo quando quiser acompanhar: ${link}`;
        }

        return `Que notícia ótima saber disso${nomeSp}, é exatamente esse conforto que a gente busca entregar aqui na loja! 🙌\n\nInclusive, abrimos um *Grupo VIP da Cesinha Acessórios* só pros clientes da casa receberem antes as ofertas fechadas da *Black Cesinha* — tá rolando Capa Magsafe *R$ 19,90* (na película Hidrogel), Armon Shield *R$ 59,90*, *Smartwatch S9 Ultra R$ 159,90*, *Fone Air Max R$ 119,90* e celulares com até *R$ 100 OFF* + Urna Premiada.\n\n👇 Grupo calmo sem spam, só entrar aqui: ${link}`;
    },

    montarPromptGemini(cli, etapa, msgBase, linkGrupo) {
        const nomeTxt = cli.primeiroNome || '(não citar nome)';
        const formaTxt = this.fraseFormaCompra(cli);
        if (etapa === 'quebra_gelo') {
            return `Você escreve mensagens humanas e acolhedoras de WhatsApp para a loja "Cesinha Acessórios" (Amargosa-BA).
Reescreva a 1ª mensagem de PÓS-VENDA abaixo deixando-a calorosa, pessoal e natural (máximo 2 a 3 frases curtas).
REGRAS OBRIGATÓRIAS:
- Foque EXCLUSIVAMENTE em confortar o cliente sobre a compra/serviço que fez (${cli.ultimoResumo || 'atendimento na loja'}) e ${formaTxt}.
- PROIBIDO colocar links, PROIBIDO mencionar "Grupo VIP", "Black Friday", "Black Cesinha", preços ou promoções nesta 1ª mensagem.
- NUNCA cite códigos internos como "Avulso", "Venda Avulsa", "OS #", nem faça perguntas bobas sobre uma capinha antiga.
- Cliente: ${nomeTxt}.
Base:\n${msgBase}`;
        }
        return `Você escreve mensagens humanas de WhatsApp para a loja "Cesinha Acessórios" (Amargosa-BA).
O cliente acabou de responder positivamente à 1ª mensagem de pós-venda. Melhore a 2ª mensagem abaixo agradecendo o retorno e convidando naturalmente para o *Grupo VIP* da loja (fazendo alusão clara ao Grupo VIP da Black Cesinha), mantendo EXATAMENTE o link (${linkGrupo}) e os valores oficiais da base.
Base:\n${msgBase}`;
    }
};

window.IARecapturaCopy = IARecapturaCopy;
