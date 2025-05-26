import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { supabase } from "../supabaseClient"; // import da instância do Supabase

export default function Login() {
  const { setUser } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Consulta à tabela users no Supabase pelo username
    const { data: userEncontrado, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .single();

    setLoading(false);

    if (error || !userEncontrado) {
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
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column" }}
      >
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
          disabled={loading}
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
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
