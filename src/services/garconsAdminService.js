import { supabase } from "../lib/supabase";

export async function listarGarcons() {
  const { data, error } = await supabase
    .from("garcons")
    .select("*")
    .order("nome");

  if (error) throw error;

  return data ?? [];
}

export async function criarGarcom(garcom) {
  const { data, error } = await supabase
    .from("garcons")
    .insert(garcom)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarGarcom(id, dados) {
  const { data, error } = await supabase
    .from("garcons")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function alterarStatusGarcom(id, ativo) {
  return atualizarGarcom(id, { ativo });
}