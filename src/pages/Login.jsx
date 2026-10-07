import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContextObject";
import { entrarComEmail, entrarComPin } from "../services/authService";
import { rotaInicial } from "../domain/autorizacao";

function Login() {
  const [modo, setModo] = useState("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const { usuario, carregando } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!carregando && usuario) navigate(rotaInicial(usuario.funcao), { replace: true });
  }, [carregando, navigate, usuario]);

  async function entrar(evento) {
    evento?.preventDefault();
    setMensagem("");
    setCarregandoLogin(true);

    try {
      if (modo === "pin") {
        if (!pin) throw new Error("Digite sua chave de acesso.");
        await entrarComPin(pin);
      } else {
        if (!email.trim() || !senha) throw new Error("Informe e-mail e senha.");
        await entrarComEmail(email, senha);
      }
    } catch (error) {
      setMensagem(error.message || "Não foi possível entrar.");
      setPin("");
    } finally {
      setCarregandoLogin(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="subtitulo">RM Comandas</p>
        <h1>Acesso ao sistema</h1>

        <div className="acoes-pedido">
          <button type="button" onClick={() => setModo("pin")}>PIN</button>
          <button type="button" onClick={() => setModo("email")}>E-mail</button>
        </div>

        {modo === "pin" ? (
          <>
            <div className="visor-chave">{pin ? "•".repeat(pin.length) : "—"}</div>
            <div className="teclado-numerico">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => (
                <button key={numero} type="button" onClick={() => setPin((atual) => `${atual}${numero}`)}>
                  {numero}
                </button>
              ))}
              <button type="button" className="botao-limpar" onClick={() => setPin("")}>Limpar</button>
              <button type="button" onClick={() => setPin((atual) => `${atual}0`)}>0</button>
              <button type="button" className="botao-entrar" disabled={carregandoLogin} onClick={entrar}>
                {carregandoLogin ? "..." : "Entrar"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={entrar}>
            <input type="email" autoComplete="username" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" autoComplete="current-password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <button type="submit" disabled={carregandoLogin}>{carregandoLogin ? "Entrando..." : "Entrar"}</button>
          </form>
        )}

        {mensagem && <p className="mensagem-formulario">{mensagem}</p>}
      </section>
    </main>
  );
}

export default Login;
