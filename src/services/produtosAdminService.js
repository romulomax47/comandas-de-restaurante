import { supabase } from "../lib/supabase";

export async function listarTodosProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome");

  if (error) throw error;

  return data ?? [];
}

export async function criarProduto(produto) {
  const { data, error } = await supabase
    .from("produtos")
    .insert(produto)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarProduto(id, dados) {
  const { data, error } = await supabase
    .from("produtos")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function alterarStatusProduto(id, ativo) {
  const { data, error } = await supabase
    .from("produtos")
    .update({ ativo })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}