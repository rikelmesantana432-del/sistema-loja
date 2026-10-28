// Teste local dos relatórios do Worker com o backup real
import fs from 'fs';
import { montarFechamentoDiario, montarResumoCiclo } from '../src/relatorios.js';
import { chaveCicloMensal, hojeLocal } from '../src/datas.js';

const state = JSON.parse(fs.readFileSync('c:/Users/rikel/Downloads/sistema loja/backup_recuperado_2026-10-23.json', 'utf8'));
let falhas = 0;
const ok = (c, n) => { console.log(`${c ? '✅' : '❌'} ${n}`); if (!c) falhas++; };

const f = montarFechamentoDiario(state, '2026-10-22');
console.log(f.texto.substring(0, 600), '\n...');
ok(f.qtdVendas > 0 && f.totalDia > 0, `Fechamento 22/10 com vendas reais: ${f.qtdVendas} itens, total ${f.totalDia}`);
ok(f.texto.length < 4096, `Mensagem dentro do limite do Telegram (${f.texto.length} caracteres)`);

const c = montarResumoCiclo(state, '2026-11-06');
console.log('\n' + c.texto);
ok(c.cicloAtual === '2026-11-dia06', 'Chave do ciclo de 06/11');
ok(chaveCicloMensal('2026-11-05') === '2026-10-dia06', 'Dia 5 pertence ao ciclo anterior');
ok(/^\d{4}-\d{2}-\d{2}$/.test(hojeLocal()), `hojeLocal Bahia: ${hojeLocal()}`);

process.exit(falhas ? 1 : 0);
