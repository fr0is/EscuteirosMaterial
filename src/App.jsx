import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Login from "./components/Login";
import Materiais from "./components/Materiais";
import Pedidos from "./components/Pedidos";

function App() {
  return (
    <AppProvider>
      <Router>
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
          <Link to="/materiais">Materiais</Link>
          <Link to="/pedidos">Pedidos</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/materiais" element={<Materiais />} />
          <Route path="/pedidos" element={<Pedidos />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
