function ListaProdutos({ produtos, adicionarProduto }) {
   return (
      <section>
         <h2>Cardápio</h2>

         <div className="grade-produtos">
            {produtos.map((produto) => (
               <article className="produto" key={produto.id}>
                  <div>
                     <small>{produto.categoria}</small>
                     <h3>{produto.nome}</h3>
                     <p>R$ {Number(produto.preco).toFixed(2)}</p>
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
   );
}

export default ListaProdutos;