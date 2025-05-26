import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Pedidos() {
  const { user, pedidos, setPedidos, stock, setStock, updatePedido } = useContext(AppContext);
  const navigate = useNavigate();

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  const handleAprovar = async (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    const novoStock = stock.map((item) => {
      if (pedido.materiais[item.nome]) {
        return {
          ...item,
          disponivel: item.disponivel - pedido.materiais[item.nome],
        };
      }
      return item;
    });

    const stockUpdated = await setStock(novoStock);
    if (!stockUpdated) {
      alert("Erro ao atualizar stock");
      return;
    }

    const pedidoUpdated = await updatePedido(id, { estado: "Aprovado" });
    if (!pedidoUpdated) {
      alert("Erro ao atualizar pedido");
      return;
    }
  };

  const handleDevolver = async (pedidoId, devolucao) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido || pedido.estado !== "Aprovado") return;

    const novoStock = stock.map((item) => {
      if (devolucao[item.nome]) {
        return {
          ...item,
          disponivel: Math.min(item.disponivel + devolucao[item.nome], item.total),
        };
      }
      return item;
    });

    const stockUpdated = await setStock(novoStock);
    if (!stockUpdated) {
      alert("Erro ao atualizar stock");
      return;
    }

    const devolucaoCompleta = Object.entries(pedido.materiais).every(
      ([nome, q]) => (devolucao[nome] || 0) === q
    );

    const novoEstado = devolucaoCompleta ? "Concluído" : "Aprovado";

    const pedidoUpdated = await updatePedido(pedidoId, { estado: novoEstado, devolvido: devolucao });
    if (!pedidoUpdated) {
      alert("Erro ao atualizar pedido");
      return;
    }
  };

  const handleCancelar = async (id) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      alert("Erro ao cancelar pedido");
      console.error(error);
      return;
    }
    setPedidos((prev) => prev.filter((p) => p.id !== id));
  };

  const pedidosVisiveis = user.isAdmin ? pedidos : pedidos.filter((p) => p.nome === user.nome);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto", boxSizing: "border-box" }}>
      <h2>Pedidos</h2>
      {pedidosVisiveis.length === 0 && <p>Nenhum pedido registado.</p>}

      {pedidosVisiveis.map((p) => (
        <PedidoItem
          key={p.id}
          pedido={p}
          onAprovar={handleAprovar}
          onDevolver={handleDevolver}
          onCancelar={handleCancelar}
          isAdmin={user.isAdmin}
          userNome={user.nome}
        />
      ))}
    </div>
  );
}

function PedidoItem({ pedido, onAprovar, onDevolver, onCancelar, isAdmin, userNome }) {
  const [devolucao, setDevolucao] = React.useState({});

  React.useEffect(() => {
    setDevolucao(pedido.devolvido || {});
  }, [pedido]);

  const handleChangeDevolucao = (nome, val) => {
    val = Math.min(Math.max(val, 0), pedido.materiais[nome]);
    setDevolucao((d) => ({ ...d, [nome]: val }));
  };

  const podeCancelar = pedido.estado === "Pendente" && (isAdmin || pedido.nome === userNome);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 16,
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
      }}
    >
      <p>
        <b>Pedido</b> por <i>{pedido.nome}</i> em {pedido.data}
      </p>
      <p>
        <b>Bando/Patrulha/Equipa/Tribo:</b> {pedido.patrulha || "-"}
      </p>
      <p>
        <b>Atividade:</b> {pedido.atividade || "-"}
      </p>
      <p>
        <b>Estado:</b> {pedido.estado}
      </p>
      <p>
        <b>Materiais:</b>
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        {Object.entries(pedido.materiais).map(([nome, q]) => (
          <li key={nome} style={{ marginBottom: 6 }}>
            {nome}: {q} (Devolvido: {pedido.devolvido?.[nome] || 0})
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        {pedido.estado === "Pendente" && isAdmin && (
          <button
            onClick={() => onAprovar(pedido.id)}
            style={{
              flex: "1 1 auto",
              padding: 14,
              fontSize: 16,
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Aprovar Pedido
          </button>
        )}

        {podeCancelar && (
          <button
            onClick={() => onCancelar(pedido.id)}
            style={{
              flex: "1 1 auto",
              padding: 14,
              fontSize: 16,
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancelar Pedido
          </button>
        )}
      </div>

      {pedido.estado === "Aprovado" && isAdmin && (
        <>
          <p>Registar devolução:</p>
          {Object.entries(pedido.materiais).map(([nome, q]) => (
            <div
              key={nome}
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <label style={{ flex: "1 1 150px", fontSize: 16 }}>
                {nome}:
                <input
                  type="number"
                  min={0}
                  max={q}
                  value={devolucao[nome] || 0}
                  onChange={(e) => handleChangeDevolucao(nome, Number(e.target.value))}
                  style={{
                    marginLeft: 8,
                    padding: 8,
                    fontSize: 16,
                    width: "80px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
                <span style={{ marginLeft: 8, fontSize: 14, color: "#666" }}>
                  / {q}
                </span>
              </label>
            </div>
          ))}
          <button
            onClick={() => onDevolver(pedido.id, devolucao)}
            style={{
              padding: 14,
              fontSize: 16,
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              width: "100%",
              marginTop: 10,
            }}
          >
            Confirmar Devolução
          </button>
        </>
      )}

      {pedido.estado === "Concluído" && (
        <p style={{ color: "green", fontWeight: "bold", marginTop: 12 }}>
          Pedido concluído!
        </p>
      )}
    </div>
  );
}
