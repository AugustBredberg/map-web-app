"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useLocale } from "@/context/LocaleContext";

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
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmColor = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: Props) {
  const { t } = useLocale();
  const resolvedTitle = title ?? t("confirmDialog.title");
  const resolvedConfirmLabel = confirmLabel ?? t("confirmDialog.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("confirmDialog.cancel");
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <ModalContent>
        <ModalHeader>{resolvedTitle}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel} isDisabled={isLoading}>
            {resolvedCancelLabel}
          </Button>
          <Button color={confirmColor} onPress={onConfirm} isLoading={isLoading}>
            {resolvedConfirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
