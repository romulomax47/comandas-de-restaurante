import { supabase } from "../lib/supabase";

export async function listarItensDaComanda(comandaId) {
   const { data, error } = await supabase
      .from("itens_pedido")
      .select(`
      id,
      quantidade,
      preco_unitario,
      status,
      observacao,
      produtos (
        nome
      ),
      garcons!itens_pedido_lancado_por_fkey (
        nome
      )
    `)
      .eq("comanda_id", comandaId)
      .order("id");

   if (error) {
      throw error;
   }

   return data ?? [];
}

export async function adicionarItensNaComanda(itens) {
   const { error } = await supabase
      .from("itens_pedido")
      .insert(itens);

   if (error) {
      throw error;
   }
}