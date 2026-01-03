import React, { createContext, useState } from 'react';

type Material = Record<string, unknown> | null;

type MaterialsContextType = {
  materials: Material;
  setMaterials: React.Dispatch<React.SetStateAction<Material>>;
};

export const MaterialsContext = createContext<MaterialsContextType>({
  materials: null,
  setMaterials: () => {}, // dummy default
});

export function MaterialsProvider({ children }: { children: React.ReactNode }) {
  const [materials, setMaterials] = useState<Material>(null);

  return (
    <MaterialsContext.Provider value={{ materials, setMaterials }}>
      {children}
    </MaterialsContext.Provider>
  );
}
