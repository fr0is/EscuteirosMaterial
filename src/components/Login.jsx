import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "../styles/Login.css";

export default function Login() {
  const { login } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUsernameError("");
    setPasswordError("");
    
    try {
      await login(username, password);
      navigate("/material");
    } catch (error) {
      // Aqui vamos verificar o erro do login
      if (error.message.includes("Username")) {
        setUsernameError("Username incorreto. Tente novamente.");
      } else if (error.message.includes("Password")) {
        setPasswordError("Password incorreta. Tente novamente.");
      } else {
        // Para erros genéricos
        setUsernameError("Falha ao fazer login. Tente novamente.");
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
        <label htmlFor="username" className="sr-only">Username</label>
        <input
          id="username"
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
          disabled={loading}
          className={usernameError ? "error" : ""}
        />
        {usernameError && <div className="error-message">{usernameError}</div>}

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
