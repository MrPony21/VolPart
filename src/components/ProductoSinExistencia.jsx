import React from 'react';
import Modal from "react-bootstrap/Modal";
import "../styles/ProductoNoEncontrado.css";
import { IoMdAlert, IoMdWarning } from "react-icons/io";
import { useNavigate } from 'react-router-dom';

const ProductoSinExistencia = ({ show, onHide, producto }) => {
  const navigate = useNavigate()

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size='lg'
    >
      <Modal.Title>
        <div className="header">
          <IoMdWarning className="icon" color='orange' />
          <p className="alert">
            El producto <strong>{producto?.upc}</strong> existe pero no cuenta con existencias en este inventario.
          </p>
        </div>
      </Modal.Title>
      <Modal.Body>
        <div className="card">

          <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
            <h6 style={{ marginBottom: "15px", fontWeight: "bold" }}>Información del Producto:</h6>
            <table style={{ width: "100%", fontSize: "14px" }}>
              <tbody>
                <tr>
                  <td style={{ paddingBottom: "8px", fontWeight: "500" }}>Código:</td>
                  <td style={{ paddingBottom: "8px" }}>{producto?.codigoProducto}</td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px", fontWeight: "500" }}>Nombre:</td>
                  <td style={{ paddingBottom: "8px" }}>{producto?.nombreProducto}</td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px", fontWeight: "500" }}>UPC:</td>
                  <td style={{ paddingBottom: "8px" }}>{producto?.upc}</td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px", fontWeight: "500" }}>Marca:</td>
                  <td style={{ paddingBottom: "8px" }}>{producto?.marca}</td>
                </tr>
              </tbody>
            </table>
          </div>

           <div className="message-div">
            <p className="message">
                ¿Desea registrar existencias para este producto en el inventario?
            </p>
          </div>

          <div className="actions">
            <a className="read" onClick={() => navigate("/CrearProducto", {state: {producto: producto, productoExistente: true}})}>
              Registrar existencias
            </a>
            <a
              className="mark-as-read"
              onClick={onHide}
              style={{ cursor: "pointer" }}
            >
              Volver
            </a>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductoSinExistencia;
