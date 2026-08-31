import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Modal from "react-bootstrap/Modal";
import { obtenerUsuarios, actualizarUsuario, getRoles } from '../api/api';
import "../styles/inventory.css"

const Usuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  // El error del modal va aparte: el Alert de la pagina queda tapado por el
  // backdrop y el usuario nunca se entera de por que fallo.
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [usuarioEditado, setUsuarioEditado] = useState({
    NombreUsuario: "",
    contrasena: "",
    CodigoRol: ""
  });

  // Cargar usuarios y roles al montar
  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      setLoadingRoles(true);
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error("Error al cargar roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const abrirEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setUsuarioEditado({
      NombreUsuario: usuario.NombreUsuario,
      contrasena: "",
      CodigoRol: usuario.CodigoRol
    });
    setErrorModal("");
    setShowEditModal(true);
  };

  // Espeja las validaciones del backend para avisar antes de mandar la peticion
  const validarUsuario = () => {
    const nombre = usuarioEditado.NombreUsuario.trim();

    if (!nombre) return "El nombre de usuario es obligatorio.";
    if (nombre.includes(" ")) return "El nombre de usuario no puede contener espacios.";

    // El backend lo valida igual, pero asi el aviso es inmediato
    const nombreRepetido = usuarios.some(
      (u) =>
        u.CodigoUsuario !== usuarioSeleccionado?.CodigoUsuario &&
        u.NombreUsuario?.toLowerCase() === nombre.toLowerCase()
    );
    if (nombreRepetido) return "Ya existe un usuario con ese nombre.";

    if (!usuarioEditado.CodigoRol || Number(usuarioEditado.CodigoRol) === 0) {
      return "Selecciona un rol para el usuario.";
    }

    // Vacia significa "no cambiarla"; si viene, debe cumplir el minimo del backend
    if (usuarioEditado.contrasena && usuarioEditado.contrasena.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }

    return null;
  };

  const guardarCambios = async () => {
    const mensajeValidacion = validarUsuario();
    if (mensajeValidacion) {
      setErrorModal(mensajeValidacion);
      return;
    }

    try {
      setGuardando(true);
      const payloadActualizacion = {
        NombreUsuario: usuarioEditado.NombreUsuario.trim(),
        CodigoRol: Number(usuarioEditado.CodigoRol)
      };

      // Solo incluir contraseña si se proporciona
      if (usuarioEditado.contrasena) {
        payloadActualizacion.contrasena = usuarioEditado.contrasena;
      }

      await actualizarUsuario(usuarioSeleccionado.CodigoUsuario, payloadActualizacion);
      setShowEditModal(false);
      setErrorModal("");
      cargarUsuarios();
      setError("");
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      // El backend manda el detalle real; antes se descartaba y se mostraba
      // siempre el mismo texto generico.
      setErrorModal(err.message || "No se pudo actualizar el usuario.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirEliminarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarUsuario(usuarioSeleccionado.CodigoUsuario);
      setShowDeleteModal(false);
      cargarUsuarios();
      setError("");
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setError("Error al eliminar el usuario.");
    }
  };

  const getRolColor = (rolNombre) => {
    switch (rolNombre?.toLowerCase()) {
      case "admin":
        return "#dc3545"; // rojo
      case "gerente":
        return "#ffc107"; // amarillo
      case "vendedor":
        return "#28a745"; // verde
      default:
        return "#6c757d"; // gris
    }
  };

  return (
    <>
      <h1 style={{ margin: "20px" }}>Gestionar Usuarios</h1>

      {error && (
        <Alert variant="filled" severity="error" style={{ margin: "20px" }}>
          {error}
        </Alert>
      )}

      <div className='div-hbusqueda'>
        <div className='busqueda'>
          <input
            className="form-control mb-3"
            placeholder="Buscar por nombre de usuario"
            style={{ width: "40%", height: "100%" }}
          />
        </div>
        <button 
          type="button" 
          className="btn btn-primary" 
          style={{ height: "100%" }} 
          onClick={() => navigate("/CrearUsuario")}
        >
          Crear Usuario
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <Alert variant="filled" severity="info" style={{ margin: "20px" }}>
          No hay usuarios registrados aún.
        </Alert>
      ) : (
        <div className="table-responsive" style={{marginTop: "50px"}}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.CodigoUsuario}>
                  <td data-label="Código:">{usuario.CodigoUsuario}</td>
                  <td data-label="Usuario:">{usuario.NombreUsuario}</td>
                  <td data-label="Rol:">
                    <span
                      style={{
                        backgroundColor: getRolColor(usuario.NombreRol),
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {usuario.NombreRol}
                    </span>
                  </td>
                  <td data-label="Acciones:">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => abrirEditarUsuario(usuario)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para editar usuario */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioSeleccionado && (
            <div>
              {errorModal && (
                <Alert variant="filled" severity="error" style={{ marginBottom: 16 }}>
                  {errorModal}
                </Alert>
              )}
              <div className="mb-3">
                <label className="form-label">Nombre de Usuario:</label>
                <input
                  type="text"
                  className="form-control"
                  value={usuarioEditado.NombreUsuario}
                  onChange={(e) => {
                    const sinEspacios = e.target.value.replace(/\s/g, "");
                    setUsuarioEditado({ ...usuarioEditado, NombreUsuario: sinEspacios });
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña (dejar vacío para no cambiar):</label>
                <input
                  type="password"
                  className="form-control"
                  value={usuarioEditado.contrasena}
                  onChange={(e) => setUsuarioEditado({ ...usuarioEditado, contrasena: e.target.value })}
                  placeholder="Ingresa nueva contraseña si deseas cambiarla"
                />
                <small className="text-muted">Mínimo 8 caracteres.</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Rol:</label>
                <select
                  className="form-control"
                  value={usuarioEditado.CodigoRol}
                  onChange={(e) => setUsuarioEditado({ ...usuarioEditado, CodigoRol: e.target.value })}
                  disabled={loadingRoles}
                >
                  <option value="">
                    {loadingRoles ? "Cargando roles..." : "Selecciona un rol"}
                  </option>
                  {roles.map((role) => (
                    <option key={role.CodigoRol} value={role.CodigoRol}>
                      {role.NombreRol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={guardarCambios} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal para eliminar usuario */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioSeleccionado && (
            <div className="alert alert-danger" role="alert">
              ¿Estás seguro de que deseas eliminar el usuario <strong>{usuarioSeleccionado.NombreUsuario}</strong>?
              <br />
              <small>Esta acción no se puede deshacer.</small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={confirmarEliminar}>
            Eliminar
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Usuarios;
