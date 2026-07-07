"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function CreateMonthModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  monthNames,
  currentYear,
  monthExists,
  saving,
}) {
  if (!isOpen) return null;
  const currentMonth = new Date().getMonth();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md pointer-events-auto">
          <form onSubmit={onSubmit} className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Create Month
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: Number(e.target.value),
                    })
                  }
                  className="w-full appearance-none px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={currentYear}>{currentYear}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>

                <select
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      month: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {monthNames.slice(0, currentMonth + 1).map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Record Name Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Record name:</span>{" "}
                  <span className="text-blue-600">
                    {formData.year}_{monthNames[formData.month - 1]}
                  </span>
                </p>
                {monthExists && (
                  <p className="text-xs text-red-600 mt-2">
                    This year and month already exists.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={saving || monthExists}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
