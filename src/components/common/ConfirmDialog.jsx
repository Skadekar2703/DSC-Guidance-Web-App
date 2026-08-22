import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

/**
 * Reusable modal for destructive deletions and crucial approvals.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed px-2">{message}</p>
        
        <div className="flex gap-3 w-full border-t border-slate-100 pt-4 shrink-0">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            loading={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
