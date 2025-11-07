import React, { useContext, useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Configuracao.css";
import "../styles/utilities.css";
import "../styles/variables.css";

export default function Configuracao() {
  const {
    user,
    setUser,
    users,
    setUsers,
    adicionarUsuario,
    supabase,
    alterarSeccaoUsuario,
  } = useContext(AppContext);

  const navigate = useNavigate();

  const [novaPassword, setNovaPassword] = useState("");
  const [usernameNovoUtilizador, setUsernameNovoUtilizador] = useState("");
  const [nomeNovoUtilizador, setNomeNovoUtilizador] = useState("");
  const [emailNovoUtilizador, setEmailNovoUtilizador] = useState("");
  const [seccaoNovoUtilizador, setSeccaoNovoUtilizador] = useState("Lobitos");
  const [tipoNovoUtilizador, setTipoNovoUtilizador] = useState("user");
  const [passwordNovoUtilizador, setPasswordNovoUtilizador] = useState("");
  const [novaSeccao, setNovaSeccao] = useState(user.seccao || "Lobitos");
  const [edicoesTipo, setEdicoesTipo] = useState({});
  const [seccaoAtiva, setSeccaoAtiva] = useState("perfil");
  // NOVO: Estados para Emails de Notificação
  const [emailsNotificacao, setEmailsNotificacao] = useState([]);
  const [novoEmailNotificacao, setNovoEmailNotificacao] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(false);
    // ==== NOVO BLOCO: Dirigentes (Responsáveis de Secção) ====
  const [dirigentes, setDirigentes] = useState([]);
  const [loadingDirigentes, setLoadingDirigentes] = useState(false);
  const [novoDirigente, setNovoDirigente] = useState({
    seccao: "",
    nome: "",
    email: "",
  });
  const [editandoDirigente, setEditandoDirigente] = useState(null);

  async function carregarDirigentes() {
    setLoadingDirigentes(true);
    const { data, error } = await supabase
      .from("responsaveis_seccao")
      .select("*")
      .order("seccao", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar responsáveis de secção.");
    } else {
      setDirigentes(data);
    }
    setLoadingDirigentes(false);
  }

  async function adicionarDirigente() {
    const { seccao, nome, email } = novoDirigente;

    if (!seccao || !nome || !email) {
      toast.warn("Preencha todos os campos.");
      return;
    }

    const { error } = await supabase.from("dirigentes").upsert([{ seccao, nome, email }]);
    if (error) {
      toast.error("Erro ao adicionar/atualizar responsável.");
      console.error(error);
    } else {
      toast.success("Responsável guardado com sucesso!");
      setNovoDirigente({ seccao: "", nome: "", email: "" });
      carregarDirigentes();
    }
  }

  async function removerDirigente(seccao) {
    const confirmToastId = toast.warn(
      <div>
        <div>Tem a certeza que deseja remover o responsável da secção <b>{seccao}</b>?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              toast.dismiss(confirmToastId);
              const { error } = await supabase.from("dirigentes").delete().eq("seccao", seccao);
              if (error) {
                toast.error("Erro ao remover responsável.");
              } else {
                toast.success("Responsável removido com sucesso!");
                carregarDirigentes();
              }
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
            onClick={() => toast.dismiss(confirmToastId)}
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
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  }

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/");
    } else {
    carregarEmailsNotificacao();  // <-- chama aqui para carregar ao entrar
    carregarDirigentes();
    }
  }, [user, navigate]);

  async function carregarEmailsNotificacao() {
    setLoadingEmails(true);
    const { data, error } = await supabase
      .from("emails_notificacao")
      .select("*")
      .order("email", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar emails de notificação.");
      console.error(error);
    } else {
      setEmailsNotificacao(data);
    }
    setLoadingEmails(false);
  }

  const validarPassword = (password) => {
    const temTamanhoValido = password.length > 6;
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return temTamanhoValido && temEspecial;
  };

  const validarEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Função para adicionar email de notificação
  const handleAdicionarEmail = async () => {
    const email = novoEmailNotificacao.trim().toLowerCase();

    if (!validarEmail(email)) {
      toast.warn("Insira um email válido.");
      return;
    }

    setLoadingEmails(true);
    const { data: existente, error: erroConsulta } = await supabase
      .from("emails_notificacao")
      .select("email")
      .eq("email", email);

    if (erroConsulta) {
      toast.error("Erro ao verificar email.");
      setLoadingEmails(false);
      return;
    }
    if (existente.length > 0) {
      toast.warn("Este email já está na lista de notificação.");
      setLoadingEmails(false);
      return;
    }

    const { error } = await supabase
      .from("emails_notificacao")
      .insert([{ email }]);

    if (error) {
      toast.error("Erro ao adicionar email.");
      console.error(error);
    } else {
      toast.success("Email adicionado com sucesso!");
      setNovoEmailNotificacao("");
      carregarEmailsNotificacao();
    }
    setLoadingEmails(false);
  };

  // Função para remover email de notificação
  const handleRemoverEmail = (email) => {
    const confirmToastId = toast.warn(
      <div>
        <div>Tem a certeza que deseja remover este email de notificação?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              setLoadingEmails(true);  // Inicia o carregamento

              // Fecha apenas o toast de confirmação
              toast.dismiss(confirmToastId);

              try {
                const { error } = await supabase
                  .from("emails_notificacao")
                  .delete()
                  .eq("email", email);

                if (error) {
                  setTimeout(() => {
                    toast.error("Erro ao remover email.");
                  }, 400);
                  console.error(error);
                  return;
                }

                // Atualiza a lista após remoção bem-sucedida
                carregarEmailsNotificacao();

                setTimeout(() => {
                  toast.success("Email removido com sucesso!", {
                    autoClose: 8000,
                    closeOnClick: true,
                    draggable: true,
                  });
                }, 400); // Delay para suavizar transição
              } catch (error) {
                setTimeout(() => {
                  toast.error("Erro ao remover email.");
                }, 400);
                console.error(error);
              } finally {
                setLoadingEmails(false);
              }
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
            onClick={() => toast.dismiss(confirmToastId)}
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
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        progress: undefined,
        toastId: 'confirm-remove-email', // Identificador único para este toast
      }
    );
  };


  const handleChangePassword = async () => {
    const password = novaPassword.trim();

    if (!password) {
      toast.warn("Insira a nova password.");
      return;
    }

    if (!validarPassword(password)) {
      toast.error(
        "A palavra-passe deve ter mais de 6 caracteres e conter pelo menos um carácter especial."
      );
      return;
    }

    try {
      // 🔐 Gera o hash da nova password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // 💾 Atualiza no Supabase
      const { error } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("username", user.username);

      if (error) {
        console.error(error);
        toast.error("Erro ao alterar a palavra-passe.");
        return;
      }

      toast.success("Password alterada com sucesso!");
      setNovaPassword("");
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao alterar password.");
    }
  };


  const handleAddUser = async () => {
    const username = usernameNovoUtilizador.trim();
    const nome = nomeNovoUtilizador.trim();
    const password = passwordNovoUtilizador.trim();
    const email = emailNovoUtilizador.trim();
    const seccao = seccaoNovoUtilizador.trim();

    if (!username || !nome || !password || !email) {
      toast.warn("Preencha todos os campos.");
      return;
    }

    if (!validarPassword(password)) {
      toast.error("A palavra-passe deve ter mais de 6 caracteres e conter pelo menos um carácter especial.");
      return;
    }

    if (!validarEmail(email)) {
      toast.error("O email inserido não é válido.");
      return;
    }

    try {
      // Verifica se o username já existe
      const { data: existingUsername, error: usernameError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username);

      if (usernameError) throw usernameError;
      if (existingUsername.length > 0) {
        toast.error("O nome de utilizador já existe.");
        return;
      }

      // Verifica se o email já existe
      const { data: existingEmail, error: emailError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email);

      if (emailError) throw emailError;
      if (existingEmail.length > 0) {
        toast.error("O email já está associado a outra conta.");
        return;
      }

      // Cria o utilizador
      await adicionarUsuario({
        username,
        nome,
        tipo: tipoNovoUtilizador,
        password,
        email,
        seccao,
      });

      // Limpa os inputs
      setUsernameNovoUtilizador("");
      setNomeNovoUtilizador("");
      setPasswordNovoUtilizador("");
      setEmailNovoUtilizador("");
      setSeccaoNovoUtilizador("Lobitos");
      setTipoNovoUtilizador("user");

      toast.success("Utilizador adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar utilizador.");
      console.error(error);
    }
  };

  const handleRemoveUser = (username) => {
  if (username === user.username) {
    toast.warn("Você não pode remover a si mesmo.");
    return;
  }

  if (username === "CA127" && !(user.username === "admin" || user.username === "CA127")) {
    toast.warn("Apenas 'admin' ou 'CA127' podem remover este utilizador.");
    return;
  }

    // Aqui captura o ID do toast de confirmação
    const confirmToastId = toast.warn(
      <div>
        <div>Tem a certeza que deseja remover este utilizador?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              // Fecha só o toast de confirmação
              toast.dismiss(confirmToastId);

              try {
                const { error } = await supabase.from("users").delete().eq("username", username);
                if (error) {
                  toast.error("Erro ao remover utilizador.");
                  console.error(error);
                  return;
                }
                setUsers((u) => u.filter((user) => user.username !== username));

                setTimeout(() => {
                  toast.success("Utilizador removido com sucesso!", {
                    autoClose: 8000,
                    closeOnClick: true,
                    draggable: true,
                  });
                }, 300);
              } catch (error) {
                toast.error("Erro ao remover o utilizador.", {
                  autoClose: 8000,
                  closeOnClick: true,
                  draggable: true,
                }, 300);
                console.error(error);
              }
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
            onClick={() => toast.dismiss(confirmToastId)}  // fecha só o toast de confirmação
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
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        progress: undefined,
      }
    );
  };


  const handleChangeSeccao = async () => {
    if (!novaSeccao) {
      toast.warn("Selecione uma seção válida.");
      return;
    }

    try {
      await alterarSeccaoUsuario(user.username, novaSeccao);
      toast.success("Seccao alterada com sucesso!");
    } catch {
      toast.error("Erro ao alterar seccao.");
    }
  };

  const handleLogout = () => {
    setUser({
      id: null,
      nome: "",
      username: "",
      isAdmin: false,
      loggedIn: false,
      seccao: null, // se também usares este campo
    });
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user.loggedIn) {
    return null;
  }

  const handleSalvarTipo = async (username) => {
    const novoTipo = edicoesTipo[username];

    if (!["user", "admin"].includes(novoTipo)) {
      toast.warn("Tipo inválido.");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ tipo: novoTipo })
        .eq("username", username);

      if (error) {
        toast.error("Erro ao atualizar tipo de utilizador.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.username === username ? { ...u, tipo: novoTipo } : u
        )
      );

      setEdicoesTipo((prev) => {
        const copy = { ...prev };
        delete copy[username];
        return copy;
      });

      toast.success("Tipo de utilizador atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar tipo de utilizador.");
    }
  };

  const secoesMenu = user.isAdmin
    ? [
        { id: "perfil", label: "Perfil" },
        { id: "utilizadoresRegistados", label: "Utilizadores Registados" },
        { id: "adicionarUtilizador", label: "Adicionar Utilizador" },
        { id: "emailsNotificacao", label: "Emails de Notificação" },
        { id: "responsavelSeccao", label: "Responsável Secção" },
      ]
    : [
        { id: "perfil", label: "Perfil" },
      ];

  return (
    <div className="config-page">
      <nav className="sidebar-menu">
        <ul>
          {secoesMenu.map((seccao) => (
            <li
              key={seccao.id}
              className={seccaoAtiva === seccao.id ? "active" : ""}
              onClick={() => setSeccaoAtiva(seccao.id)}
            >
              {seccao.label}
            </li>
          ))}
          <li className="logout-button" onClick={handleLogout}>Logout</li>
        </ul>
      </nav>

      <main className="content-area">
        {seccaoAtiva === "perfil" && (
          <section>
            <h2>Perfil</h2>

            <div className="form-group">
              <h3>Alterar Password</h3>
              <input
                type="password"
                placeholder="Nova Password"
                value={novaPassword}
                onChange={(e) => setNovaPassword(e.target.value)}
                className="input-field"
              />
              <button onClick={handleChangePassword} className="btn btn-adicionar">
                Confirmar Alteração
              </button>
            </div>

            <div className="form-group" style={{ marginTop: "2rem" }}>
              <h3>Alterar Secção</h3>
              <select
                value={novaSeccao}
                onChange={(e) => setNovaSeccao(e.target.value)}
                className="select-field"
              >
                <option value="">-- Seleciona uma secção --</option>
                <option value="Lobitos">Lobitos</option>
                <option value="Exploradores">Exploradores</option>
                <option value="Pioneiros">Pioneiros</option>
                <option value="Caminheiros">Caminheiros</option>
                <option value="Dirigentes">Dirigentes</option>
              </select>
              <button onClick={handleChangeSeccao} className="btn btn-adicionar">
                Confirmar Alteração
              </button>
            </div>
          </section>
        )}

        {user.isAdmin && seccaoAtiva === "utilizadoresRegistados" && (
          <section>
            <h2>Utilizadores Registados</h2>

            {/* Agrupa os utilizadores por secção */}
            {(() => {
              const utilizadoresPorSeccao = users
                .filter((u) => u.username !== "admin") // ignora admin
                .reduce((acc, u) => {
                  const sec = u.seccao || "Sem secção";
                  if (!acc[sec]) acc[sec] = [];
                  acc[sec].push(u);
                  return acc;
                }, {});

              const ordem = ["Lobitos", "Exploradores", "Pioneiros", "Caminheiros", "Dirigentes", "Sem secção"];
              const secoesOrdenadas = Object.keys(utilizadoresPorSeccao).sort(
                (a, b) => ordem.indexOf(a) - ordem.indexOf(b)
              );

              return secoesOrdenadas.map((secao) => (
                <div key={secao} style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      marginBottom: "0.5rem",
                      borderBottom: "2px solid var(--color-primary-dark)",
                      paddingBottom: "4px",
                      color: "var(--color-primary-dark)",
                    }}
                  >
                    {secao}
                  </h3>

                  <ul className="user-list">
                    {utilizadoresPorSeccao[secao].map((u) => {
                      const podeEditar = 
                      u.username === "CA127"
                        ? user.username === "CA127" || user.username === "admin"
                        : user.isAdmin;


                      return (
                        <li key={u.username} className="user-list-item">
                          <div className="user-info">
                            <span>
                              <b>{u.username}</b> - {u.nome} ({u.tipo}) 
                            </span>
                            {edicoesTipo[u.username] !== undefined && (
                              <select
                                value={edicoesTipo[u.username]}
                                onChange={(e) =>
                                  setEdicoesTipo((prev) => ({
                                    ...prev,
                                    [u.username]: e.target.value,
                                  }))
                                }
                                className="select-field"
                                style={{ marginLeft: "10px" }}
                              >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                            {edicoesTipo[u.username] !== undefined ? (
                              <>
                                <button title="Guardar" onClick={() => handleSalvarTipo(u.username)} className="btn btn-adicionar">💾</button>
                                <button title="Cancelar"
                                  onClick={() =>
                                    setEdicoesTipo((prev) => {
                                      const copy = { ...prev };
                                      delete copy[u.username];
                                      return copy;
                                    })
                                  }
                                  className="btn btn-remover"
                                >
                                  🗙
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Botão de edição permanece na mesma posição */}
                                {podeEditar && (
                                  <button title="Editar"
                                    onClick={() =>
                                      setEdicoesTipo((prev) => ({ ...prev, [u.username]: u.tipo }))
                                    }
                                    className="btn btn-adicionar"
                                  >
                                    ✏️
                                  </button>
                                )}
                                {/* Botão de remover permanece */}
                                {(u.username === "CA127"
                                    ? user.username === "admin" || user.username === "CA127"
                                    : u.username !== user.username && user.isAdmin
                                ) ? (
                                  <button title="Eliminar" onClick={() => handleRemoveUser(u.username)} className="btn btn-remover">🗑️</button>
                                ) : (
                                  <span className="disabled-remover">(Não pode remover)</span>
                                )}
                              </>
                            )}
                          </div>
                        </li>

                      );
                    })}
                  </ul>
                </div>
              ));
            })()}
          </section>
        )}

        {user.isAdmin && seccaoAtiva === "adicionarUtilizador" && (
          <section>
            <h2>Adicionar Utilizador</h2>
            <div className="adicionar-user-form">
              <label>
                Username
                <input
                  placeholder="Username"
                  value={usernameNovoUtilizador}
                  onChange={(e) => setUsernameNovoUtilizador(e.target.value)}
                  className="input-field"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordNovoUtilizador}
                  onChange={(e) => setPasswordNovoUtilizador(e.target.value)}
                  className="input-field"
                />
              </label>
              <label>
                Nome
                <input
                  placeholder="Nome do encarregado de material"
                  value={nomeNovoUtilizador}
                  onChange={(e) => setNomeNovoUtilizador(e.target.value)}
                  className="input-field"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  placeholder="Email do encarregado de material"
                  value={emailNovoUtilizador}
                  onChange={(e) => setEmailNovoUtilizador(e.target.value)}
                  className="input-field"
                />
              </label>
              <label>
                Secção
                <select
                  value={seccaoNovoUtilizador}
                  onChange={(e) => setSeccaoNovoUtilizador(e.target.value)}
                  className="select-field"
                >
                  <option value="Lobitos">Lobitos</option>
                  <option value="Exploradores">Exploradores</option>
                  <option value="Pioneiros">Pioneiros</option>
                  <option value="Caminheiros">Caminheiros</option>
                  <option value="Dirigentes">Dirigentes</option>
                </select>
              </label>
              <label>
                Tipo Utilizador
                <select
                  value={tipoNovoUtilizador}
                  onChange={(e) => setTipoNovoUtilizador(e.target.value)}
                  className="select-field"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button onClick={handleAddUser} className="btn btn-adicionar">
                Adicionar
              </button>
            </div>
          </section>
        )}
        {user.isAdmin && seccaoAtiva === "emailsNotificacao" && (
          <section>
            <h2>Emails de Notificação</h2>
            {loadingEmails && <p>A carregar emails...</p>}
            {!loadingEmails && (
              <>
                <ul className="user-list">
                  {emailsNotificacao.length === 0 && <li>Nenhum email configurado.</li>}
                  {emailsNotificacao.map(({ email }) => (
                    <li key={email} className="user-list-item">
                      {email}{" "}
                      <button title="Eliminar"
                        onClick={() => handleRemoverEmail(email)}
                        className="btn btn-remover"
                        disabled={loadingEmails}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <input
                    type="email"
                    placeholder="Novo email"
                    value={novoEmailNotificacao}
                    onChange={(e) => setNovoEmailNotificacao(e.target.value)}
                    className="input-field"
                    disabled={loadingEmails}
                  />
                  <button
                    onClick={handleAdicionarEmail}
                    className="btn btn-adicionar"
                    disabled={loadingEmails}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {user.isAdmin && seccaoAtiva === "responsavelSeccao" && (
          <section>
            <h2>Responsáveis de Secção</h2>

            {loadingDirigentes && <p>A carregar responsáveis...</p>}
            {!loadingDirigentes && (
              <ul className="user-list">
                {["Lobitos", "Exploradores", "Pioneiros", "Caminheiros"].map((secao) =>
                  dirigentes
                    .filter((d) => d.seccao === secao)
                    .map((d) => {
                      const isEditing = editandoDirigente === d.id;

                      return (
                        <li key={d.id} className="user-list-item">
                          <div className="user-info">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={d.nome}
                                  onChange={(e) =>
                                    setDirigentes((prev) =>
                                      prev.map((r) =>
                                        r.id === d.id ? { ...r, nome: e.target.value } : r
                                      )
                                    )
                                  }
                                  placeholder="Nome do responsável"
                                  className="input-field"
                                />
                                <input
                                  type="email"
                                  value={d.email}
                                  onChange={(e) =>
                                    setDirigentes((prev) =>
                                      prev.map((r) =>
                                        r.id === d.id ? { ...r, email: e.target.value } : r
                                      )
                                    )
                                  }
                                  placeholder="Email do responsável"
                                  className="input-field"
                                />
                              </>
                            ) : (
                              <span>
                                <b>{d.seccao}</b> ({d.nome}) - {d.email}
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                            {isEditing ? (
                              <>
                                <button title="Guardar"
                                  className="btn btn-adicionar"
                                  onClick={async () => {
                                    const { id, nome, email } = d;
                                    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                                    if (!emailValido) {
                                      toast.error("Insira um email válido.");
                                      return;
                                    }

                                    const { error } = await supabase
                                      .from("responsaveis_seccao")
                                      .update({ nome, email })
                                      .eq("id", id);

                                    if (error) {
                                      toast.error("Erro ao atualizar responsável.");
                                      console.error(error);
                                    } else {
                                      toast.success("Responsável atualizado com sucesso!");
                                      setEditandoDirigente(null);
                                      carregarDirigentes();
                                    }
                                  }}
                                >
                                  💾
                                </button>
                                <button title="Cancelar"
                                  className="btn btn-remover"
                                  onClick={() => setEditandoDirigente(null)}
                                >
                                  🗙
                                </button>
                              </>
                            ) : (
                              <button title="Editar"
                                className="btn btn-adicionar"
                                onClick={() => setEditandoDirigente(d.id)}
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })
                )}
              </ul>
            )}
          </section>
        )}


      </main>
        
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
    </div>
  );
}
