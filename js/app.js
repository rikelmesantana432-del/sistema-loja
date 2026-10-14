// ====================================
// STRATEGYOS 3.0 - APP INIT
// ====================================

(function () {
    'use strict';

    // Inicializar aplicação
    document.addEventListener('DOMContentLoaded', function () {
        console.log('StrategyOS 3.0 — Carregando...');
        
        // Tratar da segurança online com senha "1977"
        if (sessionStorage.getItem('strategyos_session') === 'authenticated') {
            document.body.classList.remove('locked');
            UI.init();
            console.log('StrategyOS 3.0 — Pronto!');
        } else {
            document.body.classList.add('locked');
            mostrarTelaBloqueio();
        }
    });

    // Ripple effect em todos os botões
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn, .nav-btn, .vendedor-btn-pag, .vendedor-produto-btn, .lock-key');
        if (!btn) return;

        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.5s linear;
            pointer-events: none;
        `;

        const currentPos = window.getComputedStyle(btn).position;
        if (currentPos === 'static') btn.style.position = 'relative';

        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });

    // Função para renderizar e controlar a tela de bloqueio cyberpunk
    function mostrarTelaBloqueio() {
        const lock = document.createElement('div');
        lock.id = 'lock-screen';
        lock.className = 'lock-screen-overlay';
        lock.innerHTML = `
            <div class="lock-screen-container" id="lock-container">
                <div class="lock-title">StrategyOS 3.0</div>
                <div class="lock-subtitle">Acesso Restrito — Cesinha Acessórios</div>
                
                <div class="lock-dots-container">
                    <div class="lock-dot" id="dot-0"></div>
                    <div class="lock-dot" id="dot-1"></div>
                    <div class="lock-dot" id="dot-2"></div>
                    <div class="lock-dot" id="dot-3"></div>
                </div>
                
                <div class="lock-keyboard">
                    <button class="lock-key num-key" data-val="1">1</button>
                    <button class="lock-key num-key" data-val="2">2</button>
                    <button class="lock-key num-key" data-val="3">3</button>
                    <button class="lock-key num-key" data-val="4">4</button>
                    <button class="lock-key num-key" data-val="5">5</button>
                    <button class="lock-key num-key" data-val="6">6</button>
                    <button class="lock-key num-key" data-val="7">7</button>
                    <button class="lock-key num-key" data-val="8">8</button>
                    <button class="lock-key num-key" data-val="9">9</button>
                    <button class="lock-key action-key delete" id="btn-del">Limpar</button>
                    <button class="lock-key num-key" data-val="0">0</button>
                    <button class="lock-key action-key enter" id="btn-ent">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(lock);

        let senhaDigitada = '';

        const atualizarInterface = () => {
            for (let i = 0; i < 4; i++) {
                const dot = document.getElementById(`dot-${i}`);
                if (dot) {
                    if (i < senhaDigitada.length) {
                        dot.classList.add('filled');
                    } else {
                        dot.classList.remove('filled');
                    }
                }
            }
        };

        const registrarDigito = (val) => {
            if (senhaDigitada.length < 4) {
                senhaDigitada += val;
                atualizarInterface();
                tocarDigitoTone();
                if (senhaDigitada.length === 4) {
                    setTimeout(verificarSenha, 200);
                }
            }
        };

        const limparSenha = () => {
            senhaDigitada = '';
            atualizarInterface();
            tocarDelTone();
        };

        const verificarSenha = () => {
            if (senhaDigitada === '1977') {
                tocarSucessoTone();
                sessionStorage.setItem('strategyos_session', 'authenticated');
                document.body.classList.remove('locked');
                
                // Transição suave para fechar a tela de bloqueio
                lock.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                lock.style.opacity = '0';
                lock.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    lock.remove();
                    UI.init();
                }, 400);
            } else {
                tocarErroTone();
                const container = document.getElementById('lock-container');
                if (container) {
                    container.classList.add('lock-shake');
                    setTimeout(() => container.classList.remove('lock-shake'), 400);
                }
                senhaDigitada = '';
                atualizarInterface();
            }
        };

        // Event listeners para o teclado numérico
        lock.querySelectorAll('.num-key').forEach(btn => {
            btn.addEventListener('click', () => registrarDigito(btn.dataset.val));
        });

        const delBtn = document.getElementById('btn-del');
        if (delBtn) delBtn.addEventListener('click', limparSenha);

        const entBtn = document.getElementById('btn-ent');
        if (entBtn) entBtn.addEventListener('click', verificarSenha);

        // Suporte a teclado físico
        const keyHandler = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                registrarDigito(e.key);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                limparSenha();
            } else if (e.key === 'Enter') {
                verificarSenha();
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Remover o event listener de keydown ao autenticar
        const originalInit = UI.init;
        UI.init = function() {
            document.removeEventListener('keydown', keyHandler);
            originalInit.call(UI);
        };
    }

    // Tons de áudio synth baseados em frequências para feedback do teclado
    function tocarDigitoTone() {
        emitirTom(523.25, 0.08); // C5
    }

    function tocarDelTone() {
        emitirTom(261.63, 0.12); // C4
    }

    function tocarErroTone() {
        emitirTom(150, 0.25, 'sawtooth');
        setTimeout(() => emitirTom(120, 0.25, 'sawtooth'), 100);
    }

    function tocarSucessoTone() {
        emitirTom(523.25, 0.1); // C5
        setTimeout(() => emitirTom(659.25, 0.1), 100); // E5
        setTimeout(() => emitirTom(783.99, 0.1), 200); // G5
        setTimeout(() => emitirTom(1046.50, 0.15), 300); // C6
    }

    function emitirTom(freq, dur, type = 'sine') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + dur);
        } catch(e) {}
    }

})();
