import { useState } from "react";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showActions?: boolean;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (config: Omit<ModalState, "isOpen">) => {
    setModalState({
      ...config,
      isOpen: true,
    });
  };

  const hideModal = () => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    showModal({
      title,
      message,
      type,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    type: "info" | "success" | "warning" | "error" = "warning"
  ) => {
    showModal({
      title,
      message,
      type,
      onConfirm,
      onCancel,
      showActions: true,
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    showAlert,
    showConfirm,
  };
};
