import { supabase } from "../lib/supabase";

export async function listarPagamentos(comandaId) {
   const { data, error } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("comanda_id", comandaId)
      .order("criado_em");

   if (error) throw error;

   return data ?? [];
}

export async function registrarPagamento({
   comandaId,
   valor,
   forma,
}) {
   const { data, error } = await supabase.rpc("registrar_pagamento_atomico", {
      p_comanda_id: comandaId,
      p_valor: valor,
      p_forma: forma,
   });

   if (error) throw error;

   return data;
}

export async function finalizarComanda(comandaId, forma) {
   const { error } = await supabase.rpc("finalizar_comanda_atomico", {
      p_comanda_id: comandaId,
      p_forma: forma,
   });
   if (error) throw error;
}
