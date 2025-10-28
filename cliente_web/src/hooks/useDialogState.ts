import { useCallback, useState } from "react";

export const useDialogState = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const openDialog = useCallback(() => setIsOpen(true), []);

  return { isOpen, setIsOpen, openDialog } as const;
};
