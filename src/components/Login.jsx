import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

export default function Login() {
  const { login } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate("/material");
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
