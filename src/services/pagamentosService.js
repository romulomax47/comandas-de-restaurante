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
   const { data, error } = await supabase
      .from("pagamentos")
      .insert({
         comanda_id: comandaId,
         valor,
         forma,
      })
      .select()
      .single();

   if (error) throw error;

   return data;
}