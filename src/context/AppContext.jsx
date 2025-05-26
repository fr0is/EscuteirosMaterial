import React, { createContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export const AppContext = createContext();

const supabaseUrl = "https://mwwyfsyjdgppvapkhkos.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d3lmc3lqZGdwcHZhcGtoa29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjA4OTUsImV4cCI6MjA2MzgzNjg5NX0.Ntu1ypad2EDtx-lkeDHcrr1alwivQXbgRgD5cnl4AMU";
const supabase = createClient(supabaseUrl, supabaseKey);

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    nome: "",
    username: "",
    isAdmin: false,
    loggedIn: false,
  });
  const [materiais, setMateriais] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [users, setUsers] = useState([]);

  // Buscar materiais
  const fetchMateriais = async () => {
    const { data, error } = await supabase.from("materiais").select("*");
    if (error) {
      console.error("Erro ao buscar materiais:", error);
    } else {
      setMateriais(data);
    }
  };

  // Buscar pedidos
  const fetchPedidos = async () => {
    const { data, error } = await supabase.from("pedidos").select("*");
    if (error) {
      console.error("Erro ao buscar pedidos:", error);
    } else {
      setPedidos(data);
    }
  };

  // Buscar usuários
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Erro ao buscar usuários:", error);
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchMateriais();
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
    const { data, error } = await supabase
      .from("pedidos")
      .update(updates)
      .eq("id", pedidoId);
    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      return false;
    }
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, ...updates } : p))
    );
    return true;
  };

  // Atualizar materiais
  const atualizarMaterial = async (id, updates) => {
    const { data, error } = await supabase
      .from("materiais")
      .update(updates)
      .eq("id", id);
    if (error) {
      console.error("Erro ao atualizar material:", error);
      throw error;
    }
    setMateriais((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  // Remover material
  const removerMaterial = async (id) => {
    const { error } = await supabase.from("materiais").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover material:", error);
      throw error;
    }
    setMateriais((prev) => prev.filter((m) => m.id !== id));
  };

  // Login
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

  // Adicionar material
  const adicionarMaterial = async ({ nome, total }) => {
    const { data, error } = await supabase
      .from("materiais")
      .insert([{ nome, total, disponivel: total }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar material:", error);
      throw error;
    }

    setMateriais((m) => [...m, data]);
  };

  const adicionarPedido = async ({
  nome,
  data,
  materiais,
  estado = "Pendente",
  devolvido = {},
  patrulha,
  atividade,
    }) => {
    const { data: result, error } = await supabase.from("pedido").insert([
        {
        nome,
        data,
        materiais,
        estado,
        devolvido,
        patrulha,
        atividade,
        },
    ]);
    if (error) {
    console.error("Erro ao adicionar pedido:", JSON.stringify(error, null, 2));
    throw error;
    }
    return result[0];
    };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        materiais,
        setMateriais,
        pedidos,
        setPedidos,
        updatePedido,
        users,
        setUsers,
        adicionarUsuario,
        supabase,
        login,
        adicionarMaterial,
        removerMaterial,
        atualizarMaterial,
        adicionarPedido,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
