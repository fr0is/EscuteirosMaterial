
// App.jsx
import { useState } from 'react';
import './App.css';

const initialStock = [
  { id: 1, nome: "Tenda 4p", total: 10, disponivel: 10 },
  { id: 2, nome: "Panela Grande", total: 5, disponivel: 5 },
  { id: 3, nome: "Bacia", total: 8, disponivel: 8 },
];

function App() {
  const [nome, setNome] = useState("");
  const [isChefe, setIsChefe] = useState(false);
  const [stock, setStock] = useState(initialStock);
  const [pedidos, setPedidos] = useState([]);
  const [novoPedido, setNovoPedido] = useState({ materiais: {}, data: "" });

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

  return (
    <div className="App">
      <h2>Login</h2>
      <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <label>
        <input type="checkbox" checked={isChefe} onChange={() => setIsChefe(!isChefe)} />
        Sou chefe do material
      </label>

      <h2>Stock Atual</h2>
      {stock.map((item) => (
        <div key={item.id}>{item.nome}: {item.disponivel}/{item.total}</div>
      ))}

      {!isChefe && (
        <>
          <h2>Requisitar Material</h2>
          <input type="date" value={novoPedido.data} onChange={(e) => setNovoPedido({ ...novoPedido, data: e.target.value })} />
          {stock.map((item) => (
            <input
              key={item.id}
              type="number"
              placeholder={item.nome}
              onChange={(e) => setNovoPedido({
                ...novoPedido,
                materiais: { ...novoPedido.materiais, [item.nome]: parseInt(e.target.value) || 0 },
              })}
            />
          ))}
          <button onClick={handleRequisitar}>Submeter Pedido</button>
        </>
      )}

      {isChefe && (
        <>
          <h2>Pedidos</h2>
          {pedidos.map((p) => (
            <div key={p.id}>
              <p><b>{p.nome}</b> - {p.data} - <i>{p.estado}</i></p>
              <ul>
                {Object.entries(p.materiais).map(([nome, q]) => (
                  <li key={nome}>{nome}: {q}</li>
                ))}
              </ul>
              {p.estado === "Pendente" && <button onClick={() => handleAprovar(p.id)}>Aprovar</button>}
              {p.estado === "Aprovado" && (
                <>
                  <p>Devolução:</p>
                  {Object.entries(p.materiais).map(([nome]) => (
                    <input
                      key={nome}
                      type="number"
                      placeholder={`Devolver ${nome}`}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setPedidos(prev => prev.map(pedido =>
                          pedido.id === p.id
                            ? { ...pedido, devolvido: { ...pedido.devolvido, [nome]: value } }
                            : pedido
                        ));
                      }}
                    />
                  ))}
                  <button onClick={() => handleDevolver(p.id, p.devolvido)}>Confirmar Devolução</button>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
