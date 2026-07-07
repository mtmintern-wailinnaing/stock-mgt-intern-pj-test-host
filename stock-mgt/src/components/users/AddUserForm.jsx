"use client";

import { createUser } from "@/lib/api";
import { AlertTriangle, Eye, EyeClosed, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AddUserForm({ isOpen, onUserAdded, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      // clean errors when typing
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
  };

  const resetFormStructure = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    });
    setGeneralError("");
    setFieldErrors({});
  };

  const handleCloseWithReset = () => {
    resetFormStructure();
    onClose(); // onClose to Parents
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setLoading(true);

    try {
      await createUser(formData);
      setFormData({ name: "", email: "", password: "", confirm_password: "" });
      toast.success("User created successfully!");
      if (onUserAdded) onUserAdded();
    } catch (error) {
      try {
        const apiError = JSON.parse(error.message);
        if (apiError.errors) {
          setFieldErrors(apiError.errors);
        } else {
          toast.error("User Creation Failed");
          handleCloseWithReset();
        }
      } catch {
        toast.error("User Creation Failed");
        handleCloseWithReset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-700/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0" onClick={handleCloseWithReset} />
      <div
        className={`relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-md overflow-hidden z-10 transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="px-6 pt-6 pb-2 flex justify-between items-center relative">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">
            Add New User
          </h3>
          <button
            type="button"
            onClick={handleCloseWithReset}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fieldErrors.email_exist?._errors ? (
            <div className="text-left p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100/50 flex items-start gap-2 w-full transition-all">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">
                {fieldErrors.email_exist._errors[0]}
              </span>
            </div>
          ) : generalError ? (
            <div className="text-left p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100/50 flex items-start gap-2 w-full transition-all">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">{generalError}</span>
            </div>
          ) : null}

          <div className="flex flex-col items-start">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              placeholder="Enter full name"
              onChange={handleChange}
              className={`w-full px-3.5 py-2 bg-white border  rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none  transition-all shadow-xs ${fieldErrors.name?._errors ? "border-red-400" : "border-slate-200"}`}
            />
            <div className="min-h-4.5 w-full text-left">
              {fieldErrors.name?._errors && (
                <p className="text-red-500 text-xs font-bold mt-0.5">
                  {fieldErrors.name._errors[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter email address"
              onChange={handleChange}
              className={`w-full px-3.5 py-2 bg-white border  rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none  transition-all shadow-xs ${fieldErrors.email?._errors ? "border-red-400" : "border-slate-200"}`}
            />
            <div className="min-h-4.5 w-full text-left">
              {fieldErrors.email?._errors && (
                <p className="text-red-500 text-xs font-bold mt-0.5">
                  {fieldErrors.email._errors[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                placeholder="Enter password"
                onChange={handleChange}
                className={`w-full px-3.5 py-2 bg-white border  rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none  transition-all shadow-xs ${fieldErrors.password?._errors ? "border-red-400" : "border-slate-200"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeClosed className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="min-h-4.5 w-full text-left">
              {fieldErrors.password?._errors && (
                <p className="text-red-500 text-xs font-bold mt-0.5">
                  {fieldErrors.password._errors[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Confirm Password *
            </label>
            <div className="relative w-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                placeholder="Confirm password"
                onChange={handleChange}
                className={`w-full px-3.5 py-2 bg-white border  rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none  transition-all shadow-xs ${fieldErrors.confirm_password?._errors ? "border-red-400" : "border-slate-200"}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeClosed className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="min-h-4.5 w-full text-left">
              {fieldErrors.confirm_password?._errors && (
                <p className="text-red-500 text-xs font-bold mt-0.5">
                  {fieldErrors.confirm_password._errors[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseWithReset}
              disabled={loading}
              className="px-4 py-2 border border-slate-400 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-800 cursor-pointer hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 disabled:bg-slate-400"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
