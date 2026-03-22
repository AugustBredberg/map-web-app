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
  /** Optional title shown in the drawer header. */
  title?: string;
}

interface DrawerContextValue {
  isOpen: boolean;
  content: ReactNode | null;
  contentKey: number;
  backdrop: boolean;
  title: string | null;
  openDrawer: (content: ReactNode, options?: DrawerOptions) => void;
  closeDrawer: () => void;
  updateTitle: (title: string) => void;
}

const DrawerContext = createContext<DrawerContextValue>({
  isOpen: false,
  content: null,
  contentKey: 0,
  backdrop: true,
  title: null,
  openDrawer: () => {},
  closeDrawer: () => {},
  updateTitle: () => {},
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const [backdrop, setBackdrop] = useState(true);
  const [title, setTitle] = useState<string | null>(null);
  const onCloseRef = useRef<(() => void) | undefined>(undefined);

  const openDrawer = useCallback((newContent: ReactNode, options?: DrawerOptions) => {
    onCloseRef.current = options?.onClose;
    setBackdrop(options?.backdrop ?? true);
    setTitle(options?.title ?? null);
    setContent(newContent);
    setContentKey((k) => k + 1);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    onCloseRef.current?.();
    onCloseRef.current = undefined;
    // Clear content after the close animation finishes (300 ms)
    setTimeout(() => setContent(null), 300);
  }, []);

  const updateTitle = useCallback((newTitle: string) => setTitle(newTitle), []);

  return (
    <DrawerContext.Provider value={{ isOpen, content, contentKey, backdrop, title, openDrawer, closeDrawer, updateTitle }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
