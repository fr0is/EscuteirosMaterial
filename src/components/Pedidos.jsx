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

  // Função para cancelar pedido pendente
  const handleCancelar = (id) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
  };

  // Se o user não é admin, filtra para mostrar só os pedidos do user
  const pedidosVisiveis = user.isAdmin
    ? pedidos
    : pedidos.filter((p) => p.nome === user.nome);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
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

  // Pode cancelar se pendente e (admin ou dono do pedido)
  const podeCancelar = pedido.estado === "Pendente" && (isAdmin || pedido.nome === userNome);

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
      <ul>
        {Object.entries(pedido.materiais).map(([nome, q]) => (
          <li key={nome}>
            {nome}: {q} (Devolvido: {pedido.devolvido?.[nome] || 0})
          </li>
        ))}
      </ul>

      {pedido.estado === "Pendente" && isAdmin && (
        <button onClick={() => onAprovar(pedido.id)}>Aprovar Pedido</button>
      )}

      {podeCancelar && (
        <button
          onClick={() => onCancelar(pedido.id)}
          style={{ marginLeft: 10, backgroundColor: "red", color: "white" }}
        >
          Cancelar Pedido
        </button>
      )}

      {pedido.estado === "Aprovado" && isAdmin && (
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
