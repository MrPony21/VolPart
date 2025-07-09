import React from 'react';
import styled from 'styled-components';
import Modal from "react-bootstrap/Modal";
import "../styles/ProductoNoEncontrado.css";
import { IoMdAlert } from "react-icons/io";
import { useNavigate } from 'react-router-dom';

const ProductoNoEncontrado = ({ show, onHide, codigo }) => {
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
          <IoMdAlert className="icon" />
          <p className="alert">
            No se encontró ningún producto con el código: <strong>{codigo}</strong>.
          </p>
        </div>
      </Modal.Title>
      <Modal.Body>
        <div className="card">
          <div className="message-div">
            <p className="message">
              ¿Desea registrar un nuevo producto en el inventario?
            </p>
          </div>
          <div className="actions">
            <a className="read" onClick={() => navigate("/CrearProducto", {state: {codigo: codigo }})}>
              Registrar producto
            </a>
            <a
              className="mark-as-read"
              onClick={onHide}
              style={{ cursor: "pointer" }}
              href="#"
            >
              Volver
            </a>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductoNoEncontrado;
