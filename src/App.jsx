import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppProvider, AppContext } from "./context/AppContext";
import Login from "./components/Login";
import Material from "./components/Material";
import Pedidos from "./components/Pedidos";
import Configuracao from "./components/Configuracao";

function Menu() {
  const { user } = useContext(AppContext);

  return (
    <nav
      style={{
        padding: 10,
        backgroundColor: "#eee",
        marginBottom: 20,
        display: "flex",
        gap: 10,
      }}
    >
      <Link to="/">Login</Link>
      <Link to="/material">Material</Link>
      <Link to="/pedidos">Pedidos</Link>
      {user.isAdmin && <Link to="/configuracao">Configuração</Link>}
    </nav>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Menu />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/material" element={<Material />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/configuracao" element={<Configuracao />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
