"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, AlertCircle, X } from "lucide-react";
import { addProduct, getCategories } from "@/lib/api";
import { buildCategoryTree } from "@/lib/buildCategoryTree";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
const currentDay = String(now.getDate()).padStart(2, "0");
const todayDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

export default function ProductFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [modalCategories, setModalCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [dateBoundaries, setDateBoundaries] = useState({ min: "", max: "" });

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategoriesInline = async () => {
      setIsLoadingCategories(true);
      try {
        const result = await getCategories();
        if (result.success) {
          setModalCategories(result.data || []);
        } else {
          toast.error(
            result.error?.message ||
              "Failed to parse available dropdown categories.",
          );
        }
      } catch (err) {
        toast.error("Network error fetching structural list data.");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategoriesInline();
  }, [isOpen]);

  const categoryTree = useMemo(
    () => buildCategoryTree(modalCategories),
    [modalCategories],
  );

  const subCategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return (
      categoryTree.find((c) => String(c.id) === parentCategoryId)?.children ||
      []
    );
  }, [categoryTree, parentCategoryId]);

  useEffect(() => {
    if (!isOpen) return;

    let localMin = "";
    let localMax = "";
    let defaultRowDate = todayDateStr;

    const today = new Date();
    const systemYear = today.getFullYear();
    const systemMonth = today.getMonth() + 1;

    if (initialData && initialData.ledger_month && initialData.ledger_year) {
      const year = initialData.ledger_year;
      const month = String(initialData.ledger_month).padStart(2, "0");
      const totalDays = new Date(year, initialData.ledger_month, 0).getDate();

      localMin = `${year}-${month}-01`;
      localMax = `${year}-${month}-${String(totalDays).padStart(2, "0")}`;
      defaultRowDate = `${year}-${month}-01`;
    } else {
      const totalDays = new Date(systemYear, systemMonth, 0).getDate();
      localMin = `${systemYear}-${String(systemMonth).padStart(2, "0")}-01`;
      localMax = `${systemYear}-${String(systemMonth).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateBoundaries({ min: localMin, max: localMax });
    setParentCategoryId(String(initialData?.parent_id || ""));
    setSubCategoryId(String(initialData?.category_id || ""));
    setErrors({});

    const hasExistingPurchases =
      initialData?.raw_purchases && initialData.raw_purchases.length > 0;

    if (hasExistingPurchases) {
      setPurchaseItems(
        initialData.raw_purchases.map((p) => {
          const rawDate =
            p.purchase_date instanceof Date
              ? p.purchase_date
              : new Date(p.purchase_date);
          const formattedDate = `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, "0")}-${String(rawDate.getDate()).padStart(2, "0")}`;
          return {
            id: p.id,
            purchase_date: formattedDate,
            purchase_qty: String(p.quantity || ""),
            price: String(p.purchase_price || ""),
            quantity_per_unit: String(p.quantity_per_unit || ""),
            unit_price: String(p.unit_price || "0.00"),
            discount_amount: String(p.discount_amount || ""),
          };
        }),
      );
    } else {
      setPurchaseItems([
        {
          id: `new-${crypto.randomUUID()}`,
          purchase_qty: "",
          price: "",
          quantity_per_unit: "",
          unit_price: "0.00",
          discount_amount: "",
          purchase_date: defaultRowDate,
        },
      ]);
    }
  }, [isOpen, initialData]);

  const handleAddPurchaseSection = () => {
    if (purchaseItems.length >= 3)
      return toast.error("Maximum 3 purchase sections allowed.");

    const today = new Date();
    const currentSystemYear = today.getFullYear();
    const currentSystemMonth = today.getMonth() + 1;

    let defaultRowDate = `${currentSystemYear}-${String(currentSystemMonth).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (initialData && initialData.ledger_month && initialData.ledger_year) {
      const ledgerYear = Number(initialData.ledger_year);
      const ledgerMonth = Number(initialData.ledger_month);

      const isPreviousMonth =
        ledgerYear < currentSystemYear ||
        (ledgerYear === currentSystemYear && ledgerMonth < currentSystemMonth);

      if (isPreviousMonth) {
        defaultRowDate = `${ledgerYear}-${String(ledgerMonth).padStart(2, "0")}-01`;
      }
    }

    setPurchaseItems([
      ...purchaseItems,
      {
        id: `new-${crypto.randomUUID()}-${purchaseItems.length}`,
        purchase_qty: "",
        price: "",
        quantity_per_unit: "",
        unit_price: "0.00",
        discount_amount: "",
        purchase_date: defaultRowDate,
      },
    ]);
  };

  const handleInputChange = (id, field, value) => {
    if (value !== "" && parseFloat(value) < 0) return;

    const updated = purchaseItems.map((item) => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        const qty =
          parseFloat(field === "purchase_qty" ? value : newItem.purchase_qty) ||
          0;
        const price =
          parseFloat(field === "price" ? value : newItem.price) || 0;
        const qtyPerUnit =
          parseFloat(
            field === "quantity_per_unit" ? value : newItem.quantity_per_unit,
          ) || 1;
        const discount =
          parseFloat(
            field === "discount_amount" ? value : newItem.discount_amount,
          ) || 0;

        const totalItems = qty * qtyPerUnit;
        const netPrice = price - discount;

        if (totalItems > 0 && netPrice < 0) {
          newItem.unit_price = netPrice;
          newItem.discount_error = "Something wrong with discount price";
        } else {
          newItem.unit_price =
            totalItems > 0 ? (netPrice / totalItems).toFixed(2) : "0.00";
          newItem.discount_error = null;
        }

        return newItem;
      }
      return item;
    });
    setPurchaseItems(updated);
  };

  const handleKeyDownFilter = (e, isFloat = false) => {
    const bannedKeys = ["-", "+", "e", "E"];
    if (!isFloat) {
      bannedKeys.push(".");
    }
    if (bannedKeys.includes(e.key)) e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const formErrors = {};
    if (!parentCategoryId) {
      formErrors.parent_category_id = {
        _errors: ["Category selection is required."],
      };
    }
    if (!subCategoryId) {
      formErrors.monthly_stock_data = {
        category_id: { _errors: ["Sub Category selection is required."] },
      };
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const backendPayload = {
      is_edit_mode: !!initialData,
      monthly_stock_data: {
        id: initialData ? initialData.id : null,
        category_id: parseInt(subCategoryId),
      },
      purchases: purchaseItems.map((p) => ({
        id: String(p.id).startsWith("new-") ? null : p.id,
        purchase_date: p.purchase_date,
        quantity: p.purchase_qty === "" ? null : parseInt(p.purchase_qty),
        purchase_price: p.price === "" ? null : parseFloat(p.price),
        discount_amount:
          p.discount_amount === "" ? 0 : parseFloat(p.discount_amount),
        quantity_per_unit:
          p.quantity_per_unit === "" ? null : parseInt(p.quantity_per_unit),
        unit_price: p.unit_price === "" ? 0 : parseFloat(p.unit_price),
      })),
    };

    setIsSaving(true);
    try {
      await addProduct(backendPayload);

      toast.success(
        initialData
          ? "Product updated successfully!"
          : "Product created successfully!",
        { id: "save-operation" },
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        return false;
      }

      toast.error(err.message || "Something went wrong", {
        id: "save-operation",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4   backdrop-blur-sm overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
      }}
    >
      <div className="bg-white/80 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 text-xl font-semibold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 "
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4  p-4 rounded-xl border border-gray-100 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category *
              </label>
              <select
                value={parentCategoryId}
                disabled={initialData}
                onChange={(e) => {
                  setParentCategoryId(e.target.value);
                  setSubCategoryId("");
                }}
                className={`w-full px-3 cursor-pointer py-2 border disabled:cursor-not-allowed disabled:bg-gray-100 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 ${
                  errors.parent_category_id?._errors
                    ? "border-red-500 bg-red-50/20"
                    : "border-gray-300"
                }`}
              >
                <option value="">
                  {isLoadingCategories
                    ? "loading..."
                    : "Select Parent Category"}{" "}
                </option>
                {categoryTree.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.parent_category_id?._errors && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />{" "}
                  {errors.parent_category_id._errors[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sub Category *
              </label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                className={`w-full px-3 py-2 border cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 ${
                  errors.monthly_stock_data?.category_id?._errors
                    ? "border-red-500 bg-red-50/20"
                    : "border-gray-300"
                }`}
                disabled={!parentCategoryId || initialData}
              >
                <option value="">
                  {isLoadingCategories
                    ? "loading sub category..."
                    : "Select Sub Category"}
                </option>
                {subCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.monthly_stock_data?.category_id?._errors && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.monthly_stock_data.category_id._errors[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="text-base font-semibold text-gray-800">
              Purchasing Information
            </h3>
            <button
              type="button"
              onClick={handleAddPurchaseSection}
              disabled={purchaseItems.length >= 3}
              className={`flex items-center cursor-pointer gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${purchaseItems.length >= 3 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
            >
              <Plus className="w-4 h-4" /> Add Purchase
            </button>
          </div>

          <div className="space-y-4">
            {purchaseItems.map((item, index) => {
              const itemErrors = errors.purchases?.[index] || {};

              return (
                <div
                  key={item.id}
                  className="bg-white/80 p-5 rounded-xl  relative"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}{" "}
                      Purchase
                    </span>

                    {String(item.id).startsWith("new-") && index > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseItems(
                            purchaseItems.filter((x) => x.id !== item.id),
                          )
                        }
                        className="text-red-500 cursor-pointer hover:text-red-700 p-1 flex items-center gap-1 text-xs font-medium transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Purchase Qty *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        value={item.purchase_qty}
                        onKeyDown={handleKeyDownFilter}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "purchase_qty",
                            e.target.value,
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg text-md text-gray-800 focus:ring-1 focus:ring-blue-500 ${itemErrors.quantity?._errors ? "border-red-500 bg-red-50/20" : "border-gray-300"}`}
                      />
                      {itemErrors.quantity?._errors && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {itemErrors.quantity._errors[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 15000"
                        value={item.price}
                        onKeyDown={handleKeyDownFilter}
                        onChange={(e) =>
                          handleInputChange(item.id, "price", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 ${itemErrors.purchase_price?._errors ? "border-red-500 bg-red-50/20" : "border-gray-300"}`}
                      />
                      {itemErrors.purchase_price?._errors && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {itemErrors.purchase_price._errors[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Quantity Per Unit
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={item.quantity_per_unit}
                        onKeyDown={handleKeyDownFilter}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "quantity_per_unit",
                            e.target.value,
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 ${itemErrors.quantity_per_unit?._errors ? "border-red-500 bg-red-50/20" : "border-gray-300"}`}
                      />
                      {itemErrors.quantity_per_unit?._errors && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {itemErrors.quantity_per_unit._errors[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="text"
                        value={item.unit_price}
                        className={`w-full px-3 py-2 border rounded-lg text-sm  text-gray-800  ${itemErrors.unit_price?._errors ? "border-red-500 bg-red-50/20 outline-none  focus:border-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        readOnly
                      />
                      {itemErrors.unit_price?._errors && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {itemErrors.unit_price._errors[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Discount Amount
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={item.discount_amount}
                        onKeyDown={handleKeyDownFilter(true)}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "discount_amount",
                            e.target.value,
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg text-sm  text-gray-800  ${item.discount_error ? "border-red-500 bg-red-50/20 outline-none  focus:border-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                      />
                      {item.discount_error && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {item.discount_error}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        min={dateBoundaries.min}
                        max={dateBoundaries.max}
                        value={item.purchase_date}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "purchase_date",
                            e.target.value,
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-blue-500 text-gray-800 ${itemErrors.purchase_date?._errors ? "border-red-500 bg-red-50/20" : "border-gray-300"}`}
                      />
                      {itemErrors.purchase_date?._errors && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {itemErrors.purchase_date._errors[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-white/80 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-400 text-gray-700 font-medium rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            {initialData ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
