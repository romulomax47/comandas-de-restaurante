export function podeAcessar(usuario, funcoesPermitidas = []) {
  if (!usuario?.ativo) return false;
  return funcoesPermitidas.length === 0 || funcoesPermitidas.includes(usuario.funcao);
}

export function rotaInicial(funcao) {
  return {
    cozinha: "/cozinha",
    caixa: "/caixa",
    proprietario: "/admin",
  }[funcao] || "/home";
}
