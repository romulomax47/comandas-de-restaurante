import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const funcoes = ["garcom", "cozinha", "caixa", "proprietario"];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Método não permitido", { status: 405, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Não autenticado" }, { status: 401, headers: corsHeaders });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData } = await admin.auth.getUser(token);
  if (!authData.user) return Response.json({ error: "Sessão inválida" }, { status: 401, headers: corsHeaders });

  const { data: operador } = await admin.from("garcons").select("id, funcao, ativo").eq("auth_user_id", authData.user.id).single();
  if (!operador?.ativo || operador.funcao !== "proprietario") {
    return Response.json({ error: "Acesso negado" }, { status: 403, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    if (!body.nome?.trim() || !funcoes.includes(body.funcao)) throw new Error("Dados inválidos");
    if (body.pin && !/^\d{4,8}$/.test(body.pin)) throw new Error("O PIN deve ter de 4 a 8 dígitos");

    let garcomId = body.id;
    if (body.id) {
      if (body.id === operador.id && (body.ativo === false || body.funcao !== "proprietario")) {
        throw new Error("O proprietário conectado não pode remover o próprio acesso");
      }
      const { data: existente, error: buscaError } = await admin.from("garcons").select("auth_user_id").eq("id", body.id).single();
      if (buscaError) throw buscaError;
      if (existente.auth_user_id && (body.email || body.senha)) {
        const atributos: Record<string, string> = {};
        if (body.email) atributos.email = body.email.trim();
        if (body.senha) atributos.password = body.senha;
        const { error } = await admin.auth.admin.updateUserById(existente.auth_user_id, atributos);
        if (error) throw error;
      }
      const { error } = await admin.from("garcons").update({
        nome: body.nome.trim(), funcao: body.funcao, ativo: body.ativo !== false,
        ...(body.email ? { email: body.email.trim() } : {}),
      }).eq("id", body.id);
      if (error) throw error;
    } else {
      if (!body.email?.trim() || !body.senha || !body.pin) throw new Error("E-mail, senha e PIN são obrigatórios");
      const { data: novoUsuario, error: authError } = await admin.auth.admin.createUser({
        email: body.email.trim(), password: body.senha, email_confirm: true,
        user_metadata: { nome: body.nome.trim() },
      });
      if (authError) throw authError;
      const { data: perfil, error } = await admin.from("garcons").insert({
        auth_user_id: novoUsuario.user.id, email: body.email.trim(), nome: body.nome.trim(),
        funcao: body.funcao, ativo: true, chave: null,
      }).select("id").single();
      if (error) {
        await admin.auth.admin.deleteUser(novoUsuario.user.id);
        throw error;
      }
      garcomId = perfil.id;
    }

    if (body.pin) {
      const { error } = await admin.rpc("definir_pin_garcom", { p_garcom_id: garcomId, p_pin: body.pin });
      if (error) throw error;
    }
    const { data: perfil, error } = await admin.from("garcons")
      .select("id, nome, email, funcao, ativo, auth_user_id").eq("id", garcomId).single();
    if (error) throw error;
    return Response.json(perfil, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao salvar usuário" }, { status: 400, headers: corsHeaders });
  }
});
