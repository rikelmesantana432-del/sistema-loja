// ====================================
// STRATEGYOS 3.0 - ASSISTÊNCIA TÉCNICA
// Complemento 8: Entrada mínima sugerida
// ====================================

// ===== UTILIDADE DE COMPRESSÃO DE IMAGEM =====
UI._comprimirImagem = function(file, maxWidth, maxHeight, quality) {
    maxWidth = maxWidth || 800;
    maxHeight = maxHeight || 600;
    quality = quality || 0.6;
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var w = img.width;
                var h = img.height;
                if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
                if (h > maxHeight) { w = w * (maxHeight / h); h = maxHeight; }
                canvas.width = Math.round(w);
                canvas.height = Math.round(h);
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

UI._comprimirImagemBase64 = function(base64, maxWidth, maxHeight, quality) {
    maxWidth = maxWidth || 800;
    maxHeight = maxHeight || 600;
    quality = quality || 0.6;
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var w = img.width;
            var h = img.height;
            if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
            if (h > maxHeight) { w = w * (maxHeight / h); h = maxHeight; }
            canvas.width = Math.round(w);
            canvas.height = Math.round(h);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = base64;
    });
};

UI._renderPreviewFotosOS = function() {
    var container = document.getElementById('os-fotos-preview');
    if (!container) return;
    container.innerHTML = (window._osFotosTemp || []).map(function(foto, idx) {
        return '<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid rgba(0,200,255,0.3);">' +
            '<img src="' + foto.base64 + '" style="width:100%;height:100%;object-fit:cover;">' +
            '<button onclick="window._osFotosTemp.splice(' + idx + ',1);UI._renderPreviewFotosOS();" style="position:absolute;top:2px;right:2px;background:rgba(255,0,0,0.85);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>' +
            '</div>';
    }).join('');
};

UI._ampliarFotoOS = function(osNumero, fotoIdx) {
    var fotos = dataManager.getFotosOS(osNumero);
    if (!fotos || !fotos[fotoIdx]) return;
    UI.openModal('📸 Foto do Aparelho', '<div style="text-align:center;"><img src="' + fotos[fotoIdx].base64 + '" style="max-width:100%;max-height:70vh;border-radius:12px;border:2px solid rgba(0,200,255,0.3);"></div><div class="modal-footer"><button class="btn btn-primary" onclick="UI.closeModal()">Fechar</button></div>');
};

// ===== WEBCAM E CHECKLIST DE FOTOS =====
window._osFotosChecklist = [
    { id: 'frente', label: '📱 1. Tela Frontal' },
    { id: 'traseira', label: '📱 2. Traseira' },
    { id: 'conector', label: '🔌 3. Conector' },
    { id: 'camera', label: '📸 4. Câmeras' },
    { id: 'detalhe', label: '🔍 5. Detalhes' }
];

UI._webcamStream = null;

UI.abrirWebcamDireto = function() {
    var area = document.getElementById('os-qrcode-area');
    if (!area) return;
    area.style.display = 'block';
    
    // Inicializar o objeto de fotos se não existir
    if (!window._osFotosTempObj) window._osFotosTempObj = {};
    
    area.innerHTML = 
        '<div style="text-align:center;">' +
            '<div style="margin-bottom:10px;font-weight:900;color:#00c8ff;">🔴 CÂMERA DO NOTEBOOK LIGADA</div>' +
            '<video id="os-webcam-video" autoplay playsinline style="width:100%;max-width:360px;border-radius:12px;border:3px solid #00c8ff;background:#000;transform:scaleX(-1);box-shadow:0 8px 25px rgba(0,200,255,0.2);"></video>' +
            '<canvas id="os-webcam-canvas" style="display:none;"></canvas>' +
            '<div style="margin-top:12px;font-size:13px;color:var(--text-muted);font-weight:bold;">Aponte o aparelho para a câmera e clique nos quadros abaixo para bater a foto:</div>' +
        '</div>' +
        '<div id="os-fotos-checklist-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-top:16px;"></div>' +
        '<div style="text-align:center;margin-top:20px;">' +
            '<button type="button" onclick="UI.fecharWebcam()" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:10px 24px;border-radius:10px;font-weight:900;font-size:14px;cursor:pointer;">⏹️ DESLIGAR CÂMERA</button>' +
        '</div>';

    UI._renderChecklistFotos();

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            UI._webcamStream = stream;
            var video = document.getElementById('os-webcam-video');
            if (video) video.srcObject = stream;
        })
        .catch(function(err) {
            area.innerHTML = '<div style="color:#ff5555;font-weight:bold;padding:16px;">❌ Erro ao acessar a câmera do notebook. Verifique as permissões!<br><br><span style="font-size:12px;">' + err.message + '</span></div>' +
                             '<button type="button" onclick="UI.fecharWebcam()" style="margin-top:10px;background:#333;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;">Fechar</button>';
        });
};

UI._renderChecklistFotos = function() {
    var grid = document.getElementById('os-fotos-checklist-grid');
    if (!grid) return;
    
    var html = '';
    window._osFotosChecklist.forEach(function(item) {
        var foto = window._osFotosTempObj[item.id];
        if (foto) {
            html += 
            '<div style="position:relative;border:2px solid #00d97e;border-radius:10px;overflow:hidden;background:#000;box-shadow:0 4px 12px rgba(0,217,126,0.2);">' +
                '<img src="' + foto.base64 + '" style="width:100%;height:90px;object-fit:cover;opacity:0.8;">' +
                '<div style="position:absolute;top:0;left:0;right:0;background:rgba(0,217,126,0.95);color:#000;font-size:11px;font-weight:900;text-align:center;padding:4px;">✅ ' + item.label + '</div>' +
                '<button type="button" onclick="UI._removerFotoChecklist(\'' + item.id + '\')" style="position:absolute;bottom:4px;right:4px;background:#ef4444;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.5);">🗑️ Refazer</button>' +
            '</div>';
        } else {
            html += 
            '<div onclick="UI._capturarFotoChecklist(\'' + item.id + '\', \'' + item.label + '\')" style="border:2px dashed rgba(0,200,255,0.4);border-radius:10px;height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,200,255,0.05);cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'rgba(0,200,255,0.15)\';this.style.borderColor=\'#00c8ff\';" onmouseout="this.style.background=\'rgba(0,200,255,0.05)\';this.style.borderColor=\'rgba(0,200,255,0.4)\';">' +
                '<span style="font-size:24px;margin-bottom:4px;filter:drop-shadow(0 2px 4px rgba(0,200,255,0.4));">📸</span>' +
                '<span style="font-size:11px;font-weight:900;color:#00c8ff;text-align:center;padding:0 4px;line-height:1.2;">' + item.label + '<br><span style="font-size:9px;color:rgba(0,200,255,0.7);">CLIQUE P/ BATER</span></span>' +
            '</div>';
        }
    });
    grid.innerHTML = html;
};

