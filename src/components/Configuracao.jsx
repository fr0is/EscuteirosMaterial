import React, { useContext, useState, useEffect } from "react";
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
  const [seccaoAtiva, setSeccaoAtiva] = useState("alterarPassword");
  // NOVO: Estados para Emails de Notificação
  const [emailsNotificacao, setEmailsNotificacao] = useState([]);
  const [novoEmailNotificacao, setNovoEmailNotificacao] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(false);

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/");
    } else {
    carregarEmailsNotificacao();  // <-- chama aqui para carregar ao entrar
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
    toast.warn(
      <div>
        <div>Tem certeza que deseja remover este email de notificação?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              setLoadingEmails(true);  // Start loading
              try {
                const { error } = await supabase
                  .from("emails_notificacao")
                  .delete()
                  .eq("email", email);

                if (error) {
                  toast.error("Erro ao remover email.");
                  console.error(error);
                  return;
                }

                // Após remover com sucesso, recarrega a lista
                carregarEmailsNotificacao();
                toast.success("Email removido com sucesso!");
              } catch (error) {
                toast.error("Erro ao remover email.");
                console.error(error);
              }
              toast.dismiss();  // Dismiss the toast
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
            onClick={() => toast.dismiss()}
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


  const handleChangePassword = () => {
    const password = novaPassword.trim();

    if (!password) {
      toast.warn("Insira a nova password.");
      return;
    }

    if (!validarPassword(password)) {
      toast.error("A palavra-passe deve ter mais de 6 caracteres e conter pelo menos um carácter especial.");
      return;
    }

    toast.success("Password alterada com sucesso!");
    setNovaPassword("");
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
    if (username === "CA127") {
      toast.warn("O utilizador CA127 não pode ser removido.");
      return;
    }
    if (username === user.username) {
      toast.warn("Você não pode remover a si mesmo.");
      return;
    }

    toast.warn(
      <div>
        <div>Tem certeza que deseja remover este utilizador?</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={async () => {
              try {
                const { error } = await supabase.from("users").delete().eq("username", username);
                if (error) {
                  toast.error("Erro ao remover utilizador.");
                  console.error(error);
                  return;
                }
                setUsers((u) => u.filter((user) => user.username !== username));
                toast.success("Utilizador removido com sucesso!");
              } catch (error) {
                toast.error("Erro ao remover utilizador.");
                console.error(error);
              }
              toast.dismiss();
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
            onClick={() => toast.dismiss()}
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
    setUser({ loggedIn: false });
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
        toast.error("Erro ao atualizar tipo.");
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

      toast.success("Tipo atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar tipo.");
    }
  };

  const secoesMenu = user.isAdmin
    ? [
        { id: "alterarPassword", label: "Alterar Password" },
        { id: "alterarSeccao", label: "Alterar Secção" },
        { id: "utilizadoresRegistados", label: "Utilizadores Registados" },
        { id: "adicionarUtilizador", label: "Adicionar Utilizador" },
        { id: "emailsNotificacao", label: "Emails de Notificação" }, // NOVO
      ]
    : [
        { id: "alterarPassword", label: "Alterar Password" },
        { id: "alterarSeccao", label: "Alterar Secção" },
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
        {seccaoAtiva === "alterarPassword" && (
          <section>
            <h2>Alterar Password</h2>
            <div className="form-group">
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
          </section>
        )}

        {seccaoAtiva === "alterarSeccao" && (
          <section>
            <h2>Alterar Secção</h2>
            <div className="form-group">
              <select
                value={novaSeccao}
                onChange={(e) => setNovaSeccao(e.target.value)}
                className="select-field"
              >
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
            <ul className="user-list">
            {users
              .filter((u) => u.username !== "admin") // manténs este filtro para não mostrar "admin" na lista normal
              .map((u) => {
                const podeEditar = 
                  (user.username === "CA127" || user.username === "admin") && // se o user logado é CA127 ou admin
                  u.username !== "CA127"; // mas não pode editar CA127
                
                return (
                  <li key={u.username} className="user-list-item">
                    <div className="user-info">
                      <b>{u.username}</b>{" "}
                      {edicoesTipo[u.username] !== undefined ? (
                        <>
                          <select
                            value={edicoesTipo[u.username]}
                            onChange={(e) =>
                              setEdicoesTipo((prev) => ({
                                ...prev,
                                [u.username]: e.target.value,
                              }))
                            }
                            className="select-field"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            onClick={() => handleSalvarTipo(u.username)}
                            className="btn btn-adicionar"
                            style={{ marginLeft: "10px" }}
                          >
                            💾
                          </button>
                          <button
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
                          ({u.tipo}) - {u.nome}
                        </>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                      {/* Mostrar botão editar para CA127 e admin para qualquer user, exceto CA127 */}
                      {podeEditar && !edicoesTipo[u.username] && (
                        <button
                          onClick={() =>
                            setEdicoesTipo((prev) => ({
                              ...prev,
                              [u.username]: u.tipo,
                            }))
                          }
                          className="btn btn-adicionar"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Botão remover só aparece se não for CA127 e nem o próprio user */}
                      {u.username !== "CA127" && u.username !== user.username ? (
                        <button
                          onClick={() => handleRemoveUser(u.username)}
                          className="btn btn-remover"
                        >
                          🗑️
                        </button>
                      ) : (
                        <span className="disabled-remover">(Não pode remover)</span>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
          </section>
        )}

        {user.isAdmin && seccaoAtiva === "adicionarUtilizador" && (
          <section>
            <h2>Adicionar Utilizador</h2>
            <div className="form-group">
              <input
                placeholder="Username"
                value={usernameNovoUtilizador}
                onChange={(e) => setUsernameNovoUtilizador(e.target.value)}
                className="input-field"
              />
              <input
                type="password"
                placeholder="Password"
                value={passwordNovoUtilizador}
                onChange={(e) => setPasswordNovoUtilizador(e.target.value)}
                className="input-field"
              />
              <input
                placeholder="Nome"
                value={nomeNovoUtilizador}
                onChange={(e) => setNomeNovoUtilizador(e.target.value)}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Email"
                value={emailNovoUtilizador}
                onChange={(e) => setEmailNovoUtilizador(e.target.value)}
                className="input-field"
              />
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
              <select
                value={tipoNovoUtilizador}
                onChange={(e) => setTipoNovoUtilizador(e.target.value)}
                className="select-field"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
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
                      <button
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
