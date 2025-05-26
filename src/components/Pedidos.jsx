import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Pedidos() {
  const {
    user,
    pedidos,
    setPedidos,
    materiais,
    setMateriais,
    updatePedido,
    cancelarPedido,
  } = useContext(AppContext);
  const navigate = useNavigate();

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  const handleAprovar = async (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    // Verifica materiais disponível
    for (const [nome, qtd] of Object.entries(pedido.materiais)) {
      const itemmateriais = materiais.find((s) => s.nome === nome);
      if (!itemmateriais || itemmateriais.disponivel < qtd) {
        alert(`materiais insuficiente para: ${nome}`);
        return;
      }
    }

    // Atualiza materiais
    const novoMateriais = materiais.map((item) => {
      if (pedido.materiais[item.nome]) {
        return {
          ...item,
          disponivel: item.disponivel - pedido.materiais[item.nome],
        };
      }
      return item;
    });

    const materiaisUpdated = await setMateriais(novoMateriais);
    if (!materiaisUpdated) {
      alert("Erro ao atualizar materiais");
      return;
    }

    // Atualiza estado do pedido
    const pedidoUpdated = await updatePedido(id, { estado: "Aprovado" });
    if (!pedidoUpdated) {
      alert("Erro ao aprovar pedido");
      return;
    }
  };

  const handleDevolver = async (pedidoId, devolucao) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido || pedido.estado !== "Aprovado") return;

    const novoMateriais = materiais.map((item) => {
      if (devolucao[item.nome]) {
        return {
          ...item,
          disponivel: Math.min(item.disponivel + devolucao[item.nome], item.total),
        };
      }
      return item;
    });

    const materiaisUpdated = await setMateriais(novoMateriais);
    if (!materiaisUpdated) {
      alert("Erro ao atualizar materiais");
      return;
    }

    const devolucaoCompleta = Object.entries(pedido.materiais).every(
      ([nome, q]) => (devolucao[nome] || 0) === q
    );

    const novoEstado = devolucaoCompleta ? "Concluído" : "Aprovado";

    const pedidoUpdated = await updatePedido(pedidoId, {
      estado: novoEstado,
      devolvido: devolucao,
    });

    if (!pedidoUpdated) {
      alert("Erro ao atualizar pedido");
      return;
    }
  };

    const handleCancelar = async (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    if (!user.isAdmin && pedido.nome !== user.nome) return;

    const success = await cancelarPedido(id);
    if (!success) {
        alert("Erro ao cancelar pedido");
        return;
    }
    };

  const pedidosVisiveis = user.isAdmin
    ? pedidos
    : pedidos.filter((p) => p.nome === user.nome);

  return (
    <div>
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

  const podeCancelar =
    pedido.estado === "Pendente" && (isAdmin || pedido.nome === userNome);

  return (
    <div>
      <p>
        <b>Pedido</b> por <i>{pedido.nome}</i> em {pedido.data}
      </p>
      <p>
        <b>Patrulha:</b> {pedido.patrulha || "-"}
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

      {/* Admin: Aprovar */}
      {pedido.estado === "Pendente" && isAdmin && (
        <button onClick={() => onAprovar(pedido.id)}>Aprovar Pedido</button>
      )}

      {/* User/Admin: Cancelar */}
      {podeCancelar && (
        <button onClick={() => onCancelar(pedido.id)}>Cancelar Pedido</button>
      )}

      {/* Admin: Devolução */}
      {pedido.estado === "Aprovado" && isAdmin && (
        <>
          <p>Registar devolução:</p>
          {Object.entries(pedido.materiais).map(([nome, q]) => (
            <div key={nome}>
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
                />{" "}
                / {q}
              </label>
            </div>
          ))}
          <button onClick={() => onDevolver(pedido.id, devolucao)}>
            Confirmar Devolução
          </button>
        </>
      )}

      {/* Concluído */}
      {pedido.estado === "Concluído" && (
        <p style={{ color: "green", fontWeight: "bold" }}>Pedido concluído!</p>
      )}
    </div>
  );
}
