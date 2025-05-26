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
    if (!user.isAdmin) return; // só admin aprova
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
    if (!user.isAdmin) return; // só admin devolve
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

  const handleCancelar = (id) => {
    // Apenas o dono do pedido pode cancelar e só se estiver pendente
    setPedidos((prev) => prev.filter((p) => !(p.id === id && p.nome === user.nome && p.estado === "Pendente")));
  };

  // Pedidos a mostrar:
  const pedidosExibir = user.isAdmin
    ? pedidos // admin vê tudo
    : pedidos.filter((p) => p.nome === user.nome); // user normal só os seus

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Pedidos</h2>
      {pedidosExibir.length === 0 && <p>Nenhum pedido registado.</p>}

      {pedidosExibir.map((p) => (
        <PedidoItem
          key={p.id}
          pedido={p}
          onAprovar={handleAprovar}
          onDevolver={handleDevolver}
          onCancelar={handleCancelar}
          isAdmin={user.isAdmin}
          currentUserName={user.nome}
        />
      ))}
    </div>
  );
}

function PedidoItem({ pedido, onAprovar, onDevolver, onCancelar, isAdmin, currentUserName }) {
  const [devolucao, setDevolucao] = React.useState({});

  React.useEffect(() => {
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

      {/* Botão Aprovar para Admin */}
      {isAdmin && pedido.estado === "Pendente" && (
        <button onClick={() => onAprovar(pedido.id)}>Aprovar Pedido</button>
      )}

      {/* Botão Devolver para Admin */}
      {isAdmin && pedido.estado === "Aprovado" && (
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

      {/* Botão Cancelar para usuário dono do pedido, se ainda pendente */}
      {!isAdmin && pedido.estado === "Pendente" && pedido.nome === currentUserName && (
        <button
          style={{ marginTop: 8, backgroundColor: "#f44336", color: "white" }}
          onClick={() => {
            if (
              window.confirm(
                "Tem certeza que deseja cancelar este pedido?"
              )
            ) {
              onCancelar(pedido.id);
            }
          }}
        >
          Cancelar Pedido
        </button>
      )}

      {pedido.estado === "Concluído" && <p>Pedido concluído!</p>}
    </div>
  );
}
