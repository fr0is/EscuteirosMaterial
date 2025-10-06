import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/DetalheMaterial.css";
import "../styles/utilities.css";
import "../styles/variables.css";

export default function DetalheMaterial() {
  const { supabase, user } = useContext(AppContext);
  const [detalhes, setDetalhes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [editData, setEditData] = useState({ descricao: "", condicao: "", estado_pedido: "" });

  // Carrega materiais e detalhes
  useEffect(() => {
    if (!user?.isAdmin) return;
    carregarMateriaisEDetalhes();
  }, [user]);

  const carregarMateriaisEDetalhes = async () => {
    setLoading(true);
    try {
      const { data: mats, error: errMat } = await supabase.from("materiais").select("id, nome");
      if (errMat) throw errMat;

      const { data: dets, error: errDet } = await supabase
        .from("detalhe_material")
        .select("*")
        .order("id", { ascending: true })
        .order("referencia", { ascending: true });

      if (errDet) throw errDet;;

      setMateriais(mats);
      setDetalhes(dets);
    } catch (error) {
      toast.error("Erro ao carregar detalhes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setEditData({
      descricao: item.descricao || "",
      condicao: item.condicao || "",
      estado_pedido: item.estado_pedido || "",
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditData({ descricao: "", condicao: "", estado_pedido: "" });
  };

  const guardarEdicao = async (id) => {
  try {
    const { error } = await supabase
      .from("detalhe_material")
      .update({
        descricao: editData.descricao,
        condicao: editData.condicao,
        estado_pedido: editData.estado_pedido,
      })
      .eq("id", id);

    if (error) throw error;

    // Atualiza apenas no estado local — sem recarregar tudo
    setDetalhes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              descricao: editData.descricao,
              condicao: editData.condicao,
              estado_pedido: editData.estado_pedido,
            }
          : item
      )
    );

    toast.success("Detalhe atualizado com sucesso!");
    cancelarEdicao(); // limpa campos de edição sem reload
  } catch (error) {
    toast.error("Erro ao atualizar detalhe: " + error.message);
  }
};

  const eliminarDetalhe = async (id) => {
    const confirmToastId = toast.warn(
      <div>
        <div>Tem a certeza que deseja eliminar este item?</div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "10px", gap: "10px" }}>
          <button
            onClick={async () => {
              toast.dismiss(confirmToastId);
              try {
                const { error } = await supabase.from("detalhe_material").delete().eq("id", id);
                if (error) throw error;
                toast.success("Item eliminado!");
                carregarMateriaisEDetalhes();
              } catch (error) {
                toast.error("Erro ao eliminar item: " + error.message);
              }
            }}
            style={{
              padding: "8px 15px",
              backgroundColor: "var(--color-primary-dark)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sim
          </button>
          <button
            onClick={() => toast.dismiss(confirmToastId)}
            style={{
              padding: "8px 15px",
              backgroundColor: "var(--color-danger-dark)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Não
          </button>
        </div>
      </div>,
      { position: "top-center", autoClose: false, draggable: false }
    );
  };

  if (!user?.isAdmin) {
    return <p>Acesso restrito — apenas administradores podem ver esta página.</p>;
  }

  return (
  <div className="material-container">
    <ToastContainer position="top-center" autoClose={4000} />
    <h2>Gestão de Detalhes de Material</h2>

    {loading ? (
      <p>A carregar...</p>
    ) : (
      <>
        {materiais.map((mat) => {
          const detalhesFiltrados = detalhes.filter((d) => d.id_material === mat.id);

          // Mapas para exibição amigável
          const condicaoMap = {
            bom: "Bom",
            danificado: "Danificado",
          };
          const estadoMap = {
            disponivel: "Disponível",
            emUso: "Em Uso",
          };

          return (
            <div key={mat.id} className="material-detalhe-bloco">
              <h3>{mat.nome}</h3>
              {detalhesFiltrados.length === 0 ? (
                <p style={{ marginLeft: "10px" }}>Sem detalhes registados.</p>
              ) : (
                <table className="material-table">
                  <thead>
                    <tr>
                      <th>Referência</th>
                      <th>Descrição</th>
                      <th>Condição</th>
                      <th>Estado Pedido</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalhesFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td>{item.referencia}</td>
                        {editandoId === item.id ? (
                          <>
                            <td>
                              <input
                                value={editData.descricao}
                                onChange={(e) =>
                                  setEditData({ ...editData, descricao: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <select
                                value={editData.condicao}
                                onChange={(e) =>
                                  setEditData({ ...editData, condicao: e.target.value })
                                }
                              >
                                <option value="bom">Bom</option>
                                <option value="danificado">Danificado</option>
                              </select>
                            </td>
                            <td>
                              <select
                                value={editData.estado_pedido}
                                onChange={(e) =>
                                  setEditData({ ...editData, estado_pedido: e.target.value })
                                }
                              >
                                <option value="disponivel">Disponível</option>
                                <option value="emUso">Em Uso</option>
                              </select>
                            </td>
                            <td>
                              <button onClick={() => guardarEdicao(item.id)}>💾</button>
                              <button onClick={cancelarEdicao}>🗙</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{item.descricao || "-"}</td>
                            <td>{condicaoMap[item.condicao] || item.condicao}</td>
                            <td>{estadoMap[item.estado_pedido] || item.estado_pedido}</td>
                            <td>
                              <button onClick={() => iniciarEdicao(item)}>✏️</button>
                              <button onClick={() => eliminarDetalhe(item.id)}>🗑️</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </>
    )}
  </div>
    );

}