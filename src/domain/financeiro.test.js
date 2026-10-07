import { describe, expect, it } from "vitest";
import { calcularResumoPagamento, validarPagamento } from "./financeiro";

describe("calcularResumoPagamento", () => {
  it("considera desconto e pagamentos parciais", () => {
    expect(calcularResumoPagamento(
      { total: "100.00", desconto: "10.00" },
      [{ valor: "30.00" }, { valor: "20.00" }],
    )).toEqual({ totalBruto: 100, desconto: 10, totalLiquido: 90, totalPago: 50, saldo: 40 });
  });

  it("trabalha em centavos e nunca gera saldo negativo", () => {
    expect(calcularResumoPagamento({ total: 0.1 + 0.2 }, [{ valor: 0.3 }]).saldo).toBe(0);
  });
});

describe("validarPagamento", () => {
  it("rejeita forma ausente, valor inválido e valor acima do saldo", () => {
    expect(validarPagamento(10, 10, "")).toMatch(/forma/);
    expect(validarPagamento(0, 10, "pix")).toMatch(/válido/);
    expect(validarPagamento(10.01, 10, "pix")).toMatch(/maior/);
  });

  it("aceita pagamento igual ao saldo", () => {
    expect(validarPagamento("10.00", 10, "pix")).toBeNull();
  });
});
