import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { registrarUsuario, getRoles } from '../api/api';
import "../styles/CrearProducto.css"

const RegistrarUsuarios = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    const [usuario, setUsuario] = useState({
        nombre: "",
        password: "",
        confirmarPassword: "",
        rol: "" 
    });

    useEffect(() => {
        const cargarRoles = async () => {
            try {
                const rolesData = await getRoles();
                console.log(rolesData)
                setRoles(rolesData);
                // Establecer el primer rol como predeterminado
                if (rolesData.length > 0) {
                    setUsuario(prev => ({ ...prev, rol: rolesData[0].CodigoRol }));
                }
            } catch (err) {
                console.error("Error al cargar roles:", err);
                setError("No se pudieron cargar los roles disponibles");
            } finally {
                setRolesLoading(false);
            }
        };

        cargarRoles();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Remover espacios automáticamente del nombre de usuario
        if (name === "nombre") {
            const sinEspacios = value.replace(/\s/g, "");
            setUsuario(prev => ({ ...prev, [name]: sinEspacios }));
        } else {
            setUsuario(prev => ({ ...prev, [name]: value }));
        }
    };

    const validarCampos = () => {
        if (!usuario.nombre || !usuario.password || !usuario.confirmarPassword) {
            return "Todos los campos son obligatorios.";
        }

        if (usuario.nombre.trim().length < 3) {
            return "El nombre debe tener al menos 3 caracteres.";
        }

        if (usuario.nombre.includes(" ")) {
            return "El nombre de usuario no puede contener espacios.";
        }

        if (usuario.password.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres.";
        }

        if (usuario.password !== usuario.confirmarPassword) {
            return "Las contraseñas no coinciden.";
        }

        return null;
    };

    const registrar = async () => {
        setError("");
        setSuccess("");

        const mensajeValidacion = validarCampos();
        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        const usuarioData = {
            nombre: usuario.nombre.trim(),
            password: usuario.password,
            rol: usuario.rol
        };

        try {
            const resultado = await registrarUsuario(usuarioData);
            setSuccess(`Usuario "${usuario.nombre}" registrado correctamente.`);
            
            const rolPorDefecto = roles.length > 0 ? roles[0].CodigoRol : "";
            setUsuario({
                nombre: "",
                password: "",
                confirmarPassword: "",
                rol: rolPorDefecto
            });

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate("/Usuarios");
            }, 2000);
        } catch (err) {
            const mensajeLimpio = err.message?.split('Error: ').pop() || 'Error inesperado al registrar usuario';
            setError(mensajeLimpio);
            console.error("Error al registrar usuario:", err);
        }
    };

    const limpiarFormulario = () => {
        const rolPorDefecto = roles.length > 0 ? roles[0].CodigoRol : "";
        setUsuario({
            nombre: "",
            password: "",
            confirmarPassword: "",
            rol: rolPorDefecto
        });
        setError("");
        setSuccess("");
    };

    return (
        <div style={{ padding: 20 }}>
            <div className="header-tab">
                <h2>Crear Usuario</h2>
                <div className='button-regresar'>
                    <button className="btn btn-primary regresar-buttom" onClick={() => navigate("/Usuarios")}>Regresar</button>
                </div>
            </div>

            {error && (
                <Alert variant="filled" severity="error" style={{ marginBottom: 15 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="filled" severity="success" style={{ marginBottom: 15 }}>
                    {success}
                </Alert>
            )}

            <div style={{ maxWidth: 600 }}>
                {/* Información del Usuario */}
                <h4 style={{ marginTop: 20, marginBottom: 15, borderBottom: "2px solid #007bff", paddingBottom: 10, color: "#333" }}>
                    Datos del Usuario
                </h4>

                <div>
                    <label>Nombre:</label>
                    <input
                        className='form-control mb-2'
                        type="text"
                        name="nombre"
                        value={usuario.nombre}
                        onChange={handleChange}
                    />
                </div>

                {/* Información de Seguridad */}
                <h4 style={{ marginTop: 25, marginBottom: 15, borderBottom: "2px solid #28a745", paddingBottom: 10, color: "#333" }}>
                    Información de Seguridad
                </h4>

                <div>
                    <label>Contraseña:</label>
                    <input
                        className='form-control mb-2'
                        type="password"
                        name="password"
                        value={usuario.password}
                        onChange={handleChange}
                        placeholder=""
                    />
                </div>

                <div>
                    <label>Confirmar Contraseña:</label>
                    <input
                        className='form-control mb-2'
                        type="password"
                        name="confirmarPassword"
                        value={usuario.confirmarPassword}
                        onChange={handleChange}
                        placeholder="Repite contraseña"
                    />
                </div>

                {/* Rol */}
                <h4 style={{ marginTop: 25, marginBottom: 15, borderBottom: "2px solid #ffc107", paddingBottom: 10, color: "#333" }}>
                    Rol
                </h4>

                <div>
                    <label>Rol:</label>
                    <select
                        className='form-control mb-2'
                        name="rol"
                        value={usuario.rol}
                        onChange={handleChange}
                        disabled={rolesLoading}
                    >
                        <option value="">
                            {rolesLoading ? "Cargando roles..." : "Selecciona un rol"}
                        </option>
                        {roles.map((role) => (
                            <option key={role.CodigoRol} value={role.CodigoRol}>
                                {role.NombreRol}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginTop: 30, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        className="btn btn-secondary"
                        onClick={limpiarFormulario}
                    >
                        Limpiar
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={registrar}
                    >
                        Registrar Usuario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrarUsuarios;
