import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { abrirComanda } from "../services/comandasService";
import ListaProdutos from "../components/ListaProdutos";
import ResumoComanda from "../components/ResumoComanda";
import { listarItensDaComanda } from "../services/itensService";
import { criarLancamento } from "../services/lancamentosService";

function Comanda() {
   const { mesaId } = useParams();
   const navigate = useNavigate();

   const [comanda, setComanda] = useState(null);
   const [itensPedido, setItensPedido] = useState([]);
   const [itensLancados, setItensLancados] = useState([]);
   const [produtos, setProdutos] = useState([]);
   const [carregando, setCarregando] = useState(true);
   const [cardapioVisivel, setCardapioVisivel] = useState(false);
   const [mensagem, setMensagem] = useState("");


   const garcom = JSON.parse(localStorage.getItem("garcom"));

   const totalNovoPedido = itensPedido.reduce(
      (soma, item) => soma + Number(item.preco) * item.quantidade,
      0
   );

   function adicionarProduto(produto) {
      const itemExistente = itensPedido.find(
         (item) => item.id === produto.id
      );

      if (itemExistente) {
         setItensPedido(
            itensPedido.map((item) =>
               item.id === produto.id
                  ? {
                     ...item,
                     quantidade: item.quantidade + 1,
                  }
                  : item
            )
         );
         setCardapioVisivel(false);

         return;
      }

      setItensPedido([
         ...itensPedido,
         {
            ...produto,
            quantidade: 1,
         },
      ]);
      setCardapioVisivel(false);

   }

   function aumentarQuantidade(produtoId) {
      setItensPedido(
         itensPedido.map((item) =>
            item.id === produtoId
               ? {
                  ...item,
                  quantidade: item.quantidade + 1,
               }
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
         removerItem(produtoId);
         return;
      }

      setItensPedido(
         itensPedido.map((item) =>
            item.id === produtoId
               ? {
                  ...item,
                  quantidade: item.quantidade - 1,
               }
               : item
         )
      );
   }

   function removerItem(produtoId) {
      setItensPedido(
         itensPedido.filter((item) => item.id !== produtoId)
      );
   }

   async function carregarItensDaComanda(comandaId) {
      try {
         const itens = await listarItensDaComanda(comandaId);

         console.log("ITENS DA COMANDA:", itens);

         setItensLancados(itens);
      } catch (error) {
         console.error("Erro ao carregar itens:", error);
      }
   }

   async function enviarParaCozinha() {
      setMensagem("");
      if (!comanda || itensPedido.length === 0 || !garcom) {
         return;
      }

      const lancamento = await criarLancamento(
         comanda.id,
         garcom.id
      );

      const itensParaSalvar = itensPedido.map((item) => ({
         comanda_id: comanda.id,
         lancamento_id: lancamento.id,
         produto_id: item.id,
         quantidade: item.quantidade,
         preco_unitario: Number(item.preco),
         status: "novo",
         lancado_por: garcom.id,
      }));
      const { error: erroItens } = await supabase
         .from("itens_pedido")
         .insert(itensParaSalvar);

      if (erroItens) {
         console.error("Erro ao salvar itens:", erroItens);
         alert("Não foi possível lançar os itens.");
         return;
      }

      const novoTotal =
         Number(comanda.total ?? 0) + totalNovoPedido;

      const { data: comandaAtualizada, error: erroComanda } =
         await supabase
            .from("comandas")
            .update({
               total: novoTotal,
            })
            .eq("id", comanda.id)
            .select()
            .single();

      if (erroComanda) {
         console.error("Erro ao atualizar comanda:", erroComanda);
         return;
      }

      const { error: erroMesa } = await supabase
         .from("mesas")
         .update({
            status: "ocupada",
            comanda_ativa_id: comanda.id,
         })
         .eq("id", Number(mesaId));

      if (erroMesa) {
         console.error("Erro ao atualizar mesa:", erroMesa);
      }

      setComanda(comandaAtualizada);
      setItensPedido([]);
      setCardapioVisivel(false);
      await carregarItensDaComanda(comanda.id);

      setMensagem("Itens enviados para a cozinha com sucesso!");
   }

   useEffect(() => {
      async function iniciar() {
         if (!garcom) {
            navigate("/login");
            return;
         }

         try {
            setCarregando(true);

            const dadosComanda = await abrirComanda(
               Number(mesaId),
               garcom.id
            );

            setComanda(dadosComanda);

            const { data: produtosData, error: produtosError } =
               await supabase
                  .from("produtos")
                  .select("*")
                  .eq("ativo", true)
                  .order("nome");


            if (produtosError) {
               console.error(
                  "Erro ao carregar produtos:",
                  produtosError
               );
            } else {
               setProdutos(produtosData ?? []);
            }

            await carregarItensDaComanda(dadosComanda.id);
         } catch (error) {
            console.error("Erro ao iniciar comanda:", error);

         } finally {
            setCarregando(false);
         }
      }

      iniciar();
   }, [mesaId]);

   if (carregando) {
      return (
         <main className="app">
            <p>Carregando comanda...</p>
         </main>
      );
   }

   return (
      <div className="pedido-layout">
         <header className="topo-pedido">
            <div>
               <p className="subtitulo">
                  Comanda #{comanda?.id}
               </p>

               <h1>Mesa {mesaId}</h1>

               <small>
                  Aberta por: {comanda?.garcons?.nome || garcom?.nome}
               </small>
            </div>

            <strong>
               Total da comanda: R$ {Number(comanda?.total ?? 0).toFixed(2)}
            </strong>
         </header>

         {cardapioVisivel && (
            <ListaProdutos
               produtos={produtos}
               adicionarProduto={adicionarProduto}
            />
         )}

         {mensagem && (
            <p className="mensagem-sucesso">
               {mensagem}
            </p>
         )}

         <ResumoComanda
            itensPedido={itensPedido}
            itensLancados={itensLancados}
            totalNovoPedido={totalNovoPedido}
            enviarParaCozinha={enviarParaCozinha}
            aumentarQuantidade={aumentarQuantidade}
            diminuirQuantidade={diminuirQuantidade}
            removerItem={removerItem}
            mostrarCardapio={() => setCardapioVisivel(true)}
         />
      </div>
   );
}

export default Comanda;