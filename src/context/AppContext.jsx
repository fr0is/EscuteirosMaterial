import React, { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser
      ? JSON.parse(storedUser)
      : { id: null, nome: "", username: "", isAdmin: false, loggedIn: false };
  });

  const [materiais, setMateriais] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [users, setUsers] = useState([]);
  const [emailsNotificacao, setEmailsNotificacao] = useState([]);

  // 🧩 Novo estado: detalhe_material
  const [detalheMaterial, setDetalheMaterial] = useState([]);

  // ---------------- FETCHS ----------------
  const fetchMateriais = async () => {
    const { data, error } = await supabase.from("materiais").select("*");
    if (error) console.error("Erro ao buscar materiais:", error);
    else setMateriais(data);
  };

  const fetchPedidos = async () => {
    const { data, error } = await supabase.from("pedidos").select("*");
    if (error) console.error("Erro ao buscar pedidos:", error);
    else setPedidos(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) console.error("Erro ao buscar usuários:", error);
    else setUsers(data);
  };

  // 🔍 Buscar detalhe_material (referências, condição e estado)
  const fetchDetalheMaterial = async () => {
    const { data, error } = await supabase
      .from("detalhe_material")
      .select("id, id_material, referencia, condicao, estado_pedido");

    if (error) {
      console.error("Erro ao buscar detalhe_material:", error);
    } else {
      setDetalheMaterial(data);
    }
  };

  // Atualizar um item de detalhe_material (opcional, útil futuramente)
  const atualizarDetalheMaterial = async (id, updates) => {
    const { data, error } = await supabase
      .from("detalhe_material")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar detalhe_material:", error);
      throw error;
    }

    setDetalheMaterial((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data } : d))
    );
  };

  // ---------------- USEEFFECT ----------------
  useEffect(() => {
    fetchMateriais();
    fetchPedidos();
    fetchUsers();
    fetchDetalheMaterial(); // 👈 adiciona o carregamento de referências
  }, []);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  // ---------------- USUÁRIOS ----------------
  const adicionarUsuario = async (novoUser) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(novoUser.password, salt);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: novoUser.username,
          nome: novoUser.nome,
          tipo: novoUser.tipo,
          password: hashedPassword,
          email: novoUser.email,
          seccao: novoUser.seccao,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar usuário:", error);
      throw error;
    }
    setUsers((u) => [...u, data]);
  };

  // ---------------- PEDIDOS ----------------
  const updatePedido = async (pedidoId, updates) => {
    const { data, error } = await supabase
      .from("pedidos")
      .update(updates)
      .eq("id", pedidoId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      return false;
    }

    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, ...data } : p))
    );
    return true;
  };

  const cancelarPedido = async (id) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      console.error("Erro ao apagar pedido:", error);
      return false;
    }
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const eliminarPedido = async (id) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      console.error("Erro ao eliminar pedido:", error);
      return false;
    }
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  // ---------------- MATERIAIS ----------------
  const setStock = async (novoStock) => {
    try {
      for (const item of novoStock) {
        await supabase
          .from("materiais")
          .update({ disponivel: item.disponivel })
          .eq("id", item.id);
      }
      setMateriais(novoStock);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar stock:", error);
      return false;
    }
  };

  const atualizarMaterial = async (id, updates) => {
    const { error } = await supabase
      .from("materiais")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    setMateriais((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const removerMaterial = async (id) => {
    const { error } = await supabase.from("materiais").delete().eq("id", id);
    if (error) throw error;
    setMateriais((prev) => prev.filter((m) => m.id !== id));
  };

  const adicionarMaterial = async ({ nome, total }) => {
    const { data, error } = await supabase
      .from("materiais")
      .insert([{ nome, total, disponivel: total }])
      .select()
      .single();

    if (error) throw error;
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
    user_id,
    seccao,
  }) => {
    const { data: result, error } = await supabase
      .from("pedidos")
      .insert([
        {
          nome,
          data,
          materiais,
          estado,
          devolvido,
          patrulha,
          atividade,
          user_id,
          seccao,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    setPedidos((prev) => [...prev, result]);
    return result;
  };

  // ---------------- LOGIN ----------------
  const login = async (identifier, password) => {
    const { data: userEncontrado, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${identifier.trim()},email.eq.${identifier.trim()}`)
      .single();

    if (error || !userEncontrado) throw new Error("Username ou email não encontrado");

    const passwordMatch = bcrypt.compareSync(password, userEncontrado.password);
    if (!passwordMatch) throw new Error("Password incorreta");

    setUser({
      id: userEncontrado.id,
      username: userEncontrado.username,
      nome: userEncontrado.nome,
      isAdmin: userEncontrado.tipo === "admin",
      loggedIn: true,
      seccao: userEncontrado.seccao,
    });
  };

  const alterarSeccaoUsuario = async (username, novaSeccao) => {
    const { data, error } = await supabase
      .from("users")
      .update({ seccao: novaSeccao })
      .eq("username", username)
      .select()
      .single();

    if (error) throw error;

    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, seccao: novaSeccao } : u))
    );

    if (user.username === username) {
      setUser((prevUser) => ({ ...prevUser, seccao: novaSeccao }));
    }
  };

  // ---------------- EMAILS DE NOTIFICAÇÃO ----------------
  const buscarEmailsNotificacao = async () => {
    const { data, error } = await supabase.from("emails_notificacao").select("email");
    if (error) {
      console.error("Erro ao buscar emails de notificação:", error);
    } else {
      setEmailsNotificacao(data);
    }
  };

  const adicionarEmailNotificacao = async (email) => {
    const { data, error } = await supabase
      .from("emails_notificacao")
      .insert([{ email }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar email de notificação:", error);
      throw error;
    }

    setEmailsNotificacao((prev) => [...prev, data]);
  };

  const removerEmailNotificacao = async (email) => {
    const { error } = await supabase.from("emails_notificacao").delete().eq("email", email);

    if (error) {
      console.error("Erro ao remover email de notificação:", error);
      return false;
    }

    setEmailsNotificacao((prev) => prev.filter((e) => e.email !== email));
    return true;
  };

  // ---------------- CONTEXTO ----------------
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
        cancelarPedido,
        setStock,
        users,
        setUsers,
        adicionarUsuario,
        supabase,
        login,
        adicionarMaterial,
        removerMaterial,
        atualizarMaterial,
        adicionarPedido,
        eliminarPedido,
        alterarSeccaoUsuario,
        emailsNotificacao,
        adicionarEmailNotificacao,
        removerEmailNotificacao,

        // 👇 Novos valores adicionados
        detalheMaterial,
        setDetalheMaterial,
        atualizarDetalheMaterial,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
