import { supabase } from "../lib/supabase";

export async function listarGarcons() {
  const { data, error } = await supabase
    .from("garcons")
    .select("id, nome, email, funcao, ativo, auth_user_id")
    .order("nome");

  if (error) throw error;

  return data ?? [];
}

async function salvarUsuario(dados) {
  const { data, error } = await supabase.functions.invoke("user-admin", {
    body: dados,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function criarGarcom(garcom) {
  return salvarUsuario(garcom);
}

export function atualizarGarcom(id, dados) {
  return salvarUsuario({ id, ...dados });
}

export function alterarStatusGarcom(garcom, ativo) {
  return salvarUsuario({
    id: garcom.id,
    nome: garcom.nome,
    email: garcom.email,
    funcao: garcom.funcao,
    ativo,
  });
}
