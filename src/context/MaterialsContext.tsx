import React, { createContext, useState } from 'react';

type MaterialsContextType = {
  materials: any; // you can replace `any` with a stricter type if you know your data shape
  setMaterials: React.Dispatch<React.SetStateAction<any>>;
};

export const MaterialsContext = createContext<MaterialsContextType>({
  materials: null,
  setMaterials: () => {}, // dummy default
});

export function MaterialsProvider({ children }: { children: React.ReactNode }) {
  const [materials, setMaterials] = useState<any>(null);

  return (
    <MaterialsContext.Provider value={{ materials, setMaterials }}>
      {children}
    </MaterialsContext.Provider>
  );
}
