import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BranchContext } from '../context/BranchContext';

export function BranchSelector() {
  const { branches, selectedBranch, changeBranch, loading } = useContext(BranchContext);
  const [showModal, setShowModal] = useState(false);
  const [tempBranch, setTempBranch] = useState(selectedBranch?.nombreInventario || "");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  if (loading) {
    return <Container>Cargando sucursales...</Container>;
  }

  if (!branches || branches.length === 0) {
    return <Container>Sin sucursales disponibles</Container>;
  }

  const handleOpenModal = () => {
    setTempBranch(selectedBranch?.nombreInventario || "");
    setShowModal(true);
  };

  const handleChangeBranch = () => {
    changeBranch(tempBranch);
    setShowModal(false);
    navigate('/Inventory');
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Container>
        <LeftSection>
          <UserInfo>
            <Label>Usuario:</Label>
            <Value>{user.nombre || user.email || "Usuario"}</Value>
          </UserInfo>
        </LeftSection>

        <RightSection>
          <BranchInfo>
            <Label>Sucursal actual:</Label>
            <Value>{selectedBranch?.nombreInventario || "Sin seleccionar"}</Value>
          </BranchInfo>

          <ChangeButton onClick={handleOpenModal}>
            Cambiar sucursal
          </ChangeButton>
        </RightSection>
      </Container>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Cambiar sucursal</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              <SelectLabel>Selecciona una sucursal:</SelectLabel>
              <ModalSelect 
                value={tempBranch} 
                onChange={(e) => setTempBranch(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {branches.map((branch) => (
                  <option key={branch.nombreInventario} value={branch.nombreInventario}>
                    {branch.nombreInventario}
                  </option>
                ))}
              </ModalSelect>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={handleCloseModal}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleChangeBranch} disabled={!tempBranch}>
                Cambiar
              </ConfirmButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: ${({ theme }) => theme.bg2 || '#f5f5f5'};
  border-bottom: 2px solid ${({ theme }) => theme.bg3 || '#ddd'};
  gap: 30px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: ${({ theme }) => theme.bg || 'white'};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bg3 || '#ddd'};
`;

const BranchInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: ${({ theme }) => theme.bg || 'white'};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bg3 || '#ddd'};
`;

const SelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#666'};
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Value = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.text || '#000'};
  font-size: 14px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 2px solid ${({ theme }) => theme.bg3 || '#ddd'};
  border-radius: 6px;
  background: white;
  color: ${({ theme }) => theme.text || '#000'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 160px;
  font-weight: 500;

  &:hover {
    border-color: ${({ theme }) => theme.bg4 || '#999'};
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ChangeButton = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const SelectLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
`;

const ModalSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #111827;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  box-sizing: border-box;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #e5e7eb;
  color: #111827;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #d1d5db;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;
