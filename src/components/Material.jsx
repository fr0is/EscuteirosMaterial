import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import "../styles/Material.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../styles/utilities.css";
import "../styles/variables.css";

export default function Material() {
  const {
    user,
    materiais,
    pedidos,
    adicionarPedido,
    adicionarMaterial,
    atualizarMaterial,
    removerMaterial,
    supabase,
    detalheMaterial,
  } = useContext(AppContext);

  const navigate = useNavigate();

  const [quantidades, setQuantidades] = useState({});
  const [patrulha, setPatrulha] = useState("");

  useEffect(() => {
    if (user.banpatequtri) {
      setPatrulha(user.banpatequtri);
    }
  }, [user.banpatequtri]);

  const [atividade, setAtividade] = useState("");

  const [novoMaterialNome, setNovoMaterialNome] = useState("");
  const [novoMaterialTotal, setNovoMaterialTotal] = useState(0);
  const [editandoMaterialId, setEditandoMaterialId] = useState(null);
  const [editandoNome, setEditandoNome] = useState("");
  const [editandoTotal, setEditandoTotal] = useState(0);

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  // 🔄 Atualizar automaticamente totais e disponíveis com base no detalhe_material
  useEffect(() => {
    if (!user.loggedIn) return;

    const atualizarEstoque = async () => {
      try {
        const { data: detalhes, error } = await supabase
          .from("detalhe_material")
          .select("id_material, estado_pedido, condicao");

        if (error) {
          console.error("Erro ao obter detalhe_material:", error);
          toast.error("Erro ao atualizar materiais.");
          return;
        }

        const contagens = {};
        detalhes.forEach((item) => {
          if (!contagens[item.id_material]) {
            contagens[item.id_material] = { total: 0, disponivel: 0 };
          }
          contagens[item.id_material].total += 1;
          if (item.estado_pedido === "disponivel" && item.condicao === "bom") {
            contagens[item.id_material].disponivel += 1;
          }
        });

        for (const material of materiais) {
          const info = contagens[material.id] || { total: 0, disponivel: 0 };
          if (
            material.total !== info.total ||
            material.disponivel !== info.disponivel
          ) {
            await atualizarMaterial(material.id, {
              total: info.total,
              disponivel: info.disponivel,
            });
          }
        }

        console.log("Materiais atualizados com sucesso!");
      } catch (err) {
        console.error("Erro ao sincronizar materiais:", err);
        toast.error("Erro ao sincronizar materiais.");
      }
    };

    atualizarEstoque();
  }, [user.loggedIn, detalheMaterial]);

  // ---------------- PEDIDOS PENDENTES ----------------
  const pendentesPorItem = {};
  pedidos.forEach((p) => {
    if (p.estado === "Pendente") {
      Object.entries(p.materiais).forEach(([nome, q]) => {
        pendentesPorItem[nome] = (pendentesPorItem[nome] || 0) + q;
      });
    }
  });

  // ---------------- CONTROLOS DE QUANTIDADE ----------------
  const handleIncrement = (nome) => {
    setQuantidades((q) => {
      const atual = q[nome] || 0;
      const max =
        (materiais.find((i) => i.nome === nome)?.disponivel || 0) -
        (pendentesPorItem[nome] || 0);
      if (atual < max) {
        return { ...q, [nome]: atual + 1 };
      }
      return q;
    });
  };

  const handleDecrement = (nome) => {
    setQuantidades((q) => {
      const atual = q[nome] || 0;
      if (atual > 0) {
        return { ...q, [nome]: atual - 1 };
      }
      return q;
    });
  };

  // ---------------- ENVIAR PEDIDO ----------------
  const handleSubmitPedido = async () => {
    if (user.seccao != "Dirigentes" && !patrulha) {
      toast.error("Erro: não foi possível determinar a patrulha automaticamente.");
      return;
    }

    if (atividade.trim() === "") {
      toast.error("Por favor, indica a atividade.");
      return;
    }

    const materiaisPedido = Object.fromEntries(
      Object.entries(quantidades).filter(([_, q]) => q > 0)
    );

    if (Object.keys(materiaisPedido).length === 0) {
      toast.error("Seleciona algum material para pedir.");
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];

    const novoPedido = {
      nome: user.nome,
      data: hoje,
      materiais: materiaisPedido,
      estado: "Pendente",
      devolvido: {},
      patrulha,
      atividade,
      user_id: user.id,
      seccao: user.seccao,
    };

    const tipoPatrulha = {
      Exploradores: "Patrulha",
      Pioneiros: "Equipa",
      Lobitos: "Bando",
      Caminheiros: "Tribo",
    };

    const nomePatrulha = tipoPatrulha[user.seccao] || "Patrulha";

    const listaMateriais = Object.entries(materiaisPedido)
      .map(([nome, qtd]) => `${nome}: ${qtd}`)
      .join("\n");

    const mensagem = `
Pedido de material recebido:

Nome: ${user.nome} 
Secção: ${user.seccao}
${nomePatrulha}: ${patrulha}
Atividade: ${atividade}
Data: ${hoje}

📦 Material solicitado:
${listaMateriais}
    `;

    try {
      // E-mails admins
      const { data: emailsAdmin, error: errEmails } = await supabase
        .from("emails_notificacao")
        .select("email");
      if (errEmails) throw errEmails;

      // Responsável da secção (opcional)
      const { data: responsavel, error: errResp } = await supabase
        .from("responsaveis_seccao")
        .select("email")
        .eq("seccao", user.seccao)
        .single();
      const emailResponsavel = responsavel?.email;

      const listaEmails = emailsAdmin.map(e => e.email);
      //if (emailResponsavel) listaEmails.push(emailResponsavel);

      if (listaEmails.length === 0) {
        toast.error("Não existe e-mail configurado para receber o pedido.");
        return;
      }

      // Enviar e-mails
      for (const email of listaEmails) {
        await emailjs.send(
          "service_pnn1l65",
          "template_8ud9uk9",
          { message: mensagem, to_email: email },
          "largUwzgW7L95dduo"
        );
      }

      await adicionarPedido(novoPedido);
      toast.success("Pedido enviado com sucesso!");
      setQuantidades({});
      setPatrulha("");
      setAtividade("");
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast.error("Falha ao enviar pedido ou e-mail.");
    }
  };

  // ---------------- GERIR MATERIAIS (ADMIN) ----------------
  const handleCriarMaterial = async () => {
    if (!novoMaterialNome.trim() || novoMaterialTotal <= 0) {
      alert("Indica nome e quantidade total válidos para o material.");
      return;
    }
    try {
      await adicionarMaterial({
        nome: novoMaterialNome.trim(),
        total: novoMaterialTotal,
        disponivel: novoMaterialTotal,
      });
      toast.success(`${novoMaterialNome} adicionado com sucesso!`);
      setNovoMaterialNome("");
      setNovoMaterialTotal(0);
    } catch (error) {
      alert("Erro ao adicionar material: " + error.message);
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoMaterialId(item.id);
    setEditandoNome(item.nome);
    setEditandoTotal(item.total);
  };

  const cancelarEdicao = () => {
    setEditandoMaterialId(null);
    setEditandoNome("");
    setEditandoTotal(0);
  };

  const salvarEdicao = async () => {
    if (!editandoNome.trim() || editandoTotal <= 0) {
      toast.error("Indica nome e quantidade total válidos para o material.");
      return;
    }

    const materialAtual = materiais.find((m) => m.id === editandoMaterialId);
    const diferencaTotal = editandoTotal - materialAtual.total;
    const novoDisponivel = materialAtual.disponivel + diferencaTotal;

    if (novoDisponivel < 0) {
      toast.error("Não podes reduzir o total para menos do que o já emprestado.");
      return;
    }

    try {
      await atualizarMaterial(editandoMaterialId, {
        nome: editandoNome.trim(),
        total: editandoTotal,
        disponivel: novoDisponivel,
      });
      toast.success(`${editandoNome} atualizado com sucesso!`);
      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao atualizar material:", error);
      toast.error("Erro ao atualizar material: " + error.message);
    }
  };


  const handleRemoverMaterial = (id) => {
    const confirmToastId = toast.warn(
      <div>
        <div>Tens a certeza que queres remover este material?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              toast.dismiss(confirmToastId);
              try {
                await removerMaterial(id);
                setTimeout(() => {
                  toast.success("Material removido com sucesso!");
                }, 300);
              } catch (error) {
                setTimeout(() => {
                  toast.error("Erro ao remover material.");
                }, 300);
              }
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
            onClick={() => toast.dismiss(confirmToastId)}
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
      { position: 'top-center', autoClose: false }
    );
  };

  // ---------------- INTERFACE ----------------
  return (
    <div className="material-container">
      <ToastContainer position="top-center" autoClose={5000} />

      <h2>Olá, {user.nome}</h2>
      <h3>Material disponível</h3>

      {[...materiais]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }))
      .map((item) =>  {
        const pendente = pendentesPorItem[item.nome] || 0;
        const isEditing = editandoMaterialId === item.id;

        return (
          <div key={item.id} className="material-item">
            {user.isAdmin ? (
              isEditing ? (
                <div className="material-editing">
                  <div className="inputs">
                    <input
                      type="text"
                      className="input-nome"
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-quantidade"
                      value={editandoTotal}
                      min={0}
                      onChange={(e) =>
                        setEditandoTotal(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="buttons">
                    <button title="Guardar" className="guardar" onClick={salvarEdicao}>
                      💾
                    </button>
                    <button title="Cancelar" className="cancelar" onClick={cancelarEdicao}>
                      🗙
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="material-info">
                    <b>
                      {item.nome}{" "}
                      {pendente > 0 && <span style={{ color: "red" }}>*</span>}
                    </b>
                    : {item.disponivel} / {item.total}{" "}
                    {pendente > 0 && <em>(Pendentes: {pendente})</em>}
                  </div>
                  <div className="material-actions">
                    <button  title="Editar" className="editar" onClick={() => iniciarEdicao(item)}>
                      ✏️
                    </button>
                    <button title="Eliminar"
                      className="remover"
                      onClick={() => handleRemoverMaterial(item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div className="material-info" style={{ flex: 1 }}>
                  <b>
                    {item.nome}{" "}
                    {pendente > 0 && <span style={{ color: "red" }}>*</span>}
                  </b>
                  : {item.disponivel} / {item.total}{" "}
                  {pendente > 0 && <em>(Pendentes: {pendente})</em>}
                </div>
                <div className="quantity-controls">
                  <button onClick={() => handleDecrement(item.nome)}>-</button>
                  <span>{quantidades[item.nome] || 0}</span>
                  <button onClick={() => handleIncrement(item.nome)}>+</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {user.isAdmin && (
        <div className="add-material">
          <h3>Adicionar novo material</h3>
          <input
            placeholder="Nome do material"
            value={novoMaterialNome}
            onChange={(e) => setNovoMaterialNome(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantidade total"
            value={novoMaterialTotal}
            min={0}
            onChange={(e) => setNovoMaterialTotal(parseInt(e.target.value) || 0)}
          />
          <button onClick={handleCriarMaterial}>Adicionar material</button>
        </div>
      )}

      {!user.isAdmin && (
        <div className="pedido-form">
          <h3>Pedido de material</h3>
          {/* Patrulha agora é automática */}
          {/* <input placeholder="Bando/Patrulha/Equipa/Tribo" value={patrulha} onChange={(e) => setPatrulha(e.target.value)} /> */}
          <input
            placeholder="Atividade"
            value={atividade}
            onChange={(e) => setAtividade(e.target.value)}
          />
          <button onClick={handleSubmitPedido}>Enviar pedido</button>
          <p className="chefe-aviso">
            * Itens com "*" têm pedidos pendentes.
          </p>
        </div>
      )}
    </div>
  );
}
