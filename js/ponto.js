import { supabase } from './supabaseClient.js';

async function agoraBrasilia() {
  const { data, error } = await supabase.rpc('agora_brasilia');
  if (error) throw error;
  if (!Array.isArray(data) || !data[0]) throw new Error('Falha ao obter horario de Brasilia no servidor.');
  return data[0];
}

export async function dataHojeBrasilia() {
  const { data } = await agoraBrasilia();
  return data;
}

export async function buscarPontoDoDia(funcionarioId, data = null) {
  const dataAlvo = data || await dataHojeBrasilia();

  const { data: ponto, error } = await supabase
    .from('pontos')
    .select('*')
    .eq('funcionario_id', funcionarioId)
    .eq('data', dataAlvo)
    .maybeSingle();

  if (error) throw error;
  return ponto;
}

export async function registrarEntrada(funcionarioId, data = null) {
  const agora = await agoraBrasilia();
  const payload = {
    funcionario_id: funcionarioId,
    data: data || agora.data,
    entrada: agora.hora
  };

  const { data: ponto, error } = await supabase
    .from('pontos')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return ponto;
}

export async function iniciarIntervalo(pontoId) {
  const { hora } = await agoraBrasilia();
  const { data, error } = await supabase
    .from('pontos')
    .update({ inicio_intervalo: hora })
    .eq('id', pontoId)
    .is('inicio_intervalo', null)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function finalizarIntervalo(pontoId) {
  const { hora } = await agoraBrasilia();
  const { data, error } = await supabase
    .from('pontos')
    .update({ fim_intervalo: hora })
    .eq('id', pontoId)
    .not('inicio_intervalo', 'is', null)
    .is('fim_intervalo', null)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function registrarSaida(pontoId) {
  const { hora } = await agoraBrasilia();
  const { data, error } = await supabase
    .from('pontos')
    .update({ saida: hora })
    .eq('id', pontoId)
    .not('entrada', 'is', null)
    .is('saida', null)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function estadoBotoes(ponto) {
  return {
    podeRegistrarEntrada: !ponto,
    podeIniciarIntervalo: Boolean(ponto?.entrada && !ponto?.inicio_intervalo),
    podeFinalizarIntervalo: Boolean(ponto?.inicio_intervalo && !ponto?.fim_intervalo),
    podeRegistrarSaida: Boolean(ponto?.entrada && !ponto?.saida)
  };
}
