"use client";

import { useState } from "react";
import { updateUser } from "@/lib/api";
import { userEditSchema } from "@/lib/validations/user";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../AuthProvider";

export default function EditUserForm({
  isOpen,
  onClose,
  user,
  onUpdateSuccess,
}) {
  const [editingUser, setEditingUser] = useState({
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    status: user?.status ?? 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { authUser, setAuthUser } = useAuth();
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name])
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleStatusToggle = () => {
    setEditingUser((prev) => ({
      ...prev,
      status: prev.status === 1 ? 0 : 1,
    }));
  };

  const handleClose = () => {
    setFieldErrors({});
    setEditingUser({
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      status: user?.status ?? 1,
    });
    onClose();
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser.id) return;

    setIsSubmitting(true);
    setFieldErrors({});

    const validation = userEditSchema.safeParse({
      name: editingUser.name,
      email: editingUser.email,
    });

    if (!validation.success) {
      const errorsObj = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (!errorsObj[fieldName]) errorsObj[fieldName] = issue.message;
      });
      setFieldErrors(errorsObj);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        status: editingUser.status,
      });

      toast.success(response?.message || "User updated successfully!");
      if (authUser && authUser.id === editingUser.id) {
        setAuthUser({
          ...authUser,
          name: editingUser.name,
          email: editingUser.email,
        });
      }
      if (onUpdateSuccess) {
        await onUpdateSuccess();
      }
      onClose();
    } catch (error) {
      try {
        const apiError = JSON.parse(error.message);
        if (apiError.errors) {
          setFieldErrors(apiError.errors);
        } else {
          toast.error("User Update Failed");
        }
      } catch {
        toast.error("User Update Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-700/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="absolute inset-0" onClick={handleClose} />
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-md overflow-hidden z-10">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">
            Edit User Profile
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveSubmit} className="p-6 space-y-5">
          {fieldErrors.email_exist?._errors && (
            <div className="text-left p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100/50 flex items-start gap-2 w-full transition-all">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">
                {fieldErrors.email_exist._errors[0]}
              </span>
            </div>
          )}

          <div className="space-y-1.5 flex flex-col items-start">
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={editingUser.name}
              onChange={handleInputChange}
              className={`text-slate-600 w-full px-3.5 py-2 bg-white border rounded-xl text-sm ${fieldErrors.name ? "border-red-400" : "border-slate-200"}`}
            />
            {fieldErrors.name && (
              <p className="text-xs font-bold text-red-500 mt-1">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5 flex flex-col items-start">
            <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={editingUser.email}
              onChange={handleInputChange}
              className={`text-slate-600 w-full px-3.5 py-2 bg-white border rounded-xl text-sm ${fieldErrors.email ? "border-red-400" : "border-slate-200"}`}
            />
            {fieldErrors.email && (
              <p className="text-xs font-bold text-red-500 mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col items-start gap-y-2 select-none">
            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
              Status
            </span>

            <div className="flex items-center gap-x-2.5">
              <button
                type="button"
                onClick={handleStatusToggle}
                className={`relative cursor-pointer inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  editingUser.status === 1 ? "bg-emerald-500" : "bg-slate-400"
                }`}
              >
                <span
                  className={`inline-block cursor-pointer h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    editingUser.status === 1
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  }`}
                />
              </button>

              {/* status */}
              <span
                className={`w-14 text-left text-xs font-bold uppercase tracking-wide ${
                  editingUser.status === 1
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {editingUser.status === 1 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 cursor-pointer border rounded-xl text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 cursor-pointer bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
