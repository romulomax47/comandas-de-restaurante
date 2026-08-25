import { supabase } from "../lib/supabase";

export async function criarLancamento(comandaId, garcomId) {
  const { data, error } = await supabase
    .from("lancamentos")
    .insert({
      comanda_id: comandaId,
      lancado_por: garcomId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}