import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppProvider, AppContext } from "./context/AppContext";
import Login from "./components/Login";
import Material from "./components/Material";
import Pedidos from "./components/Pedidos";
import Configuracao from "./components/Configuracao";

function Header() {
  const { user } = useContext(AppContext);

  return (
    <header className="main-header">
      <div className="logo-area">
        {/* Substituir pelo seu logo real se tiver */}
        <img src="/logo.png" alt="Logo" />
      </div>
      <h1 className="site-title">Depósito Material 127</h1>
      <nav className="nav-links">
        <Link to="/">Login</Link>
        <Link to="/material">Material</Link>
        <Link to="/pedidos">Pedidos</Link>
        {user?.isAdmin && <Link to="/configuracao">Configuração</Link>}
      </nav>
    </header>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Header />
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
