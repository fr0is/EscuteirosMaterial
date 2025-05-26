import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Configuracao() {
  const { user, users, adicionarUsuario, setUsers } = useContext(AppContext);
  const navigate = useNavigate();

  const [novoUsername, setNovoUsername] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState("user");

  if (!user.loggedIn || !user.isAdmin) {
    navigate("/");
    return null;
  }

  const handleAddUser = () => {
    if (!novoUsername.trim() || !novoNome.trim()) {
      alert("Preencha todos os campos.");
      return;
    }
    if (users.some((u) => u.username === novoUsername.trim())) {
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

  const handleRemoveUser = (username) => {
    if (username === "CA127") {
      alert("O usuário CA127 não pode ser removido.");
      return;
    }
    setUsers((u) => u.filter((user) => user.username !== username));
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Configuração de Usuários</h2>

      <h3>Adicionar Usuário</h3>
      <input
        placeholder="Username"
        value={novoUsername}
        onChange={(e) => setNovoUsername(e.target.value)}
        style={{ marginRight: 10 }}
      />
      <input
        placeholder="Nome"
        value={novoNome}
        onChange={(e) => setNovoNome(e.target.value)}
        style={{ marginRight: 10 }}
      />
      <select
        value={novoTipo}
        onChange={(e) => setNovoTipo(e.target.value)}
        style={{ marginRight: 10 }}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleAddUser}>Adicionar</button>

      <h3 style={{ marginTop: 30 }}>Usuários Registados</h3>
      <ul>
        {users.map((u) => (
          <li key={u.username} style={{ marginBottom: 8 }}>
            <b>{u.username}</b> ({u.tipo}) - {u.nome}{" "}
            {u.username !== "CA127" && (
              <button
                onClick={() => handleRemoveUser(u.username)}
                style={{ marginLeft: 10 }}
              >
                Remover
              </button>
            )}
            {u.username === "CA127" && <span style={{ marginLeft: 10, color: "gray" }}>(Não pode remover)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
