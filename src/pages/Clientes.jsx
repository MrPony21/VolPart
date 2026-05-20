import React, { useState, useMemo, useEffect } from 'react';
import { createCliente, updateCliente, deleteCliente, getClientes } from '../api/api';
import { exportarClientesExcel } from '../tools/exportExcel';
import Alert from '@mui/material/Alert';
import '../styles/inventory.css';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [filterField, setFilterField] = useState("nit");
    const [modalShow, setModalShow] = useState(false);
    const [clienteEdit, setClienteEdit] = useState(null);
    const [error, setError] = useState("");

    // Filtrar clientes
    const filteredClientes = useMemo(() => {
        if (inputValue.trim() === "") return clientes;
        const criterio = inputValue.trim().toLowerCase();
        return clientes.filter(c => {
            const valorCampo = String(c[filterField] ?? "").toLowerCase();
            return valorCampo.includes(criterio);
        });
    }, [clientes, filterField, inputValue]);

    useEffect(() => {
        obtenerClientes();
    }, []);

    const obtenerClientes = () => {
        getClientes()
            .then(data => setClientes(data))
            .catch(err => console.error(err));
    }


    // Abrir modal para crear o editar
    const handleOpenModal = (cliente = null) => {
        setClienteEdit(cliente);
        setModalShow(true);
    };

    // Guardar cliente
    const handleSaveCliente = async (nuevoCliente) => {
        const payload = {
            nombreCliente: nuevoCliente.nombreCliente,
            nit: nuevoCliente.nit,
            telefono: nuevoCliente.telefono,
            direccion: nuevoCliente.direccion
        };

        try {
            if (clienteEdit) {
                // Editar
                setClientes(prev => prev.map(c => c.nit === clienteEdit.nit ? nuevoCliente : c));
                const clienteActualizado = await updateCliente(clienteEdit.codigoCliente, payload);
                console.log("ClienteActualizadoCorrectamente ", clienteActualizado);
                obtenerClientes();
                setError("");
            } else {
                // Crear
                setClientes(prev => [...prev, nuevoCliente]);
                const clienteCreado = await createCliente(payload);
                console.log("ClienteCreadoCorrectamente ", clienteCreado);
                obtenerClientes();
                setError("");
            }
        } catch (err) {
            const mensajeLimpio = err.message?.split('Error: ').pop() || 'Error inesperado';
            setError(mensajeLimpio);
            console.error("Ocurrió un error al guardar el cliente", err);
            // Revertir cambios si hubo error
            obtenerClientes();
        }
        setModalShow(false);
        setClienteEdit(null);
    };

    // Eliminar cliente
    const handleDeleteCliente = (nit) => {
        setClientes(prev => prev.filter(c => c.nit !== nit));
    };

    return (
        <div style={{ padding: 30 }}>
            <h1 style={{ margin: "20px" }}>Clientes</h1>
            {error && (
                <Alert variant="filled" severity="error" style={{ marginBottom: 20 }}>
                    {error}
                </Alert>
            )}
            <div className='div-hbusqueda'>
                <div className='busqueda'>
                    <input
                        className="form-control mb-3"
                        placeholder="Buscar"
                        style={{ width: "40%", height: "100%" }}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                    />
                    <select className="form-select selectInventory" value={filterField} onChange={e => setFilterField(e.target.value)}>
                        <option value="nit">NIT</option>
                        <option value="nombreCliente">Nombre</option>
                        <option value="telefono">Teléfono</option>
                        <option value="direccion">Dirección</option>
                    </select>
                    <button type="button" className="btn btn-secondary button-head" onClick={() => { setInputValue(""); setFilterField("nit"); }} >Limpiar</button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-success" style={{ height: "100%" }}
                    onClick={() => exportarClientesExcel(clientes)}
                  >Exportar Excel</button>
                  <button type="button" className="btn btn-primary" style={{ height: "100%" }} onClick={() => handleOpenModal()} >Crear Cliente</button>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>NIT</th>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClientes.map((el, idx) => (
                            <tr key={el.nit}>
                                <td data-label="Código:">{el.codigoCliente}</td>
                                <td data-label="NIT:">{el.nit}</td>
                                <td data-label="Nombre:">{el.nombreCliente}</td>
                                <td data-label="Teléfono:">{el.telefono}</td>
                                <td data-label="Dirección:">{el.direccion}</td>
                                <td data-label="Acciones:">
                                    <button className="btn btn-outline-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => handleOpenModal(el)}>Editar</button>
                                    {/* <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCliente(el.nit)}>Eliminar</button> */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {modalShow && (
                <ClienteModal
                    show={modalShow}
                    cliente={clienteEdit}
                    onSave={handleSaveCliente}
                    onHide={() => { setModalShow(false); setClienteEdit(null); }}
                />
            )}
        </div>
    );
};

// Modal para crear/editar cliente
function ClienteModal({ show, cliente, onSave, onHide }) {
    const [form, setForm] = useState(cliente || { nit: '', nombreCliente: '', telefono: '', direccion: '' });
    const [error, setError] = useState("");

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError(""); // Limpiar error al editar un campo
    };

    const handleSubmit = e => {
        e.preventDefault();
        if (!form.nit || !form.nombreCliente || !form.telefono || !form.direccion) {
            setError("Todos los campos deben estar completos para avanzar");
            return;
        }
        onSave(form);
    };

    if (!show) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 30, borderRadius: 8, width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ marginTop: 0 }}>{cliente ? 'Editar Cliente' : 'Crear Cliente'}</h4>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {error && (
                        <Alert variant="filled" severity="error" style={{ marginBottom: 20 }}>
                            {error}
                        </Alert>
                    )}
                    <div className="mb-3">
                        <label>NIT</label>
                        <input type="number" name="nit" value={form.nit} onChange={handleChange} className="form-control no-spin" required />
                    </div>
                    <div className="mb-3">
                        <label>Nombre</label>
                        <input type="text" name="nombreCliente" value={form.nombreCliente} onChange={handleChange} className="form-control" required />
                    </div>
                    <div className="mb-3">
                        <label>Teléfono</label>
                        <input type="number" name="telefono" value={form.telefono} onChange={handleChange} className="form-control no-spin" />
                    </div>
                    <div className="mb-3">
                        <label>Dirección</label>
                        <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className="form-control" />
                    </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: 18, borderTop: '1px solid #eee', paddingTop: 18 }}>
                    <button type="button" className="btn btn-secondary" style={{ marginRight: 8 }} onClick={onHide}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">{cliente ? "Guardar" : "Crear"}</button>
                </div>
            </form>
        </div>
    );
}

export default Clientes;