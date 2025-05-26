import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Materiais() {
  const { user, stock, pedidos, setPedidos } = useContext(AppContext);
  const navigate = useNavigate();
  const [dataPedido, setDataPedido] = useState("");
  const [quantidades, setQuantidades] = useState({});

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  const handleChangeQuantidade = (nome, value) => {
    const val = Math.max(0, Math.min(value || 0, stock.find((i) => i.nome === nome)?.disponivel || 0));
    setQuantidades((q) => ({ ...q, [nome]: val }));
  };

  const handleSubmitPedido = () => {
    if (!dataPedido) return alert("Escolha uma data");
    const materiais = Object.fromEntries(
      Object.entries(quantidades).filter(([_, q]) => q > 0)
    );
    if (Object.keys(materiais).length === 0) return alert("Selecione algum material");

    const novoPedido = {
      id: Date.now(),
      nome: user.nome,
      data: dataPedido,
      materiais,
      estado: "Pendente",
      devolvido: {},
    };
    setPedidos([...pedidos, novoPedido]);
    setQuantidades({});
    setDataPedido("");
    alert("Pedido enviado!");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Olá, {user.nome}</h2>
      <h3>Stock disponível</h3>
      {stock.map((item) => (
        <div key={item.id} style={{ marginBottom: 6 }}>
          <b>{item.nome}</b>: {item.disponivel} / {item.total}
        </div>
      ))}

      {!user.isChefe && (
        <>
          <h3>Fazer pedido</h3>
          <input
            type="date"
            value={dataPedido}
            onChange={(e) => setDataPedido(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {stock.map((item) => (
            <div key={item.id} style={{ marginBottom: 6 }}>
              <label>
                {item.nome}:{" "}
                <input
                  type="number"
                  min={0}
                  max={item.disponivel}
                  value={quantidades[item.nome] || ""}
                  onChange={(e) => handleChangeQuantidade(item.nome, Number(e.target.value))}
                />
              </label>
            </div>
          ))}
          <button onClick={handleSubmitPedido} style={{ marginTop: 10 }}>
            Enviar Pedido
          </button>
        </>
      )}

      {user.isChefe && <p>O chefe do material não pode fazer pedidos aqui.</p>}
    </div>
  );
}
