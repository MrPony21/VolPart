import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function resolverRol(codigoRol) {
  const roles = { 1: "ADMIN", 2: "OPERADOR" };
  return roles[codigoRol] ?? null;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // ← clave: empieza en true

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJWT(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({
          username: payload.NombreUsuario,
          rol: resolverRol(payload.CodigoRol),
        });
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false); // ← solo después de verificar el token
  }, []);

  const login = (token) => {
    const payload = decodeJWT(token);
    localStorage.setItem("token", token);
    setUser({
      username: payload?.NombreUsuario,
      rol: resolverRol(payload?.CodigoRol),
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("selectedBranch");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}