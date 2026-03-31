import React, { createContext, useState, useEffect } from 'react';
import { getInventory } from '../api/api';

export const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener sucursales al montar el componente
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        console.log("aahh")
        const inventory = await getInventory();
        console.log("inventarios",inventory)
        setBranches(inventory);
        console.log("primera sucursal",inventory[0])
        // Seleccionar la primera sucursal por defecto
        if (inventory.length > 0) {
          const savedBranch = localStorage.getItem("selectedBranch");
          const branchToSelect = savedBranch 
            ? inventory.find(b => b.nombreInventario === savedBranch) || inventory[0]
            : inventory[0];

            console.log("sucursal a seleccionar",branchToSelect)
          setSelectedBranch(branchToSelect);
        }
      } catch (err) {
        console.error("Error cargando sucursales:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);
 

  // Guardar sucursal seleccionada en localStorage
  const changeBranch = (branchName) => {
    const branch = branches.find(b => b.nombreInventario === branchName);
    if (branch) {
      setSelectedBranch(branch);
      localStorage.setItem("selectedBranch", branchName);
    }
  };

  const value = {
    branches,
    selectedBranch,
    changeBranch,
    loading,
    error,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}
