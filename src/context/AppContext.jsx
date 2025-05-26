import React, { createContext, useState } from "react";

export const AppContext = createContext();

const initialStock = [
  { id: 1, nome: "Tenda 4p", total: 10, disponivel: 10 },
  { id: 2, nome: "Panela Grande", total: 5, disponivel: 5 },
  { id: 3, nome: "Bacia", total: 8, disponivel: 8 },
];

export function AppProvider({ children }) {
  const [user, setUser] = useState({ nome: "", isChefe: false, loggedIn: false });
  const [stock, setStock] = useState(initialStock);
  const [pedidos, setPedidos] = useState([]);

  return (
    <AppContext.Provider
      value={{ user, setUser, stock, setStock, pedidos, setPedidos }}
    >
      {children}
    </AppContext.Provider>
  );
}
