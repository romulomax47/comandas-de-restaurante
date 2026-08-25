export function gerarTicket({
   setor,
   numeroMesa,
   lancamento,
   garcom,
   itens,
}) {
   if (itens.length === 0) {
      return null;
   }

   const horario = new Date(lancamento.criado_em).toLocaleTimeString(
      "pt-BR",
      {
         hour: "2-digit",
         minute: "2-digit",
      }
   );

   const linhasItens = itens
      .map((item) => {
         let linha = `${item.quantidade}x ${item.nome}`;

         if (item.observacao) {
            linha += `\n   Obs: ${item.observacao}`;
         }

         return linha;
      })
      .join("\n\n");

   return `
================================
           ${setor.toUpperCase()}
================================
MESA ${numeroMesa}
Lançamento #${lancamento.id}
${horario}

${linhasItens}

Garçom: ${garcom.nome}
================================
`.trim();
}