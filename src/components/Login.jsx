import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

export default function Login() {
  const { setUser } = useContext(AppContext);
  const [nome, setNome] = useState("");
  const [isChefe, setIsChefe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Insira seu nome");
    setUser({ nome: nome.trim(), isChefe, loggedIn: true });
    navigate("/materiais");
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <label>
          <input
            type="checkbox"
            checked={isChefe}
            onChange={() => setIsChefe(!isChefe)}
          />{" "}
          Sou chefe do material
        </label>
        <button type="submit" style={{ marginTop: 10, padding: "8px 16px" }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
