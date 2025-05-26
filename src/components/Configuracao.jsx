import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Configuracao() {
  const { user, users, setUsers, adicionarUsuario, supabase } = useContext(AppContext);
  const navigate = useNavigate();

  const [novoUsername, setNovoUsername] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState("user");

  useEffect(() => {
    if (!user.loggedIn || !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleAddUser = async () => {
    if (!novoUsername.trim() || !novoNome.trim()) {
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
      });
      setNovoUsername("");
      setNovoNome("");
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
    <div
      style={{
        padding: 20,
        maxWidth: 600,
        margin: "auto",
        boxSizing: "border-box",
      }}
    >
      <h2>Configuração de Utilizador</h2>

      <h3>Adicionar Utilizador</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <input
          placeholder="Username"
          value={novoUsername}
          onChange={(e) => setNovoUsername(e.target.value)}
          style={{
            flex: "1 1 100%",
            padding: 10,
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
        <input
          placeholder="Nome"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          style={{
            flex: "1 1 100%",
            padding: 10,
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
        <select
          value={novoTipo}
          onChange={(e) => setNovoTipo(e.target.value)}
          style={{
            flex: "1 1 100%",
            padding: 10,
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleAddUser}
          style={{
            flex: "1 1 100%",
            padding: "12px 0",
            fontSize: 18,
            borderRadius: 4,
            border: "none",
            backgroundColor: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
        >
          Adicionar
        </button>
      </div>

      <h3>Utilizadores Registados</h3>
      <ul style={{ padding: 0, listStyle: "none" }}>
        {users.map((u) => (
          <li
            key={u.username}
            style={{
              marginBottom: 12,
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 6,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 16,
            }}
          >
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <b>{u.username}</b> ({u.tipo}) - {u.nome}
            </div>
            {u.username !== "CA127" && u.username !== user.username ? (
              <button
                onClick={() => handleRemoveUser(u.username)}
                style={{
                  padding: "6px 12px",
                  fontSize: 14,
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Remover
              </button>
            ) : (
              <span
                style={{
                  marginLeft: 10,
                  color: "gray",
                  fontStyle: "italic",
                  flexShrink: 0,
                }}
              >
                (Não pode remover)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
