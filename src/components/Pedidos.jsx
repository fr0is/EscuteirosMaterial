import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
    eliminarPedido,
    users,
    detalheMaterial,
    atualizarDetalheMaterial,
    supabase,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [datasLevantamento, setDatasLevantamento] = useState({});

  useEffect(() => {
    if (!user.loggedIn) navigate("/");
  }, [user.loggedIn, navigate]);

  useEffect(() => {
    if (!pedidos || pedidos.length === 0) return;

    setPedidos((prev) =>
      prev.map((p) => {
        if (!p.materiaisDetalhados) {
          const detalhados = {};
          Object.entries(p.materiais || {}).forEach(([nome, qtd]) => {
            detalhados[nome] = Array(qtd)
              .fill(0)
              .map(() => ({
                referencia: "",
                condicao: "bom",
                estado_pedido: "disponivel",
                detalhes: "",
              }));
          });
          return { ...p, materiaisDetalhados: detalhados };
        }
        return p;
      })
    );
  }, []);

  if (!user.loggedIn) return null;

  const getUserById = (id) => users?.find((u) => u.id === id);

  const handleDataLevantamentoChange = (id, novaData) => {
    setDatasLevantamento((prev) => ({ ...prev, [id]: novaData }));
  };

  const pedidosVisiveis = (user.isAdmin
    ? pedidos
    : pedidos.filter((p) => p.nome === user.nome)
  )
    .slice()
    .sort((a, b) => b.id - a.id);

  // ------------------- APROVAR -------------------
  async function handleAprovar(id) {
    const dataLevant = datasLevantamento[id];
    if (!dataLevant || !dataLevant.trim()) {
      toast.error("Indique a data de levantamento antes de aprovar.");
      return;
    }

    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== "Pendente") return;

    for (const [nome, unidades] of Object.entries(pedido.materiaisDetalhados)) {
      for (const unidade of unidades) {
        if (!unidade.referencia) {
          toast.error(`Selecione todas as referências para ${nome}`);
          return;
        }
      }
    }

    for (const [nome, unidades] of Object.entries(pedido.materiaisDetalhados)) {
      const refs = unidades.map((u) => u.referencia).filter((r) => r);
      const duplicadas = refs.filter((r, i) => refs.indexOf(r) !== i);
      if (duplicadas.length > 0) {
        toast.error(`Referência repetida em ${nome}: ${duplicadas[0]}`);
        return;
      }
    }

    const ok = await updatePedido(id, {
      estado: "Aprovado",
      data_levantamento: dataLevant,
      materiaisDetalhados: pedido.materiaisDetalhados,
    });
    if (!ok) {
      toast.error("Erro ao aprovar pedido");
      return;
    }

    // Atualiza detalhe_material
    for (const [nome, unidades] of Object.entries(pedido.materiaisDetalhados)) {
      for (const unidade of unidades) {
        const detalhe = detalheMaterial.find(
          (d) =>
            d.referencia === unidade.referencia &&
            materiais.find((m) => m.id === d.id_material)?.nome === nome
        );
        if (detalhe) {
          await atualizarDetalheMaterial(detalhe.id, {
            estado_pedido: "emUso",
            descricao: "",
          });
        }
      }
    }

    // ----- ENVIO DE EMAIL -----
    const autor = getUserById(pedido.user_id);
    if (!autor?.email) {
      toast.error("Pedido aprovado, mas autor sem email configurado.");
      return;
    }

    try {
      // Busca responsável da secção (opcional)
      const { data: responsavel, error: errResp } = await supabase
        .from("responsaveis_seccao")
        .select("email")
        .eq("seccao", pedido.seccao)
        .single();

      const emailResponsavel = responsavel?.email;

      const listaEmails = [autor.email];
      if (emailResponsavel) listaEmails.push(emailResponsavel);

      const listaMateriais = Object.entries(pedido.materiais || {})
        .map(([nome, qtd]) => `- ${nome}: ${qtd} unidades`)
        .join("\n");

      for (const email of listaEmails) {
        await emailjs.send(
          "service_pnn1l65",
          "template_im8430o",
          {
            message: `Olá ${autor.nome},\n\nO seu pedido foi aprovado ✅\n\n📅 Levantamento: ${dataLevant}\n\n📦 Material:\n${listaMateriais}\n\nBoa atividade!`,
            to_email: email,
          },
          "largUwzgW7L95dduo"
        );
      }

      toast.success("Pedido aprovado e email(s) enviado(s).");
    } catch (err) {
      console.error("Erro ao enviar email:", err);
      toast.error("Pedido aprovado, mas falha ao enviar email.");
    }

    setDatasLevantamento((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  // ------------------- DEVOLVER -------------------
  async function handleDevolver(pedidoId) {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido || pedido.estado !== "Aprovado") return;

    let devolucaoTotal = true;
    const devolvidoAtualizado = { ...pedido.devolvido };
    const materiaisDetalhadosAtualizados = { ...pedido.materiaisDetalhados };

    for (const [nome, unidades] of Object.entries(pedido.materiaisDetalhados)) {
      for (let i = 0; i < unidades.length; i++) {
        const unidade = unidades[i];
        const devolvido = pedido.devolvido?.[nome]?.[i];

        if (devolvido) {
          devolvidoAtualizado[nome][i] = 1;

          // Atualiza a condicao no pedido também
          materiaisDetalhadosAtualizados[nome][i].condicao = unidade.condicao;

          const detalhe = detalheMaterial.find(
            (d) =>
              d.referencia === unidade.referencia &&
              materiais.find((m) => m.id === d.id_material)?.nome === nome
          );
          if (detalhe) {
            await atualizarDetalheMaterial(detalhe.id, {
              estado_pedido: "disponivel",
              condicao: unidade.condicao,
              descricao: unidade.detalhes || "",
            });
          }
        } else {
          devolucaoTotal = false;
        }
      }
    }

    const novoEstado = devolucaoTotal ? "Concluído" : "Aprovado";

    // Se devolução completa, define data_devolucao como hoje
    const updateData = {
      estado: novoEstado,
      devolvido: devolvidoAtualizado,
      materiaisDetalhados: materiaisDetalhadosAtualizados,
    };
    if (devolucaoTotal) updateData.data_devolucao = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Atualiza pedido no Supabase
    await updatePedido(pedidoId, updateData);

    // Atualiza estado local
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              ...updateData,
            }
          : p
      )
    );

    toast.success(
      devolucaoTotal
        ? "Pedido devolvido completamente!"
        : "Pedido devolvido parcialmente!"
    );
  }



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
            onDevolver={() => handleDevolver(p.id)}
            onCancelar={cancelarPedido}
            onEliminar={eliminarPedido}
            isAdmin={user.isAdmin}
            userNome={user.nome}
            dataLevantamento={datasLevantamento[p.id] || ""}
            setDataLevantamento={(novaData) =>
              handleDataLevantamentoChange(p.id, novaData)
            }
            seccao={seccao}
            materiais={materiais}
            detalheMaterial={detalheMaterial}
            setPedidos={setPedidos}
          />
        );
      })}

      <ToastContainer position="top-center" autoClose={4000} />
    </div>
  );
}

