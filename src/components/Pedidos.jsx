import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { ToastContainer, toast } from "react-toastify"; // Importando o Toast
import "react-toastify/dist/ReactToastify.css"; // Estilo do Toast
import "../styles/Pedidos.css";
import "../styles/utilities.css";
import "../styles/variables.css";

export default function Pedidos() {
  const {
    user,
    pedidos,
    setPedidos,
    materiais,
    updatePedido,
    cancelarPedido,
    setStock,
    eliminarPedido,
    users,
  } = useContext(AppContext);
  const navigate = useNavigate();

  const [datasLevantamento, setDatasLevantamento] = useState({});

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/");
    }
  }, [user.loggedIn, navigate]);

  if (!user.loggedIn) return null;

  const getUserById = (id) => users?.find((u) => u.id === id);

  const handleDataLevantamentoChange = (id, novaData) => {
    setDatasLevantamento((prev) => ({
      ...prev,
      [id]: novaData,
    }));
  };

  const handleAprovar = async (id) => {
    const dataLevant = datasLevantamento[id];
    if (!dataLevant || !dataLevant.trim()) {
      toast.error("Indique a data de levantamento antes de aprovar.");
      return;
    }

    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    for (const [nome, qtd] of Object.entries(pedido.materiais)) {
      const item = materiais.find((m) => m.nome === nome);
      if (!item || item.disponivel < qtd) {
        toast.error(`Material insuficiente para: ${nome}`);
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
      toast.error("Erro ao atualizar materiais");
      return;
    }

    const pedidoUpdated = await updatePedido(id, {
      estado: "Aprovado",
      data_levantamento: dataLevant,
    });

    if (!pedidoUpdated) {
      toast.error("Erro ao aprovar pedido");
      return;
    }

    const autor = getUserById(pedido.user_id);

    if (!autor?.email) {
      toast.error("Email do autor não está definido. Não foi possível enviar o email.");
      return;
    }

    const listaMateriais = Object.entries(pedido.materiais)
      .map(([nome, qtd]) => `- ${nome}: ${qtd}`)
      .join("\n");

    const mensagem = `
Olá ${autor.nome},

O seu pedido foi aprovado ✅

📅 Levantamento: ${dataLevant}

📦 Material:
${listaMateriais}

Boa atividade!
`.trim();

    try {
      await emailjs.send(
        "service_pnn1l65",
        "template_im8430o",
        {
          message: mensagem,
          to_email: autor.email,
        },
        "largUwzgW7L95dduo"
      );
      toast.success("Pedido aprovado e email enviado.");
    } catch (err) {
      toast.error("Pedido aprovado, mas falha no envio de email.");
    }

    setDatasLevantamento((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleDevolver = async (pedidoId, devolucao) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido || pedido.estado !== "Aprovado") return;

    // Atualizando os materiais
    const novoMateriais = materiais.map((item) => {
      if (devolucao[item.nome]) {
        return {
          ...item,
          disponivel: Math.min(item.disponivel + devolucao[item.nome], item.total),
        };
      }
      return item;
    });

    const materiaisUpdated = await setStock(novoMateriais);
    if (!materiaisUpdated) {
      toast.error("Erro ao atualizar materiais");
      return;
    }

    // Verificar se todos os materiais foram devolvidos
    const devolucaoCompleta = Object.entries(pedido.materiais).every(
      ([nome, q]) => (devolucao[nome] || 0) === q
    );

    // Se todos os materiais foram devolvidos, atualiza o estado para "Concluído"
    const novoEstado = devolucaoCompleta ? "Concluído" : "Aprovado";

    const pedidoUpdated = await updatePedido(pedidoId, {
      estado: novoEstado,
      devolvido: devolucao,
    });

    if (!pedidoUpdated) {
      toast.error("Erro ao atualizar pedido");
      return;
    }

    if (devolucaoCompleta) {
      toast.success("Pedido devolvido completamente e concluído!");
    }
  };

  const handleCancelar = async (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    if (!user.isAdmin && pedido.nome !== user.nome) return;

    const success = await cancelarPedido(id);
    if (!success) {
      toast.error("Erro ao cancelar pedido");
    }
  };

  const handleEliminar = (id) => {
    const confirmToastId = toast.warn(
      <div>
        <div>Tem a certeza que deseja eliminar este pedido?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              toast.dismiss(confirmToastId); // Fecha só o toast de confirmação

              const sucesso = await eliminarPedido(id);

              setTimeout(() => {
                if (!sucesso) {
                  toast.error("Erro ao eliminar pedido");
                } else {
                  toast.success("Pedido eliminado com sucesso!");
                  setPedidos((prev) => prev.filter((p) => p.id !== id));
                }
              }, 300);
            }}
            style={{
              padding: '8px 15px',
              backgroundColor: 'var(--color-primary-dark)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sim
          </button>
          <button
            onClick={() => toast.dismiss(confirmToastId)} // Fecha só o toast de confirmação
            style={{
              padding: '8px 15px',
              backgroundColor: 'var(--color-danger-dark)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Não
          </button>
        </div>
      </div>,
      {
        position: 'top-center',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        progress: undefined,
      }
    );
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

      {pedidosVisiveis.map((p) => {
        const autor = getUserById(p.user_id);
        const seccao = autor ? autor.seccao : "Não disponível";

        return (
          <PedidoItem
            key={p.id}
            pedido={p}
            onAprovar={() => handleAprovar(p.id)}
            onDevolver={handleDevolver}
            onCancelar={handleCancelar}
            onEliminar={handleEliminar}
            isAdmin={user.isAdmin}
            userNome={user.nome}
            dataLevantamento={datasLevantamento[p.id] || ""}
            setDataLevantamento={(novaData) =>
              handleDataLevantamentoChange(p.id, novaData)
            }
            seccao={seccao}
          />
        );
      })}

      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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
  dataLevantamento,
  setDataLevantamento,
  seccao,
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
      <p><b>Secção:</b> {pedido.seccao}</p>
      <p><b>{grupoLabel}:</b> {pedido.patrulha || "-"}</p>
      <p><b>Atividade:</b> {pedido.atividade || "-"}</p>
      <p><b>Estado:</b> {pedido.estado}</p>
      {pedido.data_levantamento && (
        <p><b>Levantamento:</b> {pedido.data_levantamento}</p>
      )}
      <p><b>Material:</b></p>
      <ul>
        {Object.entries(pedido.materiais).map(([nome, q]) => (
          <li key={nome}>
            {nome}: {q} (Devolvido: {pedido.devolvido?.[nome] || 0})
          </li>
        ))}
      </ul>

      <div className="pedido-buttons">
        {pedido.estado === "Pendente" && isAdmin && (
          <>
            <input
              type="date"
              placeholder="Data de levantamento"
              value={dataLevantamento}
              onChange={(e) => setDataLevantamento(e.target.value)}
            />
            <button className="btn-aprovar" onClick={onAprovar}>
              Aprovar Pedido
            </button>
          </>
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
                <span className="input-wrapper">
                  <input
                    type="number"
                    min={0}
                    max={q}
                    value={devolucao[nome] || 0}
                    onChange={(e) => handleChangeDevolucao(nome, Number(e.target.value))}
                  />
                  / {q}
                </span>
              </label>
            </div>
          ))}
          {pedido.estado === "Aprovado" && (
            <p className="pedido-warning">
              ⚠️ Pedido ainda não está totalmente entregue.
            </p>
          )}
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
