import React, { useContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link,useNavigate  } from "react-router-dom";
import { AppProvider, AppContext } from "./context/AppContext";
import Login from "./components/Login";
import Material from "./components/Material";
import Pedidos from "./components/Pedidos";
import Configuracao from "./components/Configuracao";
import DetalheMaterial from "./components/DetalheMaterial";
import { FaBars } from "react-icons/fa";
import "../src/styles/Header.css";
import logo from "./logo.png";
// index.js (ou App.js)
import "./index.css";  // global/base CSS

function Header() {
  const { user } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (user?.loggedIn) {
      navigate("/material");
    } else {
      navigate("/");
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <img
          src={logo}
          alt="Logo"
          className="logo"
          style={{ cursor: "pointer" }}
          onClick={handleLogoClick}
          onError={(e) => (e.target.style.display = "none")}
        />
      </div>

      <h1 className="site-title">Depósito Material 127</h1>
      
      {user?.loggedIn && (
        <>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <FaBars />
          </button>
          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            <Link to="/material" onClick={() => setMenuOpen(false)}>Material</Link>
            {user.isAdmin &&<Link to="/detalheMaterial" onClick={() => setMenuOpen(false)}>Detalhe Material</Link>}
            <Link to="/pedidos" onClick={() => setMenuOpen(false)}>Pedidos</Link>
            <Link to="/configuracao" onClick={() => setMenuOpen(false)}>Conta</Link>
          </nav>
        </>
      )}
      
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
          <Route path="/detalheMaterial" element={<DetalheMaterial />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/configuracao" element={<Configuracao />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
