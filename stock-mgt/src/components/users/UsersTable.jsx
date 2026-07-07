"use client";

import { Trash2, User, Mail, Calendar, Frown } from "lucide-react";
import { toast } from "sonner";
import EditUserButton from "./EditUserButton";

export default function UserList({
  users,
  currentUserId,
  onDelete,
  isDeletingId,
  onEdit,
}) {
  return (
    <div
      className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-auto custom-scrollbar"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
      }}
    >
      <table className="min-w-full divide-y divide-gray-400 text-left text-sm">
        <thead className="bg-gray-50 text-gray-700 uppercase text-sm font-semibold tracking-wider">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Status</th>
            <th className="pl-6 py-4">Created</th>
            <th className="pr-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 text-gray-600">
          {users.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-12 md:py-16">
                <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <div className="w-14 h-14 flex items-center justify-center mb-3 shadow-xs">
                    <Frown className="w-15 h-15 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-0.5">
                    No users Found!
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    No users in the system.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            users?.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 bg-slate-100 border border-slate-200/60 rounded-xl flex items-center justify-center text-slate-500 shadow-2xs group-hover:bg-white group-hover:text-slate-800 transition-colors">
                        <User className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <div className="flex flex-col">
                        <div className="font-semibold text-slate-800 tracking-tight">
                          {user.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400/80 stroke-2" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide ${
                        user.status === 1
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-stone-50 text-red-400 border border-stone-200/60"
                      }`}
                    >
                      {user.status === 1 ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Active
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-red-300"></span>
                          Inactive
                        </>
                      )}
                    </span>
                  </td>

                  <td className="pl-6 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-2" />
                      <span>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </td>

                  <td className="pr-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <EditUserButton
                      onClick={() => {
                        onEdit(user);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (isCurrentUser) {
                          toast.error("You cannot delete your own account!");
                          return;
                        }
                        onDelete(user);
                      }}
                      disabled={isDeletingId === user.id}
                      className={`cursor-pointer group inline-flex items-center justify-center rounded-lg border p-1.5 text-xs font-medium transition shadow-2xs active:scale-95 bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 transition-colors group-hover:text-red-500" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
