import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Caixa() {
   const [comandas, setComandas] = useState([]);
   const [carregando, setCarregando] = useState(true);
   const [formasPagamento, setFormasPagamento] = useState({});

   async function carregarComandas() {
      setCarregando(true);

      const { data, error } = await supabase
         .from("comandas")
         .select(`
        id,
        mesa_id,
        total,
        status,
        fechada_em,
        mesas!pedidos_mesa_id_fkey (
          id,
          numero
        ),
        itens_pedido (
          id,
          quantidade,
          preco_unitario,
          produtos (
            nome
          )
        )
      `)
         .eq("status", "fechamento")
         .order("id", { ascending: true });

      if (error) {
         console.error("Erro ao carregar comandas:", error);
         setCarregando(false);
         return;
      }

      setComandas(data ?? []);
      setCarregando(false);
   }

   async function finalizarPagamento(comanda) {

      const formaPagamento = formasPagamento[comanda.id];

      if (!formaPagamento) {
         alert("Selecione a forma de pagamento.");
         return;
      }
      const confirmar = window.confirm(
         `Confirmar pagamento da Mesa ${comanda.mesas?.numero}?`
      );

      if (!confirmar) {
         return;
      }

      const { error: erroComanda } = await supabase
         .from("comandas")
         .update({
            status: "fechada",
            fechada_em: new Date().toISOString(),
            forma_pagamento: formaPagamento,
         })
         .eq("id", comanda.id);

      if (erroComanda) {
         console.error("Erro ao fechar comanda:", erroComanda);
         return;
      }

      const { error: erroMesa } = await supabase
         .from("mesas")
         .update({
            status: "livre",
            comanda_ativa_id: null,
         })
         .eq("id", comanda.mesa_id);

      if (erroMesa) {
         console.error("Erro ao liberar mesa:", erroMesa);
         return;
      }

      await carregarComandas();
   }
   function selecionarFormaPagamento(comandaId, forma) {
      setFormasPagamento((formasAtuais) => ({
         ...formasAtuais,
         [comandaId]: forma,
      }));
   }

   useEffect(() => {
      let ativo = true;

      async function carregarInicial() {
         const { data, error } = await supabase
            .from("comandas")
            .select(`
            id,
            mesa_id,
            total,
            status,
            fechada_em,
            mesas!pedidos_mesa_id_fkey (
               id,
               numero
            ),
            itens_pedido (
               id,
               quantidade,
               preco_unitario,
               produtos (
                  nome
               )
            )
         `)
            .eq("status", "fechamento")
            .order("id", { ascending: true });

         if (!ativo) return;

         if (error) {
            console.error("Erro ao carregar comandas:", error);
            setCarregando(false);
            return;
         }

         setComandas(data ?? []);
         setCarregando(false);
      }

      carregarInicial();

      return () => {
         ativo = false;
      };
   }, []);

   if (carregando) {
      return (
         <main className="app">
            <p>Carregando contas...</p>
         </main>
      );
   }

   return (
      <main className="app">
         <header className="topo-pedido">
            <div>
               <p className="subtitulo">Caixa</p>
               <h1>Contas aguardando pagamento</h1>
            </div>
         </header>

         {comandas.length === 0 ? (
            <p>Nenhuma conta aguardando pagamento.</p>
         ) : (
            <div className="grade-pedidos">
               {comandas.map((comanda) => (
                  <article className="pedido-cozinha" key={comanda.id}>
                     <h2>Mesa {comanda.mesas?.numero}</h2>

                     <p>Comanda #{comanda.id}</p>

                     <div className="itens-cozinha">
                        {comanda.itens_pedido?.map((item) => (
                           <p key={item.id}>
                              {item.quantidade}x {item.produtos?.nome}
                              {" — "}
                              R${" "}
                              {(
                                 Number(item.preco_unitario) *
                                 item.quantidade
                              ).toFixed(2)}
                           </p>
                        ))}
                     </div>

                     <strong>
                        Total: R$ {Number(comanda.total ?? 0).toFixed(2)}
                     </strong>

                     <div className="formas-pagamento">
                        <p>Forma de pagamento</p>

                        {["dinheiro", "pix", "credito", "debito"].map((forma) => (
                           <button
                              key={forma}
                              type="button"
                              className={
                                 formasPagamento[comanda.id] === forma
                                    ? "forma-pagamento selecionada"
                                    : "forma-pagamento"
                              }
                              onClick={() =>
                                 selecionarFormaPagamento(comanda.id, forma)
                              }
                           >
                              {forma === "dinheiro" && "Dinheiro"}
                              {forma === "pix" && "Pix"}
                              {forma === "credito" && "Crédito"}
                              {forma === "debito" && "Débito"}
                           </button>
                        ))}
                     </div>

                     <button
                        type="button"
                        className="botao-enviar"
                        onClick={() => finalizarPagamento(comanda)}
                     >
                        Confirmar pagamento
                     </button>
                  </article>
               ))}
            </div>
         )}
      </main>
   );
}

export default Caixa;