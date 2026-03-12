"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface DrawerOptions {
  onClose?: () => void;
  /** Whether to show a darkened backdrop behind the drawer. Defaults to true. */
  backdrop?: boolean;
}

interface DrawerContextValue {
  isOpen: boolean;
  content: ReactNode | null;
  backdrop: boolean;
  openDrawer: (content: ReactNode, options?: DrawerOptions) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue>({
  isOpen: false,
  content: null,
  backdrop: true,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [backdrop, setBackdrop] = useState(true);
  const onCloseRef = useRef<(() => void) | undefined>(undefined);

  const openDrawer = useCallback((newContent: ReactNode, options?: DrawerOptions) => {
    onCloseRef.current = options?.onClose;
    setBackdrop(options?.backdrop ?? true);
    setContent(newContent);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    onCloseRef.current?.();
    onCloseRef.current = undefined;
    // Clear content after the close animation finishes (300 ms)
    setTimeout(() => setContent(null), 300);
  }, []);

  return (
    <DrawerContext.Provider value={{ isOpen, content, backdrop, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
