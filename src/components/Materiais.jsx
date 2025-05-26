import { useState } from "react";

export default function Materiais({ stock, setStock, isChefe }) {
  const [novoNome, setNovoNome] = useState("");
  const [novoTotal, setNovoTotal] = useState("");

  // Atualizar total e ajustar disponível automaticamente
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

  // Adicionar unidades ao disponível (sem alterar total)
  const handleAdicionarStock = (id, qtd) => {
    if (qtd <= 0) return;
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.id === id) {
          // Disponível não pode ultrapassar total
          const disponivelNovo = Math.min(item.disponivel + qtd, item.total);
          return { ...item, disponivel: disponivelNovo };
        }
        return item;
      })
    );
  };

  // Remover unidades do disponível (sem alterar total)
  const handleRemoverStock = (id, qtd) => {
    if (qtd <= 0) return;
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.id === id) {
          const disponivelNovo = Math.max(item.disponivel - qtd, 0);
          return { ...item, disponivel: disponivelNovo };
        }
        return item;
      })
    );
  };

  // Adicionar novo item
  const handleAdicionarItem = () => {
    if (!novoNome.trim() || !novoTotal || isNaN(novoTotal) || novoTotal <= 0) {
      alert("Preencha um nome e quantidade total válida!");
      return;
    }
    if (stock.find((i) => i.nome.toLowerCase() === novoNome.toLowerCase())) {
      alert("Já existe um item com esse nome!");
      return;
    }
    const novoItem = {
      id: Date.now(),
      nome: novoNome.trim(),
      total: parseInt(novoTotal, 10),
      disponivel: parseInt(novoTotal, 10),
    };
    setStock([...stock, novoItem]);
    setNovoNome("");
    setNovoTotal("");
  };

  return (
    <div>
      <h2>Material</h2>
      {stock.map((item) => (
        <div key={item.id} style={{ marginBottom: 12, borderBottom: "1px solid #ccc", paddingBottom: 6 }}>
          <b>{item.nome}</b>
          <div>
            Total:{" "}
            <input
              type="number"
              min="0"
              value={item.total}
              onChange={(e) => handleAtualizarTotal(item.id, parseInt(e.target.value, 10))}
              disabled={!isChefe}
              style={{ width: 60 }}
            />
          </div>
          <div>
            Disponível: {item.disponivel}
            {isChefe && (
              <>
                <button onClick={() => handleAdicionarStock(item.id, 1)} style={{ marginLeft: 10 }}>
                  +1
                </button>
                <button onClick={() => handleRemoverStock(item.id, 1)} style={{ marginLeft: 5 }}>
                  -1
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {isChefe && (
        <div style={{ marginTop: 20 }}>
          <h3>Adicionar Novo Item</h3>
          <input
            placeholder="Nome do material"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            style={{ marginRight: 10 }}
          />
          <input
            type="number"
            min="1"
            placeholder="Quantidade total"
            value={novoTotal}
            onChange={(e) => setNovoTotal(e.target.value)}
            style={{ width: 140, marginRight: 10 }}
          />
          <button onClick={handleAdicionarItem}>Adicionar</button>
        </div>
      )}
    </div>
  );
}
