"use client";

import { Pencil } from "lucide-react";

export default function EditUserButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition shadow-2xs active:scale-95 cursor-pointer"
      title="Edit User"
    >
      <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-500 transition-colors" />
    </button>
  );
}
