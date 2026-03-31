import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logoSinFondo.png';
import '../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Aquí integra tu API de login
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, contrasena: password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', username);
      navigate('/inventory');
    } catch (err) {
        setError('Hubo un problema al iniciar sesion, verifica tus credenciales e intenta de nuevo');
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
              placeholder="Nombre de usuario"
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
              placeholder="••••••••"
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
