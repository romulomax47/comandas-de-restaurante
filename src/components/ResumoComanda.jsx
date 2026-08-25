import ItensComanda from "./ItensComanda";

function ResumoComanda({
  itensPedido,
  itensLancados,
  totalNovoPedido,
  enviarParaCozinha,
  aumentarQuantidade,
  diminuirQuantidade,
  removerItem,
  mostrarCardapio,
}) {
  return (
    <aside className="comanda">
      <button
        type="button"
        className="botao-novo-produto"
        onClick={mostrarCardapio}
      >
        + Adicionar produtos
      </button>
      <h2>Novo lançamento</h2>

      <ItensComanda
        itensPedido={itensPedido}
        aumentarQuantidade={aumentarQuantidade}
        diminuirQuantidade={diminuirQuantidade}
        removerItem={removerItem}
      />

      <div className="total-pedido">
        <span>Novo lançamento</span>
        <strong>R$ {totalNovoPedido.toFixed(2)}</strong>
      </div>

      <button
        type="button"
        className="botao-enviar"
        disabled={itensPedido.length === 0}
        onClick={enviarParaCozinha}
      >
        Enviar para cozinha
      </button>

      <hr />

      <h2>Itens já lançados</h2>

      {itensLancados.length === 0 ? (
        <p>Esta comanda ainda não possui itens.</p>
      ) : (
        itensLancados.map((item) => (
          <div className="item-pedido" key={item.id}>
            <div>
              <strong>
                {item.quantidade}x {item.produtos?.nome}
              </strong>

              <small>
                Lançado por: {item.garcons?.nome || "Não identificado"}
              </small>
            </div>

            <div>
              <span>{item.status}</span>

              <strong>
                R$ {(Number(item.preco_unitario) * item.quantidade).toFixed(2)}
              </strong>
            </div>
          </div>
        ))
      )}
    </aside>
  );
}

export default ResumoComanda;