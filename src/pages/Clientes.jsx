import React, { useState, useMemo, useEffect } from 'react';
import { createCliente, updateCliente, deleteCliente, getClientes } from '../api/api';
import '../styles/inventory.css';

const initialClientes = [
    { nit: '1234567', nombre: 'Juan Pérez', telefono: '555-1234', direccion: 'Buenos ' },
    { nit: '9876543', nombre: 'Ana López', telefono: '555-5678', direccion: 'Zona 10' },
    { nit: '5555555', nombre: 'Carlos Ruiz', telefono: '555-9999', direccion: 'Zona 4' },
];

const Clientes = () => {
    const [clientes, setClientes] = useState(initialClientes);
    const [inputValue, setInputValue] = useState("");
    const [filterField, setFilterField] = useState("nit");
    const [modalShow, setModalShow] = useState(false);
    const [clienteEdit, setClienteEdit] = useState(null);

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
        getClientes()
            .then(data => setClientes(data))
            .catch(err => console.error(err));
    }, []);


    // Abrir modal para crear o editar
    const handleOpenModal = (cliente = null) => {
        setClienteEdit(cliente);
        setModalShow(true);
    };

    // Guardar cliente
    const handleSaveCliente = async (nuevoCliente) => {
        if (clienteEdit) {
            // Editar
            setClientes(prev => prev.map(c => c.nit === clienteEdit.nit ? nuevoCliente : c));
        } else {
            // Crear
            setClientes(prev => [...prev, nuevoCliente]);

            console.log(nuevoCliente)
            try {
                const clienteCreado = await createCliente(nuevoCliente)
                console.log("ClienteCreadoCorrectamente ", clienteCreado)
            } catch (err) {
                const mensajeLimpio = err.message?.split('Error: ').pop() || 'Error inesperado';
                //setError(mensajeLimpio)
                console.error("Ocurrio un error al crear su producto", err)
            }


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
                        <option value="nombre">Nombre</option>
                        <option value="telefono">Teléfono</option>
                        <option value="direccion">Dirección</option>
                    </select>
                    <button type="button" className="btn btn-secondary button-head" onClick={() => { setInputValue(""); setFilterField("nit"); }} >Limpiar</button>
                </div>
                <button type="button" className="btn btn-primary" style={{ height: "100%" }} onClick={() => handleOpenModal()} >Crear Cliente</button>
            </div>
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>#</th>
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
                            <td>{idx + 1}</td>
                            <td>{el.nit}</td>
                            <td>{el.nombre}</td>
                            <td>{el.telefono}</td>
                            <td>{el.direccion}</td>
                            <td>
                                <button className="btn btn-outline-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => handleOpenModal(el)}>Editar</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCliente(el.nit)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
    const [form, setForm] = useState(cliente || { nit: '', nombre: '', telefono: '', direccion: '' });

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = e => {
        e.preventDefault();
        if (!form.nit || !form.nombre) return;
        onSave(form);
    };

    if (!show) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 30, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <h4>{cliente ? 'Editar Cliente' : 'Crear Cliente'}</h4>
                <div className="mb-3">
                    <label>NIT</label>
                    <input type="number" name="nit" value={form.nit} onChange={handleChange} className="form-control no-spin" required />
                </div>
                <div className="mb-3">
                    <label>Nombre</label>
                    <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="form-control" required />
                </div>
                <div className="mb-3">
                    <label>Teléfono</label>
                    <input type="number" name="telefono" value={form.telefono} onChange={handleChange} className="form-control no-spin" />
                </div>
                <div className="mb-3">
                    <label>Dirección</label>
                    <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className="form-control" />
                </div>
                <div style={{ textAlign: 'right', marginTop: 18 }}>
                    <button type="button" className="btn btn-secondary" style={{ marginRight: 8 }} onClick={onHide}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    );
}

export default Clientes;