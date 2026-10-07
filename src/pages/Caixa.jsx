import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
   listarPagamentos,
   registrarPagamento,
   finalizarComanda,
} from "../services/pagamentosService";
import { calcularResumoPagamento, validarPagamento } from "../domain/financeiro";

async function buscarDadosCaixa() {
   const { data, error } = await supabase
      .from("comandas")
      .select(`
         id, mesa_id, total, desconto, status, fechada_em,
         mesas!pedidos_mesa_id_fkey (id, numero),
         itens_pedido (id, quantidade, preco_unitario, produtos (nome))
      `)
      .eq("status", "fechamento")
      .order("id", { ascending: true });
   if (error) throw error;

   const comandas = data ?? [];
   const pares = await Promise.all(comandas.map(async (comanda) => [
      comanda.id,
      await listarPagamentos(comanda.id),
   ]));
   return { comandas, pagamentos: Object.fromEntries(pares) };
}

function Caixa() {

   //ESTADOS
   const [comandas, setComandas] = useState([]);
   const [carregando, setCarregando] = useState(true);
   const [pagamentos, setPagamentos] = useState({});
   const [valoresPagamento, setValoresPagamento] = useState({});
   const [formasPagamento, setFormasPagamento] = useState({});

   async function carregarPagamentos(comandaId) {
      try {
         const dados = await listarPagamentos(comandaId);

         setPagamentos((atuais) => ({
            ...atuais,
            [comandaId]: dados,
         }));
      } catch (error) {
         console.error("Erro ao carregar pagamentos:", error);
      }


   }

   async function adicionarPagamento(comanda, saldo) {
      const forma = formasPagamento[comanda.id];

      const valor = Number(
         valoresPagamento[comanda.id]
      );

      const erroValidacao = validarPagamento(valor, saldo, forma);
      if (erroValidacao) {
         alert(erroValidacao);
         return;
      }

      try {
         await registrarPagamento({
            comandaId: comanda.id,
            valor,
            forma,
         });

         setValoresPagamento((atuais) => ({
            ...atuais,
            [comanda.id]: "",
         }));

         await carregarPagamentos(comanda.id);

      } catch (error) {
         console.error(
            "Erro ao registrar pagamento:",
            error
         );

         alert("Não foi possível registrar o pagamento.");
      }
   }




   async function finalizarPagamento(comanda, saldo) {

      const formaPagamento = formasPagamento[comanda.id];
      if (Number(saldo) > 0.001) {
         alert(
            `Não é possível finalizar. Ainda faltam R$ ${Number(
               saldo
            ).toFixed(2)} para pagar.`
         );

         return;
      }
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

      try {
         await finalizarComanda(comanda.id, formaPagamento);
         const dados = await buscarDadosCaixa();
         setComandas(dados.comandas);
         setPagamentos(dados.pagamentos);
      } catch (error) {
         console.error("Erro ao finalizar comanda:", error);
         alert(error.message || "Não foi possível finalizar a conta.");
      }
   }

   function selecionarFormaPagamento(comandaId, forma) {
      setFormasPagamento((formasAtuais) => ({
         ...formasAtuais,
         [comandaId]: forma,
      }));
   }




   useEffect(() => {
      let ativo = true;

      buscarDadosCaixa()
         .then((dados) => {
            if (ativo) {
               setComandas(dados.comandas);
               setPagamentos(dados.pagamentos);
               setCarregando(false);
            }
         })
         .catch((error) => {
            if (ativo) {
               console.error("Erro ao carregar caixa:", error);
               setCarregando(false);
            }
         });

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
               {comandas.map((comanda) => {
                  const pagamentosComanda =
                     pagamentos[comanda.id] ?? [];

                  const { totalPago, totalLiquido, saldo } =
                     calcularResumoPagamento(comanda, pagamentosComanda);

                  return (
                     <article className="pedido-cozinha" key={comanda.id}>
                        <h2>Mesa {comanda.mesas?.numero}</h2>

                        <p>Comanda #{comanda.id}</p>

                        <div className="itens-cozinha">
                           {comanda.itens_pedido?.map((item) => (
                              <p key={item.id}>
                                 {item.quantidade}x{" "}
                                 {item.produtos?.nome}
                                 {" — "}
                                 R${" "}
                                 {(
                                    Number(item.preco_unitario) *
                                    item.quantidade
                                 ).toFixed(2)}
                              </p>
                           ))}

                           <p>
                              Total bruto:{" "}
                              <strong>
                                 R$ {Number(comanda.total ?? 0).toFixed(2)}
                              </strong>
                           </p>

                           <p>
                              Desconto:{" "}
                              <strong>
                                 R$ {Number(comanda.desconto ?? 0).toFixed(2)}
                              </strong>
                           </p>

                           <p>
                              Total líquido:{" "}
                              <strong>
                                 R$ {totalLiquido.toFixed(2)}
                              </strong>
                           </p>

                           <div className="pamento-caixa">
                              <h3>Registrar pagamento</h3>
                              <select value={formasPagamento[comanda.id]}
                                 onChange={(e) => selecionarFormaPagamento(comanda.id, e.target.value)}>
                                 <option value="">
                                    Forma de pagamento
                                 </option>
                                 <option value="dinheiro">
                                    Dinheiro
                                 </option>
                                 <option value="pix">
                                    Pix
                                 </option>
                                 <option value="credito">
                                    Crédito
                                 </option>
                                 <option value="debito">
                                    Débito
                                 </option>
                              </select>

                              <input
                                 type="number"
                                 min="0.01"
                                 step="0.01"
                                 placeholder={`Saldo R$ ${saldo.toFixed(2)}`}
                                 value={
                                    valoresPagamento[comanda.id] ?? ""
                                 }
                                 onChange={(e) =>
                                    setValoresPagamento((atuais) => ({
                                       ...atuais,
                                       [comanda.id]: e.target.value,
                                    }))
                                 }
                              />
                              <button
                                 type="button"
                                 onClick={() =>
                                    adicionarPagamento(
                                       comanda,
                                       saldo
                                    )
                                 }
                              >
                                 Registrar pagamento
                              </button>
                              <p>
                                 Pago:{" "}
                                 <strong>
                                    R$ {totalPago.toFixed(2)}
                                 </strong>
                              </p>

                              <p>
                                 Saldo:{" "}
                                 <strong>
                                    R$ {saldo.toFixed(2)}
                                 </strong>
                              </p>



                           </div>
                           {pagamentosComanda.length > 0 && (
                              <div>
                                 <h3>Pagamentos registrados</h3>

                                 {pagamentosComanda.map(
                                    (pagamento) => (
                                       <p key={pagamento.id}>
                                          {pagamento.forma} — R${" "}
                                          {Number(
                                             pagamento.valor
                                          ).toFixed(2)}
                                       </p>
                                    )
                                 )}
                              </div>
                           )}
                           <button
                              type="button"
                              className="botao-enviar"
                              onClick={() =>
                                 finalizarPagamento(
                                    comanda,
                                    saldo
                                 )
                              }
                           >
                              Finalizar conta
                           </button>
                        </div>
                     </article>
                  )
               })}
            </div>
         )}
      </main>
   );
}

export default Caixa;
