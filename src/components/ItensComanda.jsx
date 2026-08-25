function ItensComanda({
   itensPedido,
   aumentarQuantidade,
   diminuirQuantidade,
   removerItem,
}) {
   if (itensPedido.length === 0) {
      return <p>Nenhum item selecionado.</p>;
   }

   return (
      <>
         {itensPedido.map((item) => (
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
                  R$ {(Number(item.preco) * item.quantidade).toFixed(2)}
               </strong>
            </div>
         ))}
      </>
   );
}

export default ItensComanda;