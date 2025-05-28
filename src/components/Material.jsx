import React, { useContext, useState } from "react";
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
  } = useContext(AppContext);
  const navigate = useNavigate();

  const [quantidades, setQuantidades] = useState({});
  const [patrulha, setPatrulha] = useState("");
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

  const pendentesPorItem = {};
  pedidos.forEach((p) => {
    if (p.estado === "Pendente") {
      Object.entries(p.materiais).forEach(([nome, q]) => {
        pendentesPorItem[nome] = (pendentesPorItem[nome] || 0) + q;
      });
    }
  });

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

  const handleSubmitPedido = async () => {
    // Verificar se a patrulha e a atividade estão preenchidas
    if (patrulha.trim() === "") {
      toast.error("Por favor, informe o nome da patrulha/equipa/bando/tribo.");
      return;
    }
    if (atividade.trim() === "") {
      toast.error("Por favor, informe a atividade.");
      return;
    }

    const materiaisPedido = Object.fromEntries(
      Object.entries(quantidades).filter(([_, q]) => q > 0)
    );
    
    if (Object.keys(materiaisPedido).length === 0) {
      toast.error("Selecione algum material para pedir.");
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
      if (!adicionarPedido) {
        toast.error("Função para adicionar pedido não implementada.");
        return;
      }

      // Enviar o pedido para a aplicação
      await adicionarPedido(novoPedido);

      // Enviar o email usando emailjs
      await emailjs.send(
        "service_pnn1l65",
        "template_8ud9uk9",
        { message: mensagem },
        "largUwzgW7L95dduo"
      );

      // Mostrar mensagem de sucesso com Toast
      toast.success("Pedido enviado com sucesso!");

      // Resetar os campos do formulário
      setQuantidades({});
      setPatrulha("");
      setAtividade("");
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast.error("Falha ao enviar pedido ou email. Verifique sua conexão ou configuração.");
    }
  };


  const handleCriarMaterial = async () => {
    if (!novoMaterialNome.trim() || novoMaterialTotal <= 0) {
      alert("Informe nome e quantidade total válidos para o material.");
      return;
    }
    try {
      await adicionarMaterial({
        nome: novoMaterialNome.trim(),
        total: novoMaterialTotal,
        disponivel: novoMaterialTotal,
      });
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
      alert("Informe nome e quantidade total válidos para o material.");
      return;
    }

    const materialAtual = materiais.find((m) => m.id === editandoMaterialId);
    const diferencaTotal = editandoTotal - materialAtual.total;
    const novoDisponivel = materialAtual.disponivel + diferencaTotal;

    if (novoDisponivel < 0) {
      alert(
        "Não pode reduzir total para menos do que a quantidade já emprestada."
      );
      return;
    }

    try {
      await atualizarMaterial(editandoMaterialId, {
        nome: editandoNome.trim(),
        total: editandoTotal,
        disponivel: novoDisponivel,
      });
      cancelarEdicao();
    } catch (error) {
      alert("Erro ao atualizar material: " + error.message);
    }
  };

  const handleRemoverMaterial = (id) => {
  toast.warn(
    <div>
      <div>Tem certeza que deseja remover este material?</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
        <button
          onClick={async () => {
            try {
              await removerMaterial(id);  // Chama a função de remoção do material
              toast.success("Material removido com sucesso!");
            } catch (error) {
              toast.error("Erro ao remover material.");
            }
            toast.dismiss();  // Fecha o toast após ação
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
          onClick={() => toast.dismiss()}  // Fecha o toast ao clicar em "Não"
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
      autoClose: false,  // Não fecha automaticamente
      closeOnClick: false,  // Não fecha ao clicar
      draggable: false,  // Não é possível arrastar
      progress: undefined,  // Desabilita o progresso do Toast
    }
  );
};



  return (
    <div className="material-container">
    {/* ToastContainer para as notificações */}
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

      <h2>Olá, {user.nome}</h2> {/* Exibe o nome real do usuário */}
      <h3>Stock disponível</h3>

      {materiais.map((item) => {
        const pendente = pendentesPorItem[item.nome] || 0;
        const isEditing = editandoMaterialId === item.id;

        return (
          <div key={item.id} className="material-item">
            {user.isAdmin ? (
              isEditing ? (
                <div className="material-editing">
                  <div className="inputs">
                    <input
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                    />
                    <input
                      type="number"
                      value={editandoTotal}
                      onChange={(e) => setEditandoTotal(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="buttons">
                    <button className="guardar" onClick={salvarEdicao}>
                       💾 
                    </button>
                    <button className="cancelar" onClick={cancelarEdicao}>
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
                    <button
                      className="editar"
                      onClick={() => iniciarEdicao(item)}
                    >
                      ✏️
                    </button>
                    <button
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
            onChange={(e) => setNovoMaterialTotal(parseInt(e.target.value) || 0)}
          />
          <button onClick={handleCriarMaterial}>Adicionar material</button>
        </div>
      )}

      {!user.isAdmin && (
        <div className="pedido-form">
          <h3>Pedido de material</h3>
          <input
            placeholder="Patrulha/Equipa/Bando/Tribo"
            value={patrulha}
            onChange={(e) => setPatrulha(e.target.value)}
          />
          <input
            placeholder="Atividade"
            value={atividade}
            onChange={(e) => setAtividade(e.target.value)}
          />
          <button onClick={handleSubmitPedido}>Enviar pedido</button>
          <p className="chefe-aviso">* Itens com "*" têm pedidos pendentes.</p>
        </div>
      )}
    </div>
  );
}
