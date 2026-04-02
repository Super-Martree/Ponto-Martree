import { supabase } from './supabaseClient.js';

export async function listarFuncionarios() {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data;
}

export async function salvarPontoManual(ponto) {
  const payload = {
    funcionario_id: ponto.funcionario_id,
    data: ponto.data,
    entrada: ponto.entrada || null,
    inicio_intervalo: ponto.inicio_intervalo || null,
    fim_intervalo: ponto.fim_intervalo || null,
    saida: ponto.saida || null
  };

  const { data, error } = await supabase
    .from('pontos')
    .upsert(payload, { onConflict: 'funcionario_id,data' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listarPontosPorMes({ anoMes, funcionarioId }) {
  const [ano, mes] = anoMes.split('-').map(Number);
  const proximoMes = new Date(ano, mes, 1);
  const fim = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, '0')}-01`;

  let query = supabase
    .from('pontos')
    .select('*, funcionarios(id, nome, trabalha_sabado)')
    .gte('data', `${anoMes}-01`)
    .lt('data', fim)
    .order('data', { ascending: true });

  if (funcionarioId) query = query.eq('funcionario_id', funcionarioId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function relatorioDiario({ data, funcionarioId }) {
  let query = supabase
    .from('funcionarios')
    .select('id, nome, trabalha_sabado, pontos!left(data, entrada, saida, inicio_intervalo, fim_intervalo)')
    .order('nome', { ascending: true });

  if (funcionarioId) query = query.eq('id', funcionarioId);

  const { data: funcionarios, error } = await query;
  if (error) throw error;

  return funcionarios.map((f) => {
    const pontoDia = (f.pontos || []).find((p) => p.data === data) || null;
    return {
      funcionario: {
        id: f.id,
        nome: f.nome,
        trabalha_sabado: f.trabalha_sabado
      },
      ponto: pontoDia
    };
  });
}

export async function salvarEscalaSabadoSemanal({ funcionarioId, semanaInicio, trabalhaSabado }) {
  const payload = {
    funcionario_id: funcionarioId,
    semana_inicio: semanaInicio,
    trabalha_sabado: Boolean(trabalhaSabado)
  };

  const { data, error } = await supabase
    .from('escala_sabado_semanal')
    .upsert(payload, { onConflict: 'funcionario_id,semana_inicio' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listarEscalaSabadoSemanal({ inicio, fim, funcionarioId }) {
  let query = supabase
    .from('escala_sabado_semanal')
    .select('*')
    .gte('semana_inicio', inicio)
    .lt('semana_inicio', fim)
    .order('semana_inicio', { ascending: true });

  if (funcionarioId) query = query.eq('funcionario_id', funcionarioId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
