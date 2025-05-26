import { useState } from "react";

const initialStock = [
  { id: 1, nome: "Tenda 4p", total: 10, disponivel: 10 },
  { id: 2, nome: "Panela Grande", total: 5, disponivel: 5 },
  { id: 3, nome: "Bacia", total: 8, disponivel: 8 },
];

export default function App() {
  const [nome, setNome] = useState("");
  const [isChefe, setIsChefe] = useState(false);
  const [stock, setStock] = useState(initialStock);
  const [pedidos, setPedidos] = useState([]);
  const [novoPedido, setNovoPedido] = useState({ materiais: {}, data: "" });

  // Estados para o chefe gerir o stock
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoItemTotal, setNovoItemTotal] = useState("");

  const handleRequisitar = () => {
    const pedido = {
      id: Date.now(),
      nome,
      data: novoPedido.data,
      materiais: novoPedido.materiais,
      estado: "Pendente",
      devolvido: {},
    };
    setPedidos([...pedidos, pedido]);
    setNovoPedido({ materiais: {}, data: "" });
  };

  const handleAprovar = (pedidoId) => {
    const atualizado = pedidos.map((p) => {
      if (p.id === pedidoId) {
        const materiais = p.materiais;
        const novoStock = stock.map((item) => {
          if (materiais[item.nome]) {
            item.disponivel -= materiais[item.nome];
          }
          return item;
        });
        setStock(novoStock);
        return { ...p, estado: "Aprovado" };
      }
      return p;
    });
    setPedidos(atualizado);
  };

  const handleDevolver = (pedidoId, devolucao) => {
    const atualizado = pedidos.map((p) => {
      if (p.id === pedidoId) {
        const novoStock = stock.map((item) => {
          if (devolucao[item.nome]) {
            item.disponivel += devolucao[item.nome];
          }
          return item;
        });
        setStock(novoStock);
        return { ...p, estado: "Concluído", devolvido: devolucao };
      }
      return p;
    });
    setPedidos(atualizado);
  };

  // Adicionar novo item ao stock
  const handleAdicionarItem = () => {
    if (!novoItemNome.trim() || !novoItemTotal || isNaN(novoItemTotal)) {
      alert("Preencha nome e quantidade válida.");
      return;
    }
    // Verificar se já existe um item com esse nome
    if (stock.find((item) => item.nome.toLowerCase() === novoItemNome.toLowerCase())) {
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
      // Opcional: eliminar pedidos associados? (não feito aqui)
    }
  };

  // Atualizar total stock
  const handleAtualizarTotal = (id, novoTotal) => {
    if (isNaN(novoTotal) || novoTotal < 0) return;

    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.id === id) {
          // Calcular quantos estão emprestados
          const emprestados = item.total - item.disponivel;
          // Se o novo total for menor que emprestados, ajustar o disponivel para 0
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

  return (
    <div className="App" style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Login</h2>
      <input
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ marginRight: 10 }}
      />
      <label>
        <input
          type="checkbox"
          checked={isChefe}
          onChange={() => setIsChefe(!isChefe)}
        />
        Sou chefe do material
      </label>

      <h2>Stock Atual</h2>
      {stock.map((item) => (
        <div key={item.id} style={{ marginBottom: 8, borderBottom: "1px solid #ccc", paddingBottom: 6 }}>
          <b>{item.nome}</b> — {item.disponivel}/{item.total} disponível
          {isChefe && (
            <>
              <br />
              <label>
                Total:{" "}
                <input
                  type="number"
                  min="0"
                  value={item.total}
                  onChange={(e) =>
                    handleAtualizarTotal(item.id, parseInt(e.target.value))
                  }
                  style={{ width: 60 }}
                />
              </label>{" "}
              <button
                style={{ marginLeft: 10 }}
                onClick={() => handleEliminarItem(item.id)}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      ))}

      {!isChefe && (
        <>
          <h2>Requisitar Material</h2>
          <input
            type="date"
            value={novoPedido.data}
            onChange={(e) =>
              setNovoPedido({ ...novoPedido, data: e.target.value })
            }
          />
          {stock.map((item) => (
            <input
              key={item.id}
              type="number"
              placeholder={item.nome}
              min="0"
              max={item.disponivel}
              onChange={(e) =>
                setNovoPedido({
                  ...novoPedido,
                  materiais: {
                    ...novoPedido.materiais,
                    [item.nome]: Math.min(
                      Math.max(parseInt(e.target.value) || 0, 0),
                      item.disponivel
                    ),
                  },
                })
              }
              style={{ display: "block", marginTop: 4 }}
            />
          ))}
          <button onClick={handleRequisitar} style={{ marginTop: 10 }}>
            Submeter Pedido
          </button>
        </>
      )}

      {isChefe && (
        <>
          <h2>Gestão do Inventário</h2>
          <div style={{ marginBottom: 12 }}>
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
          </div>

          <h2>Pedidos</h2>
          {pedidos.length === 0 && <p>Nenhum pedido registado.</p>}
          {pedidos.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                marginBottom: 10,
              }}
            >
              <p>
                <b>{p.nome}</b> - {p.data} - <i>{p.estado}</i>
              </p>
              <ul>
                {Object.entries(p.materiais).map(([nome, q]) => (
                  <li key={nome}>
                    {nome}: {q}
                  </li>
                ))}
              </ul>
              {p.estado === "Pendente" && (
                <button onClick={() => handleAprovar(p.id)}>Aprovar</button>
              )}
              {p.estado === "Aprovado" && (
                <>
                  <p>Devolução:</p>
                  {Object.entries(p.materiais).map(([nome]) => (
                    <input
                      key={nome}
                      type="number"
                      placeholder={`Devolver ${nome}`}
                      min="0"
                      max={p.materiais[nome]}
                      onChange={(e) => {
                        const value = Math.min(
                          Math.max(parseInt(e.target.value) || 0, 0),
                          p.materiais[nome]
                        );
                        setPedidos((prev) =>
                          prev.map((pedido) =>
                            pedido.id === p.id
                              ? {
                                  ...pedido,
                                  devolvido: {
                                    ...pedido.devolvido,
                                    [nome]: value,
                                  },
                                }
                              : pedido
                          )
                        );
                      }}
                      style={{ marginRight: 6, marginBottom: 4 }}
                    />
                  ))}
                  <button onClick={() => handleDevolver(p.id, p.devolvido)}>
                    Confirmar Devolução
                  </button>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
