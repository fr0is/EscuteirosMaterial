import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";  // Importando o toast e o ToastContainer
import "react-toastify/dist/ReactToastify.css";  // Importando os estilos do Toast
import "../styles/Configuracao.css";
import "../styles/utilities.css";
import "../styles/variables.css";

export default function Configuracao() {
  const { user, setUser, users, setUsers, adicionarUsuario, supabase } = useContext(AppContext);
  const navigate = useNavigate();

  const [novaPassword, setNovaPassword] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState(""); 
  const [novaSeccao, setNovaSeccao] = useState("Lobitos");
  const [novoTipo, setNovoTipo] = useState("user");

  const [secaoAtiva, setSecaoAtiva] = useState("alterarPassword");

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChangePassword = () => {
    if (!novaPassword.trim()) {
      toast.warn("Insira a nova password.");
      return;
    }
    toast.success("Password alterada com sucesso!");
    setNovaPassword("");
  };

  const handleAddUser = async () => {
    if (!novoUsername.trim() || !novoNome.trim() || !novaPassword.trim() || !novoEmail.trim()) {
      toast.warn("Preencha todos os campos.");
      return;
    }
    if (users.some((u) => u.username === novoUsername.trim())) {
      toast.warn("Username já existe.");
      return;
    }
    try {
      await adicionarUsuario({
        username: novoUsername.trim(),
        nome: novoNome.trim(),
        tipo: novoTipo,
        password: novaPassword.trim(),
        email: novoEmail.trim(), 
        seccao: novaSeccao.trim(),
      });
      setNovoUsername("");
      setNovoNome("");
      setNovaPassword("");
      setNovoEmail("");
      setNovaSeccao("Lobitos"); 
      setNovoTipo("user");
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
            toast.dismiss(); // Fecha o Toast após a ação
          }}
          style={{
            padding: '8px 15px',
            backgroundColor: 'var(--color-primary-dark)',  // A cor do botão "Sim"
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Sim
        </button>
        <button
          onClick={() => toast.dismiss()}  // Fecha o Toast ao clicar em "Não"
          style={{
            padding: '8px 15px',
            backgroundColor: 'var(--color-danger-dark)',  // A cor do botão "Não"
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
      autoClose: false,  // Não fecha automaticamente
      closeOnClick: false,  // Não fecha ao clicar
      draggable: false,  // Não é possível arrastar
      progress: undefined,  // Desabilita o progresso do Toast
    }
  );
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
        { id: "utilizadoresRegistados", label: "Utilizadores Registados" },
        { id: "adicionarUtilizador", label: "Adicionar Utilizador" },
      ]
    : [{ id: "alterarPassword", label: "Alterar Password" }];

  return (
    <div className="config-page">
      <nav className="sidebar-menu">
        <ul>
          {secoesMenu.map((secao) => (
            <li
              key={secao.id}
              className={secaoAtiva === secao.id ? "active" : ""}
              onClick={() => setSecaoAtiva(secao.id)}
            >
              {secao.label}
            </li>
          ))}
          <li className="logout-button" onClick={handleLogout}>Logout</li>
        </ul>
      </nav>

      <main className="content-area">
        {secaoAtiva === "alterarPassword" && (
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

        {user.isAdmin && secaoAtiva === "utilizadoresRegistados" && (
          <section>
            <h2>Utilizadores Registados</h2>
            <ul className="user-list">
              {users.map((u) => (
                <li key={u.username} className="user-list-item">
                  <div className="user-info">
                    <b>{u.username}</b> ({u.tipo}) - {u.nome}
                  </div>
                  {u.username !== "CA127" && u.username !== user.username ? (
                    <button
                      onClick={() => handleRemoveUser(u.username)}
                      className="btn btn-remover"
                    >
                      Remover
                    </button>
                  ) : (
                    <span className="disabled-remover">(Não pode remover)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {user.isAdmin && secaoAtiva === "adicionarUtilizador" && (
          <section>
            <h2>Adicionar Utilizador</h2>
            <div className="form-group">
              <input
                placeholder="Username"
                value={novoUsername}
                onChange={(e) => setNovoUsername(e.target.value)}
                className="input-field"
              />
              <input
                type="password"
                placeholder="Password"
                value={novaPassword}
                onChange={(e) => setNovaPassword(e.target.value)}
                className="input-field"
              />
              <input
                placeholder="Nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                className="input-field"
              />
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
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
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
