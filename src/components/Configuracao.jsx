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

  const [seccaoAtiva, setSeccaoAtiva] = useState("alterarPassword");

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/");
    }
  }, [user, navigate]);

  const validarPassword = (password) => {
    const temTamanhoValido = password.length > 6;
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return temTamanhoValido && temEspecial;
  };

  const validarEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const secoesMenu = user.isAdmin
    ? [
        { id: "alterarPassword", label: "Alterar Password" },
        { id: "alterarSeccao", label: "Alterar Seccao" },
        { id: "utilizadoresRegistados", label: "Utilizadores Registados" },
        { id: "adicionarUtilizador", label: "Adicionar Utilizador" },
      ]
    : [
        { id: "alterarPassword", label: "Alterar Password" },
        { id: "alterarSeccao", label: "Alterar Seccao" },
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
            <h2>Alterar Seccao</h2>
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
                .filter((u) => u.username !== "admin") // filtra o "admin"
                .map((u) => (
                  <li key={u.username} className="user-list-item">
                    <div className="user-info">
                      <b>{u.username}</b> ({u.tipo}) - {u.nome}
                    </div>
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
                  </li>
                ))}
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
