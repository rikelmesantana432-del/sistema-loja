// Utilitários de data no fuso da loja (America/Bahia)

export const DIA_ZERAMENTO = 6;
export const META_OBJETIVO = 7000;

export function hojeLocal(dataObj = new Date()) {
    return new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(dataObj);
}

export function diaSemanaLocal(dataObj = new Date()) {
    const nome = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bahia', weekday: 'short' }).format(dataObj);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(nome);
}

export function dataYMDDeValor(valor) {
    if (!valor) return '';
    const ts = typeof valor === 'number' ? valor : Date.parse(valor);
    if (!Number.isNaN(ts) && String(valor).length > 10) return hojeLocal(new Date(ts));
    return String(valor).substring(0, 10);
}

export function formatarBR(ymd) {
    const [a, m, d] = ymd.split('-');
    return `${d}/${m}/${a}`;
}

export function mesAnterior(anoMes) {
    let [a, m] = anoMes.split('-').map(Number);
    m -= 1;
    if (m === 0) { m = 12; a -= 1; }
    return `${a}-${String(m).padStart(2, '0')}`;
}

// Ciclo mensal: do dia 6 de um mês até o dia 5 do mês seguinte
export function chaveCicloMensal(ymd) {
    const dia = parseInt(ymd.substring(8, 10), 10);
    const anoMes = ymd.substring(0, 7);
    const base = dia >= DIA_ZERAMENTO ? anoMes : mesAnterior(anoMes);
    return `${base}-dia06`;
}

export function R(v) {
    const n = Number(v) || 0;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
