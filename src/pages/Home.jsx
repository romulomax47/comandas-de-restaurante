import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { buscarOuCriarMesa } from "../services/mesasService";

function Home() {

  const navigate = useNavigate();
  const garcom = JSON.parse(localStorage.getItem("garcom"));

  const [numeroMesa, setNumeroMesa] = useState("");
  const [buscandoMesa, setBuscandoMesa] = useState(false);
  const [mensagem, setMensagem] = useState("");



  async function acessarMesa() {
    setMensagem("");

    try {
      setBuscandoMesa(true);

      const mesa = await buscarOuCriarMesa(numeroMesa);

      navigate(`/comanda/${mesa.numero}`);
    } catch (error) {
      console.error("Erro ao acessar mesa:", error);

      setMensagem(
        error.message || "Não foi possível acessar a mesa."
      );
    } finally {
      setBuscandoMesa(false);
    }

  }




  return (
    <section className="acesso-mesa-pdv">
      <div className="usuario-logado">
        <span>Garçom</span>
        <strong>{garcom?.nome}</strong>
      </div>

      <p className="subtitulo">Acesso rápido</p>
      <h1>Digite o número da mesa</h1>

      <div className="visor-mesa">
        {numeroMesa || "—"}
      </div>

      <div className="teclado-numerico">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => (
          <button
            key={numero}
            type="button"
            onClick={() =>
              setNumeroMesa((valorAtual) => `${valorAtual}${numero}`)
            }
          >
            {numero}
          </button>
        ))}

        <button
          type="button"
          className="botao-limpar"
          onClick={() => {
            setNumeroMesa("");
            setMensagem("");
          }}
        >
          Limpar
        </button>

        <button
          type="button"
          onClick={() =>
            setNumeroMesa((valorAtual) => `${valorAtual}0`)
          }
        >
          0
        </button>

        <button
          type="button"
          className="botao-entrar"
          disabled={buscandoMesa || !numeroMesa}
          onClick={acessarMesa}
        >
          {buscandoMesa ? "..." : "Entrar"}
        </button>
      </div>

      {mensagem && (
        <p className="mensagem-formulario">{mensagem}</p>
      )}

      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("garcom");
          navigate("/login");
        }}
      >
        Sair
      </button>
    </section>
  );
}
export default Home;