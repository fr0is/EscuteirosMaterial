import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import "../styles/Configuracao.css";

export default function Configuracao() {
  const { user, users, setUsers, adicionarUsuario, supabase } = useContext(AppContext);
  const navigate = useNavigate();

  const [novaPassword, setNovaPassword] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState("user");

  // Estado para controlar qual seção está ativa no menu lateral
  const [secaoAtiva, setSecaoAtiva] = useState("alterarPassword");

  useEffect(() => {
    if (!user.loggedIn || !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // Função para alterar a password do utilizador atual (exemplo simples)
  const handleChangePassword = () => {
    if (!novaPassword.trim()) {
      alert("Insira a nova password.");
      return;
    }
    // Aqui você faria a lógica para alterar a password no backend
    alert("Password alterada com sucesso (simulação).");
    setNovaPassword("");
  };

  const handleAddUser = async () => {
    if (!novoUsername.trim() || !novoNome.trim() || !novaPassword.trim()) {
      alert("Preencha todos os campos.");
      return;
    }
    if (users.some((u) => u.username === novoUsername.trim())) {
      alert("Username já existe.");
      return;
    }
    try {
      await adicionarUsuario({
        username: novoUsername.trim(),
        nome: novoNome.trim(),
        tipo: novoTipo,
        password: novaPassword.trim(),
      });
      setNovoUsername("");
      setNovoNome("");
      setNovaPassword("");
      setNovoTipo("user");
      alert("Usuário adicionado com sucesso!");
    } catch (error) {
      alert("Erro ao adicionar usuário.");
      console.error(error);
    }
  };

  const handleRemoveUser = async (username) => {
    if (username === "CA127") {
      alert("O utilizador CA127 não pode ser removido.");
      return;
    }
    if (username === user.username) {
      alert("Você não pode remover a si mesmo.");
      return;
    }
    try {
      const { error } = await supabase.from("users").delete().eq("username", username);
      if (error) {
        alert("Erro ao remover usuário.");
        console.error(error);
        return;
      }
      setUsers((u) => u.filter((user) => user.username !== username));
      alert("Usuário removido com sucesso!");
    } catch (error) {
      alert("Erro ao remover usuário.");
      console.error(error);
    }
  };

  return (
    <div className="config-page">
      <nav className="sidebar-menu">
        <ul>
          <li
            className={secaoAtiva === "alterarPassword" ? "active" : ""}
            onClick={() => setSecaoAtiva("alterarPassword")}
          >
            Alterar Password
          </li>
          <li
            className={secaoAtiva === "utilizadoresRegistados" ? "active" : ""}
            onClick={() => setSecaoAtiva("utilizadoresRegistados")}
          >
            Utilizadores Registados
          </li>
          <li
            className={secaoAtiva === "adicionarUtilizador" ? "active" : ""}
            onClick={() => setSecaoAtiva("adicionarUtilizador")}
          >
            Adicionar Utilizador
          </li>
        </ul>
      </nav>

      <main className="content-area">
        {secaoAtiva === "alterarPassword" && (
          <section>
            <h2>Alterar Password</h2>
            <input
              type="password"
              placeholder="Nova Password"
              value={novaPassword}
              onChange={(e) => setNovaPassword(e.target.value)}
              className="input-field"
            />
            <button onClick={handleChangePassword} className="btn btn-adicionar">
              Confirmar Alteração
            </button>
          </section>
        )}

        {secaoAtiva === "utilizadoresRegistados" && (
          <section>
            <h2>Utilizadores Registados</h2>
            <ul className="user-list">
              {users.map((u) => (
                <li key={u.username} className="user-list-item">
                  <div className="user-info">
                    <b>{u.username}</b> ({u.tipo}) - {u.nome}
                  </div>
                  {u.username !== "CA127" && u.username !== user.username ? (
                    <button
                      onClick={() => handleRemoveUser(u.username)}
                      className="btn btn-remover"
                    >
                      Remover
                    </button>
                  ) : (
                    <span className="disabled-remover">(Não pode remover)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {secaoAtiva === "adicionarUtilizador" && (
          <section>
            <h2>Adicionar Utilizador</h2>
            <div className="form-group">
              <input
                placeholder="Username"
                value={novoUsername}
                onChange={(e) => setNovoUsername(e.target.value)}
                className="input-field"
              />
              <input
                type="password"
                placeholder="Password"
                value={novaPassword}
                onChange={(e) => setNovaPassword(e.target.value)}
                className="input-field"
              />
              <input
                placeholder="Nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="input-field"
              />
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
                className="select-field"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={handleAddUser} className="btn btn-adicionar">
                Adicionar
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
