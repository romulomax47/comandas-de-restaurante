import { useEffect, useState } from "react";
import { listarGarcons, criarGarcom, atualizarGarcom, alterarStatusGarcom } from "../services/garconsAdminService";

function GarconsAdmin() {
  const [garcons, setGarcons] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState("");
  const [funcao, setFuncao] = useState("garcom");
  const [garcomEditando, setGarcomEditando] = useState(null);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;
    listarGarcons()
      .then((dados) => { if (ativo) setGarcons(dados); })
      .catch(() => { if (ativo) setMensagem("Não foi possível carregar os usuários."); });
    return () => { ativo = false; };
  }, []);

  function limparFormulario() {
    setNome(""); setEmail(""); setSenha(""); setPin(""); setFuncao("garcom"); setGarcomEditando(null);
  }

  async function salvarGarcom(evento) {
    evento.preventDefault();
    if (!nome.trim() || !email.trim() || (!garcomEditando && (!senha || !pin))) {
      setMensagem("Informe nome, e-mail e, para novos usuários, senha e PIN.");
      return;
    }

    try {
      const dados = { nome: nome.trim(), email: email.trim(), funcao, ...(senha ? { senha } : {}), ...(pin ? { pin } : {}) };
      const salvo = garcomEditando
        ? await atualizarGarcom(garcomEditando.id, dados)
        : await criarGarcom(dados);
      setGarcons((atuais) => garcomEditando
        ? atuais.map((item) => item.id === salvo.id ? salvo : item)
        : [...atuais, salvo]);
      setMensagem("Usuário salvo com sucesso.");
      limparFormulario();
    } catch (error) {
      setMensagem(error.message || "Não foi possível salvar o usuário.");
    }
  }

  function iniciarEdicao(garcom) {
    setGarcomEditando(garcom); setNome(garcom.nome); setEmail(garcom.email || "");
    setFuncao(garcom.funcao); setSenha(""); setPin(""); setMensagem("");
  }

  async function alternarAtivo(garcom) {
    try {
      const atualizado = await alterarStatusGarcom(garcom, !garcom.ativo);
      setGarcons((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item));
    } catch (error) {
      setMensagem(error.message || "Não foi possível alterar o usuário.");
    }
  }

  return (
    <main className="app">
      <header className="topo-pedido"><div><p className="subtitulo">Administração</p><h1>Usuários</h1></div></header>
      <form onSubmit={salvarGarcom}>
        <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" autoComplete="new-password" placeholder={garcomEditando ? "Nova senha (opcional)" : "Senha"} value={senha} onChange={(e) => setSenha(e.target.value)} />
        <input type="password" inputMode="numeric" placeholder={garcomEditando ? "Novo PIN (opcional)" : "PIN de 4 a 8 dígitos"} value={pin} onChange={(e) => setPin(e.target.value)} />
        <select value={funcao} onChange={(e) => setFuncao(e.target.value)}>
          <option value="garcom">Garçom</option><option value="cozinha">Cozinha</option>
          <option value="caixa">Caixa</option><option value="proprietario">Proprietário</option>
        </select>
        <button type="submit">{garcomEditando ? "Salvar alterações" : "Cadastrar usuário"}</button>
        {garcomEditando && <button type="button" onClick={limparFormulario}>Cancelar</button>}
      </form>
      {mensagem && <p>{mensagem}</p>}
      <section><h2>Usuários cadastrados</h2>
        {garcons.map((garcom) => (
          <div key={garcom.id}>
            <strong>{garcom.nome}</strong><span> — {garcom.email} — {garcom.funcao} — {garcom.ativo ? "Ativo" : "Inativo"}</span>
            <button type="button" onClick={() => iniciarEdicao(garcom)}>Editar</button>
            <button type="button" onClick={() => alternarAtivo(garcom)}>{garcom.ativo ? "Desativar" : "Ativar"}</button>
          </div>
        ))}
      </section>
    </main>
  );
}

export default GarconsAdmin;
