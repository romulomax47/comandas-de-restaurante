import { supabase } from "../lib/supabase";

export async function listarProdutosAtivos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, preco, categoria, setor, ativo")
    .eq("ativo", true)
    .order("nome");

  if (error) {
    throw error;
  }

  return data ?? [];
}