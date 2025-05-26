import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Pedidos() {
  const { user, pedidos, setPedidos, stock, setStock } = useContext(AppContext);
  const navigate = useNavigate();

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  const handleAprovar = (id) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === id && p.estado === "Pendente") {
          // Atualizar stock
          const novoStock = stock.map((item) => {
            if (p.materiais[item.nome]) {
              return {
                ...item,
                disponivel: item.disponivel - p.materiais[item.nome],
              };
            }
            return item;
          });
          setStock(novoStock);
          return { ...p, estado: "Aprovado" };
        }
        return p;
      })
    );
  };

  const handleDevolver = (pedidoId, devolucao) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id === pedidoId && p.estado === "Aprovado") {
          // Atualizar stock garantindo que disponivel <= total
          const novoStock = stock.map((item) => {
            if (devolucao[item.nome]) {
              const disponivelAtualizado = Math.min(
                item.disponivel + devolucao[item.nome],
                item.total
              );
              return {
                ...item,
                disponivel: disponivelAtualizado,
              };
            }
            return item;
          });
          setStock(novoStock);

          // Verificar se a devolução está completa
          const devolucaoCompleta = Object.entries(p.materiais).every(
            ([nome, q]) => (devolucao[nome] || 0) === q
          );

          return {
            ...p,
            estado: devolucaoCompleta ? "Concluído" : "Aprovado",
            devolvido: devolucao,
          };
        }
        return p;
      })
    );
  };

  if (!user.isAdmin) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <h2>Pedidos</h2>
        <p>Você não tem permissão para gerir pedidos.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Pedidos</h2>
      {pedidos.length === 0 && <p>Nenhum pedido registado.</p>}

      {pedidos.map((p) => (
        <PedidoItem
          key={p.id}
          pedido={p}
          onAprovar={handleAprovar}
          onDevolver={handleDevolver}
        />
      ))}
    </div>
  );
}

function PedidoItem({ pedido, onAprovar, onDevolver }) {
  const [devolucao, setDevolucao] = React.useState({});

  React.useEffect(() => {
    // Reset devolução quando muda o pedido
    setDevolucao(pedido.devolvido || {});
  }, [pedido]);

  const handleChangeDevolucao = (nome, val) => {
    val = Math.min(Math.max(val, 0), pedido.materiais[nome]);
    setDevolucao((d) => ({ ...d, [nome]: val }));
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 12,
        marginBottom: 12,
        borderRadius: 6,
      }}
    >
      <p>
        <b>Pedido #{pedido.id}</b> por <i>{pedido.nome}</i> em {pedido.data}
      </p>
      <p>
        <b>Estado:</b> {pedido.estado}
      </p>
      <p>
        <b>Materiais:</b>
      </p>
      <ul>
        {Object.entries(pedido.materiais).map(([nome, q]) => (
          <li key={nome}>
            {nome}: {q} (Devolvido: {pedido.devolvido?.[nome] || 0})
          </li>
        ))}
      </ul>

      {pedido.estado === "Pendente" && (
        <button onClick={() => onAprovar(pedido.id)}>Aprovar Pedido</button>
      )}

      {pedido.estado === "Aprovado" && (
        <>
          <p>Registrar devolução:</p>
          {Object.entries(pedido.materiais).map(([nome, q]) => (
            <div key={nome} style={{ marginBottom: 6 }}>
              <label>
                {nome}:{" "}
                <input
                  type="number"
                  min={0}
                  max={q}
                  value={devolucao[nome] || 0}
                  onChange={(e) =>
                    handleChangeDevolucao(nome, Number(e.target.value))
                  }
                />
              </label>
            </div>
          ))}
          <button onClick={() => onDevolver(pedido.id, devolucao)}>
            Confirmar Devolução
          </button>
        </>
      )}

      {pedido.estado === "Concluído" && <p>Pedido concluído!</p>}
    </div>
  );
}
