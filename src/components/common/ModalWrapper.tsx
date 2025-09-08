import React from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export type ModalType = "info" | "success" | "warning" | "error";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ModalType;
  showCloseButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showActions?: boolean;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  showCloseButton = true,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  showActions = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100";
      case "warning":
        return "bg-yellow-100";
      case "error":
        return "bg-red-100";
      default:
        return "bg-blue-100";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 ${getIconBgColor()} rounded-xl flex items-center justify-center`}
            >
              {getIcon()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-gray-700 leading-relaxed">{message}</div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-3 mt-6">
              {onCancel && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  {cancelText}
                </button>
              )}
              {onConfirm && (
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors ${
                    type === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : type === "warning"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          )}

          {/* Single OK Button */}
          {!showActions && (
            <div className="mt-6">
              <button
                onClick={onClose}
                className={`w-full px-4 py-3 text-white rounded-xl font-medium transition-colors ${
                  type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : type === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
