import { supabase } from "../lib/supabase";

export async function buscarOuCriarMesa(numero) {
  const numeroMesa = Number(numero);

  if (!numeroMesa || numeroMesa <= 0) {
    throw new Error("Número de mesa inválido.");
  }

  const { data, error } = await supabase.rpc("buscar_ou_criar_mesa", {
    p_numero: numeroMesa,
  });
  if (error) throw error;
  return data;
}
