import { supabase } from "../lib/supabase";

export async function abrirComanda(mesaId) {
  const { data, error } = await supabase.rpc("obter_ou_abrir_comanda", {
    p_mesa_id: mesaId,
  });
  if (error) throw error;
  return data;
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

export async function solicitarFechamento(comandaId) {
  const { error } = await supabase.rpc("solicitar_fechamento_atomico", {
    p_comanda_id: comandaId,
  });
  if (error) throw error;
}

export async function lancarPedido(comandaId, itens) {
  const { data, error } = await supabase.rpc("lancar_pedido", {
    p_comanda_id: comandaId,
    p_itens: itens.map((item) => ({
      produto_id: item.id,
      quantidade: item.quantidade,
      observacao: item.observacao || null,
    })),
  });
  if (error) throw error;
  return data;
}
