import { Navigate } from "react-router-dom";

function RotaProtegida({
  children,
  funcoesPermitidas = [],
}) {
  const usuario = JSON.parse(
    localStorage.getItem("garcom")
  );

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (
    funcoesPermitidas.length > 0 &&
    !funcoesPermitidas.includes(usuario.funcao)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RotaProtegida;