UI._capturarFotoChecklist = function(id, label) {
    var video = document.getElementById('os-webcam-video');
    var canvas = document.getElementById('os-webcam-canvas');
    if (!video || !canvas || video.readyState === 0) {
        return UI.toast('⚠️ Ligue a câmera primeiro para bater a foto!', 'warning');
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    var ctx = canvas.getContext('2d');
    
    // Inverter a imagem para salvar corretamente
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    var dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    
    if (!window._osFotosTempObj) window._osFotosTempObj = {};
    window._osFotosTempObj[id] = {
        id: Date.now(),
        base64: dataUrl,
        descricao: label
    };
    
    UI._renderChecklistFotos();
    
    // Feedback visual e sonoro sutil (se possível)
    UI.toast('✅ ' + label + ' registrada!', 'success');
    var wrap = document.getElementById('os-qrcode-area');
    if(wrap) {
        wrap.style.transform = 'scale(0.98)';
        setTimeout(() => wrap.style.transform = 'scale(1)', 100);
    }
};

UI._removerFotoChecklist = function(id) {
    if (window._osFotosTempObj && window._osFotosTempObj[id]) {
        delete window._osFotosTempObj[id];
        UI._renderChecklistFotos();
    }
};

UI.fecharWebcam = function() {
    if (UI._webcamStream) {
        UI._webcamStream.getTracks().forEach(function(t) { t.stop(); });
        UI._webcamStream = null;
    }
    // Mudar display apenas para quem usava qrcode-area. No novo fluxo, o checklist deve ficar visível sempre.
    var grid = document.getElementById('os-fotos-checklist-grid');
    if (grid) {
        // Se a câmera foi fechada, podemos manter as fotos visíveis!
        var videoArea = document.getElementById('os-webcam-video');
        if (videoArea) videoArea.parentElement.style.display = 'none';
        
        // Remove botão fechar
        var btnFechar = document.querySelector('button[onclick="UI.fecharWebcam()"]');
        if (btnFechar) btnFechar.parentElement.style.display = 'none';
    } else {
        var area = document.getElementById('os-qrcode-area');
        if (area) {
            area.style.display = 'none';
            area.innerHTML = '';
        }
    }
};

// ===== VINCULAÇÃO CELULAR VIA QR CODE + POLLING TEMPO REAL =====
UI._fotoSessionId = null;
UI._fotoPollingInterval = null;
UI._fotoPollingCount = 0;

UI._vincularCelularOS = function() {
    // Gerar sessão única
    UI._fotoSessionId = 'os_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    var qrArea = document.getElementById('os-qrcode-area');
    if (!qrArea) return;

    // Buscar IP local do servidor
    fetch('/api/ip')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.ip) {
                qrArea.style.display = 'block';
                qrArea.innerHTML = '<div style="color:#ff5555;font-weight:700;">❌ IP de rede local não detectado.<br><span style="font-size:11px;color:var(--text-muted);">Execute o server.ps1 como Administrador para habilitar acesso na rede.</span></div>';
                return;
            }
            var mobileUrl = 'http://' + data.ip + ':' + data.port + '/foto-os.html?session=' + UI._fotoSessionId;
            
            // Gerar QR Code usando API pública do Google Charts (leve, sem dependência)
            var qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(mobileUrl);
            
            qrArea.style.display = 'block';
            qrArea.innerHTML = 
                '<div style="font-weight:800;font-size:14px;color:#00d97e;margin-bottom:10px;">📱 VINCULAR CELULAR</div>' +
                '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">Escaneie o QR Code abaixo com o celular para abrir a câmera</div>' +
                '<img src="' + qrImgUrl + '" style="border-radius:12px;border:3px solid #00d97e;background:#fff;padding:8px;" width="180" height="180">' +
                '<div style="margin-top:10px;font-size:11px;color:var(--text-muted);word-break:break-all;">📍 ' + mobileUrl + '</div>' +
                '<div id="os-sync-status" style="margin-top:10px;font-size:12px;color:#00c8ff;font-weight:700;">🔄 Aguardando fotos do celular...</div>' +
                '<button type="button" onclick="UI._pararPollingFotos()" style="margin-top:8px;padding:6px 14px;background:rgba(255,50,50,0.2);color:#ff5555;border:1px solid rgba(255,50,50,0.3);border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">✕ Desconectar Celular</button>';
            
            // Iniciar polling a cada 2 segundos
            UI._fotoPollingCount = 0;
            UI._iniciarPollingFotos();
        })
        .catch(function() {
            qrArea.style.display = 'block';
            qrArea.innerHTML = '<div style="color:#ff5555;font-weight:700;">❌ Não foi possível conectar ao servidor.<br><span style="font-size:11px;color:var(--text-muted);">Verifique se o server.ps1 está rodando.</span></div>';
        });
};

UI._iniciarPollingFotos = function() {
    if (UI._fotoPollingInterval) clearInterval(UI._fotoPollingInterval);
    
    UI._fotoPollingInterval = setInterval(function() {
        if (!UI._fotoSessionId) return;
        
        fetch('/api/fotos?session=' + UI._fotoSessionId)
            .then(function(r) { return r.json(); })
            .then(function(fotos) {
                if (!fotos || fotos.length === 0) return;
                
                // Verificar se há novas fotos que ainda não foram adicionadas
                var novasFotos = fotos.filter(function(f) {
                    return !window._osFotosTemp.some(function(t) { return t.id === f.id; });
                });
                
                if (novasFotos.length > 0) {
                    novasFotos.forEach(function(f) {
                        if (window._osFotosTemp.length < 5) {
                            window._osFotosTemp.push({
                                id: f.id,
                                base64: f.base64,
                                descricao: f.descricao || 'Foto via celular'
                            });
                        }
                    });
                    
                    UI._renderPreviewFotosOS();
                    UI.toast('📸 ' + novasFotos.length + ' foto(s) recebida(s) do celular!', 'success');
                    
                    var statusEl = document.getElementById('os-sync-status');
                    if (statusEl) {
                        statusEl.innerHTML = '✅ ' + window._osFotosTemp.length + ' foto(s) sincronizada(s) do celular';
                        statusEl.style.color = '#00d97e';
                    }
                }
            })
            .catch(function() { /* silencioso */ });
    }, 2000);
};

UI._pararPollingFotos = function() {
    if (UI._fotoPollingInterval) {
        clearInterval(UI._fotoPollingInterval);
        UI._fotoPollingInterval = null;
    }
    // Limpar sessão no servidor
    if (UI._fotoSessionId) {
        fetch('/api/fotos?session=' + UI._fotoSessionId, { method: 'DELETE' }).catch(function(){});
    }
    UI._fotoSessionId = null;
    var qrArea = document.getElementById('os-qrcode-area');
    if (qrArea) {
        qrArea.style.display = 'none';
        qrArea.innerHTML = '';
    }
    UI.toast('📱 Celular desconectado', 'info');
};

