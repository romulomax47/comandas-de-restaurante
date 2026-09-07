import { useNavigate } from "react-router-dom";

function Admin() {
   const navigate = useNavigate();



   return (
      <main className="app">
         <header className="topo-pedido">
            <div>
               <p className="subtitulo">Administração</p>
               <h1>Painel administrativo</h1>
            </div>
         </header>

         <section className="painel-admin">
            <button
               type="button"
               className="card-admin"
               onClick={() => navigate("/admin/produtos")}
            >
               <strong>Produtos</strong>
               <span>
                  Cadastrar, editar, ativar e definir cozinha/bar
               </span>
            </button>

            <button
               type="button"
               className="card-admin"
               onClick={() => navigate("/admin/garcons")}
            >
               <strong>Garçons</strong>
               <span>
                  Cadastrar equipe, alterar chave e ativar/desativar
               </span>
            </button>

            <button
               type="button"
               className="card-admin"
               disabled
            >
               <strong>Relatórios</strong>
               <span>Em breve</span>
            </button>

            <button
               type="button"
               className="card-admin"
               disabled
            >
               <strong>Configurações</strong>
               <span>Em breve</span>
            </button>
         </section>
      </main>
   );
}

export default Admin;