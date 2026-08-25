import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Cozinha() {
   const [pedidos, setPedidos] = useState([]);
   const [carregando, setCarregando] = useState(true);

   useEffect(() => {
      async function carregarPedidos() {
         const { data, error } = await supabase
            .from("comanda")
            .select(`
        id,
        mesa_id,
        status,
        total,
        observacao,
        criado_em,
        itens_pedido (
          id,
          quantidade,
          preco_unitario,
          produtos (
            nome
          )
        )
      `)
            .order("criado_em", { ascending: true });

         console.log("Pedidos completos:", data);
         console.log("Erro ao carregar pedidos:", error);

         if (error) {
            setCarregando(false);
            return;
         }

         setPedidos(data ?? []);
         setCarregando(false);
      }

      carregarPedidos();
   }, []);

   if (carregando) {
      return (
         <main className="app">
            <p>Carregando pedidos...</p>
         </main>
      );
   }

   async function atualizarStatus(pedidoId, novoStatus) {
      const { error } = await supabase
         .from("comanda")
         .update({ status: novoStatus })
         .eq("id", pedidoId);

      if (error) {
         console.error("Erro ao atualizar status:", error);
         alert("Não foi possível atualizar o pedido.");
         return;
      }

      setPedidos((pedidosAtuais) =>
         pedidosAtuais.map((pedido) =>
            pedido.id === pedidoId
               ? { ...pedido, status: novoStatus }
               : pedido
         )
      );
   }



   return (
      <main className="app">
         <header className="topo-pedido">
            <div>
               <p className="subtitulo">Operação</p>
               <h1>Tela da cozinha</h1>
            </div>
         </header>

         {pedidos.length === 0 ? (
            <p>Nenhum pedido aguardando preparo.</p>
         ) : (
            <section className="grade-pedidos">
               {pedidos.map((pedido) => (
                  <article className="pedido-cozinha" key={pedido.id}>
                     <div className="pedido-cabecalho">
                        <div>
                           <small>Pedido #{pedido.id}</small>
                           <h2>Mesa {pedido.mesa_id}</h2>
                        </div>

                        <span className={`status status-${pedido.status}`}>
                           {pedido.status}
                        </span>
                     </div>

                     <div className="itens-cozinha">
                        {pedido.itens_pedido.map((item) => (
                           <p key={item.id}>
                              {item.quantidade}x {item.produtos?.nome}
                           </p>
                        ))}
                     </div>

                     <strong>Total: R$ {Number(pedido.total).toFixed(2)}</strong>
                     <div className="acoes-pedido">
                        {pedido.status === "novo" && (
                           <button
                              type="button"
                              onClick={() => atualizarStatus(pedido.id, "em_preparo")}
                           >
                              Iniciar preparo
                           </button>
                        )}

                        {pedido.status === "em_preparo" && (
                           <button
                              type="button"
                              onClick={() => atualizarStatus(pedido.id, "pronto")}
                           >
                              Marcar como pronto
                           </button>
                        )}

                        {pedido.status === "pronto" && (
                           <span>✅ Pedido pronto</span>
                        )}
                     </div>
                  </article>
               ))}
            </section>
         )}
      </main>
   );
}

export default Cozinha;