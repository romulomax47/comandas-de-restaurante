import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { abrirComanda, lancarPedido } from "../services/comandasService";
import ListaProdutos from "../components/ListaProdutos";
import ResumoComanda from "../components/ResumoComanda";
import { listarItensDaComanda } from "../services/itensService";
import { solicitarFechamento } from "../services/comandasService";
import { AuthContext } from "../contexts/AuthContextObject";



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
   const [mesa, setMesa] = useState(null);


   const { usuario: garcom } = useContext(AuthContext);

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

         setItensLancados(itens);
      } catch (error) {
         console.error("Erro ao carregar itens:", error);
      }
   }

   async function enviarPedido() {
      setMensagem("");
      if (!comanda || itensPedido.length === 0 || !garcom) {
         return;
      }

      let comandaAtualizada;
      try {
         comandaAtualizada = await lancarPedido(comanda.id, itensPedido);
      } catch (error) {
         console.error("Erro ao lançar pedido:", error);
         setMensagem("Não foi possível lançar os itens.");
         return;
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
            navigate("/");
            return;
         }

         try {
            setCarregando(true);

            const { data: mesaEncontrada, error: erroMesa } = await supabase
               .from("mesas")
               .select("id, numero, status")
               .eq("numero", Number(mesaId))
               .single();

            if (erroMesa) {
               throw erroMesa;
            }

            setMesa(mesaEncontrada);

            const dadosComanda = await abrirComanda(mesaEncontrada.id);

            setComanda(dadosComanda);
            //Carrega produtos ativos
            const { data: produtosData, error: produtosError } = await supabase
               .from("produtos")
               .select("*")
               .eq("ativo", true)
               .order("nome");

            if (produtosError) {
               console.error("Erro ao carregar produtos:", produtosError);
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

   }, [mesaId, garcom, navigate]);

   if (carregando) {
      return (
         <main className="app">
            <p>Carregando comanda...</p>
         </main>
      );
   }

   async function imprimirConta() {
      if (!comanda || !mesa) {
         return;
      }

      try {
         await solicitarFechamento(comanda.id);

         setComanda({
            ...comanda,
            status: "fechamento",
         });

         setMesa({
            ...mesa,
            status: "fechamento",
         });
      } catch (error) {
         console.error("Erro ao solicitar fechamento:", error);
      }
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
            enviarPedido={enviarPedido}
            aumentarQuantidade={aumentarQuantidade}
            diminuirQuantidade={diminuirQuantidade}
            removerItem={removerItem}
            mostrarCardapio={() => setCardapioVisivel(true)}
            imprimirConta={imprimirConta}
            statusComanda={comanda?.status}
         />
      </div>
   );
}

export default Comanda;
