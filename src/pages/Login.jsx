import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20));

function Login() {
   const [chave, setChave] = useState("");
   const [mensagem, setMensagem] = useState("");
   const [carregando, setCarregando] = useState(false);

   const navigate = useNavigate();

   function digitarNumero(numero) {
      setChave((valorAtual) => `${valorAtual}${numero}`);
      setMensagem("");
   }

   function limpar() {
      setChave("");
      setMensagem("");
   }

   async function entrar() {

      if (!chave) {
         setMensagem("Digite sua chave de acesso.");
         return;
      }



      setCarregando(true);

      const { data: garcom, error } = await supabase
         .from("garcons")
         .select("id, nome, ativo")
         .eq("chave", chave)
         .eq("ativo", true)
         .maybeSingle();

      setCarregando(false);

      console.log('Chave', chave)
      console.log('Erro', error)
      console.log('Garcom', garcom)

      if (error) {
         console.error("Erro no login:", error);
         setMensagem("Erro ao acessar o sistema.");
         return;
      }

      if (!garcom) {
         setMensagem("Chave inválida.");
         setChave("");
         return;
      }


      localStorage.setItem("garcom", JSON.stringify(garcom));

      navigate("/home");
   }

   return (
      <main className="login-page">
         <section className="login-card">
            <p className="subtitulo">RM Comandas</p>
            <h1>Acesso do garçom</h1>

            <div className="visor-chave">
               {chave ? "•".repeat(chave.length) : "—"}
            </div>

            <div className="teclado-numerico">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => (
                  <button
                     key={numero}
                     type="button"
                     onClick={() => digitarNumero(numero)}
                  >
                     {numero}
                  </button>
               ))}

               <button
                  type="button"
                  className="botao-limpar"
                  onClick={limpar}
               >
                  Limpar
               </button>

               <button
                  type="button"
                  onClick={() => digitarNumero(0)}
               >
                  0
               </button>

               <button
                  type="button"
                  className="botao-entrar"
                  disabled={carregando}
                  onClick={entrar}
               >
                  {carregando ? "..." : "Entrar"}
               </button>
            </div>

            {mensagem && (
               <p className="mensagem-formulario">{mensagem}</p>
            )}
         </section>
      </main>
   );
}

export default Login;