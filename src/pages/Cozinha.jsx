import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

async function buscarItensCozinha() {
  const { data, error } = await supabase
    .from("itens_pedido")
    .select(`
      id, quantidade, status, observacao,
      produtos!inner(nome, setor),
      comandas!inner(id, mesa_id, mesas(numero)),
      lancamentos(criado_em)
    `)
    .eq("produtos.setor", "cozinha")
    .in("status", ["novo", "em_preparo", "pronto"])
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function Cozinha() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;
    buscarItensCozinha()
      .then((dados) => { if (ativo) setItens(dados); })
      .catch(() => { if (ativo) setMensagem("Não foi possível carregar a cozinha."); })
      .finally(() => { if (ativo) setCarregando(false); });

    const canal = supabase.channel("cozinha-itens")
      .on("postgres_changes", { event: "*", schema: "public", table: "itens_pedido" }, async () => {
        const dados = await buscarItensCozinha();
        if (ativo) setItens(dados);
      }).subscribe();
    return () => { ativo = false; supabase.removeChannel(canal); };
  }, []);

  async function atualizarStatus(itemId, status) {
    const { error } = await supabase.from("itens_pedido").update({ status }).eq("id", itemId);
    if (error) {
      setMensagem("Não foi possível atualizar o item.");
      return;
    }
    setItens((atuais) => atuais.map((item) => item.id === itemId ? { ...item, status } : item));
  }

  if (carregando) return <main className="app"><p>Carregando pedidos...</p></main>;

  return (
    <main className="app">
      <header className="topo-pedido"><div><p className="subtitulo">Operação</p><h1>Tela da cozinha</h1></div></header>
      {mensagem && <p className="mensagem-formulario">{mensagem}</p>}
      {itens.length === 0 ? <p>Nenhum item aguardando preparo.</p> : (
        <section className="grade-pedidos">
          {itens.map((item) => (
            <article className="pedido-cozinha" key={item.id}>
              <div className="pedido-cabecalho"><div><small>Item #{item.id}</small>
                <h2>Mesa {item.comandas?.mesas?.numero ?? item.comandas?.mesa_id}</h2></div>
                <span className={`status status-${item.status}`}>{item.status}</span>
              </div>
              <p>{item.quantidade}x {item.produtos?.nome}</p>
              {item.observacao && <p>Obs.: {item.observacao}</p>}
              <div className="acoes-pedido">
                {item.status === "novo" && <button type="button" onClick={() => atualizarStatus(item.id, "em_preparo")}>Iniciar preparo</button>}
                {item.status === "em_preparo" && <button type="button" onClick={() => atualizarStatus(item.id, "pronto")}>Marcar como pronto</button>}
                {item.status === "pronto" && <button type="button" onClick={() => atualizarStatus(item.id, "entregue")}>Marcar como entregue</button>}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Cozinha;
