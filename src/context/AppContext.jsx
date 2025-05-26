import React, { createContext, useState } from "react";

export const AppContext = createContext();

const initialStock = [
  { id: 1, nome: "Tenda 4p", total: 10, disponivel: 10 },
  { id: 2, nome: "Panela Grande", total: 5, disponivel: 5 },
  { id: 3, nome: "Bacia", total: 8, disponivel: 8 },
];

// Usuários iniciais para teste
const initialUsers = [
  { username: "admin", tipo: "admin", nome: "Admin Chefe" },
  { username: "user", tipo: "user", nome: "User Normal" },
  { username: "CA127", tipo: "admin", nome: "Usuário CA127" },  // <-- novo user
];


export function AppProvider({ children }) {
  const [user, setUser] = useState({ nome: "", username: "", isAdmin: false, loggedIn: false });
  const [stock, setStock] = useState(initialStock);
  const [pedidos, setPedidos] = useState([]);
  const [users, setUsers] = useState(initialUsers);

  // Função para adicionar novo usuário
  const adicionarUsuario = (novoUser) => {
    setUsers((u) => [...u, novoUser]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        stock,
        setStock,
        pedidos,
        setPedidos,
        users,
        setUsers,
        adicionarUsuario,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
