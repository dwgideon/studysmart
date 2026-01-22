import { create } from "zustand";

export type StudyFile = {
  id: number;
  name?: string;
  active?: boolean;
  [key: string]: any;
};

type StudyStore = {
  files: StudyFile[];
  addFile: (file: Partial<StudyFile>) => void;
  deleteFile: (id: number) => void;
  renameFile: (id: number, newName: string) => void;
  setActiveFile: (id: number) => void;
};

export const useStudyStore = create<StudyStore>((set) => ({
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
