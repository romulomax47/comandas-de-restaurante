function centavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

export function calcularResumoPagamento(comanda, pagamentos = []) {
  const totalBruto = centavos(comanda?.total);
  const desconto = centavos(comanda?.desconto);
  const totalLiquido = Math.max(totalBruto - desconto, 0);
  const totalPago = pagamentos.reduce((soma, pagamento) => soma + centavos(pagamento.valor), 0);
  const saldo = Math.max(totalLiquido - totalPago, 0);

  return {
    totalBruto: totalBruto / 100,
    desconto: desconto / 100,
    totalLiquido: totalLiquido / 100,
    totalPago: totalPago / 100,
    saldo: saldo / 100,
  };
}

export function validarPagamento(valor, saldo, forma) {
  if (!forma) return "Selecione a forma de pagamento.";
  const valorCentavos = centavos(valor);
  if (valorCentavos <= 0) return "Informe um valor válido.";
  if (valorCentavos > centavos(saldo)) return "O pagamento não pode ser maior que o saldo.";
  return null;
}
