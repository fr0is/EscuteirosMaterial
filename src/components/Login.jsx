import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

export default function Login() {
  const { users, setUser } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const userEncontrado = users.find((u) => u.username === username.trim());
    if (!userEncontrado) {
      alert("Username não encontrado");
      return;
    }

    setUser({
      username: userEncontrado.username,
      nome: userEncontrado.nome,
      isAdmin: userEncontrado.tipo === "admin",
      loggedIn: true,
    });
    navigate("/material");
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 400,
        margin: "auto",
        boxSizing: "border-box",
      }}
    >
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            fontSize: 18,
            marginBottom: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
          required
          autoFocus
        />
        <button
          type="submit"
          style={{
            padding: "14px 0",
            fontSize: 18,
            borderRadius: 6,
            border: "none",
            backgroundColor: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
