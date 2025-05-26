import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Material() {
  const { user, stock, pedidos, setPedidos } = useContext(AppContext);
  const navigate = useNavigate();
  const [quantidades, setQuantidades] = useState({});

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  const handleIncrement = (nome) => {
    setQuantidades((q) => {
      const atual = q[nome] || 0;
      const max = stock.find((i) => i.nome === nome)?.disponivel || 0;
      if (atual < max) {
        return { ...q, [nome]: atual + 1 };
      }
      return q;
    });
  };

  const handleDecrement = (nome) => {
    setQuantidades((q) => {
      const atual = q[nome] || 0;
      if (atual > 0) {
        return { ...q, [nome]: atual - 1 };
      }
      return q;
    });
  };

  const handleSubmitPedido = () => {
    const materiais = Object.fromEntries(
      Object.entries(quantidades).filter(([_, q]) => q > 0)
    );
    if (Object.keys(materiais).length === 0) {
      alert("Selecione algum material para pedir.");
      return;
    }

    const hoje = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

    const novoPedido = {
      id: Date.now(),
      nome: user.nome,
      data: hoje,
      materiais,
      estado: "Pendente",
      devolvido: {},
    };

    setPedidos([...pedidos, novoPedido]);
    setQuantidades({});
    alert("Pedido enviado com sucesso!");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Olá, {user.nome}</h2>
      <h3>Stock disponível</h3>
      {stock.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
            justifyContent: "space-between",
            borderBottom: "1px solid #ddd",
            paddingBottom: 6,
          }}
        >
          <div>
            <b>{item.nome}</b>: {item.disponivel} / {item.total}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => handleDecrement(item.nome)}>-</button>
            <span style={{ minWidth: 20, textAlign: "center" }}>
              {quantidades[item.nome] || 0}
            </span>
            <button onClick={() => handleIncrement(item.nome)}>+</button>
          </div>
        </div>
      ))}

      {!user.isChefe && (
        <button
          onClick={handleSubmitPedido}
          style={{ marginTop: 20, padding: "10px 20px", fontSize: 16 }}
        >
          Fazer Pedido
        </button>
      )}

      {user.isChefe && <p>O chefe do material não pode fazer pedidos aqui.</p>}
    </div>
  );
}
