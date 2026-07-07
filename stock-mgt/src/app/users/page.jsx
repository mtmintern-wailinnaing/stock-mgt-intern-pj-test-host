"use client";
import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import UserList from "@/components/users/UsersTable";
import AddUserForm from "@/components/users/AddUserForm";
import { useAuth } from "@/components/AuthProvider";
import { getUsers, deleteUser, searchUsers } from "@/lib/api";
import EditUserForm from "@/components/users/EditUserForm";
import DeleteConfirmModal from "@/components/users/DeleteConfirmModal";
import { toast } from "sonner";

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const { authUser, isLoading } = useAuth();
  const currentUserId = authUser?.id;
  const fetchUsers = async (query = "", showLoading = true) => {
    setLoading(showLoading);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isLoading && authUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers();
    }
  }, [isLoading, authUser]);

  const handleSearch = async () => {
    try {
      const data = await searchUsers(searchQuery);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUserAdded = () => {
    setIsAddOpen(false);
    fetchUsers();
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-xl">
          <p className="text-sm font-semibold text-red-600">Error Occurred</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  return (
    <div className="relative min-h-screen bg-linear-to-br bg-slate-200 p-4 md:p-8 selection:bg-blue-500/10">
      <div className="mx-auto max-w-8xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 ">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
              User Management
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">
              Manage system users and their permissions
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:max-w-xl lg:justify-end">
            <div className="relative group flex-1 sm:max-w-xs md:max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                <Search className="w-4 h-4" />
              </span>

              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (value === "") {
                    fetchUsers("", false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-slate-500 shadow-xs transition-all"
              />
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 bg-slate-600 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Add New User
            </button>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <UserList
              users={users}
              currentUserId={currentUserId}
              onDeleteSuccess={fetchUsers}
              onEdit={handleEditClick}
              onDelete={(user) => {
                setSelectedUser(user);
                setIsDeleteOpen(true);
              }}
              isDeletingId={isDeletingId}
              setSearchQuery={setSearchQuery}
            />
          )}
        </div>
      </div>

      <AddUserForm
        isOpen={isAddOpen}
        onUserAdded={handleUserAdded}
        onClose={() => setIsAddOpen(false)}
      />

      {isEditOpen && (
        <EditUserForm
          isOpen={isEditOpen}
          user={selectedUser}
          onClose={() => setIsEditOpen(false)}
          onUpdateSuccess={fetchUsers}
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteOpen}
          user={selectedUser}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={async () => {
            setIsDeletingId(selectedUser.id);

            try {
              const response = await deleteUser(selectedUser.id);

              toast.success(response?.message || "User deleted successfully!");

              setIsDeleteOpen(false);
              fetchUsers();
            } catch (error) {
              console.info(error);
              toast.error("Failed to delete user!");
            } finally {
              setIsDeletingId(null);
            }
          }}
        />
      )}
    </div>
  );
}
