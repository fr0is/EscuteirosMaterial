import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import "./Configuracao.css";

export default function Configuracao() {
  const { user, users, setUsers, adicionarUsuario, supabase } = useContext(AppContext);
  const navigate = useNavigate();

  const [novaPassword, setNovaPassword] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState("user");

  useEffect(() => {
    if (!user.loggedIn || !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

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
    <div className="config-container">
      <h2>Configuração de Utilizador</h2>

      <h3>Adicionar Utilizador</h3>
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

      <h3>Utilizadores Registados</h3>
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
    </div>
  );
}
