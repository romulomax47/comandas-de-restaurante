import { useNavigate } from "react-router-dom";

const mesas = [
  { id: 1, numero: 1, status: "livre" },
  { id: 2, numero: 2, status: "ocupada" },
  { id: 3, numero: 3, status: "livre" },
  { id: 4, numero: 4, status: "ocupada" },
  { id: 5, numero: 5, status: "livre" },
  { id: 6, numero: 6, status: "livre" },
];

function Home() {
  const navigate = useNavigate();

  return (
    <main className="app">
      <header className="topo">
        <div>
          <p className="subtitulo">MVP de comandas</p>
          <h1>Mesas do restaurante</h1>
        </div>
      </header>

      <section className="grade-mesas">
        {mesas.map((mesa) => (
          <button
            key={mesa.id}
            type="button"
            className={`mesa mesa-${mesa.status}`}
            onClick={() => navigate(`/pedido/${mesa.id}`)}
          >
            <strong>Mesa {mesa.numero}</strong>
            <span>{mesa.status === "livre" ? "Livre" : "Ocupada"}</span>
          </button>
        ))}
      </section>
    </main>
  );
}

export default Home;