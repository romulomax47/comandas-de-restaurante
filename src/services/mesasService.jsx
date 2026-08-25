import { supabase } from "../lib/supabase";

export async function buscarOuCriarMesa(numero) {
  const numeroMesa = Number(numero);

  if (!numeroMesa || numeroMesa <= 0) {
    throw new Error("Número de mesa inválido.");
  }

  const { data: mesaExistente, error: erroBusca } = await supabase
    .from("mesas")
    .select("id, numero, status, comanda_ativa_id")
    .eq("numero", numeroMesa)
    .maybeSingle();

  if (erroBusca) {
    throw erroBusca;
  }

  if (mesaExistente) {
    if (mesaExistente.status === "fechamento") {
      throw new Error(
        `A Mesa ${numeroMesa} está em fechamento.`
      );
    }

    return mesaExistente;
  }

  const { data: novaMesa, error: erroCriacao } = await supabase
    .from("mesas")
    .insert({
      numero: numeroMesa,
      status: "livre",
    })
    .select("id, numero, status, comanda_ativa_id")
    .single();

  if (erroCriacao) {
    throw erroCriacao;
  }

  return novaMesa;
}