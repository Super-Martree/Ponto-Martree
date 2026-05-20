export function toMinutes(timeString) {
  if (!timeString) return null;
  const [h, m] = timeString.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) return '--:--';
  const sign = totalMinutes < 0 ? '-' : '';
  const abs = Math.abs(totalMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseDateUTC(dateString) {
  return new Date(`${dateString}T00:00:00Z`);
}

export function getInicioSemanaISO(data) {
  const d = parseDateUTC(data);
  const dia = d.getUTCDay();
  const diffParaSegunda = dia === 0 ? -6 : 1 - dia;
  d.setUTCDate(d.getUTCDate() + diffParaSegunda);
  return d.toISOString().slice(0, 10);
}

function trabalhaSabadoNaSemana(funcionario, data, escalaSabadoMap) {
  const semanaInicio = getInicioSemanaISO(data);
  const funcionarioId = funcionario?.id;
  if (funcionarioId && escalaSabadoMap) {
    const key = `${funcionarioId}|${semanaInicio}`;
    if (escalaSabadoMap.has(key)) return escalaSabadoMap.get(key);
  }

  return false;
}

export function getMetaDiaria(funcionario, data, options = {}) {
  const { escalaSabadoMap } = options;
  const diaSemana = parseDateUTC(data).getUTCDay();
  const semanaComSabado = trabalhaSabadoNaSemana(funcionario, data, escalaSabadoMap);

  if (diaSemana === 0) return 0;
  if (semanaComSabado && diaSemana >= 1 && diaSemana <= 6) return 440; // semana com sabado: seg-sab 7h20
  if (diaSemana === 6) return 0;
  if (diaSemana === 2) return 480; // terca 8h
  return 540; // segunda, quarta, quinta e sexta 9h
}

export function calcularHorasTrabalhadas(ponto) {
  if (!ponto?.entrada || !ponto?.saida) return null;

  const entrada = toMinutes(ponto.entrada);
  const saida = toMinutes(ponto.saida);

  if (entrada === null || saida === null || saida < entrada) return null;

  let intervalo = 0;
  if (ponto.inicio_intervalo && ponto.fim_intervalo) {
    const inicio = toMinutes(ponto.inicio_intervalo);
    const fim = toMinutes(ponto.fim_intervalo);
    if (inicio !== null && fim !== null && fim >= inicio) {
      intervalo = fim - inicio;
    }
  }

  return saida - entrada - intervalo;
}

export function calcularSaldoDia(meta, horasTrabalhadas) {
  if (horasTrabalhadas === null || horasTrabalhadas === undefined) return null;
  return horasTrabalhadas - meta;
}

export function calcularSaldoMes(listaPontos) {
  const totals = {
    totalMinutosTrabalhados: 0,
    totalMetaMinutos: 0,
    saldoAcumulado: 0,
    saldoPositivo: 0,
    saldoNegativo: 0
  };

  for (const item of listaPontos) {
    const horas = item.horasTrabalhadasMinutos ?? calcularHorasTrabalhadas(item);
    const meta = item.metaMinutos ?? getMetaDiaria(item.funcionario || item, item.data);

    if (horas !== null) {
      const saldo = calcularSaldoDia(meta, horas) || 0;
      totals.totalMinutosTrabalhados += horas;
      totals.totalMetaMinutos += meta;
      totals.saldoAcumulado += saldo;
      if (saldo > 0) totals.saldoPositivo += saldo;
      if (saldo < 0) totals.saldoNegativo += saldo;
    }
  }

  return totals;
}
