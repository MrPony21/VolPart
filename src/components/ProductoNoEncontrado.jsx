import React from 'react';
import styled from 'styled-components';
import Modal from "react-bootstrap/Modal";

const ProductoNoEncontrado = ( {show, onHide} ) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
    <StyledWrapper>
      <div className="card">
        <div className="header">
          <span className="icon">
            <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" fillRule="evenodd" />
            </svg>
          </span>
          <p className="alert">New message!</p>
        </div>
        <p className="message">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam ea quo unde
          vel adipisci blanditiis voluptates eum. Nam, cum minima?
        </p>
        <div className="actions">
          <a className="read" href>
            Take a Look
          </a>
          <a className="mark-as-read" onClick={onHide} style={{cursor: "pointer"}}  href>
            Mark as Read
          </a>
        </div>
      </div>
    </StyledWrapper>
     </Modal>
  );
}

const StyledWrapper = styled.div`
  .card {
    width: 100%
    border-width: 1px;
    border-color: rgba(219, 234, 254, 1);
    border-radius: 1rem;
    background-color: rgba(255, 255, 255, 1);
    padding: 1rem;
  }

  .header {
    display: flex;
    align-items: center;
    grid-gap: 1rem;
    gap: 1rem;
  }

  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background-color: rgba(96, 165, 250, 1);
    padding: 0.5rem;
    color: rgba(255, 255, 255, 1);
  }

  .icon svg {
    height: 1rem;
    width: 1rem;
  }

  .alert {
    font-weight: 600;
    color: rgba(107, 114, 128, 1);
  }

  .message {
    margin-top: 1rem;
    color: rgba(107, 114, 128, 1);
  }

  .actions {
    margin-top: 1.5rem;
  }

  .actions a {
    text-decoration: none;
  }

  .mark-as-read, .read {
    display: inline-block;
    border-radius: 0.5rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
  }

  .read {
    background-color: rgba(59, 130, 246, 1);
    color: rgba(255, 255, 255, 1);
  }

  .mark-as-read {
    margin-top: 0.5rem;
    background-color: rgba(249, 250, 251, 1);
    color: rgba(107, 114, 128, 1);
    transition: all .15s ease;
  }

  .mark-as-read:hover {
    background-color: rgb(230, 231, 233);
  }`;

export default ProductoNoEncontrado;
