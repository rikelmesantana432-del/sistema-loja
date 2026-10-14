# 🤝 StrategyOS - Sócio Estratégico Virtual

Sistema de gestão estratégica para loja de eletrônicos em Amargosa-BA.

## 🚀 Como Usar

### Abrir o Sistema
1. Navegue até a pasta `C:\strategyos`
2. Abra o arquivo `index.html` no seu navegador (Chrome, Firefox, Edge)
3. O sistema carregará automaticamente com os dados iniciais

### Funcionalidades Principais

#### 📊 Dashboard
- **Caixa Livre**: Visualização do caixa disponível
- **ISF (Índice de Segurança Financeira)**: Score de 0-100 indicando saúde financeira
- **Meta Paraguai**: Progresso em tempo real da meta de R$ 20.000

#### 📈 Análise Completa
Relatório completo com:
- Saúde financeira atual
- Tracker da meta Paraguai
- Análise de todos os produtos (margem, IRP, risco)
- Ranking de prioridade de venda
- Estratégia de desconto inteligente
- Recomendações de compra
- Próximos 3 passos da semana

#### 🎯 Tracker Meta
Acompanhamento detalhado da meta:
- Progresso visual com barra
- Acumulado vs Meta total
- Meses restantes
- Meta mensal e semanal ajustadas

#### 🏆 Prioridade Venda
Ranking completo de produtos do mais urgente ao que pode aguardar:
- 🔴 Urgente: Vender imediatamente
- 🟡 Breve: Vender em breve
- 🟢 Aguardar: Pode esperar

#### 🧮 Simuladores

**Simular Compra**
- Analisa viabilidade de compra de novo produto
- Calcula margem, IRP e impacto na meta
- Decisão clara: ✅ COMPRAR | ⚠️ CAUTELA | ❌ EVITAR

**Simular Venda**
- Projeta resultado da venda de produto do estoque
- Mostra lucro, novo caixa e progresso na meta
- Recomenda reinvestir ou guardar

**Simular Troca**
- Calcula viabilidade de operação de troca
- Margem no produto novo + margem no usado
- Sugere desconto máximo recomendado

#### 📝 Registros

**Registrar Venda**
- Remove produto do estoque
- Atualiza caixa livre
- Adiciona lucro à meta
- Salva no histórico

**Registrar Compra**
- Adiciona produto ao estoque
- Desconta do caixa
- Registra no histórico

**Atualizar Caixa**
- Atualiza valor do caixa livre manualmente

## 📊 Índices e Métricas

### IRP - Índice de Risco de Parado (0-100)
Quanto maior, mais risco de encalhar:
- **0-30**: ✅ Estoque seguro
- **31-60**: ⚠️ Atenção - considere desconto em 45 dias
- **61-100**: 🚨 Alto risco - desconto imediato

**Cálculo:**
- Preço acessível (30%)
- Popularidade do modelo (20%)
- Margem de lucro (15%)
- Histórico de giro (20%)
- Idade do modelo (15%)

### ISF - Índice de Segurança Financeira (0-100)
Quanto maior, mais seguro:
- **70-100**: 🔵 Seguro
- **40-69**: 🟡 Moderado
- **0-39**: 🔴 Arriscado

**Cálculo:**
- Reserva cobre parcelas (40 pts)
- Caixa livre ≥ R$ 2.000 (30 pts)
- Produtos de risco <30% do estoque (20 pts)
- Meta mensal no caminho (10 pts)

## 💾 Persistência de Dados

Todos os dados são salvos automaticamente no navegador (localStorage):
- Estoque atualizado
- Histórico de vendas e compras
- Progresso da meta
- Configurações financeiras

**Importante:** Os dados ficam salvos no navegador. Se limpar o cache, os dados serão perdidos.

### Backup Manual
1. Abra o Console do navegador (F12)
2. Digite: `dataManager.exportarDados()`
3. Copie o JSON retornado e salve em arquivo .txt

### Restaurar Backup
1. Abra o Console do navegador (F12)
2. Digite: `dataManager.importarDados('COLE_O_JSON_AQUI')`

## 🎨 Características do Design

- ✨ Tema escuro moderno
- 🌈 Gradientes vibrantes
- 💎 Efeito glassmorphism
- 📱 Totalmente responsivo
- ⚡ Animações suaves
- 🎯 Interface intuitiva

## 🔧 Estrutura do Projeto

```
strategyos/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos modernos
├── js/
│   ├── app.js          # Inicialização
│   ├── data.js         # Gerenciamento de dados
│   ├── calculators.js  # IRP, ISF, análises
│   ├── commands.js     # Sistema de comandos
│   └── ui.js           # Interface de usuário
└── README.md           # Este arquivo
```

## 📱 Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 🆘 Solução de Problemas

**Dashboard não carrega:**
- Verifique se todos os arquivos JS estão na pasta `js/`
- Abra o Console (F12) e veja se há erros

**Dados não salvam:**
- Verifique se o navegador permite localStorage
- Não use modo anônimo/privado

**Botões não funcionam:**
- Recarregue a página (F5)
- Limpe o cache do navegador

## 📞 Suporte

Sistema desenvolvido especificamente para gestão estratégica de loja de eletrônicos em Amargosa-BA.

---

**Versão:** 1.0  
**Data:** Fevereiro 2026  
**Desenvolvido por:** StrategyOS Team
