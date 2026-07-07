"use client";
import {
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  Folder,
  FolderOpen,
  Info,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { mapCategoryFromAPI } from "@/lib/api";
import { getCategories, createCategory } from "@/lib/api";
import { updateCategory, deleteCategory } from "@/lib/api";
import { useState, useEffect } from "react";
import { categorySchema } from "@/lib/validations/category";
import { useAuth } from "@/components/AuthProvider";
import { formatZodErrors } from "@/lib/validations/validate";
import { toast } from "sonner";
export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [parentNameInput, setParentNameInput] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    parentId: "",
    remark: "",
    minQuantity: "",
  });
  const { authUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });
  const openErrorModal = (message) => {
    setErrorModal({
      isOpen: true,
      message: message,
    });
  };

  const closeErrorModal = () => {
    setErrorModal({
      isOpen: false,
      message: "",
    });
  };

  const buildCategoryTree = (flat) => {
    const map = new Map();
    const roots = [];
    flat.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });
    flat.forEach((item) => {
      const node = map.get(item.id);
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  function getAllCategoryIds(categories) {
    const ids = new Set();
    const traverse = (cats) => {
      cats.forEach((cat) => {
        ids.add(cat.id);
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(categories);
    return ids;
  }

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCategories();
      const categories = response.data;
      const mapped = categories.map(mapCategoryFromAPI);
      const tree = buildCategoryTree(mapped);
      setCategories(tree);
      setExpandedCategories(getAllCategoryIds(tree));
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      loadCategories();
    }
  }, [authUser]);

  const getCategoryNameById = (id, cats = categories) => {
    for (const c of cats) {
      if (c.id === id) return c.name;
      if (c.children) {
        const found = getCategoryNameById(id, c.children);
        if (found) return found;
      }
    }
    return "";
  };
  const openModal = (category, parentId) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parentId: category.parentId || "",
        remark: category.remark || "",
        minQuantity: category.minQuantity ?? "",
      });
      setParentNameInput(
        category.parentId ? getCategoryNameById(category.parentId) : "",
      );
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        parentId: parentId || "",
        remark: "",
        minQuantity: "",
      });
      setParentNameInput(parentId ? getCategoryNameById(parentId) : "");
    }
    setIsModalOpen(true);
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", parentId: "", remark: "", minQuantity: "" });
    setParentNameInput("");
    setFieldErrors({});
  };
  const openDeleteModal = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCategory(categoryToDelete.id);

      toast.success("Category deleted successfully");
      closeDeleteModal();
      await loadCategories();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to delete category";

      const isRestricted =
        errorMessage.includes("stock data") ||
        errorMessage.includes("stock quantity") ||
        errorMessage.includes("purchases") ||
        errorMessage.includes("subcategories");

      if (isRestricted) {
        openErrorModal(errorMessage);
        closeDeleteModal();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const result = categorySchema.safeParse(formData);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await updateCategory(Number(editingCategory.id), {
          name: formData.name,
          minimumThreshold:
            formData.minQuantity === "" ? 0 : Number(formData.minQuantity),
          remark: formData.remark || undefined,
        });
      } else {
        await createCategory({
          name: formData.name,
          parentId: formData.parentId ? Number(formData.parentId) : null,
          minimumThreshold:
            formData.minQuantity === "" ? 0 : Number(formData.minQuantity),
          remark: formData.remark || undefined,
        });
      }
      closeModal();
      toast.success(
        editingCategory
          ? "Category updated successfully"
          : "Category created successfully",
      );
      await loadCategories();
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const ErrorModal = () => {
    if (!errorModal.isOpen) return null;

    useEffect(() => {
      if (errorModal.isOpen) {
        const timer = setTimeout(() => {
          closeErrorModal();
        }, 5000);

        return () => clearTimeout(timer);
      }
    }, [errorModal.isOpen]);

    return (
      <>
        <div className="fixed top-4 right-4 z-\[9999\] pointer-events-auto max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-red-50 rounded-xl shadow-2xl border border-red-200/50 p-4 overflow-hidden relative">
            {/* Red left border accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-50 rounded-l-xl" />

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-50">
              <div className="h-full bg-red-60 animate-[shrink_5s_linear_forwards] rounded-full" />
            </div>

            <button
              onClick={closeErrorModal}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-black-100 rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pl-2 pr-6 pb-1">
              <div className="flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium leading-relaxed">
                  {errorModal.message ||
                    "Cannot delete category: stock quantity still exists in category or subcategories"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const DeleteConfirmationModal = () => {
    if (!isDeleteModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={closeDeleteModal}
        />

        {/* Modal Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 overflow-hidden transition-all transform animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-50 border border-red-100 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Delete Category
              </h2>
            </div>
            <button
              onClick={closeDeleteModal}
              className="p-1.5 text-slate-400 cursor-pointer hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content for Delete */}
          <div className="mb-6">
            <p className="text-slate-600 text-sm">
              Are you sure you want to delete the category{" "}
              <span className="font-semibold text-slate-900">
                "{categoryToDelete?.name}"
              </span>
              ?
            </p>
            <p className="text-slate-500 text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="flex-1 px-4 py-2.5 cursor-pointer border border-slate-200 font-medium text-sm text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 px-4 py-2.5 cursor-pointer bg-red-600 font-medium text-sm text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-500/10 disabled:bg-red-400 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="w-full">
        <div
          onClick={() => hasChildren && toggleExpand(category.id)}
          className={`group flex items-center justify-between py-3 px-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer ${
            level > 0 ? "bg-slate-50/30" : "bg-white"
          }`}
          style={{ paddingLeft: `${Math.max(1, level * 2)}rem` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <div className="p-1 hover:bg-slate-200/70 rounded text-slate-500 transition-colors">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            ) : (
              <div className="w-6" />
            )}

            <div className="flex items-center gap-2 text-slate-400">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500" />
                )
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1.5" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <span className="font-medium text-slate-700 truncate">
                {category.name}
              </span>

              {(category.remark || category.minQuantity !== undefined) && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {category.minQuantity !== undefined &&
                    category.minQuantity !== 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
                        Min Qty: {category.minQuantity}
                      </span>
                    )}
                  {category.remark && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 max-w-xs truncate">
                      <Info className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{category.remark}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-4 shrink-0">
            {level === 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(undefined, category.id);
                }}
                className="p-1.5 cursor-pointer text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Add subcategory"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal(category);
              }}
              className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-green-50 hover:text-green-600 transition active:scale-95 cursor-pointer"
              title="Edit category"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-500 transition-colors" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(category);
              }}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative before:absolute before:left-[1.65rem] before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
            {category.children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  return (
    <>
      <div className="max-w-full min-h-screen px-4 lg:px-12 py-8 bg-linear-to-br bg-slate-200  md:p-8 selection:bg-blue-500/10 p-8 antialiased">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Category Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Organize and structure inventory item classifications.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex flex-nowrap bg-slate-600 items-center cursor-pointer justify-center gap-2 md:px-7 px-4 py-2.5 text-white font-medium text-sm rounded-xl shadow-sm shadow-blue-500/10 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Category</span>
          </button>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {!loading && categories.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                No categories setup
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Get started by creating your primary high-level categories.
              </p>
              <button
                onClick={() => openModal()}
                className="inline-flex cursor-pointer items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Add your first category &rarr;
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {categories.map((category) => renderCategory(category))}
            </div>
          )}
        </div>

        <ErrorModal />

        <DeleteConfirmationModal />
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={closeModal}
            />

            <div className="relative bg-white/80 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 overflow-hidden transition-all transform animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCategory
                    ? "Edit Category"
                    : formData.parentId
                      ? "New Subcategory"
                      : "New Parent Category"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-slate-400 cursor-pointer hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {parentNameInput && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Parent Category
                    </label>
                    <input
                      type="text"
                      value={parentNameInput}
                      disabled
                      className="w-full px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg cursor-not-allowed font-medium text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFieldErrors({});
                    }}
                    className={`w-full px-3 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-shadow ${fieldErrors.name ? "border-red-500" : "border-slate-200"}`}
                    placeholder="e.g., Electronics, Raw Materials"
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {(formData.parentId || editingCategory?.parentId) && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Remark
                      </label>
                      <textarea
                        rows={3}
                        value={formData.remark}
                        onChange={(e) =>
                          setFormData({ ...formData, remark: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-shadow resize-none"
                        placeholder="Optional notes or details regarding subcategory layout..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Minimum Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.minQuantity}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            minQuantity:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          });
                          setFieldErrors({});
                        }}
                        className={`w-full px-3 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-shadow ${fieldErrors.minQuantity ? "border-red-500" : "border-slate-200"}`}
                        placeholder="Leaves empty or 0 if unmonitored"
                      />
                      {fieldErrors.minQuantity && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.minQuantity}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 mt-6 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 cursor-pointer py-2 border border-slate-300 font-medium text-sm text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 cursor-pointer px-4 py-2 bg-slate-600 font-medium text-sm text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10"
                    disabled={saving}
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingCategory ? "Save Changes" : "Create"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
