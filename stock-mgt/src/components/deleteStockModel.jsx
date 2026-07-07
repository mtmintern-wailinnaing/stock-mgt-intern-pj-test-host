"use client";

import { AlertTriangle, X } from "lucide-react";

export default function DeleteStockModal({
  isOpen,
  itemName,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-700/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-6 text-center z-10 border border-white/60">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-x-3 mb-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-50 border border-red-100 shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
        </div>

        <p className="text-sm text-gray-500 mb-6 leading-relaxed flex flex-col items-center">
          <span>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-800">{itemName}</span>?
          </span>
          <span className="text-xs text-red-500 mt-1 font-medium">
            This action cannot be undone.
          </span>
        </p>

        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer px-4 py-2.5 border border-gray-400 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition active:scale-98"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full px-4 cursor-pointer py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-red-100 transition active:scale-98"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
