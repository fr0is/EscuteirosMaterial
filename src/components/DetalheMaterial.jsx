import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { toast, ToastContainer } from "react-toastify";
import { FaCheckCircle, FaExclamationTriangle, FaTools } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
  const [editData, setEditData] = useState({ descricao: "", condicao: "" });
  const [expandido, setExpandido] = useState({});
  const conteudoRefs = useRef({});

  useEffect(() => {
    if (!user?.isAdmin) return;
    carregarMateriaisEDetalhes();
  }, [user]);

  const carregarMateriaisEDetalhes = async () => {
    setLoading(true);
    try {
      const { data: mats, error: errMat } = await supabase
        .from("materiais")
        .select("id, nome");
      if (errMat) throw errMat;

      const { data: dets, error: errDet } = await supabase
        .from("detalhe_material")
        .select("*")
        .order("id", { ascending: true })
        .order("referencia", { ascending: true });
      if (errDet) throw errDet;

      setMateriais(
        mats.sort((a, b) => a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" }))
      );
      setDetalhes(
        dets.sort((a, b) =>
          (a.referencia || "").localeCompare(b.referencia || "", "pt", {
            numeric: true,
            sensitivity: "base",
          })
        )
      );
    } catch (error) {
      toast.error("Erro ao carregar detalhes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandido = (id, numItens) => {
    setExpandido((prev) => {
      const novo = { ...prev, [id]: !prev[id] };
      const el = conteudoRefs.current[id];
      if (el) {
        // Configuração de tempo de transição mais uniforme
        const tempoMin = 0.3; // tempo mínimo em segundos
        const tempoMax = 0.8; // tempo máximo em segundos
        const fator = 0.03;   // incremento por item (30ms)
        let duracao = tempoMin + numItens * fator;
        if (duracao > tempoMax) duracao = tempoMax;

        if (novo[id]) {
          const altura = el.scrollHeight;
          el.style.height = altura + "px";
        } else {
          el.style.height = "0px";
        }
        el.style.transitionDuration = `${duracao}s`;
        el.style.transitionTimingFunction = "ease-in-out"; // suaviza ainda mais
      }
      return novo;
    });
  };


  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setEditData({ descricao: item.descricao || "", condicao: item.condicao || "" });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditData({ descricao: "", condicao: "" });
  };

  const guardarEdicao = async (id) => {
    try {
      const { error } = await supabase
        .from("detalhe_material")
        .update({ descricao: editData.descricao, condicao: editData.condicao })
        .eq("id", id);

      if (error) throw error;

      setDetalhes((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, descricao: editData.descricao, condicao: editData.condicao }
            : item
        )
      );
      toast.success("Detalhe atualizado com sucesso!");
      cancelarEdicao();
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

  const exportarExcel = async (nomeMaterialOriginal, referenciaFiltro) => {
    try {
      const normalizar = (str) =>
        str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      const nomeMaterial = normalizar(nomeMaterialOriginal);

      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("id, nome, data_devolucao, materiais, materiaisDetalhados, estado")
        .order("data_devolucao", { ascending: false });

      if (error) throw error;

      // Filtra apenas pedidos concluídos
      const pedidosConcluidos = (pedidos || []).filter(
        (p) => normalizar(p.estado) === "concluido"
      );

      // Filtra pedidos que contenham o material desejado
      const pedidosFiltrados = pedidosConcluidos.filter((p) => {
        const nomesMateriais = Object.keys(p.materiais || {}).map(normalizar);
        return nomesMateriais.includes(nomeMaterial);
      });

      // Cria linhas para o Excel
      const linhas = pedidosFiltrados.flatMap((pedido) => {
      const detalhes = pedido.materiaisDetalhados || {};
      const chave = Object.keys(detalhes || {}).find(
        (m) => normalizar(m) === nomeMaterial
      );
      const lista = detalhes[chave] || [];

      // Agora filtramos também pela referência
      return lista
        .filter((item) => !referenciaFiltro || item.referencia === referenciaFiltro)
        .map((item) => ({
          Material: nomeMaterialOriginal,
          Referência: item.referencia || "-",
          Condição: item.condicao || "-",
          "Pedido por": pedido.nome || "-",
          "Data de devolução": pedido.data_devolucao
            ? new Date(pedido.data_devolucao).toLocaleDateString("pt-PT")
            : "-",
        }));
    });

      if (linhas.length === 0) {
        toast.info("Sem dados para exportar.");
        return;
      }

      // Cria o Excel
      const worksheet = XLSX.utils.json_to_sheet(linhas);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Historico_${nomeMaterialOriginal}#${referenciaFiltro}.xlsx`);

      toast.success(`Exportado com sucesso: ${nomeMaterialOriginal}#${referenciaFiltro}`);
    } catch (error) {
      toast.error("Erro ao exportar Excel: " + error.message);
    }
  };

  if (!user?.isAdmin) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Acesso restrito — apenas administradores podem ver esta página.
      </p>
    );
  }

  const getIcone = (item) => {
    const iconStyle = { fontSize: "18px" };
    if (item.condicao === "danificado") return <FaExclamationTriangle style={{ ...iconStyle, color: "var(--color-danger)" }} />;
    if (item.estado_pedido === "emUso") return <FaTools style={{ ...iconStyle, color: "#FF5F15" }} />;
    if (item.estado_pedido === "disponivel" && item.condicao === "bom") return <FaCheckCircle style={{ ...iconStyle, color: "var(--color-primary)" }} />;
    return null;
  };

  return (
    <div className="material-container">
      <ToastContainer position="top-center" autoClose={4000} />
      <h2>Gestão de Detalhes de Material</h2>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        materiais.map((mat) => {
          const detalhesFiltrados = detalhes.filter((d) => d.id_material === mat.id);
          const condicaoMap = { bom: "Bom", danificado: "Danificado" };

          return (
            <div key={mat.id} className="material-detalhe-bloco">
              <h3 onClick={() => toggleExpandido(mat.id, detalhesFiltrados.length)}>
                {mat.nome}
                <span>{expandido[mat.id] ? "▲" : "▼"}</span>
              </h3>

              <div
                ref={(el) => (conteudoRefs.current[mat.id] = el)}
                className={`material-detalhe-conteudo ${expandido[mat.id] ? "expanded" : ""}`}
              >
                {detalhesFiltrados.length === 0 ? (
                  <p style={{ marginLeft: "10px" }}>Sem detalhes registados.</p>
                ) : (
                  <table className="material-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Referência</th>
                        <th>Descrição</th>
                        <th>Condição</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...detalhesFiltrados]
                        .sort((a, b) =>
                          (a.referencia || "").localeCompare(b.referencia || "", "pt", { numeric: true, sensitivity: "base" })
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            <td style={{ textAlign: "center", width: "25px" }}>{getIcone(item)}</td>
                            <td>{item.referencia}</td>
                            {editandoId === item.id ? (
                              <>
                                <td>
                                  <input
                                    value={editData.descricao}
                                    onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <select
                                    value={editData.condicao}
                                    onChange={(e) => setEditData({ ...editData, condicao: e.target.value })}
                                  >
                                    <option value="bom">Bom</option>
                                    <option value="danificado">Danificado</option>
                                  </select>
                                </td>
                                <td>
                                  <button title="Guardar" onClick={() => guardarEdicao(item.id)}>💾</button>
                                  <button title="Cancelar" onClick={cancelarEdicao}>🗙</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{item.descricao || "-"}</td>
                                <td>{condicaoMap[item.condicao] || item.condicao}</td>
                                <td className="acoes">
                                  <button className="btn-editar" title="Editar" onClick={() => iniciarEdicao(item) }>✏️</button>
                                  <button className="btn-eliminar" title="Eliminar" onClick={() => eliminarDetalhe(item.id)}>🗑️</button>
                                  <button className="btn-excel" title="Exportar Histórico" onClick={() => exportarExcel(mat.nome, item.referencia)}>📄</button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
