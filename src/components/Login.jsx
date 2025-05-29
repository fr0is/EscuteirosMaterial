import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "../styles/Login.css";
import "../styles/utilities.css";
import "../styles/variables.css";

export default function Login() {
  const { login } = useContext(AppContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIdentifierError("");
    setPasswordError("");
    
    try {
      await login(identifier, password);
      navigate("/material");
    } catch (error) {
      // Aqui vamos verificar o erro do login
      if (error.message.includes("Identifier")) {
        setIdentifierError("Username/Email incorreto. Tente novamente.");
      } else if (error.message.includes("Password")) {
        setPasswordError("Password incorreta. Tente novamente.");
      } else {
        // Para erros genéricos
        setIdentifierError("Falha ao fazer login. Tente novamente.");
        setPasswordError("Falha ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="identifier" className="sr-only">Username/Email</label>
        <input
          id="identifier"
          name="identifier"
          placeholder="Username/Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoFocus
          disabled={loading}
          className={identifierError ? "error" : ""}
        />
        {identifierError && <div className="error-message">{identifierError}</div>}

        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          name="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className={passwordError ? "error" : ""}
        />
        {passwordError && <div className="error-message">{passwordError}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "A entrar..." : "Login"}
        </button>
      </form>
    </div>
  );
}
