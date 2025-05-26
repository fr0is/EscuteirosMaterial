import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Material() {
  const { user, stock, setStock, pedidos, setPedidos } = useContext(AppContext);
  const navigate = useNavigate();

  const [dataPedido, setDataPedido] = useState("");
  const [quantidades, setQuantidades] = useState({});

  // Estados para chefe gerir stock
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoItemTotal, setNovoItemTotal] = useState("");

  if (!user.loggedIn) {
    navigate("/");
    return null;
  }

  const handleChangeQuantidade = (nome, value) => {
    const disponivel = stock.find((i) => i.nome === nome)?.disponivel || 0;
    const val = Math.max(0, Math.min(value || 0, disponivel));
    setQuantidades((q) => ({ ...q, [nome]: val }));
  };

  const handleSubmitPedido = () => {
    if (!dataPedido) return alert("Escolha uma data");
    const materiais = Object.fromEntries(
      Object.entries(quantidades).filter(([_, q]) => q > 0)
    );
    if (Object.keys(materiais).length === 0)
      return alert("Selecione algum material");

    const novoPedido = {
      id: Date.now(),
      nome: user.nome,
      data: dataPedido,
      materiais,
      estado: "Pendente",
      devolvido: {},
    };
    setPedidos([...pedidos, novoPedido]);
    setQuantidades({});
    setDataPedido("");
    alert("Pedido enviado!");
  };

  // Função para atualizar o total e o disponível (adicionar ou remover stock)
  const handleAtualizarTotal = (id, novoTotal) => {
    if (isNaN(novoTotal) || novoTotal < 0) return;
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.id === id) {
          const emprestados = item.total - item.disponivel;
          const disponivelAtualizado =
            novoTotal < emprestados ? 0 : novoTotal - emprestados;
          return {
            ...item,
            total: novoTotal,
            disponivel: disponivelAtualizado,
          };
        }
        return item;
      })
    );
  };

  // Adicionar novo item ao stock
  const handleAdicionarItem = () => {
    if (!novoItemNome.trim() || !novoItemTotal || isNaN(novoItemTotal)) {
      alert("Preencha nome e quantidade válida.");
      return;
    }
    if (
      stock.find(
        (item) => item.nome.toLowerCase() === novoItemNome.trim().toLowerCase()
      )
    ) {
      alert("Já existe um item com esse nome.");
      return;
    }
    const novoItem = {
      id: Date.now(),
      nome: novoItemNome.trim(),
      total: parseInt(novoItemTotal),
      disponivel: parseInt(novoItemTotal),
    };
    setStock([...stock, novoItem]);
    setNovoItemNome("");
    setNovoItemTotal("");
  };

  // Eliminar item do stock
  const handleEliminarItem = (id) => {
    if (window.confirm("Tem a certeza que quer eliminar este item?")) {
      setStock(stock.filter((item) => item.id !== id));
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Olá, {user.nome}</h2>

      <h3>Stock disponível</h3>
      {stock.length === 0 && <p>Nenhum item no stock.</p>}
      {stock.map((item) => (
        <div
          key={item.id}
          style={{
            marginBottom: 12,
            borderBottom: "1px solid #ccc",
            paddingBottom: 6,
          }}
        >
          <b>{item.nome}</b>: {item.disponivel} / {item.total}
          {user.isChefe && (
            <>
              <div style={{ marginTop: 6 }}>
                <label>
                  Total:{" "}
                  <input
                    type="number"
                    min="0"
                    value={item.total}
                    onChange={(e) =>
                      handleAtualizarTotal(item.id, parseInt(e.target.value))
                    }
                    style={{ width: 70 }}
                  />
                </label>
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => handleEliminarItem(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {!user.isChefe && (
        <>
          <h3>Fazer pedido</h3>
          <input
            type="date"
            value={dataPedido}
            onChange={(e) => setDataPedido(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {stock.map((item) => (
            <div key={item.id} style={{ marginBottom: 6 }}>
              <label>
                {item.nome}:{" "}
                <input
                  type="number"
                  min={0}
                  max={item.disponivel}
                  value={quantidades[item.nome] || ""}
                  onChange={(e) =>
                    handleChangeQuantidade(item.nome, Number(e.target.value))
                  }
                />
              </label>
            </div>
          ))}
          <button onClick={handleSubmitPedido} style={{ marginTop: 10 }}>
            Enviar Pedido
          </button>
        </>
      )}

      {user.isChefe && (
        <>
          <h3>Adicionar novo item ao stock</h3>
          <input
            placeholder="Nome do novo item"
            value={novoItemNome}
            onChange={(e) => setNovoItemNome(e.target.value)}
            style={{ marginRight: 6 }}
          />
          <input
            type="number"
            placeholder="Quantidade total"
            value={novoItemTotal}
            onChange={(e) => setNovoItemTotal(e.target.value)}
            style={{ width: 120, marginRight: 6 }}
            min="0"
          />
          <button onClick={handleAdicionarItem}>Adicionar Item</button>
        </>
      )}
    </div>
  );
}
