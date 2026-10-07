import { supabase } from "../lib/supabase";

export async function entrarComEmail(email, senha) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });
  if (error) throw error;
}

export async function entrarComPin(pin) {
  const { data, error } = await supabase.functions.invoke("pin-login", {
    body: { pin },
  });
  if (error) throw error;
  if (!data?.token_hash) throw new Error("Resposta de autenticação inválida.");

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: "magiclink",
  });
  if (verifyError) throw verifyError;
}