// ------------------- COMPONENTE PEDIDO ITEM -------------------
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
  materiais,
  detalheMaterial,
  setPedidos,
}) {
  const [devolvidoLocal, setDevolvidoLocal] = useState(pedido.devolvido || {});

  const podeCancelar =
    pedido.estado === "Pendente" && (isAdmin || pedido.nome === userNome);

  const handleDevolvidoChange = (nome, idx, checked) => {
    const updated = { ...devolvidoLocal };
    if (!updated[nome]) updated[nome] = [];
    updated[nome][idx] = checked ? 1 : 0;
    setDevolvidoLocal(updated);

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedido.id ? { ...p, devolvido: updated } : p
      )
    );
  };

  const getGrupoLabel = (nomeGrupo) => {
    switch (nomeGrupo) {
      case "Pioneiros": return "Equipa";
      case "Lobitos": return "Bando";
      case "Exploradores": return "Patrulha";
      case "Caminheiros": return "Tribo";
      default: return "Patrulha";
    }
  };
  const grupoLabel = getGrupoLabel(pedido.nome);

  return (
    <div className="pedido-item">
      <p><b>Pedido</b> por <i>{pedido.nome}</i> em {pedido.data}</p>
      <p><b>Secção:</b> {pedido.seccao}</p>
      <p><b>{grupoLabel}:</b> {pedido.patrulha || "-"}</p>
      <p><b>Atividade:</b> {pedido.atividade || "-"}</p>
      <p><b>Estado:</b> {pedido.estado}</p>
      {pedido.data_levantamento && <p><b>Levantamento:</b> {pedido.data_levantamento}</p>}
      {pedido.data_devolucao && (<p><b>Devolução:</b> {pedido.data_devolucao}</p>)}
      
      <table className="material-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Referência</th>
            <th>Detalhes</th>
            <th>Condição</th>
            <th>Devolvido</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pedido.materiaisDetalhados || {})
          .sort(([a], [b]) => a.localeCompare(b, "pt", { sensitivity: "base" }))
          .map(([nome, unidades]) =>
            unidades.map((unidade, idx) => {
              const material = materiais.find((m) => m.nome === nome);
              const referenciasDisponiveis = (detalheMaterial || [])
              .filter(
                (d) =>
                  d.id_material === material?.id &&
                  d.estado_pedido === "disponivel" &&
                  d.condicao === "bom"
              )
              .map((d) => d.referencia);

              const devolvidoConfirmado = pedido.devolvido?.[nome]?.[idx] === 1;

              const podeEditarDetalhes =
                isAdmin &&
                ((pedido.estado === "Pendente") ||
                  (pedido.estado === "Aprovado" && !devolvidoConfirmado));

              const podeEditarCondicao =
                isAdmin &&
                pedido.estado === "Aprovado" &&
                !devolvidoConfirmado;

              return (
                <tr key={`${nome}-${idx}`}>
                  <td>{nome}</td>

                  {/* REFERÊNCIA */}
                  <td>
                    {isAdmin && pedido.estado === "Pendente" ? (
                      <select
                        value={unidade.referencia}
                        onChange={(e) => {
                          const novaRef = e.target.value;
                          const detalheSelecionado = detalheMaterial.find(
                            (d) =>
                              d.referencia === novaRef &&
                              materiais.find((m) => m.id === d.id_material)?.nome === nome
                          );
                          const updated = { ...pedido.materiaisDetalhados };
                          updated[nome][idx] = {
                            ...updated[nome][idx],
                            referencia: novaRef,
                            detalhes: detalheSelecionado?.descricao || "",
                          };
                          setPedidos((prev) =>
                            prev.map((p) =>
                              p.id === pedido.id
                                ? { ...p, materiaisDetalhados: updated }
                                : p
                            )
                          );
                        }}
                      >
                        <option value="">Selecione</option>
                        {referenciasDisponiveis
                          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                          .map((ref) => (
                            <option key={ref} value={ref}>
                              {ref}
                            </option>
                          ))}
                      </select>
                    ) : (
                      unidade.referencia || "-"
                    )}
                  </td>

                  {/* DETALHES */}
                  <td>
                    {podeEditarDetalhes ? (
                      <input
                        type="text"
                        value={unidade.detalhes || ""}
                        onChange={(e) => {
                          const updated = { ...pedido.materiaisDetalhados };
                          updated[nome][idx] = {
                            ...updated[nome][idx],
                            detalhes: e.target.value,
                          };
                          setPedidos((prev) =>
                            prev.map((p) =>
                              p.id === pedido.id
                                ? { ...p, materiaisDetalhados: updated }
                                : p
                            )
                          );
                        }}
                      />
                    ) : (
                      unidade.detalhes || "-"
                    )}
                  </td>

                  {/* CONDIÇÃO */}
                  <td>
                    {podeEditarCondicao ? (
                      <select
                        value={unidade.condicao}
                        onChange={(e) => {
                          const updated = { ...pedido.materiaisDetalhados };
                          updated[nome][idx] = {
                            ...updated[nome][idx],
                            condicao: e.target.value,
                          };
                          setPedidos((prev) =>
                            prev.map((p) =>
                              p.id === pedido.id
                                ? { ...p, materiaisDetalhados: updated }
                                : p
                            )
                          );
                        }}
                      >
                        <option value="bom">Bom</option>
                        <option value="danificado">Danificado</option>
                      </select>
                    ) : (
                      unidade.condicao
                    )}
                  </td>

                  {/* DEVOLVIDO */}
                  <td>
                    {pedido.estado === "Aprovado" && isAdmin ? (
                      <input
                        type="checkbox"
                        checked={!!devolvidoLocal[nome]?.[idx]}
                        disabled={devolvidoConfirmado}
                        onChange={(e) => handleDevolvidoChange(nome, idx, e.target.checked)}
                      />
                    ) : (
                      devolvidoConfirmado ? "Sim" : "Não"
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="pedido-buttons">
        {pedido.estado === "Pendente" && isAdmin && (
          <>
            <input
              type="date"
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

        {pedido.estado === "Aprovado" && isAdmin && (
          <button className="btn-aprovar" onClick={onDevolver}>
            Confirmar Devolução
          </button>
        )}

        {pedido.estado === "Concluído" && isAdmin && (
          <button title="Eliminar"
            className="btn-eliminar-pedido"
            onClick={() => onEliminar(pedido.id)}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