UI.renderAssistencia = function () {
    try {
        const f = dataManager.data.financeiro || {};
        const ordensBrutas = dataManager.getOrdens() || [];
        const ordens = Array.isArray(ordensBrutas) ? ordensBrutas.filter(o => o && typeof o === 'object') : [];
        const ativas = ordens.filter(o => o && o.status !== 'entregue' && o.status !== 'cancelado');
        const concluidas = ordens.filter(o => o && o.status === 'entregue');
        const fatMes = concluidas.filter(o => {
            if (!o) return false;
            try {
                const dateVal = o.dataEntrega || o.dataCriacao;
                if (!dateVal) return false;
                const d = new Date(dateVal);
                const agora = new Date();
                return !isNaN(d.getTime()) && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
            } catch (err) { return false; }
        }).reduce((s, o) => s + (o.pago || o.valorFinal || 0), 0);

    const statusEmoji = { aguardando_peca: '🟡 Aguardando peça', em_reparo: '🔧 Em reparo', pronto: '✅ Pronto', entregue: '📦 Entregue' };

    // Calcular estatísticas de Margem Média da Assistência
    let totalCustoPecas = 0;
    let totalFaturadoOS = 0;
    const margemPorMarca = { iphone: { fat: 0, custo: 0, qtd: 0 }, samsung: { fat: 0, custo: 0, qtd: 0 }, motorola: { fat: 0, custo: 0, qtd: 0 }, xiaomi: { fat: 0, custo: 0, qtd: 0 }, outros: { fat: 0, custo: 0, qtd: 0 } };

    ordens.forEach(os => {
        if (!os) return;
        const val = parseFloat(os.valorFinal || os.preco || os.valor || os.pago || 0);
        const mod = (os.modelo || '').toLowerCase();
        const serv = (os.servico || '').toLowerCase();
        
        // Estimar custo da peça com base na tabela ou custo gravado
        let custoPeca = parseFloat(os.custoPeca || 0);
        if (!custoPeca && window.Calculators && typeof window.Calculators.getOrcamentoServico === 'function') {
            try {
                const orc = Calculators.getOrcamentoServico(os.modelo || '', os.servico || 'tela', os.qualidade || '1aLinha');
                if (orc) custoPeca = orc.custoPeca || 0;
            } catch(errCalc) {}
        }
        if (!custoPeca) custoPeca = Math.round(val * 0.45); // Estimativa padrão 45% custo se não especificado

        totalFaturadoOS += val;
        totalCustoPecas += custoPeca;

        let marca = 'outros';
        if (mod.includes('iphone')) marca = 'iphone';
        else if (mod.includes('samsung')) marca = 'samsung';
        else if (mod.includes('moto') || mod.includes('motorola')) marca = 'motorola';
        else if (mod.includes('xiaomi') || mod.includes('redmi') || mod.includes('poco')) marca = 'xiaomi';

        if (!margemPorMarca[marca]) margemPorMarca[marca] = { fat: 0, custo: 0, qtd: 0 };
        margemPorMarca[marca].fat += val;
        margemPorMarca[marca].custo += custoPeca;
        margemPorMarca[marca].qtd += 1;
    });

    const lucroBrutoAssistencia = Math.max(0, totalFaturadoOS - totalCustoPecas);
    const margemMediaGeral = totalFaturadoOS > 0 ? Math.round((lucroBrutoAssistencia / totalFaturadoOS) * 100) : 0;

    if (!UI._assistenciaBusca) UI._assistenciaBusca = '';
    if (!UI._assistenciaFiltroStatus) UI._assistenciaFiltroStatus = 'todos';

    function normalizar(txt) {
        if (!txt) return '';
        return String(txt).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    function correspondeBuscaOS(os, buscaStr) {
        if (!os) return false;
        if (!buscaStr) return true;
        const termos = normalizar(buscaStr).split(/\s+/).filter(t => t.length > 0);
        if (termos.length === 0) return true;
        const texto = normalizar([
            os.numero,
            'os #' + os.numero,
            os.cliente,
            os.telefone,
            os.modelo,
            os.servico,
            os.defeito,
            os.status,
            os.valorFinal || os.preco || os.valor
        ].join(' '));
        return termos.every(t => texto.includes(t));
    }

    // Filtrar ordens ativas e concluídas
    const ativasFiltradas = ativas.filter(os => correspondeBuscaOS(os, UI._assistenciaBusca));
    const concluidasFiltradas = concluidas.filter(os => correspondeBuscaOS(os, UI._assistenciaBusca));

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <div>
                <h2 style="margin:0;font-size:26px;color:#FFD700;font-weight:900;">🔧 ASSISTÊNCIA TÉCNICA & BUSCA DE MANUTENÇÕES</h2>
                <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0;">Pesquise por cliente, modelo do celular, serviço ou nº da OS</p>
            </div>
            <button class="btn btn-success btn-lg" onclick="UI.modalNovaOS()">+ Nova OS</button>
        </div>

        <!-- BARRA DE BUSCA INTELIGENTE E FILTROS IGUAL AO MÓDULO VENDEDOR -->
        <div style="background:rgba(20,24,38,0.8);border:1px solid #FFD700;border-radius:14px;padding:14px;margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <div style="flex:1;min-width:240px;position:relative;">
                <input class="form-input" id="assist-busca-input" style="width:100%;padding:12px 14px;font-size:16px;border-radius:10px;border:1px solid rgba(255,215,0,0.5);background:#0b0f19;color:#fff;" 
                    placeholder="🔍 Buscar OS (ex: joao tela iphone, 003, bateria)..." 
                    value="${UI._assistenciaBusca}" 
                    oninput="UI._assistenciaBusca=this.value;UI.renderAssistencia();setTimeout(()=>{const el=document.getElementById('assist-busca-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}},10)">
            </div>
            <button class="btn ${UI._assistenciaFiltroStatus === 'todos' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._assistenciaFiltroStatus='todos';UI.renderAssistencia()">⚡ Todas (${ordens.length})</button>
            <button class="btn ${UI._assistenciaFiltroStatus === 'ativas' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._assistenciaFiltroStatus='ativas';UI.renderAssistencia()">🔧 Em Andamento (${ativas.length})</button>
            <button class="btn ${UI._assistenciaFiltroStatus === 'concluidas' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._assistenciaFiltroStatus='concluidas';UI.renderAssistencia()">✅ Concluídas (${concluidas.length})</button>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default"><div class="dash-card-value">${UI.R(f.caixaAssistencia || 0)}</div><div class="dash-card-label">Caixa da Assistência</div></div>
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default"><div class="dash-card-value">${ativas.length}</div><div class="dash-card-label">Em Andamento</div></div>
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default"><div class="dash-card-value">${UI.R(fatMes)}</div><div class="dash-card-label">Faturamento Mês</div></div>
            <div class="dash-card" style="flex:1;min-width:130px;cursor:default;border:1px solid rgba(0,255,163,0.3);"><div class="dash-card-value" style="color:#00FFA3;">${margemMediaGeral}%</div><div class="dash-card-label">Margem Média Bruta</div></div>
        </div>

        <!-- DASHBOARD DE MARGEM MÉDIA DE MANUTENÇÃO -->
        <div style="background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="margin:0;font-size:15px;color:#00FFA3;">📊 Dashboard de Margem Média por Marca (Consertos)</h3>
                <span style="font-size:11px;color:var(--text-muted);">Baseado em ${ordens.length} ordens de serviço</span>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;">
                ${[
                    { key: 'iphone', label: '🍎 iPhone', color: '#B6FF5C' },
                    { key: 'samsung', label: '📱 Samsung', color: '#00FFA3' },
                    { key: 'xiaomi', label: '⚡ Xiaomi / Poco', color: '#FFB65C' },
                    { key: 'motorola', label: '🎧 Motorola', color: '#5CBEFF' }
                ].map(m => {
                    const d = margemPorMarca[m.key];
                    const lucro = Math.max(0, d.fat - d.custo);
                    const mg = d.fat > 0 ? Math.round((lucro / d.fat) * 100) : 0;
                    return `
                        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;">
                            <div style="font-size:13px;font-weight:700;color:${m.color};margin-bottom:4px;">${m.label}</div>
                            <div style="font-size:18px;font-weight:800;color:#FFF;">${UI.R(lucro)} <span style="font-size:11px;font-weight:400;color:var(--text-muted);">lucro</span></div>
                            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Margem Média: <strong style="color:${m.color};">${mg}%</strong> (${d.qtd} OS)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>`;

    // Alertas de OS prontas para entregar
    const osProntas = ativas.filter(o => o.status === 'pronto' || o.status === 'em_andamento');
    const osAtrasadas = ativas.filter(o => {
        const prazo = o.prazoEntrega || o.prazo;
        if (!prazo) return false;
        return new Date(prazo) < new Date();
    });

    if (osProntas.length > 0) {
        html += `<div style="background:rgba(0,217,126,0.12);border:2px solid #00d97e;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px">📦</span>
            <div>
                <strong style="color:#00d97e;font-size:16px;">${osProntas.length} OS PRONTA(S) PARA ENTREGAR!</strong>
                <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">
                    ${osProntas.map(o => `OS #${String(o.numero).padStart(3,'0')} — ${o.cliente} (${o.modelo})`).join(' | ')}
                </div>
            </div>
        </div>`;
    }
    if (osAtrasadas.length > 0) {
        html += `<div style="background:rgba(239,68,68,0.12);border:2px solid #ef4444;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px">⏰</span>
            <div>
                <strong style="color:#ef4444;font-size:16px;">${osAtrasadas.length} OS ATRASADA(S)!</strong>
                <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">
                    ${osAtrasadas.map(o => `OS #${String(o.numero).padStart(3,'0')} — ${o.cliente}`).join(' | ')}
                </div>
            </div>
        </div>`;
    }

    if (UI._assistenciaFiltroStatus !== 'concluidas') {
        html += `<h3 class="dash-section-title">📋 Em Andamento (${ativasFiltradas.length})</h3>`;
        ativasFiltradas.forEach(os => {
            const totalOS = parseFloat(os.valorFinal || os.preco || os.valor || os.pago || 0);
            const restanteOS = os.restante !== undefined ? parseFloat(os.restante) : (os.falta !== undefined ? parseFloat(os.falta) : (totalOS - (os.pago || 0)));
            const pagoOS = os.pago !== undefined ? parseFloat(os.pago) : Math.max(0, totalOS - restanteOS);
            const custoPecaOS = parseFloat(os.custoPeca || os.custoTotal || 0);
            const lucroEstimadoOS = custoPecaOS > 0 ? Math.max(0, totalOS - custoPecaOS) : null;
            const prazoStr = os.prazoEntrega || os.prazo;
            const atrasada = prazoStr && new Date(prazoStr) < new Date();
            const borderColor = os.status === 'pronto' || os.status === 'em_andamento' ? '#00d97e' : atrasada ? '#ef4444' : 'rgba(255,215,0,0.2)';

            html += `<div class="os-card" style="border:1px solid ${borderColor};">
                <div class="os-header">
                    <span class="os-numero">OS #${String(os.numero).padStart(3, '0')}</span>
                    <span class="os-status os-${os.status}">${statusEmoji[os.status] || os.status}${atrasada ? ' ⏰ ATRASADA' : ''}</span>
                </div>
                <div class="os-info">👤 ${os.cliente} | 📞 ${os.telefone || '—'}</div>
                <div class="os-info">📱 ${os.modelo} | 🔧 ${os.servico}</div>
                <div class="os-info">💰 Total: ${UI.R(totalOS)} | Pago: ${UI.R(pagoOS)} | Resta: <strong style="color:${restanteOS > 0 ? '#FFD700' : '#00d97e'}">${UI.R(restanteOS)}</strong></div>
                ${lucroEstimadoOS !== null ? `<div class="os-info" style="color:#00FFA3;font-size:12px;">📈 Lucro estimado: ${UI.R(lucroEstimadoOS)} (custo peça: ${UI.R(custoPecaOS)})</div>` : ''}
                ${prazoStr ? `<div class="os-info" style="color:${atrasada ? '#ef4444' : 'var(--text-muted)'}">📅 Prazo: ${prazoStr}${atrasada ? ' - ATRASADA!' : ''}</div>` : ''}
                ${os.defeito ? `<div class="os-info" style="font-style:italic">Defeito: ${os.defeito}</div>` : ''}
                ${(os.fotos && os.fotos.length > 0) ? '<div style="margin-top:14px;padding:12px;background:rgba(0,200,255,0.06);border-radius:10px;border:1px solid rgba(0,200,255,0.15);"><div style="font-weight:800;font-size:13px;color:#00c8ff;margin-bottom:8px;">📸 FOTOS DO APARELHO NA ENTRADA (' + os.fotos.length + ')</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' + os.fotos.map(function(f, idx) { return '<div onclick="UI._ampliarFotoOS(' + os.numero + ',' + idx + ')" style="cursor:pointer;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid rgba(0,200,255,0.3);"><img src="' + f.base64 + '" style="width:100%;height:100%;object-fit:cover;"></div>'; }).join('') + '</div></div>' : ''}
                <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
                    ${os.status === 'aguardando_peca' ? `<button class="btn btn-primary btn-sm" onclick="UI._mudarStatusOS(${os.numero},'em_reparo')">🔧 Iniciar Reparo</button>` : ''}
                    ${os.status === 'em_reparo' ? `<button class="btn btn-success btn-sm" onclick="UI._mudarStatusOS(${os.numero},'pronto')">✅ Marcar como Pronto</button>` : ''}
                    ${(os.status === 'pronto' || os.status === 'em_andamento') ? `<button class="btn btn-primary btn-sm" style="background:#00d97e;color:#000;font-weight:700;" onclick="UI.modalCobrarOS(${os.numero})">📦 Entregar e Cobrar</button>` : ''}
                    <button class="btn btn-ghost btn-sm" style="color:#ef4444;font-size:12px;" onclick="UI.modalConfirmarDeletarOS(${os.numero})">🗑️ Excluir OS</button>
                </div>
            </div>`;
        });

        if (ativasFiltradas.length === 0) html += '<p style="text-align:center;color:var(--text-muted);padding:20px">Nenhuma OS em andamento encontrada</p>';
    }

    if (UI._assistenciaFiltroStatus !== 'ativas' && concluidasFiltradas.length > 0) {
        html += `<h3 class="dash-section-title" style="margin-top:20px">✅ Concluídas (${concluidasFiltradas.length})</h3>`;
        concluidasFiltradas.slice(-20).reverse().forEach(os => {
            const totalOS = parseFloat(os.valorFinal || os.preco || os.valor || os.pago || 0);
            const custoPecaOS = parseFloat(os.custoPeca || os.custoTotal || 0);
            const lucroOS = custoPecaOS > 0 ? Math.max(0, totalOS - custoPecaOS) : null;
            html += `<div class="os-card" style="opacity:0.85;border:1px solid rgba(0,217,126,0.3);">
                <div class="os-header"><span class="os-numero">OS #${String(os.numero).padStart(3, '0')}</span><span class="os-status os-entregue">📦 Concluída</span></div>
                <div class="os-info">👤 ${os.cliente} | 📱 ${os.modelo} — ${os.servico} | 💰 Total: ${UI.R(totalOS)}</div>
                ${lucroOS !== null ? `<div class="os-info" style="font-size:12px;color:#00FFA3;">📈 Lucro real: ${UI.R(lucroOS)}</div>` : ''}
                ${(os.fotos && os.fotos.length > 0) ? '<div style="margin-top:14px;padding:12px;background:rgba(0,200,255,0.06);border-radius:10px;border:1px solid rgba(0,200,255,0.15);"><div style="font-weight:800;font-size:13px;color:#00c8ff;margin-bottom:8px;">📸 FOTOS DO APARELHO NA ENTRADA (' + os.fotos.length + ')</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' + os.fotos.map(function(f, idx) { return '<div onclick="UI._ampliarFotoOS(' + os.numero + ',' + idx + ')" style="cursor:pointer;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid rgba(0,200,255,0.3);"><img src="' + f.base64 + '" style="width:100%;height:100%;object-fit:cover;"></div>'; }).join('') + '</div></div>' : ''}
                <div style="margin-top:10px;text-align:right;">
                    <button class="btn btn-ghost btn-sm" style="color:#ef4444;font-size:11px;" onclick="UI.modalConfirmarDeletarOS(${os.numero})">🗑️ Excluir esta OS</button>
                </div>
            </div>`;
        });
    }

    document.getElementById('main-content').innerHTML = html;
    } catch (err) {
        console.error('Erro na tela de Assistência Técnica:', err);
        UI.toast('Erro ao carregar Assistência: ' + err.message, 'error');
    }
};

UI._mudarStatusOS = function (numero, novoStatus) {
    if (novoStatus === 'entregue') {
        UI.modalConfirmarCustoPecaOS(numero, function () {
            const r = dataManager.atualizarStatusOS(numero, 'entregue');
            if (r.sucesso) {
                UI.toast(`✅ OS #${numero}: Entregue!`, 'success');
            }
            UI.render();
        });
        return;
    }

    const r = dataManager.atualizarStatusOS(numero, novoStatus);
    if (r.sucesso) {
        const msgs = { em_reparo: 'Em reparo!', pronto: 'Pronto para retirada! 📦', entregue: 'Entregue!' };
        UI.toast(`✅ OS #${numero}: ${msgs[novoStatus]}`, 'success');

        // Sugestão 2: WhatsApp automático ao marcar OS como pronto
        if (novoStatus === 'pronto') {
            const os = dataManager.getOrdens().find(o => o.numero === numero);
            if (os && os.telefone && os.telefone.replace(/\D/g, '').length >= 10) {
                const tel = os.telefone.replace(/\D/g, '');
                const nomeCurto = (os.cliente || 'Cliente').split(' ')[0];
                const restante = parseFloat(os.restante || 0);
                const msgWpp = encodeURIComponent(
                    `Olá ${nomeCurto}! 👋\n\n` +
                    `✅ Seu *${os.modelo}* está *PRONTO* para retirada!\n\n` +
                    (restante > 0 ? `💰 Valor restante a pagar: *R$ ${restante.toFixed(2).replace('.', ',')}*\n\n` : `✅ Pagamento já realizado!\n\n`) +
                    `📍 Nos encontre na loja. Horário de atendimento normal.\n\n` +
                    `_Cesinha Acessórios — StrategyOS_`
                );
                UI.openModal(`📲 Avisar Cliente — OS #${String(numero).padStart(3,'0')}`, `
                    <div style="text-align:center;padding:16px;">
                        <div style="font-size:48px;margin-bottom:12px;">📲</div>
                        <h3 style="color:#25D366;font-size:20px;margin-bottom:8px;">OS PRONTA! Avisar cliente?</h3>
                        <div style="background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.3);border-radius:12px;padding:14px;margin:16px 0;text-align:left;">
                            <div style="font-size:14px;color:#FFF;font-weight:700;margin-bottom:4px;">👤 ${os.cliente}</div>
                            <div style="font-size:13px;color:var(--text-muted);">📞 ${os.telefone} | 📱 ${os.modelo}</div>
                            ${restante > 0 ? `<div style="font-size:13px;color:#FFD700;margin-top:4px;">💰 A pagar na retirada: <strong>R$ ${restante.toFixed(2)}</strong></div>` : '<div style="font-size:13px;color:#00d97e;margin-top:4px;">✅ Já está quitado</div>'}
                        </div>
                        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">A mensagem já está pronta. Clique para abrir o WhatsApp.</div>
                    </div>
                    <div class="modal-footer" style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-lg" onclick="UI.closeModal();UI.render();">Pular</button>
                        <a href="https://wa.me/55${tel}?text=${msgWpp}" target="_blank" class="btn btn-lg" style="background:#25D366;color:#fff;font-size:16px;font-weight:900;flex:1;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;" onclick="UI.closeModal();setTimeout(()=>UI.render(),500);">
                            📲 Enviar WhatsApp
                        </a>
                    </div>
                `);
                return; // não faz render agora, o modal que chama render após fechar
            }
        }

        UI.render();
    }
};

UI.modalConfirmarDeletarOS = function (numero) {
    const ordens = dataManager.getOrdens() || [];
    const os = ordens.find(o => o && o.numero === numero);
    const cliente = os ? os.cliente : 'Cliente';
    const modelo = os ? os.modelo : 'Aparelho';

    UI.openModal(`⚠️ Excluir OS #${String(numero).padStart(3, '0')}`, `
        <div style="text-align:center;padding:16px;">
            <div style="font-size:48px;margin-bottom:12px;">🗑️</div>
            <h3 style="color:#ef4444;font-size:18px;margin-bottom:8px;">Deseja excluir a OS #${String(numero).padStart(3, '0')}?</h3>
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:14px;margin:16px 0;text-align:left;">
                <div style="font-size:14px;color:#FFF;font-weight:700;">👤 Cliente: ${cliente}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">📱 Modelo: ${modelo}</div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">Esta ação removerá a Ordem de Serviço e limpará os registros associados.</div>
        </div>
        <div class="modal-footer" style="display:flex;gap:8px;">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-danger btn-lg" style="flex:1;" onclick="
                const r = dataManager.deletarOrdemServico(${numero});
                if (r.sucesso) {
                    UI.toast('✅ OS #${numero} excluída com sucesso!', 'success');
                } else {
                    UI.toast('Erro ao excluir OS: ' + (r.erro || 'Desconhecido'), 'error');
                }
                UI.closeModal();
                UI.render();
            ">✓ Confirmar Exclusão</button>
        </div>
    `);
};

// === NOVA OS — com entrada sugerida (Complemento 8) ===
UI.modalNovaOS = function () {
    const servicos = ['tela', 'bateria', 'conector', 'camera', 'botao', 'software', 'limpeza', 'outro'];
    const servicoNomes = {
        tela: '📱 Troca de Tela',
        bateria: '🔋 Troca de Bateria',
        conector: '🔌 Conector de Carga',
        camera: '📷 Reparo Câmera',
        botao: '🔘 Reparo Botões',
        software: '💻 Software (Formatação)',
        limpeza: '🧹 Limpeza (Oxidação/Água)',
        outro: '🔧 Outro Serviço'
    };

    UI.openModal('📋 Nova Ordem de Serviço', `
        <h4 style="font-size:13px;color:var(--accent-cyan);margin-bottom:10px">👤 CLIENTE</h4>
        <div style="margin-bottom:8px;">
            <button class="btn btn-sm" type="button" style="background:rgba(139,92,246,0.2);color:#a78bfa;border:1px solid #8b5cf6;font-size:13px;padding:6px 12px;cursor:pointer;" onclick="document.getElementById('os-cliente').value='Cliente Geral';document.getElementById('os-telefone').value='';UI._autoCompletarClienteOS();">
                ⚡ Usar Cliente Geral
            </button>
        </div>
        <div class="form-group">
            <label class="form-label" style="color:#FFD700;font-weight:700;">1º Nome do Cliente (opcional):</label>
            <input class="form-input" id="os-cliente" placeholder="Digite 1 letra para buscar ou deixe em branco..." style="font-size:16px;padding:12px;width:100%;" oninput="UI._autoCompletarClienteOS()">
            <div id="os-cliente-sugestoes" style="margin-top:6px;"></div>
        </div>
        <div class="form-group" style="margin-top:12px;">
            <label class="form-label" style="color:#FFD700;font-weight:700;">2º Telefone / WhatsApp:</label>
            <input class="form-input" id="os-telefone" placeholder="(75) 9XXXX-XXXX" type="tel" style="font-size:16px;padding:12px;width:100%;" oninput="if(UI._mascaraTelefone)UI._mascaraTelefone(this);UI._autoCompletarClienteOS()">
        </div>

        <h4 style="font-size:13px;color:var(--accent-cyan);margin:14px 0 10px">📱 APARELHO</h4>
        <div class="form-float"><input class="form-input" id="os-modelo" placeholder=" "><label for="os-modelo">Modelo do aparelho</label></div>
        <div class="form-float"><input class="form-input" id="os-imei" placeholder=" "><label for="os-imei">IMEI (opcional)</label></div>

        <h4 style="font-size:13px;color:var(--accent-cyan);margin:14px 0 10px">🔧 SERVIÇO</h4>
        <div class="form-float"><textarea class="form-textarea" id="os-defeito" placeholder=" "></textarea><label for="os-defeito">Descrição do defeito</label></div>
        <div class="form-group"><label class="form-label">Serviço Solicitado</label>
            <select class="form-select" id="os-servico" onchange="UI._calcOrcamento()" style="font-size:15px;padding:10px;">
                ${servicos.map(s => `<option value="${s}">${servicoNomes[s]}</option>`).join('')}
            </select>
        </div>

        <div style="margin-top:16px;padding:14px;background:rgba(255,255,255,0.05);border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
            <div style="font-weight:800;font-size:14px;color:#a855f7;margin-bottom:10px;">✅ TESTE RÁPIDO DE ENTRADA</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Desmarque o que estiver com defeito para registrar no laudo:</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;color:#FFF;font-weight:700;">
                <label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="chk-tela" checked style="width:18px;height:18px;"> 📱 Tela / Touch</label>
                <label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="chk-wifi" checked style="width:18px;height:18px;"> 📶 Wi-Fi</label>
                <label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="chk-cam" checked style="width:18px;height:18px;"> 📸 Câmeras</label>
                <label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="chk-audio" checked style="width:18px;height:18px;"> 🔊 Áudio / Mic</label>
                <label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="chk-chip" checked style="width:18px;height:18px;"> 📡 Sinal / Chip</label>
                <label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="chk-carga" checked style="width:18px;height:18px;"> ⚡ Carregamento</label>
            </div>
        </div>

        <button class="btn btn-primary btn-lg btn-block" onclick="UI._calcOrcamento()" style="margin-top:16px">📊 Gerar Orçamento</button>
        <div id="os-orcamento"></div>
        <div id="os-entrada-secao"></div>
        <div id="os-resultado"></div>
    `);
};

UI._calcOrcamento = function () {
    const modelo = document.getElementById('os-modelo').value.trim();
    const servico = document.getElementById('os-servico').value;
    if (!modelo) return UI.toast('Informe o modelo', 'error');
    const orc = Calculators.getOrcamentoServico(modelo, servico);

    if (!orc) {
        document.getElementById('os-orcamento').innerHTML = `
            <div class="analise-ponto" style="margin-top:12px;border-left:3px solid var(--accent-yellow)">
                <div class="analise-ponto-info">⚠️ Sem preço cadastrado para "${servico}" de "${modelo}"</div>
                <div class="form-group" style="margin-top:8px"><label class="form-label">Valor do orçamento (R$)</label><input class="form-input" id="os-valor-manual" type="number" step="0.01" placeholder="Valor manual" oninput="UI._renderEntradaOS()"></div>
            </div>`;
        UI._renderEntradaOS();
        return;
    }

    // Se o serviço for relacionado a tela, gerar comparativo das 3 qualidades
    let htmlComparativo = '';
    if (servico.includes('tela')) {
        const orcOrig = Calculators.getOrcamentoServico(modelo, 'telaOriginal');
        const orc1a = Calculators.getOrcamentoServico(modelo, 'tela');
        const orc2a = Calculators.getOrcamentoServico(modelo, 'tela2aLinha');

        htmlComparativo = `
        <div style="margin-top:12px;background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:10px;padding:12px;">
            <div style="font-size:13px;color:#FFD700;font-weight:700;margin-bottom:8px;">💡 GUIA DE PREÇOS DE TELA PARA FUNCIONÁRIAS:</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;">
                <div style="background:rgba(255,215,0,0.08);border:1px solid #FFD700;border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:12px;color:#FFD700;font-weight:800;">💎 PREMIUM ORIGINAL</div>
                    <div style="font-size:16px;font-weight:900;color:#FFF;margin-top:4px;">${orcOrig ? UI.R(orcOrig.ideal) : 'N/A'}</div>
                    <div style="font-size:11px;color:var(--text-muted);">Custo: ${orcOrig ? UI.R(orcOrig.custoPeca) : 0}</div>
                </div>
                <div style="background:rgba(0,255,163,0.08);border:1px solid #00FFA3;border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:12px;color:#00FFA3;font-weight:800;">⭐ 1ª LINHA (INCELL)</div>
                    <div style="font-size:16px;font-weight:900;color:#FFF;margin-top:4px;">${orc1a ? UI.R(orc1a.ideal) : 'N/A'}</div>
                    <div style="font-size:11px;color:var(--text-muted);">Custo: ${orc1a ? UI.R(orc1a.custoPeca) : 0}</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:12px;color:#AAA;font-weight:800;">💰 2ª LINHA (ECONÔMICA)</div>
                    <div style="font-size:16px;font-weight:900;color:#FFF;margin-top:4px;">${orc2a ? UI.R(orc2a.ideal) : 'N/A'}</div>
                    <div style="font-size:11px;color:var(--text-muted);">Custo: ${orc2a ? UI.R(orc2a.custoPeca) : 0}</div>
                </div>
            </div>
        </div>`;
    }

    document.getElementById('os-orcamento').innerHTML = `
        <div class="analise-ponto" style="margin-top:12px">
            <div class="analise-ponto-title">📊 ORÇAMENTO — ${modelo.toUpperCase()}</div>
            <div class="analise-ponto-info">Fonte: ${orc.fonte === 'modelo' ? '✅ Modelo exato' : '⚠️ Estimativa por marca'} (${orc.marca})</div>
            <div class="analise-ponto-info">Custo peça: ${UI.R(orc.custoPeca)} | Mão de obra: ${UI.R(orc.maoObra)} | Total: ${UI.R(orc.total)}</div>
            <div class="analise-ponto-info">Prazo: ${orc.prazo} dias úteis</div>
            <hr style="border-color:var(--border-color);margin:8px 0">
            <div class="analise-ponto-title">💰 PREÇO SUGERIDO (${servico.includes('telaOriginal') ? 'PREMIUM' : servico.includes('2aLinha') ? '2ª LINHA' : '1ª LINHA'})</div>
            <div class="analise-ponto-info">Mínimo (30%): ${UI.R(orc.minimo)} | <strong style="color:var(--accent-green)">Ideal (50%): ${UI.R(orc.ideal)}</strong> | Máximo (70%): ${UI.R(orc.maximo)}</div>
            ${htmlComparativo}
        </div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Valor final (R$)</label><input class="form-input" id="os-valor-final" type="number" step="0.01" value="${orc.ideal}" style="font-size:18px;font-weight:700" oninput="UI._renderEntradaOS()"></div>
    `;
    UI._renderEntradaOS();
};

// === ENTRADA SUGERIDA — Complemento 8 ===
UI._renderEntradaOS = function () {
    const valorEl = document.getElementById('os-valor-final') || document.getElementById('os-valor-manual');
    const valor = parseFloat(valorEl ? valorEl.value : 0) || 0;
    if (valor <= 0) { document.getElementById('os-entrada-secao').innerHTML = ''; return; }

    const e50 = Math.round(valor * 0.50);
    const e30 = Math.round(valor * 0.30);

    document.getElementById('os-entrada-secao').innerHTML = `
        <h4 style="font-size:13px;color:var(--accent-cyan);margin:16px 0 10px">💳 ENTRADA SUGERIDA</h4>

        <div class="entrada-opcao selecionada" onclick="UI._selecionarEntrada(this, 50, ${e50})">
            <div class="entrada-titulo">✅ Cenário A — 50% de entrada (RECOMENDADO)</div>
            <div class="entrada-detalhe">Entrada: ${UI.R(e50)} | Restante: ${UI.R(valor - e50)}</div>
            <div class="entrada-detalhe" style="color:var(--accent-green)">Segurança: Alta</div>
        </div>
        <div class="entrada-opcao" onclick="UI._selecionarEntrada(this, 30, ${e30})">
            <div class="entrada-titulo">⚠️ Cenário B — 30% de entrada</div>
            <div class="entrada-detalhe">Entrada: ${UI.R(e30)} | Restante: ${UI.R(valor - e30)}</div>
            <div class="entrada-detalhe" style="color:var(--accent-yellow)">Segurança: Média — Só para clientes conhecidos</div>
        </div>
        <div class="entrada-opcao" onclick="UI._selecionarEntrada(this, 0, 0)">
            <div class="entrada-titulo">❌ Cenário C — Sem entrada</div>
            <div class="entrada-detalhe">Pagamento total na retirada: ${UI.R(valor)}</div>
            <div class="entrada-detalhe" style="color:var(--accent-red)">Segurança: Baixa — Alto risco de abandono</div>
        </div>
        <div class="entrada-opcao" onclick="UI._selecionarEntrada(this, 'custom', 0)">
            <div class="entrada-titulo">✏️ Personalizado</div>
            <input class="form-input" id="os-entrada-custom" type="number" step="0.01" placeholder="Valor da entrada" onclick="event.stopPropagation()" style="margin-top:6px">
        </div>

        <input type="hidden" id="os-entrada-tipo" value="50">
        <input type="hidden" id="os-entrada-valor" value="${e50}">

        <div id="os-entrada-alerta"></div>

        <div class="form-group" style="margin-top:12px">
            <label class="form-label">Forma de pagamento da entrada</label>
            <div class="form-radio-group">
                <label class="form-radio-label"><input type="radio" name="os-pag-entrada" value="dinheiro" checked><span>💵 Dinheiro</span></label>
                <label class="form-radio-label"><input type="radio" name="os-pag-entrada" value="pix"><span>📲 PIX</span></label>
                <label class="form-radio-label"><input type="radio" name="os-pag-entrada" value="cartao"><span>💳 Cartão</span></label>
            </div>
        </div>

        <div style="margin-top:16px;padding:14px;background:rgba(0,200,255,0.06);border-radius:12px;border:1px solid rgba(0,200,255,0.15);">
            <div style="font-weight:800;font-size:14px;color:#00c8ff;margin-bottom:10px;">📸 REGISTRO VISUAL DO APARELHO</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px;">Tire fotos do estado do celular na entrada para proteger a loja (máx. 5 fotos)</div>
            <input type="file" id="os-foto-input" accept="image/*" capture="environment" multiple style="display:none">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="button" onclick="UI.abrirWebcamDireto()" style="flex:1;min-width:100px;padding:10px;background:linear-gradient(135deg,#00c8ff,#0060ff);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;">📷 Ligar Câmera</button>
                <button type="button" onclick="document.getElementById('os-foto-input').removeAttribute('capture');document.getElementById('os-foto-input').click();" style="flex:1;min-width:100px;padding:10px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;">📁 Galeria PC</button>
                <button type="button" onclick="UI._vincularCelularOS()" style="flex:1;min-width:100px;padding:10px;background:linear-gradient(135deg,#00d97e,#00a86b);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;">📱 Via Celular</button>
            </div>
            <div id="os-qrcode-area" style="display:none;margin-top:12px;text-align:center;padding:14px;background:rgba(0,0,0,0.3);border-radius:10px;border:1px dashed rgba(0,200,255,0.3);"></div>
            <div id="os-fotos-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;"></div>
        </div>

        <div class="modal-footer" style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-success btn-lg" style="flex:1" onclick="UI._confirmarOS()">✓ Registrar OS</button>
        </div>
    `;

    window._osFotosTemp = [];
    setTimeout(function() {
        var input = document.getElementById('os-foto-input');
        if (input) {
            input.addEventListener('change', async function(e) {
                var files = Array.from(e.target.files);
                for (var i = 0; i < files.length; i++) {
                    if (window._osFotosTemp.length >= 5) {
                        UI.toast('⚠️ Máximo de 5 fotos por OS!', 'warning');
                        break;
                    }
                    try {
                        var compressed = await UI._comprimirImagem(files[i], 800, 600, 0.6);
                        window._osFotosTemp.push({ id: Date.now() + i, base64: compressed, descricao: 'Foto ' + (window._osFotosTemp.length + 1) + ' - Entrada' });
                    } catch (err) {
                        console.error('Erro ao comprimir foto:', err);
                    }
                }
                UI._renderPreviewFotosOS();
                e.target.value = '';
            });
        }
    }, 100);
};

UI._selecionarEntrada = function (el, pct, valor) {
    document.querySelectorAll('.entrada-opcao').forEach(e => e.classList.remove('selecionada'));
    el.classList.add('selecionada');
    document.getElementById('os-entrada-tipo').value = pct;
    document.getElementById('os-entrada-valor').value = valor;

    const valorEl = document.getElementById('os-valor-final') || document.getElementById('os-valor-manual');
    const total = parseFloat(valorEl ? valorEl.value : 0) || 0;

    if (pct !== 'custom' && total > 0 && valor / total < 0.30 && valor > 0) {
        document.getElementById('os-entrada-alerta').innerHTML = `<div class="alerta-item alerta-warning" style="margin-top:8px">⚠️ Entrada baixa — risco de abandono do aparelho</div>`;
    } else if (pct === 0) {
        document.getElementById('os-entrada-alerta').innerHTML = `<div class="alerta-item alerta-danger" style="margin-top:8px">❌ Sem entrada — alto risco. Recomendamos pelo menos 30%</div>`;
    } else {
        document.getElementById('os-entrada-alerta').innerHTML = '';
    }
};

UI._confirmarOS = function () {
    let cliente = document.getElementById('os-cliente').value.trim();
    const telefone = document.getElementById('os-telefone').value.trim();
    const modelo = document.getElementById('os-modelo').value.trim();
    const imei = document.getElementById('os-imei').value.trim();
    let defeito = document.getElementById('os-defeito').value.trim();
    const servico = document.getElementById('os-servico').value;
    const valorEl = document.getElementById('os-valor-final') || document.getElementById('os-valor-manual');
    const valorFinal = parseFloat(valorEl ? valorEl.value : 0) || 0;

    if (!cliente) cliente = 'Cliente Geral';
    if (!modelo) return UI.toast('Informe o modelo do aparelho', 'error');
    if (!valorFinal) return UI.toast('Gere o orçamento primeiro', 'error');

    // Processar checklist de testes básicos
    const chks = [
        {id: 'chk-tela', label: 'Tela/Touch'}, {id: 'chk-wifi', label: 'Wi-Fi'},
        {id: 'chk-cam', label: 'Câmeras'}, {id: 'chk-audio', label: 'Áudio/Mic'},
        {id: 'chk-chip', label: 'Sinal/Chip'}, {id: 'chk-carga', label: 'Carregamento'}
    ];
    let falhas = [];
    chks.forEach(c => {
        const el = document.getElementById(c.id);
        if (el && !el.checked) falhas.push(c.label);
    });
    
    if (falhas.length > 0) {
        defeito += `\n\n[⚠️ TESTES DE ENTRADA COM FALHA: ${falhas.join(', ')}]`;
    } else {
        defeito += `\n\n[✅ TODOS OS TESTES BÁSICOS OK]`;
    }

    // Entrada
    const entradaTipo = document.getElementById('os-entrada-tipo').value;
    let entrada = 0;
    if (entradaTipo === 'custom') {
        entrada = parseFloat(document.getElementById('os-entrada-custom').value) || 0;
    } else {
        entrada = parseFloat(document.getElementById('os-entrada-valor').value) || 0;
    }

    // Tratar array de fotos do novo checklist
    const fotosFinais = window._osFotosTempObj ? Object.values(window._osFotosTempObj) : (window._osFotosTemp || []);

    // Prazo
    const orc = Calculators.getOrcamentoServico(modelo, servico);
    const prazo = orc ? orc.prazo : 5;
    const dataPrazo = new Date();
    dataPrazo.setDate(dataPrazo.getDate() + prazo);

    // Cadastrar cliente se não existir
    if (!dataManager.buscarCliente(cliente)) {
        dataManager.cadastrarCliente({ nome: cliente, telefone });
    }
    // Parar polling de fotos ao salvar a OS
    UI._pararPollingFotos();

    const r = dataManager.criarOrdemServico({
        cliente, telefone, modelo, imei, defeito, servico,
        valorFinal, entrada, fotos: window._osFotosTemp || [],
        custoPeca: orc ? orc.custoPeca : Math.round(valorFinal * 0.35),
        custoTotal: orc ? (orc.custoPeca + orc.maoObra) : Math.round(valorFinal * 0.45),
        prazoEntrega: dataPrazo.toISOString().split('T')[0],
        formaPagamentoEntrada: document.querySelector('input[name="os-pag-entrada"]:checked')?.value || 'dinheiro'
    });

    if (r.sucesso) {
        const totalFotos = (window._osFotosTemp || []).length;
        UI.openModal('✅ OS Registrada!', `
            <div style="text-align:center;padding:20px">
                <div style="font-size:48px">🔧</div>
                <h3 style="color:var(--accent-cyan)">OS #${String(r.numero).padStart(3, '0')}</h3>
                <p style="margin:8px 0">👤 ${cliente} | 📱 ${modelo}</p>
                <p>🔧 ${servico} | 💰 ${UI.R(valorFinal)}</p>
                ${entrada > 0 ? `<p>Entrada: ${UI.R(entrada)}</p>` : '<p style="color:var(--accent-red)">⚠️ Sem entrada</p>'}
                <p>📅 Prazo: ${dataPrazo.toLocaleDateString('pt-BR')}</p>
                ${totalFotos > 0 ? `<p style="color:#00c8ff;">📸 ${totalFotos} foto(s) registrada(s) do aparelho</p>` : ''}
            </div>
            <div class="modal-footer"><button class="btn btn-primary btn-lg" onclick="UI.closeModal();UI.navigate('assistencia');">OK</button></div>
        `);
    }
};

// === COBRAR OS E MINI-SIMULADOR ===
UI.modalCobrarOS = function (numero) {
    const os = dataManager.getOrdens().find(o => o.numero === numero);
    if (!os) return;

    if (os.restante <= 0) {
        // Se já pagou tudo na entrada, só entrega
        UI._mudarStatusOS(numero, 'entregue');
        return;
    }

    const valorAcesso = os.restante;
    const taxaPix = dataManager.data.taxasCartao.pix;
    const descPix = valorAcesso * (taxaPix / 100);
    const liquidoPix = valorAcesso - descPix;

    UI.openModal(`🔧 FAZER CONSERTO — OS #${String(numero).padStart(3, '0')}`, `
        <div style="background: rgba(138,43,226,0.1); padding: 16px; border-radius: 12px; border: 1px solid rgba(138,43,226,0.3); margin-bottom: 20px;">
            <h4 style="color: #B284BE; text-transform: uppercase;">PASSO 5 — COMO CLIENTE VAI PAGAR?</h4>
            <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">Valor restante: ${UI.R(valorAcesso)}</div>
        </div>
        
        <h4 style="font-size:13px;color:var(--accent-cyan);margin:16px 0 10px">ESCOLHA A FORMA:</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="card p-3" style="text-align: center; border: 2px solid transparent; cursor: pointer; background: rgba(255,255,255,0.03);" onclick="UI._confirmarCobrarOS(${numero}, 'dinheiro')" onmouseover="this.style.borderColor='#50C878'" onmouseout="this.style.borderColor='transparent'">
                <div style="font-size: 24px;">💵</div>
                <div style="font-weight: bold; margin: 4px 0;">DINHEIRO</div>
                <div style="color: #50C878; font-size: 16px;">${UI.R(valorAcesso)}</div>
                <button class="btn btn-sm btn-ghost" style="margin-top: 8px; width: 100%;">ESCOLHER</button>
            </div>
            
            <div class="card p-3" style="text-align: center; border: 2px solid transparent; cursor: pointer; background: rgba(255,255,255,0.03);" onclick="UI._confirmarCobrarOS(${numero}, 'pix')" onmouseover="this.style.borderColor='#39afd1'" onmouseout="this.style.borderColor='transparent'">
                <div style="font-size: 24px;">📱</div>
                <div style="font-weight: bold; margin: 4px 0;">PIX</div>
                <div style="color: #39afd1; font-size: 16px;">Você recebe: ${UI.R(liquidoPix)}</div>
                <button class="btn btn-sm btn-ghost" style="margin-top: 8px; width: 100%;">ESCOLHER</button>
            </div>
        </div>
        
        <div class="card p-3" style="text-align: center; border: 2px solid transparent; cursor: pointer; background: rgba(255,255,255,0.03);" onclick="UI._renderMiniSimulador(${numero}, ${valorAcesso})" onmouseover="this.style.borderColor='#FFD700'" onmouseout="this.style.borderColor='transparent'">
            <div style="font-size: 24px;">💳</div>
            <div style="font-weight: bold; margin: 4px 0;">CARTÃO</div>
            <div style="color: var(--text-muted); font-size: 13px;">Ver simulador de parcelas onde VOCÊ absorve a taxa</div>
            <button class="btn btn-sm btn-outline" style="margin-top: 8px; width: 100%;">ESCOLHER → MINISIMULADOR</button>
        </div>
    `);
};

UI._renderMiniSimulador = function (numero, valorFinal) {
    const taxas = dataManager.data.taxasCartao;
    let listHtml = '';

    // Lista de cartões possíveis
    const opcoes = [
        { id: 'debito', nome: 'Débito' },
        { id: 'credito', nome: 'Crédito 1x' }
    ];
    for (let i = 2; i <= 18; i++) opcoes.push({ id: `${i}x`, nome: `${i}x sem juros` });

    opcoes.forEach(op => {
        let maxParcelas = 1;
        if (op.id.includes('x')) maxParcelas = parseInt(op.id.replace('x', ''));

        const tx = taxas[op.id] || 0;
        const vParcela = valorFinal / maxParcelas;
        const textoCliente = (maxParcelas > 1) ? `Cliente paga: ${maxParcelas}x de ${UI.R(vParcela)} (Total: ${UI.R(valorFinal)})` : `Cliente paga: ${UI.R(valorFinal)}`;
        const desconto = valorFinal * (tx / 100);
        const recebimento = valorFinal - desconto;

        listHtml += `
            <label class="form-radio-label" style="display:flex; align-items:flex-start; padding:12px; margin-bottom:8px;">
                <input type="radio" name="os-parcela-escolhida" value="${op.id}" style="margin-top:4px;">
                <div style="flex:1;">
                    <strong style="color:#FFD700; font-size:15px;">${op.nome}</strong><br>
                    <span style="color:#FFF;">${textoCliente}</span><br>
                    <span style="color:#50C878; font-weight:600;">Você recebe: ${UI.R(recebimento)} (taxa ${tx}%)</span>
                </div>
            </label>
        `;
    });

    UI.openModal(`💳 PARCELAMENTO NO CARTÃO — OS #${String(numero).padStart(3, '0')}`, `
        <div style="background: rgba(138,43,226,0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <div style="color:#fff; font-size: 16px;">Valor do serviço restante: <strong>${UI.R(valorFinal)}</strong></div>
            <div style="color:var(--accent-red); font-size: 12px; margin-top:4px;">⚠️ Lembrete: No conserto o cliente NÃO REPASSA juros, você absorve a taxa!</div>
        </div>
        
        <h4 style="font-size:13px;color:var(--accent-cyan);margin:16px 0 10px">EM QUANTAS VEZES? (escolha uma)</h4>
        
        <div style="max-height: 350px; overflow-y: auto; padding-right: 8px;" class="custom-scroll">
            ${listHtml}
        </div>
        
        <div class="modal-footer" style="margin-top: 20px;">
            <button class="btn btn-ghost" onclick="UI.modalCobrarOS(${numero})">Voltar</button>
            <button class="btn btn-success btn-lg" onclick="UI._confirmarCobrarOSCartao(${numero}, ${valorFinal})">✅ Confirmar Escolha</button>
        </div>
    `);
};

UI._confirmarCobrarOS = function (numero, forma) {
    const os = dataManager.getOrdens().find(o => o.numero === numero);
    if (!os) return;
    os.formaPagamentoFinal = forma;
    dataManager.saveData();

    // EXIGÊNCIA SOLICITADA: Perguntar quanto foi a peça ao finalizar a OS
    UI.modalConfirmarCustoPecaOS(numero, function () {
        if (forma === 'pix') {
            const restante = parseFloat(os.restante || 0);
            const taxaPix = dataManager.data.taxasCartao?.pix || 0;
            const descontoPix = Math.round(restante * (taxaPix / 100) * 100) / 100;
            if (descontoPix > 0) {
                dataManager.saveData();
                UI._mudarStatusOS(numero, 'entregue');
                dataManager.data.financeiro.caixaAssistencia -= descontoPix;
                dataManager.saveData();
                UI.toast(`✅ OS #${numero} entregue! (PIX — taxa ${taxaPix}% deduzida: -R$${descontoPix.toFixed(2)})`, 'success');
                return;
            }
        }
        UI._mudarStatusOS(numero, 'entregue');
    });
};

UI.modalConfirmarCustoPecaOS = function (numero, callbackConcluir) {
    const os = dataManager.getOrdens().find(o => o.numero === numero);
    if (!os) {
        if (callbackConcluir) callbackConcluir();
        return;
    }

    // Tentar estimar o custo base do banco de dados para sugerir ao usuário
    let custoSugerido = parseFloat(os.custoPeca || os.custoTotal || 0);
    const keyModelo = (os.modelo || '').toLowerCase().trim();
    let servicosBD = dataManager.data.tabelaServicosModelo[keyModelo];
    if (!servicosBD) {
        for (const [k, v] of Object.entries(dataManager.data.tabelaServicosModelo)) {
            if (keyModelo.includes(k) || k.includes(keyModelo)) { servicosBD = v; break; }
        }
    }

    let dicaTexto = 'Insira o valor real que você pagou ao fornecedor nesta peça/tela.';
    if (servicosBD && servicosBD.tela) {
        const p1 = servicosBD.tela.p;
        const p2 = servicosBD.tela2aLinha ? servicosBD.tela2aLinha.p : Math.round(p1 * 0.65);
        const pOrig = servicosBD.telaOriginal ? servicosBD.telaOriginal.p : Math.round(p1 * 2);
        dicaTexto = `💡 Custo cadastrado no banco: 1ª Linha R$ ${p1} | 2ª Linha R$ ${p2} | Original R$ ${pOrig}`;
        if (custoSugerido <= 0) custoSugerido = p1;
    }

    UI.openModal(`🔧 CUSTO DA PEÇA/TELA — OS #${String(numero).padStart(3, '0')}`, `
        <div style="padding:16px;">
            <div style="background:rgba(255,215,0,0.1);border:1px solid #FFD700;border-radius:12px;padding:14px;margin-bottom:16px;">
                <div style="font-size:14px;color:#FFD700;font-weight:800;text-transform:uppercase;">📱 ${os.modelo} — ${os.servico}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">👤 Cliente: ${os.cliente} | 💰 Cobrado do cliente: <strong>${UI.R(os.valorFinal || os.preco || 0)}</strong></div>
            </div>

            <label class="form-label" style="font-size:16px;color:#00FFA3;font-weight:800;">💸 QUANTO FOI O CUSTO DA PEÇA/TELA PAGO AO FORNECEDOR? (R$):</label>
            <input type="number" id="input-custo-real-os" class="form-input" style="font-size:24px;text-align:center;font-weight:900;color:#00FFA3;padding:12px;margin:8px 0;" value="${custoSugerido > 0 ? custoSugerido : ''}" placeholder="0,00" autofocus>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">${dicaTexto}</div>

            <div style="background:rgba(16,185,129,0.08);border:1px dashed #10b981;border-radius:8px;padding:10px;font-size:12px;color:#10b981;margin-bottom:16px;">
                ℹ️ Este valor será deduzido do caixa para calcular seu lucro líquido exato e alimentar o histórico do banco de dados.
            </div>
        </div>
        <div class="modal-footer" style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-lg" onclick="UI.closeModal();">Cancelar</button>
            <button class="btn btn-success btn-lg" style="flex:1;font-size:18px;font-weight:900;" onclick="UI._salvarCustoEConcluirOS(${numero}, ${callbackConcluir ? 'true' : 'false'})">✅ SALVAR CUSTO & CONCLUIR OS</button>
        </div>
    `);

    // Armazenar callback temporário
    UI._tempOSCallback = callbackConcluir;
};

UI._salvarCustoEConcluirOS = function (numero, temCallback) {
    const inp = document.getElementById('input-custo-real-os');
    const valorCusto = parseFloat(inp?.value || 0);

    const os = dataManager.getOrdens().find(o => o.numero === numero);
    if (os) {
        os.custoPeca = valorCusto;
        os.custoTotal = valorCusto;
        dataManager.saveData();
    }

    UI.closeModal();

    if (temCallback && typeof UI._tempOSCallback === 'function') {
        const cb = UI._tempOSCallback;
        UI._tempOSCallback = null;
        cb();
    } else {
        UI._mudarStatusOS(numero, 'entregue');
    }
};

UI._confirmarCobrarOSCartao = function (numero, valorEsperado) {
    const sel = document.querySelector('input[name="os-parcela-escolhida"]:checked');
    if (!sel) return UI.toast('Escolha uma parcela', 'error');

    const id = sel.value;
    const taxa = dataManager.data.taxasCartao[id] || 0;
    const valorRecebidoReal = valorEsperado - (valorEsperado * (taxa / 100));

    // Encontrar ordens e deduzir a taxa extra para atualizar o caixa corretamente
    // Como mudar para entregue soma o valorRestante inteiro, precisamos deduzir o desconto depois
    UI._mudarStatusOS(numero, 'entregue');
    const descontoMaquina = valorEsperado - valorRecebidoReal;
    if (descontoMaquina > 0) {
        dataManager.data.financeiro.caixaAssistencia -= descontoMaquina; // ajustando a entrada lida no mudarStatusOs
        dataManager.saveData();
    }
};

UI._autoCompletarClienteOS = function () {
    const nomeInp = document.getElementById('os-cliente');
    const telInp = document.getElementById('os-telefone');
    const div = document.getElementById('os-cliente-sugestoes');
    if (!div) return;

    const termNome = (nomeInp?.value || '').toLowerCase().trim();
    const termTel = (telInp?.value || '').replace(/\D/g, '');

    if (termNome.length < 1 && termTel.length < 1) {
        div.innerHTML = '';
        return;
    }

    const clientes = dataManager.data.clientes || [];
    const encontrados = clientes.filter(c => {
        const matchNome = termNome.length >= 1 && (c.nome || '').toLowerCase().includes(termNome);
        const matchTel = termTel.length >= 1 && (c.telefone || '').replace(/\D/g, '').includes(termTel);
        return matchNome || matchTel;
    });

    if (encontrados.length > 0) {
        div.innerHTML = `<div style="font-size:12px;color:#10b981;font-weight:700;margin:6px 0;">✅ ${encontrados.length} cliente(s) encontrado(s). Clique para preencher:</div>` +
            encontrados.slice(0, 3).map(c => `
                <div onclick="UI._selecionarClienteOS('${c.nome.replace(/'/g, "\\'")}', '${c.telefone}')"
                     style="padding:8px 12px;background:rgba(255,255,255,0.08);border:1px solid #10b981;border-radius:8px;margin-top:4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong style="color:#FFF;font-size:14px">${c.nome}</strong>
                        <div style="font-size:12px;color:var(--text-muted)">📞 ${c.telefone || 'Sem tel'}</div>
                    </div>
                    <span style="color:#10b981;font-weight:bold;font-size:12px;">PREENCHER ✓</span>
                </div>
            `).join('');
    } else {
        div.innerHTML = `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">🆕 Cliente novo — será registrado com as informações acima</div>`;
    }
};

UI._selecionarClienteOS = function (nome, telefone) {
    const nomeInp = document.getElementById('os-cliente');
    const telInp = document.getElementById('os-telefone');
    const div = document.getElementById('os-cliente-sugestoes');
    if (nomeInp) nomeInp.value = nome;
    if (telInp) telInp.value = telefone;
    if (div) div.innerHTML = `<div style="font-size:12px;color:#10b981;font-weight:bold;margin-top:4px;">✅ Cliente preenchido: ${nome}</div>`;
};

