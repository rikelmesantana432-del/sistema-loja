// ====================================
// STRATEGYOS 3.0 - MÓDULO DE INTEGRAÇÕES & AUTOMAÇÕES
// Telegram Bot, Backup Google Drive, Relatórios por E-mail
// ====================================

const Integrations = {

    // === 1. GERADOR DE TEXTO DE RELATÓRIO EXECUTIVO DETALHADO ===
    gerarTextoRelatorioDetalhado() {
        const data = dataManager.data || {};
        const f = data.financeiro || {};
        const meta = dataManager.calcularProgressoMeta ? dataManager.calcularProgressoMeta() : {};
        const isf = Calculators.calcularISF();
        const isfClass = Calculators.classificarISF(isf);
        const celulares = dataManager.getEstoqueCelulares ? dataManager.getEstoqueCelulares() : (data.estoqueCelulares || []);
        const totalCustoEstoque = celulares.reduce((s, p) => s + (p.custo || 0), 0);
        const totalVendaEstoque = celulares.reduce((s, p) => s + (p.precoVenda || 0), 0);
        
        // IRP crítico (estoque travado há 30+ dias ou IRP > 60)
        const prodsCriticos = celulares.filter(p => Calculators.calcularIRP(p) > 60);

        // Crediário
        const crediarios = data.crediarios || [];
        const totalAReceber = crediarios.reduce((s, c) => s + (c.valorTotal - (c.valorPago || 0)), 0);
        const inadimplentes = crediarios.filter(c => c.status === 'inadimplente' || c.status === 'atrasado');

        // Assinaturas / Assistência
        const osList = (data.assistencia?.ordensServico || []);
        const osAbertas = osList.filter(o => o.status !== 'entregue' && o.status !== 'cancelado');

        const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        return `📊 STRATEGYOS 3.0 — RELATÓRIO EXECUTIVO
🏪 Cesinha Acessórios — Amargosa/BA
📅 ${hoje}

━━━━━━━━━━━━━━━━━━━━━
💰 SAÚDE FINANCEIRA & CAIXAS
• ISF (Índice Segurança): ${isf}/100 ${isfClass.emoji} (${isfClass.texto})
• Caixa Principal: R$ ${(f.caixaPrincipal || 0).toFixed(2)}
• Caixa Secundario (Balcão): R$ ${(f.caixaSecundario || 0).toFixed(2)}
• Caixa Assistência: R$ ${(f.caixaAssistencia || 0).toFixed(2)}
• Fundo de Estoque Guardado: R$ ${(data.fundoCustoEstoque?.saldoGuardado || 0).toFixed(2)}
• Total Líquido em Caixa: R$ ${((f.caixaPrincipal||0) + (f.caixaSecundario||0) + (f.caixaAssistencia||0) + (data.fundoCustoEstoque?.saldoGuardado||0)).toFixed(2)}

🎯 META PARAGUAI (R$ 20.000)
• Acumulado: R$ ${(meta.acumulado || 0).toFixed(2)} (${(meta.progressoPct || 0).toFixed(1)}%)
• Falta: R$ ${(meta.restante || 20000).toFixed(2)}

📱 ESTOQUE DE APARELHOS
• Total de Aparelhos: ${celulares.length} unidades
• Capital Travado (Custo): R$ ${totalCustoEstoque.toFixed(2)}
• Potencial de Venda: R$ ${totalVendaEstoque.toFixed(2)}
• Alertas IRP Crítico (60+ dias): ${prodsCriticos.length} modelo(s)

💳 CREDIÁRIO & RECEBÍVEIS
• Total a Receber: R$ ${totalAReceber.toFixed(2)}
• Clientes em Atraso: ${inadimplentes.length} cliente(s)

🔧 ASSISTÊNCIA TÉCNICA
• Ordens de Serviço em Aberto: ${osAbertas.length} OS(s)

💡 AÇÃO ESTRATÉGICA RECOMENDADA:
${prodsCriticos.length > 0 ? `🚨 Priorize a venda do modelo ${prodsCriticos[0].nome} dando até 10% de desconto.` : `✅ Estoque saudável e de alto giro. Mantenha os preços cheios.`}`;
    },

    // === 2. DISPARAR BOT DO TELEGRAM ===
    async enviarTelegram(silencioso = false) {
        const cfgTg = dataManager.getConfigTelegram ? dataManager.getConfigTelegram() : {};
        const token = cfgTg.botToken;
        const chatId = cfgTg.chatId;

        if (!token || !chatId) {
            if (!silencioso) UI.toast('Configure o Token e Chat ID do Telegram nas configurações.', 'warning');
            return false;
        }

        try {
            const mensagem = this.gerarTextoRelatorioDetalhado();
            const url = `https://api.telegram.org/bot${token}/sendMessage`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: mensagem,
                    disable_web_page_preview: true
                })
            });

            const json = await res.json();
            if (json.ok) {
                if (!silencioso) UI.toast('✈️ Relatório enviado para o Telegram com sucesso!', 'success');
                return true;
            } else {
                throw new Error(json.description || 'Erro na API do Telegram');
            }
        } catch (e) {
            console.error('Erro no disparo Telegram:', e);
            if (!silencioso) UI.toast('Erro ao enviar Telegram: ' + e.message, 'error');
            return false;
        }
    },

    // === 2B. ENVIAR BACKUP COMPLETO DO BANCO EM ARQUIVO PARA O TELEGRAM ===
    async enviarBackupTelegram(silencioso = false) {
        const cfgTg = dataManager.getConfigTelegram ? dataManager.getConfigTelegram() : {};
        const token = cfgTg.botToken;
        const chatId = cfgTg.chatId;

        if (!token || !chatId) {
            if (!silencioso) {
                this.modalConfigurarTelegram();
                UI.toast('Configure o Token e Chat ID do Telegram primeiro.', 'warning');
            }
            return false;
        }

        try {
            if (!silencioso) UI.toast('✈️ Enviando backup para o Telegram...', 'info');
            const jsonStr = JSON.stringify(dataManager.data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const dataHoje = new Date().toISOString().substring(0, 10);
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', `📁 BACKUP COMPLETO STRATEGYOS\n🏪 Cesinha Acessórios\n📅 ${dataHoje}`);
            formData.append('document', blob, `StrategyOS_Backup_${dataHoje}.json`);

            const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
                method: 'POST',
                body: formData
            });

            const json = await res.json();
            if (json.ok) {
                if (!silencioso) UI.toast('✅ Backup em arquivo enviado para o Telegram com sucesso!', 'success');
                return true;
            } else {
                throw new Error(json.description || 'Erro no envio do backup pelo Telegram');
            }
        } catch (e) {
            console.error('Erro ao enviar backup via Telegram:', e);
            if (!silencioso) UI.toast('Erro ao enviar backup Telegram: ' + e.message, 'error');
            return false;
        }
    },

    // === MODAL DE CONFIGURAÇÃO RÁPIDA DO BOT TELEGRAM ===
    modalConfigurarTelegram() {
        const config = (dataManager.data.configIntegracoes || {});
        const html = `
            <div style="padding:10px;">
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.5;">
                    Configure seu Bot do Telegram para receber <strong>Relatórios Diários</strong> e <strong>Backups Automáticos em Nuvem</strong> diretamente no seu celular, mesmo rodando em Localhost!
                </div>

                <div class="form-group" style="margin-bottom:12px;">
                    <label class="form-label" style="color:#00c8ff;font-weight:700;">1. Token do Bot do Telegram:</label>
                    <input class="form-input" id="cfg-telegram-token" placeholder="ex: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz" value="${config.telegramToken || ''}" style="font-size:14px;padding:10px;width:100%;">
                    <span style="font-size:11px;color:var(--text-muted);">Crie um bot no Telegram com o @BotFather para pegar o Token.</span>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label" style="color:#00c8ff;font-weight:700;">2. Chat ID do Seu Telegram:</label>
                    <input class="form-input" id="cfg-telegram-chatid" placeholder="ex: 987654321 ou -100xxxx" value="${config.telegramChatId || ''}" style="font-size:14px;padding:10px;width:100%;">
                    <span style="font-size:11px;color:var(--text-muted);">Envie uma mensagem para o @userinfobot no Telegram para descobrir seu ID.</span>
                </div>

                <div style="background:rgba(0,200,255,0.06);border:1px solid rgba(0,200,255,0.2);border-radius:10px;padding:12px;margin-bottom:16px;">
                    <div style="font-size:12px;color:#00c8ff;font-weight:800;margin-bottom:6px;">🚀 Testar Conexão Agora:</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-sm" style="background:#0088cc;color:#fff;font-weight:700;" onclick="Integrations.enviarTelegram()">📊 Testar Envio do Relatório</button>
                        <button class="btn btn-sm" style="background:#00a86b;color:#fff;font-weight:700;" onclick="Integrations.enviarBackupTelegram()">📁 Testar Envio de Backup (JSON)</button>
                    </div>
                </div>

                <div class="modal-footer" style="display:flex;gap:8px;">
                    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
                    <button class="btn btn-primary btn-lg" style="flex:1;" onclick="
                        if (!dataManager.data.configIntegracoes) dataManager.data.configIntegracoes = {};
                        dataManager.data.configIntegracoes.telegramToken = document.getElementById('cfg-telegram-token').value.trim();
                        dataManager.data.configIntegracoes.telegramChatId = document.getElementById('cfg-telegram-chatid').value.trim();
                        dataManager.saveData();
                        UI.toast('✅ Configurações do Telegram salvas com sucesso!', 'success');
                        UI.closeModal();
                    ">💾 Salvar Configurações</button>
                </div>
            </div>
        `;
        UI.openModal('🤖 Configuração do Telegram (Backup & Relatórios)', html);
    },

    // === 3. BACKUP GOOGLE DRIVE ===
    async fazerBackupGoogleDrive(silencioso = false) {
        const config = (dataManager.data.configIntegracoes || {});
        const scriptUrl = config.googleDriveScriptUrl;
        const jsonStr = JSON.stringify(dataManager.data, null, 2);
        const dataHoje = new Date().toISOString().substring(0, 10);
        const nomeArquivo = `StrategyOS_Backup_${dataHoje}.json`;

        // 1. Download Local em arquivo JSON (sempre garantido com 1 clique)
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 2. Se houver Google Apps Script URL configurada, enviar via Webhook em nuvem
        if (scriptUrl) {
            try {
                await fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: nomeArquivo,
                        data: jsonStr,
                        timestamp: new Date().toISOString()
                    })
                });
                if (!silencioso) UI.toast('📁 Backup baixado e sincronizado com o Google Drive!', 'success');
            } catch (e) {
                console.warn('Erro ao enviar para Google Apps Script:', e);
                if (!silencioso) UI.toast('📁 Backup salvo localmente (Erro no webhook Google Drive).', 'info');
            }
        } else {
            if (!silencioso) UI.toast(`📁 Backup baixado com sucesso: ${nomeArquivo}`, 'success');
        }
        return true;
    },

    // === 4. RELATÓRIO POR E-MAIL ===
    gerarHTMLRelatorioEmail() {
        const texto = this.gerarTextoRelatorioDetalhado();
        const htmlCorpo = texto.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        return `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #ffffff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #161b26; border: 1px solid #2a3447; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #00FFA3; margin-top: 0;">🏪 StrategyOS 3.0 — Relatório da Loja</h2>
                    <div style="font-size: 14px; line-height: 1.6; color: #d0d7e3;">
                        ${htmlCorpo}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #2a3447; margin: 20px 0;">
                    <p style="font-size: 12px; color: #8899a6; text-align: center;">Enviado automaticamente por StrategyOS — Cesinha Acessórios</p>
                </div>
            </body>
            </html>
        `;
    },

    async enviarEmailRelatorio(silencioso = false) {
        const config = (dataManager.data.configIntegracoes || {});
        const emailDestino = config.emailDestino;
        const scriptUrl = config.emailScriptUrl || config.googleDriveScriptUrl;

        if (!emailDestino) {
            if (!silencioso) UI.toast('Configure o E-mail de Destino nas configurações.', 'warning');
            return false;
        }

        if (!scriptUrl) {
            // Abrir mailto com o resumo como fallback
            const assunto = encodeURIComponent(`📊 Relatório StrategyOS - ${new Date().toLocaleDateString('pt-BR')}`);
            const corpo = encodeURIComponent(this.gerarTextoRelatorioDetalhado());
            window.open(`mailto:${emailDestino}?subject=${assunto}&body=${corpo}`);
            if (!silencioso) UI.toast('📧 Cliente de e-mail aberto para envio!', 'info');
            return true;
        }

        try {
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_email',
                    email: emailDestino,
                    subject: `📊 Relatório Executivo StrategyOS — ${new Date().toLocaleDateString('pt-BR')}`,
                    html: this.gerarHTMLRelatorioEmail(),
                    text: this.gerarTextoRelatorioDetalhado()
                })
            });
            if (!silencioso) UI.toast('📧 Relatório enviado por e-mail com sucesso!', 'success');
            return true;
        } catch (e) {
            console.error('Erro no envio de e-mail:', e);
            if (!silencioso) UI.toast('Erro ao enviar e-mail: ' + e.message, 'error');
            return false;
        }
    }
};
