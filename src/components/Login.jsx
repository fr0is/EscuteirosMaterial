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
    <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
          required
        />
        <button type="submit" style={{ marginTop: 10, padding: "8px 16px" }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
