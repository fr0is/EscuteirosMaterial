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

  // Calcula pendentes por item (igual antes)
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
    // Validar campos obrigatórios
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

    const hoje = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

    const novoPedido = {
      id: Date.now(),
      nome: user.nome,
      data: hoje,
      materiais,
      estado: "Pendente",
      devolvido: {},
      patrulha, // adiciona campo patrulha
      atividade, // adiciona campo atividade
    };

    setPedidos([...pedidos, novoPedido]);
    setQuantidades({});
    setPatrulha("");
    setAtividade("");
    alert("Pedido enviado com sucesso!");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
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
              marginBottom: 8,
              justifyContent: "space-between",
              borderBottom: "1px solid #ddd",
              paddingBottom: 6,
            }}
          >
            <div>
              <b>
                {item.nome} {pendente > 0 && <span style={{ color: "red" }}>*</span>}
              </b>
              : {item.disponivel} / {item.total}{" "}
              {pendente > 0 && <em style={{ color: "red" }}>(Pendentes: {pendente})</em>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => handleDecrement(item.nome)}>-</button>
              <span style={{ minWidth: 20, textAlign: "center" }}>
                {quantidades[item.nome] || 0}
              </span>
              <button onClick={() => handleIncrement(item.nome)}>+</button>
            </div>
          </div>
        );
      })}

      {!user.isAdmin && (
        <>
          <div style={{ marginTop: 20 }}>
            <label>
              Nome da Patrulha/Equipa/Bando/Tribo: <br />
              <input
                type="text"
                value={patrulha}
                onChange={(e) => setPatrulha(e.target.value)}
                style={{ width: "100%", padding: 6, marginBottom: 10 }}
              />
            </label>
            <label>
              Atividade: <br />
              <input
                type="text"
                value={atividade}
                onChange={(e) => setAtividade(e.target.value)}
                style={{ width: "100%", padding: 6, marginBottom: 10 }}
              />
            </label>
            <button
              onClick={handleSubmitPedido}
              style={{ marginTop: 10, padding: "10px 20px", fontSize: 16 }}
            >
              Fazer Pedido
            </button>
          </div>
        </>
      )}

      {user.isAdmin && <p>O chefe do material não pode fazer pedidos aqui.</p>}
    </div>
  );
}
