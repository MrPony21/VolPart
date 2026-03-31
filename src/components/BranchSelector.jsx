import React, { useContext } from 'react';
import styled from 'styled-components';
import { BranchContext } from '../context/BranchContext';

export function BranchSelector() {
  const { branches, selectedBranch, changeBranch, loading } = useContext(BranchContext);
  const user = JSON.parse(localStorage.getItem("user")) || {};


  if (loading) {
    return <Container>Cargando sucursales...</Container>;
  }

  if (!branches || branches.length === 0) {
    return <Container>Sin sucursales disponibles</Container>;
  }

  return (
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

        <SelectContainer>
          <Label>Cambiar a:</Label>
          <Select 
            value={selectedBranch?.nombreInventario || ""} 
            onChange={(e) => changeBranch(e.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.nombreInventario} value={branch.nombreInventario}>
                {branch.nombreInventario}
              </option>
            ))}
          </Select>
        </SelectContainer>
      </RightSection>
    </Container>
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
