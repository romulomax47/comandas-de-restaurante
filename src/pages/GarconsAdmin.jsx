import { useEffect, useState } from "react";
import {
   listarGarcons,
   criarGarcom,
   atualizarGarcom,
   alterarStatusGarcom,
} from "../services/garconsAdminService";

function GarconsAdmin() {
   const [garcons, setGarcons] = useState([]);

   const [nome, setNome] = useState("");
   const [chave, setChave] = useState("");
   const [garcomEditando, setGarcomEditando] = useState(null);
   const [mensagem, setMensagem] = useState("");

   async function carregarGarcons() {
      try {
         const dados = await listarGarcons();
         setGarcons(dados);
      } catch (error) {
         console.error("Erro ao carregar garçons:", error);
      }
   }

   useEffect(() => {
      carregarGarcons();
   }, []);

   async function salvarGarcom(evento) {
      evento.preventDefault();

      if (!nome.trim() || !chave.trim()) {
         setMensagem("Preencha nome e chave.");
         return;
      }

      try {
         if (garcomEditando) {
            const atualizado = await atualizarGarcom(
               garcomEditando.id,
               {
                  nome: nome.trim(),
                  chave: chave.trim(),
               }
            );

            setGarcons((atuais) =>
               atuais.map((garcom) =>
                  garcom.id === atualizado.id
                     ? atualizado
                     : garcom
               )
            );

            setMensagem("Garçom atualizado com sucesso.");
            setGarcomEditando(null);
         } else {
            const novoGarcom = await criarGarcom({
               nome: nome.trim(),
               chave: chave.trim(),
               ativo: true,
            });

            setGarcons((atuais) => [...atuais, novoGarcom]);

            setMensagem("Garçom cadastrado com sucesso.");
         }

         setNome("");
         setChave("");
      } catch (error) {
         console.error("Erro ao salvar garçom:", error);
         setMensagem("Não foi possível salvar o garçom.");
      }
   }

   function iniciarEdicao(garcom) {
      setGarcomEditando(garcom);
      setNome(garcom.nome);
      setChave(garcom.chave);
      setMensagem("");
   }

   async function alternarAtivo(garcom) {
      try {
         const atualizado = await alterarStatusGarcom(
            garcom.id,
            !garcom.ativo
         );

         setGarcons((atuais) =>
            atuais.map((item) =>
               item.id === atualizado.id
                  ? atualizado
                  : item
            )
         );
      } catch (error) {
         console.error("Erro ao alterar garçom:", error);
      }
   }

   return (
      <main className="app">
         <header className="topo-pedido">
            <div>
               <p className="subtitulo">Administração</p>
               <h1>Garçons</h1>
            </div>
         </header>

         <form onSubmit={salvarGarcom}>
            <input
               type="text"
               placeholder="Nome"
               value={nome}
               onChange={(e) => setNome(e.target.value)}
            />

            <input
               type="password"
               placeholder="Chave de acesso"
               value={chave}
               onChange={(e) => setChave(e.target.value)}
            />

            <button type="submit">
               {garcomEditando
                  ? "Salvar alterações"
                  : "Cadastrar garçom"}
            </button>
         </form>

         {mensagem && <p>{mensagem}</p>}

         <section>
            <h2>Garçons cadastrados</h2>

            {garcons.map((garcom) => (
               <div key={garcom.id}>
                  <strong>{garcom.nome}</strong>

                  <span>
                     {" "}
                     — {garcom.ativo ? "Ativo" : "Inativo"}
                  </span>

                  <button
                     type="button"
                     onClick={() => iniciarEdicao(garcom)}
                  >
                     Editar
                  </button>

                  <button
                     type="button"
                     onClick={() => alternarAtivo(garcom)}
                  >
                     {garcom.ativo ? "Desativar" : "Ativar"}
                  </button>
               </div>
            ))}
         </section>
      </main>
   );
}

export default GarconsAdmin;