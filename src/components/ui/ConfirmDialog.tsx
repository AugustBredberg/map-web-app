"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "danger" | "primary" | "default" | "secondary" | "success" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel} isDisabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button color={confirmColor} onPress={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
