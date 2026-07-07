"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { X, Save } from "lucide-react";
import { toast } from "sonner";

export default function StockModal({
  isOpen,
  onClose,
  selectedItem,
  onSave,
  monthId,
}) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { authUser } = useAuth();
  const currentUserId = authUser?.id;

  useEffect(() => {
    if (isOpen && selectedItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...selectedItem,
        checked_week_1: selectedItem.checked_week_1 ?? 0,
        checked_week_2: selectedItem.checked_week_2 ?? 0,
        checked_week_3: selectedItem.checked_week_3 ?? 0,
        checked_week_4: selectedItem.checked_week_4 ?? 0,
        checked_week_5: selectedItem.checked_week_5 ?? 0,
      });
    } else {
      setFormData({});
    }
  }, [isOpen, selectedItem]);

  const handleClose = () => {
    toast.dismiss();
    onClose();
  };

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,

        used_qty_1st_week: Number(formData.used_qty_1st_week || 0),
        used_qty_2nd_week: Number(formData.used_qty_2nd_week || 0),
        used_qty_3rd_week: Number(formData.used_qty_3rd_week || 0),
        used_qty_4th_week: Number(formData.used_qty_4th_week || 0),
        used_qty_5th_week: Number(formData.used_qty_5th_week || 0),

        checked_week_1: formData.checked_week_1 ? 1 : 0,
        checked_week_2: formData.checked_week_2 ? 1 : 0,
        checked_week_3: formData.checked_week_3 ? 1 : 0,
        checked_week_4: formData.checked_week_4 ? 1 : 0,
        checked_week_5: formData.checked_week_5 ? 1 : 0,

        stock_id: selectedItem.stock_id,
        category_id: selectedItem.id,
        month_id: parseInt(monthId),
        currentUserId: currentUserId,
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (error) {
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const weeks = [
    { key: "used_qty_1st_week", label: "1st Week", checkKey: "checked_week_1" },
    { key: "used_qty_2nd_week", label: "2nd Week", checkKey: "checked_week_2" },
    { key: "used_qty_3rd_week", label: "3rd Week", checkKey: "checked_week_3" },
    { key: "used_qty_4th_week", label: "4th Week", checkKey: "checked_week_4" },
    { key: "used_qty_5th_week", label: "5th Week", checkKey: "checked_week_5" },
  ];

  return (
    <div className="fixed inset-0 bg-slate-700/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="bg-white/80 p-6 rounded-lg w-full max-w-lg shadow-xl relative z-10">
        <h2 className="text-xl text-slate-800 font-bold mb-4">
          Edit Check:{" "}
          <span className="text-green-600">{selectedItem?.name}</span>
        </h2>

        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-4 mt-8">
          {weeks.map((week) => (
            <div key={week.key} className="flex flex-col gap-1  pb-3">
              <label className="text-sm font-semibold text-gray-600">
                Used Qty {week.label}
              </label>

              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  className="w-full text-gray-600 border p-2 rounded outline-none focus:border-green-500"
                  value={formData[week.key] ?? 0}
                  onChange={(e) => handleInputChange(week.key, e.target.value)}
                />

                <label className="flex items-center gap-2 text-md text-green-700 hover:text-green-900 font-medium cursor-pointer px-3 py-2">
                  <input
                    type="checkbox"
                    className="cursor-pointer w-5 h-5 accent-green-600"
                    checked={formData[week.checkKey] === 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [week.checkKey]: e.target.checked ? 1 : 0,
                      }))
                    }
                  />
                  Checked
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="cursor-pointer w-full px-4 py-3 bg-gray-100 text-gray-700 font-semibold border border-slate-500 rounded-lg hover:bg-gray-200 transition-all"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className={`cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-semibold transition-all ${
              isSaving
                ? "bg-green-600"
                : "bg-green-600 hover:bg-green-700 shadow-lg shadow-blue-200"
            }`}
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Check
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
