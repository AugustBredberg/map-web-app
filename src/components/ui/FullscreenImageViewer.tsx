"use client";

import type { ReactNode } from "react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Shown in the top bar */
  title: string;
  /** Media to show — e.g. `<img />` or a placeholder block */
  children: ReactNode;
}

/**
 * Full-viewport image viewer. Reuse anywhere you need tap-to-expand photos.
 */
export default function FullscreenImageViewer({ isOpen, onClose, title, children }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      placement="center"
      scrollBehavior="inside"
      shouldBlockScroll
      classNames={{
        base: "m-0 !rounded-none",
        body: "flex min-h-0 flex-1 flex-col items-center justify-center gap-0 overflow-auto p-4 sm:p-6",
      }}
    >
      <ModalContent className="flex h-[100dvh] max-h-[100dvh] flex-col">
        <ModalHeader className="flex-shrink-0 border-b border-border py-3 text-base font-semibold">{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}
