import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logoSinFondo.png';
import '../styles/login.css';
import { BranchContext } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext'; // + NUEVO

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshBranches } = useContext(BranchContext);
  const { login } = useAuth(); // + NUEVO

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;

      let response;
      try {
        response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, contrasena: password }),
          signal: AbortSignal.timeout(8000),
        });
      } catch (networkErr) {
        
        if (networkErr.name === 'TimeoutError') {
          throw new Error('TIMEOUT');
        }
        throw new Error('NETWORK');
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (!response.ok) {
        throw new Error('SERVER_ERROR');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', username);
      login(data.token, username); // + NUEVO: setea el rol en el contexto
      refreshBranches();
      navigate('/Inventory');

    } catch (err) {
      const messages = {
        NETWORK:           'No se pudo conectar al servidor. Verifica tu conexión a internet.',
        TIMEOUT:           'El servidor tardó demasiado en responder. Intenta de nuevo.',
        INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
        SERVER_ERROR:      'Error interno del servidor. Intenta más tarde.',
      };

      setError(messages[err.message] ?? 'Ocurrió un error inesperado. Intenta de nuevo.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo-section">
          <img src={logo} alt="AP Volk's Logo" className="login-logo" />
        </div>

        {/* Título */}
        <h1 className="login-title">Bienvenido</h1>
        <p className="login-subtitle">Ap Volks</p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              type="username"
              placeholder=""
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          {/* Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Footer */}
        {/* <div className="login-footer">
          <p>¿Olvidaste tu contraseña?</p>
          <a href="#" className="forgot-password-link">Recuperar</a>
        </div> */}
      </div>

      {/* Background decorativo */}
      <div className="background-decoration"></div>
    </div>
  );
}