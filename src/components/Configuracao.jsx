import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Configuracao() {
  const { user, users, adicionarUsuario } = useContext(AppContext);
  const navigate = useNavigate();

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  if (!user.isAdmin) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <h2>Configuração</h2>
        <p>Você não tem permissão para aceder a esta página.</p>
      </div>
    );
  }

  const [novoUsername, setNovoUsername] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState("user");

  const handleAdicionar = (e) => {
    e.preventDefault();

    if (!novoUsername.trim() || !novoNome.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    // Verificar se já existe
    if (users.find((u) => u.username === novoUsername.trim())) {
      alert("Username já existe.");
      return;
    }

    adicionarUsuario({
      username: novoUsername.trim(),
      nome: novoNome.trim(),
      tipo: novoTipo,
    });

    setNovoUsername("");
    setNovoNome("");
    setNovoTipo("user");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Configuração de Utilizadores</h2>

      <h3>Utilizadores existentes</h3>
      <ul>
        {users.map((u) => (
          <li key={u.username}>
            <b>{u.username}</b> ({u.nome}) - Tipo: {u.tipo}
          </li>
        ))}
      </ul>

      <h3>Adicionar novo utilizador</h3>
      <form onSubmit={handleAdicionar} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
        <input
          placeholder="Username"
          value={novoUsername}
          onChange={(e) => setNovoUsername(e.target.value)}
          required
        />
        <input
          placeholder="Nome completo"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          required
        />
        <select
          value={novoTipo}
          onChange={(e) => setNovoTipo(e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" style={{ padding: "8px 16px" }}>
          Adicionar Utilizador
        </button>
      </form>
    </div>
  );
}
