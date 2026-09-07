import { useEffect, useState } from "react";
import {
   listarTodosProdutos,
   criarProduto,
   atualizarProduto,
   alterarStatusProduto,
} from "../services/produtosAdminService";
function ProdutosAdmin() {
   const [produtos, setProdutos] = useState([]);

   const [nome, setNome] = useState("");
   const [preco, setPreco] = useState("");
   const [categoria, setCategoria] = useState("");
   const [setor, setSetor] = useState("cozinha");
   const [produtoEditando, setProdutoEditando] = useState(null);

   const [mensagem, setMensagem] = useState("");

   function iniciarEdicao(produto) {
      setProdutoEditando(produto);

      setNome(produto.nome);
      setPreco(produto.preco);
      setCategoria(produto.categoria);
      setSetor(produto.setor);

      setMensagem("");
   }

   async function carregarProdutos() {
      try {
         const dados = await listarTodosProdutos();
         setProdutos(dados);
      } catch (error) {
         console.error("Erro ao carregar produtos:", error);
      }
   }

   useEffect(() => {
      carregarProdutos();
   }, []);

   async function salvarProduto(evento) {
      evento.preventDefault();

      if (!nome.trim() || !preco || !categoria.trim()) {
         setMensagem("Preencha todos os campos.");
         return;
      }

      try {
         if (produtoEditando) {
            const produtoAtualizado = await atualizarProduto(
               produtoEditando.id,
               {
                  nome: nome.trim(),
                  preco: Number(preco),
                  categoria: categoria.trim(),
                  setor,
               }
            );

            setProdutos((atuais) =>
               atuais.map((produto) =>
                  produto.id === produtoAtualizado.id
                     ? produtoAtualizado
                     : produto
               )
            );

            setMensagem("Produto atualizado com sucesso.");
            setProdutoEditando(null);

         } else {
            const novoProduto = await criarProduto({
               nome: nome.trim(),
               preco: Number(preco),
               categoria: categoria.trim(),
               setor,
               ativo: true,
            });

            setProdutos((atuais) => [...atuais, novoProduto]);
         }




         setNome("");
         setPreco("");
         setCategoria("");
         setSetor("cozinha");

         setMensagem("Produto cadastrado com sucesso.");
      } catch (error) {
         console.error("Erro ao cadastrar produto:", error);
         setMensagem("Não foi possível cadastrar o produto.");
      }
   }

   async function alternarAtivo(produto) {
      try {
         const atualizado = await alterarStatusProduto(
            produto.id,
            !produto.ativo
         );

         setProdutos((atuais) =>
            atuais.map((item) =>
               item.id === atualizado.id ? atualizado : item
            )
         );
      } catch (error) {
         console.error("Erro ao alterar produto:", error);
      }
   }

   return (
      <main className="app">
         <header className="topo-pedido">
            <div>
               <p className="subtitulo">Administração</p>
               <h1>Produtos</h1>
            </div>
         </header>

         <form onSubmit={salvarProduto}>
            <input
               type="text"
               placeholder="Nome"
               value={nome}
               onChange={(e) => setNome(e.target.value)}
            />

            <input
               type="number"
               step="0.01"
               min="0"
               placeholder="Preço"
               value={preco}
               onChange={(e) => setPreco(e.target.value)}
            />

            <input
               type="text"
               placeholder="Categoria"
               value={categoria}
               onChange={(e) => setCategoria(e.target.value)}
            />

            <select
               value={setor}
               onChange={(e) => setSetor(e.target.value)}
            >
               <option value="cozinha">Cozinha</option>
               <option value="bar">Bar</option>
            </select>

            <button type="submit">
               {produtoEditando ? "Salvar alterações" : "Cadastrar produto"}
            </button>
         </form>

         {mensagem && <p>{mensagem}</p>}

         <section>
            <h2>Produtos cadastrados</h2>

            {produtos.map((produto) => (
               <div key={produto.id}>
                  <strong>{produto.nome}</strong>

                  <span>
                     {" "}R$ {Number(produto.preco).toFixed(2)}
                  </span>

                  <span>
                     {" "}— {produto.categoria}
                  </span>

                  <span>
                     {" "}— {produto.setor}
                  </span>

                  <button
                     type="button"
                     onClick={() => alternarAtivo(produto)}
                  >
                     {produto.ativo ? "Desativar" : "Ativar"}
                  </button>

                  <button
                     type="button"
                     onClick={() => iniciarEdicao(produto)}
                  >
                     Editar
                  </button>
               </div>
            ))}
         </section>
      </main>
   );
}

export default ProdutosAdmin;