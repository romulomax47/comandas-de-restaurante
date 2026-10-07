import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Método não permitido", { status: 405, headers: corsHeaders });

  try {
    const { pin } = await request.json();
    if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
      return Response.json({ error: "PIN inválido" }, { status: 400, headers: corsHeaders });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
    const identificador = await sha256(ip);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: perfis, error } = await admin.rpc("verificar_pin", {
      p_pin: pin,
      p_identificador: identificador,
    });
    const perfil = perfis?.[0];
    if (error || !perfil?.email) {
      return Response.json({ error: error?.message || "PIN inválido" }, { status: 401, headers: corsHeaders });
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: perfil.email,
    });
    if (linkError || !link?.properties?.hashed_token) throw linkError || new Error("Não foi possível criar a sessão");

    return Response.json({ token_hash: link.properties.hashed_token }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: "Não foi possível autenticar" }, { status: 500, headers: corsHeaders });
  }
});
