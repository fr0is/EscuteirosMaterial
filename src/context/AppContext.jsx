import React, { createContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export const AppContext = createContext();

const supabaseUrl = "https://mwwyfsyjdgppvapkhkos.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d3lmc3lqZGdwcHZhcGtoa29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjA4OTUsImV4cCI6MjA2MzgzNjg5NX0.Ntu1ypad2EDtx-lkeDHcrr1alwivQXbgRgD5cnl4AMU";
const supabase = createClient(supabaseUrl, supabaseKey);

export function AppProvider({ children }) {
  const [user, setUser] = useState({ nome: "", username: "", isAdmin: false, loggedIn: false });
  const [stock, setStock] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [users, setUsers] = useState([]);

  // Carregar stock
  const fetchStock = async () => {
    const { data, error } = await supabase.from("stock").select("*");
    if (error) {
      console.error("Erro ao buscar stock:", error);
    } else {
      setStock(data);
    }
  };

  // Carregar pedidos
  const fetchPedidos = async () => {
    const { data, error } = await supabase.from("pedidos").select("*");
    if (error) {
      console.error("Erro ao buscar pedidos:", error);
    } else {
      setPedidos(data);
    }
  };

  // Carregar users (igual ao teu original)
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Erro ao buscar users:", error);
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchStock();
    fetchPedidos();
    fetchUsers();
  }, []);

  // Adicionar usuário
  const adicionarUsuario = async (novoUser) => {
    const { data, error } = await supabase.from("users").insert([novoUser]);
    if (error) {
      console.error("Erro ao adicionar usuário:", error);
      return;
    }
    setUsers((u) => [...u, data[0]]);
  };

  // Atualizar pedido (ex: aprovar, devolver, cancelar)
  const updatePedido = async (pedidoId, updates) => {
    const { data, error } = await supabase.from("pedidos").update(updates).eq("id", pedidoId);
    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      return false;
    }
    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, ...updates } : p)));
    return true;
  };

  // Atualizar stock
  const updateStock = async (updatedStock) => {
    for (const item of updatedStock) {
      const { error } = await supabase.from("stock").update({ disponivel: item.disponivel }).eq("id", item.id);
      if (error) {
        console.error("Erro ao atualizar stock:", error);
        return false;
      }
    }
    setStock(updatedStock);
    return true;
  };

// Função login no AppContext
const login = async (username) => {
  const { data: userEncontrado, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username.trim())
    .single();

  if (error || !userEncontrado) {
    throw new Error("Username não encontrado");
  }

  setUser({
    username: userEncontrado.username,
    nome: userEncontrado.nome,
    isAdmin: userEncontrado.tipo === "admin",
    loggedIn: true,
  });
 };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        stock,
        setStock: updateStock,
        pedidos,
        setPedidos,
        updatePedido,
        users,
        setUsers,
        adicionarUsuario,
        supabase,
        login,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
