import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Material() {
  const { user, stock, pedidos, setPedidos } = useContext(AppContext);
  const navigate = useNavigate();
  const [quantidades, setQuantidades] = useState({});
  const [patrulha, setPatrulha] = useState("");
  const [atividade, setAtividade] = useState("");

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  // Calcula pendentes por item
  const pendentesPorItem = {};
  pedidos.forEach((p) => {
    if (p.estado === "Pendente") {
      Object.entries(p.materiais).forEach(([nome, q]) => {
        pendentesPorItem[nome] = (pendentesPorItem[nome] || 0) + q;
      });
    }
  });

  const handleIncrement = (nome) => {
    setQuantidades((q) => {
      const atual = q[nome] || 0;
      const max = (stock.find((i) => i.nome === nome)?.disponivel || 0) - (pendentesPorItem[nome] || 0);
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
    if (patrulha.trim() === "") {
      alert("Por favor, informe o nome da patrulha/equipa/bando/tribo.");
      return;
    }
    if (atividade.trim() === "") {
      alert("Por favor, informe a atividade.");
      return;
    }

    const materiais = Object.fromEntries(
      Object.entries(quantidades).filter(([_, q]) => q > 0)
    );
    if (Object.keys(materiais).length === 0) {
      alert("Selecione algum material para pedir.");
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];

    const novoPedido = {
      id: Date.now(),
      nome: user.nome,
      data: hoje,
      materiais,
      estado: "Pendente",
      devolvido: {},
      patrulha,
      atividade,
    };

    setPedidos([...pedidos, novoPedido]);
    setQuantidades({});
    setPatrulha("");
    setAtividade("");
    alert("Pedido enviado com sucesso!");
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 600,
        margin: "auto",
        boxSizing: "border-box",
      }}
    >
      <h2>Olá, {user.nome}</h2>
      <h3>Stock disponível</h3>
      {stock.map((item) => {
        const pendente = pendentesPorItem[item.nome] || 0;
        return (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 12,
              justifyContent: "space-between",
              borderBottom: "1px solid #ddd",
              paddingBottom: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>
                {item.nome} {pendente > 0 && <span style={{ color: "red" }}>*</span>}
              </b>
              : {item.disponivel} / {item.total}{" "}
              {pendente > 0 && (
                <em style={{ color: "red", display: "block", marginTop: 4 }}>
                  (Pendentes: {pendente})
                </em>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => handleDecrement(item.nome)}
                style={{
                  padding: "8px 12px",
                  fontSize: 20,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                aria-label={`Diminuir quantidade de ${item.nome}`}
              >
                −
              </button>
              <span
                style={{
                  minWidth: 30,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {quantidades[item.nome] || 0}
              </span>
              <button
                onClick={() => handleIncrement(item.nome)}
                style={{
                  padding: "8px 12px",
                  fontSize: 20,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                aria-label={`Aumentar quantidade de ${item.nome}`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      {!user.isAdmin && (
        <div style={{ marginTop: 30 }}>
          <label style={{ display: "block", marginBottom: 12 }}>
            Nome de Bando/Patrulha/Equipa/Tribo: <br />
            <input
              type="text"
              value={patrulha}
              onChange={(e) => setPatrulha(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                fontSize: 16,
                borderRadius: 6,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              placeholder="Ex: Bando Lobo"
            />
          </label>
          <label style={{ display: "block", marginBottom: 20 }}>
            Atividade: <br />
            <input
              type="text"
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                fontSize: 16,
                borderRadius: 6,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              placeholder="Ex: Acampamento de Verão"
            />
          </label>
          <button
            onClick={handleSubmitPedido}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 18,
              borderRadius: 6,
              border: "none",
              backgroundColor: "#007bff",
              color: "white",
              cursor: "pointer",
            }}
          >
            Fazer Pedido
          </button>
        </div>
      )}

      {user.isAdmin && <p>O chefe do material não pode fazer pedidos aqui.</p>}
    </div>
  );
}
