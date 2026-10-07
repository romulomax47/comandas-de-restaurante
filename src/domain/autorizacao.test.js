import { describe, expect, it } from "vitest";
import { podeAcessar, rotaInicial } from "./autorizacao";

describe("podeAcessar", () => {
  it("nega usuário ausente ou inativo", () => {
    expect(podeAcessar(null, [])).toBe(false);
    expect(podeAcessar({ ativo: false, funcao: "proprietario" }, ["proprietario"])).toBe(false);
  });

  it("respeita as funções permitidas", () => {
    expect(podeAcessar({ ativo: true, funcao: "caixa" }, ["caixa", "proprietario"])).toBe(true);
    expect(podeAcessar({ ativo: true, funcao: "garcom" }, ["proprietario"])).toBe(false);
  });
});

describe("rotaInicial", () => {
  it.each([
    ["garcom", "/home"], ["cozinha", "/cozinha"],
    ["caixa", "/caixa"], ["proprietario", "/admin"],
  ])("direciona %s para %s", (funcao, rota) => {
    expect(rotaInicial(funcao)).toBe(rota);
  });
});
