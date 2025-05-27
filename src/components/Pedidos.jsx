import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import "../styles/Pedidos.css";

export default function Pedidos() {
  const {
    user,
    pedidos,
    setPedidos,
    materiais,
    updatePedido,
    cancelarPedido,
    setStock,
    eliminarPedido, // função para eliminar pedidos
  } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/");
    }
  }, [user.loggedIn, navigate]);

  if (!user.loggedIn) {
    return null;
  }

  const handleAprovar = async (id) => {
    if (!pedidos || !materiais) {
      alert("Dados ainda não carregados");
      return;
    }

    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    for (const [nome, qtd] of Object.entries(pedido.materiais)) {
      const itemmateriais = materiais.find((s) => s.nome === nome);
      if (!itemmateriais || itemmateriais.disponivel < qtd) {
        alert(`Materiais insuficiente para: ${nome}`);
        return;
      }
    }

    const novoMateriais = materiais.map((item) => {
      if (pedido.materiais[item.nome]) {
        return {
          ...item,
          disponivel: item.disponivel - pedido.materiais[item.nome],
        };
      }
      return item;
    });

    const materiaisUpdated = await setStock(novoMateriais);
    if (!materiaisUpdated) {
      alert("Erro ao atualizar materiais");
      return;
    }

    const pedidoUpdated = await updatePedido(id, { estado: "Aprovado" });
    if (!pedidoUpdated) {
      alert("Erro ao aprovar pedido");
      return;
    }
  };

  const handleDevolver = async (pedidoId, devolucao) => {
    if (!pedidos || !materiais) {
      alert("Dados ainda não carregados");
      return;
    }

    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido || pedido.estado !== "Aprovado") return;

    const novoMateriais = materiais.map((item) => {
      if (devolucao[item.nome]) {
        return {
          ...item,
          disponivel: Math.min(
            item.disponivel + devolucao[item.nome],
            item.total
          ),
        };
      }
      return item;
    });

    const materiaisUpdated = await setStock(novoMateriais);
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

  const handleEliminar = async (id) => {
    const confirm = window.confirm(
      "Tem certeza que deseja eliminar este pedido? Esta ação não pode ser desfeita."
    );
    if (!confirm) return;

    const sucesso = await eliminarPedido(id);
    if (!sucesso) {
      alert("Erro ao eliminar pedido");
      return;
    }
    // Atualiza a lista local removendo o pedido eliminado
    setPedidos((prev) => prev.filter((p) => p.id !== id));
  };

  const pedidosVisiveis = (user.isAdmin
    ? pedidos
    : pedidos.filter((p) => p.nome === user.nome))
    .slice()
    .sort((a, b) => b.id - a.id);

  return (
    <div className="pedidos-container">
      <h2>Pedidos</h2>
      {pedidosVisiveis.length === 0 && <p>Nenhum pedido registado.</p>}

      {pedidosVisiveis.map((p) => (
        <PedidoItem
          key={p.id}
          pedido={p}
          onAprovar={handleAprovar}
          onDevolver={handleDevolver}
          onCancelar={handleCancelar}
          onEliminar={handleEliminar}
          isAdmin={user.isAdmin}
          userNome={user.nome}
        />
      ))}

      {/* REMOVIDO: botão de eliminar pedidos antigos */}
    </div>
  );
}

function PedidoItem({
  pedido,
  onAprovar,
  onDevolver,
  onCancelar,
  onEliminar,
  isAdmin,
  userNome,
}) {
  const [devolucao, setDevolucao] = useState({});

  useEffect(() => {
    setDevolucao(pedido.devolvido || {});
  }, [pedido]);

  const handleChangeDevolucao = (nome, val) => {
    val = Math.min(Math.max(val, 0), pedido.materiais[nome]);
    setDevolucao((d) => ({ ...d, [nome]: val }));
  };

  const podeCancelar =
    pedido.estado === "Pendente" && (isAdmin || pedido.nome === userNome);

  const getGrupoLabel = (nomeGrupo) => {
    switch (nomeGrupo) {
      case "Pioneiros":
        return "Equipa";
      case "Lobitos":
        return "Bando";
      case "Exploradores":
        return "Patrulha";
      case "Caminheiros":
        return "Tribo";
      default:
        return "Patrulha";
    }
  };

  const grupoLabel = getGrupoLabel(pedido.nome);

  return (
    <div className="pedido-item">
      <p>
        <b>Pedido</b> por <i>{pedido.nome}</i> em {pedido.data}
      </p>
      <p>
        <b>{grupoLabel}:</b> {pedido.patrulha || "-"}
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

      <div className="pedido-buttons">
        {pedido.estado === "Pendente" && isAdmin && (
          <button className="btn-aprovar" onClick={() => onAprovar(pedido.id)}>
            Aprovar Pedido
          </button>
        )}

        {podeCancelar && (
          <button className="btn-cancelar" onClick={() => onCancelar(pedido.id)}>
            Cancelar Pedido
          </button>
        )}
      </div>

      {pedido.estado === "Aprovado" && isAdmin && (
        <div className="devolucao-container">
          <p>Registar devolução:</p>
          {Object.entries(pedido.materiais).map(([nome, q]) => (
            <div key={nome} className="devolucao-item">
              <label>
                {nome}:
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
          <div className="pedido-buttons">
            <button
              className="btn-aprovar"
              onClick={() => onDevolver(pedido.id, devolucao)}
            >
              Confirmar Devolução
            </button>
          </div>
        </div>
      )}

      {pedido.estado === "Concluído" && (
        <p className="pedido-concluido">Pedido devolvido!</p>
      )}

      {/* Botão eliminar pedido no canto inferior direito */}
      {isAdmin && pedido.estado === "Concluído" && (
        <button
          className="btn-eliminar-pedido"
          onClick={() => onEliminar(pedido.id)}
          title="Eliminar Pedido"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
