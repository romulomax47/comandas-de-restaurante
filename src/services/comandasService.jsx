import { supabase } from "../lib/supabase";

export async function abrirComanda(mesaId, garcomId) {
  const { data: comandaExistente, error: erroBusca } = await supabase
    .from("comandas")
    .select(`
      *,
      garcons!comandas_garcom_id_fkey (
        id,
        nome
      )
    `)
    .eq("mesa_id", mesaId)
    .eq("status", "aberta")
    .maybeSingle();

  if (erroBusca) {
    throw erroBusca;
  }

  if (comandaExistente) {
    return comandaExistente;
  }

  const { data: novaComanda, error: erroCriacao } = await supabase
    .from("comandas")
    .insert({
      mesa_id: mesaId,
      status: "aberta",
      total: 0,
      aberta_por: garcomId,
    })
    .select(`
      *,
      garcons!comandas_garcom_id_fkey (
        id,
        nome
      )
    `)
    .single();

  if (erroCriacao) {
    throw erroCriacao;
  }

  return novaComanda;
}

export async function atualizarTotalComanda(comandaId, total) {
  const { data, error } = await supabase
    .from("comandas")
    .update({ total })
    .eq("id", comandaId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}