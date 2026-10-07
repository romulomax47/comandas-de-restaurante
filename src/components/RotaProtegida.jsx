import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContextObject";
import { podeAcessar } from "../domain/autorizacao";

function RotaProtegida({
  children,
  funcoesPermitidas = [],
}) {
  const { usuario, carregando } = useContext(AuthContext);

  if (carregando) {
    return <p>Validando sessão...</p>;
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (!podeAcessar(usuario, funcoesPermitidas)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RotaProtegida;
