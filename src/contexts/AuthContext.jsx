import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContextObject";

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil(session) {
      if (!session?.user) {
        if (ativo) {
          setSessao(null);
          setUsuario(null);
          setCarregando(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("garcons")
        .select("id, nome, ativo, funcao, auth_user_id")
        .eq("auth_user_id", session.user.id)
        .eq("ativo", true)
        .single();

      if (!ativo) return;

      if (error || !data) {
        await supabase.auth.signOut();
        setSessao(null);
        setUsuario(null);
      } else {
        setSessao(session);
        setUsuario(data);
      }
      setCarregando(false);
    }

    supabase.auth.getSession().then(({ data }) => carregarPerfil(data.session));
    const { data: assinatura } = supabase.auth.onAuthStateChange(
      (_evento, session) => carregarPerfil(session)
    );

    return () => {
      ativo = false;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ sessao, usuario, carregando, sair }}>
      {children}
    </AuthContext.Provider>
  );
}
