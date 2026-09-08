import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
   listarPagamentos,
   registrarPagamento,
} from "../services/pagamentosService";

function Caixa() {

   //ESTADOS
   const [comandas, setComandas] = useState([]);
   const [carregando, setCarregando] = useState(true);
   const [pagamentos, setPagamentos] = useState({});
   const [valoresPagamento, setValoresPagamento] = useState({});
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

      for (const comanda of data ?? []) {
         await carregarPagamentos(comanda.id);
      }
   }

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

      if (!forma) {
         alert("Selecione a forma de pagamento.");
         return;
      }

      if (!valor || valor <= 0) {
         alert("Informe um valor válido.");
         return;
      }

      if (valor > saldo) {
         alert("O pagamento não pode ser maior que o saldo.");
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
               {comandas.map((comanda) => {
                  const pagamentosComanda =
                     pagamentos[comanda.id] ?? [];

                  const totalPago = pagamentosComanda.reduce(
                     (soma, pagamento) =>
                        soma + Number(pagamento.valor),
                     0
                  );

                  const totalLiquido =
                     Number(comanda.total ?? 0) -
                     Number(comanda.desconto ?? 0);

                  const saldo = Math.max(
                     totalLiquido - totalPago,
                     0
                  );

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