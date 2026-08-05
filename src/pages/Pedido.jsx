import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Pedido() {
   const { mesaId } = useParams();
   const navigate = useNavigate();

   const [itensPedido, setItensPedido] = useState([]);
   const [produtos, setProdutos] = useState([]);

   function adicionarProduto(produto) {
      const itemExistente = itensPedido.find(
         (item) => item.id === produto.id
      );

      if (itemExistente) {
         setItensPedido(
            itensPedido.map((item) =>
               item.id === produto.id
                  ? { ...item, quantidade: item.quantidade + 1 }
                  : item
            )
         );

         return;
      }

      setItensPedido([
         ...itensPedido,
         {
            ...produto,
            quantidade: 1,
         },
      ]);
   }

   function aumentarQuantidade(produtoId) {
      setItensPedido(
         itensPedido.map((item) =>
            item.id === produtoId
               ? { ...item, quantidade: item.quantidade + 1 }
               : item
         )
      );
   }

   function diminuirQuantidade(produtoId) {
      const itemExistente = itensPedido.find(
         (item) => item.id === produtoId
      );

      if (!itemExistente) {
         return;
      }

      if (itemExistente.quantidade === 1) {
         setItensPedido(
            itensPedido.filter((item) => item.id !== produtoId)
         );

         return;
      }

      setItensPedido(
         itensPedido.map((item) =>
            item.id === produtoId
               ? { ...item, quantidade: item.quantidade - 1 }
               : item
         )
      );
   }

   function removerItem(produtoId) {
      setItensPedido(
         itensPedido.filter((item) => item.id !== produtoId)
      );
   }

   async function enviarParaCozinha() {
      if (itensPedido.length === 0) {
         return;
      }

      const { data: pedido, error: erroPedido } = await supabase
         .from("pedidos")
         .insert({
            mesa_id: Number(mesaId),
            status: "novo",
            total,
         })
         .select()
         .single();

      if (erroPedido) {
         console.error("Erro ao criar pedido:", erroPedido);
         alert("Não foi possível criar o pedido.");
         return;
      }

      const itensParaSalvar = itensPedido.map((item) => ({
         pedido_id: pedido.id,
         produto_id: item.id,
         quantidade: item.quantidade,
         preco_unitario: item.preco,
      }));

      const { error: erroItens } = await supabase
         .from("itens_pedido")
         .insert(itensParaSalvar);

      if (erroItens) {
         console.error("Erro ao salvar itens:", erroItens);
         alert("Pedido criado, mas ocorreu um erro ao salvar os itens.");
         return;
      }

      const { error: erroMesa } = await supabase
         .from("mesas")
         .update({ status: "ocupada" })
         .eq("id", Number(mesaId));

      if (erroMesa) {
         console.error("Erro ao atualizar mesa:", erroMesa);
      }

      alert(`Pedido da Mesa ${mesaId} enviado para a cozinha!`);

      setItensPedido([]);
      navigate("/");
   }
   const total = itensPedido.reduce(
      (soma, item) => soma + item.preco * item.quantidade,
      0
   )

   useEffect(() => {
      console.log("useEffect iniciou");

      async function carregarProdutos() {
         const { data, error } = await supabase
            .from("produtos")
            .select("*")
            .eq("ativo", true)
            .order("nome");

         console.log("Produtos recebidos:", data);
         console.log("Erro do Supabase:", error);

         if (error) {
            return;
         }

         setProdutos(data ?? []);
      }

      carregarProdutos();
   }, []);

   return (<main className="app">
      <button
         type="button"
         className="botao-voltar"
         onClick={() => navigate("/")}
      >
         ← Voltar
      </button>

      <header className="topo-pedido">
         <div>
            <p className="subtitulo">Nova comanda</p>
            <h1>Mesa {mesaId}</h1>
         </div>

         <strong>Total: R$ {total.toFixed(2)}</strong>
      </header>

      <div className="pedido-layout">
         <section>
            <h2>Cardápio</h2>

            <div className="grade-produtos">
               {produtos.map((produto) => (
                  <article className="produto" key={produto.id}>
                     <div>
                        <small>{produto.categoria}</small>
                        <h3>{produto.nome}</h3>
                        <p>R$ {produto.preco.toFixed(2)}</p>
                     </div>

                     <button
                        type="button"
                        onClick={() => adicionarProduto(produto)}
                     >
                        Adicionar
                     </button>
                  </article>
               ))}
            </div>
         </section>

         <aside className="comanda">
            <h2>Pedido atual</h2>

            {itensPedido.length === 0 ? (
               <p>Nenhum item adicionado.</p>
            ) : (
               itensPedido.map((item) => (
                  <div className="item-pedido" key={item.id}>
                     <div>
                        <strong>{item.nome}</strong>

                        <div className="controles-item">
                           <button
                              type="button"
                              onClick={() => diminuirQuantidade(item.id)}
                           >
                              −
                           </button>

                           <span>{item.quantidade}</span>

                           <button
                              type="button"
                              onClick={() => aumentarQuantidade(item.id)}
                           >
                              +
                           </button>

                           <button
                              type="button"
                              className="botao-remover"
                              onClick={() => removerItem(item.id)}
                           >
                              Remover
                           </button>
                        </div>
                     </div>

                     <strong>
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                     </strong>
                  </div>
               ))
            )}

            <div className="total-pedido">
               <span>Total</span>
               <strong>R$ {total.toFixed(2)}</strong>
            </div>

            <button
               type="button"
               className="botao-enviar"
               disabled={itensPedido.length === 0}
               onClick={enviarParaCozinha}
            >
               Enviar para a cozinha
            </button>
         </aside>
      </div>
   </main>)


};

export default Pedido;