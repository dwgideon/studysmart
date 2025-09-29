import { create } from "zustand";

export const useStudyStore = create((set) => ({
  files: [],
  addFile: (file) =>
    set((state) => ({
      files: [...state.files, { id: Date.now(), ...file }],
    })),
  deleteFile: (id) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),
  renameFile: (id, newName) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, name: newName } : file
      ),
    })),
  setActiveFile: (id) =>
    set((state) => ({
      files: state.files.map((file) => ({
        ...file,
        active: file.id === id,
      })),
    })),
}));

