"use client";

import {
  CalendarDays,
  Package,
  DollarSign,
  ShoppingCart,
  Filter,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { getCategories, getAllPurchases } from "@/lib/api";
import { buildCategoryTree } from "@/lib/buildCategoryTree";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getMonthLabel(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function parseDate(dateStr) {
  const parts = dateStr.split("-");
  return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
}

function calculateUnitPrice(quantity, quantityPerUnit, totalPrice) {
  const totalItems = quantity * quantityPerUnit;
  if (totalItems <= 0) return 0;
  return totalPrice / totalItems;
}

function formatMMK(value) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState("");
  const [selectedCompareMonth, setSelectedCompareMonth] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [purchasesEnvelope, categoriesEnvelope] = await Promise.all([
        getAllPurchases(),
        getCategories(),
      ]);

      const rawPurchases = purchasesEnvelope?.success
        ? purchasesEnvelope.data
        : [];
      const rawCategories = categoriesEnvelope?.success
        ? categoriesEnvelope.data
        : [];

      const formattedPurchases = rawPurchases.map((p) => {
        const raw = p;
        return {
          ...p,
          id: String(p.id),
          quantity: Number(p.quantity),
          purchase_price: Number(raw.purchase_price ?? 0),
          unit_price: Number(p.unit_price),
          quantity_per_unit: Number(p.quantity_per_unit),
          discount_amount: Number(p.discount_amount),
          discount_price: Number(raw.discount_price ?? 0),
          category_id: Number(p.category_id),
        };
      });
      setPurchases(formattedPurchases);
      setCategories(rawCategories);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const categoryTree = useMemo(
    () => buildCategoryTree(categories),
    [categories],
  );

  const allSubCategoryIds = useMemo(() => {
    const ids = new Set();
    categories.forEach((c) => {
      if (c.parent_id) ids.add(Number(c.id));
    });
    return ids;
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedParentCategory) return [];
    const parent = categoryTree.find(
      (c) => String(c.id) === selectedParentCategory,
    );
    return parent?.children || [];
  }, [categoryTree, selectedParentCategory]);

  const getFilteredBase = useCallback(
    (data) => {
      let result = [...data];

      if (selectedParentCategory) {
        const parentNum = Number(selectedParentCategory);

        const parent = categoryTree.find(
          (c) => String(c.id) === selectedParentCategory,
        );

        const childIds = parent?.children?.map((c) => c.id) || [];

        result = result.filter((p) => {
          if (p.category_id === parentNum) return true;

          // Keep purchases that don't belong to any subcategory
          if (!allSubCategoryIds.has(p.category_id)) return true;

          // Otherwise only keep children of selected parent
          return childIds.includes(p.category_id);
        });
      }

      if (selectedCategory) {
        result = result.filter(
          (p) => p.category_id === Number(selectedCategory),
        );
      }

      return result;
    },
    [selectedParentCategory, selectedCategory, categoryTree, allSubCategoryIds],
  );

  const flatPurchases = useMemo(() => {
    const currentMonthKey = getMonthKey(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
    );

    return getFilteredBase(purchases)
      .filter((p) => {
        const { year, month } = parseDate(p.purchase_date);
        return getMonthKey(year, month) === currentMonthKey;
      })
      .sort(
        (a, b) =>
          new Date(b.purchase_date).getTime() -
          new Date(a.purchase_date).getTime(),
      );
  }, [purchases, getFilteredBase]);

  const availableMonths = useMemo(() => {
    const now = new Date();
    const monthSet = new Set();
    monthSet.add(getMonthKey(now.getFullYear(), now.getMonth() + 1));
    purchases.forEach((p) => {
      const { year, month } = parseDate(p.purchase_date);
      monthSet.add(getMonthKey(year, month));
    });
    return Array.from(monthSet)
      .sort()
      .map((key) => {
        const [y, m] = key.split("-").map(Number);
        return { key, year: y, month: m, label: getMonthLabel(y, m) };
      });
  }, [purchases]);

  const currentMonthKey = getMonthKey(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
  );

  const isInvalidCompare = selectedCompareMonth === currentMonthKey;

  const comparisonMonths = useMemo(() => {
    const months = [];
    const current = availableMonths.find((m) => m.key === currentMonthKey);
    if (current) months.push(current);
    if (selectedCompareMonth) {
      const found = availableMonths.find((m) => m.key === selectedCompareMonth);
      if (found) months.push(found);
    }
    return months;
  }, [selectedCompareMonth, availableMonths]);

  const isComparisonMode =
    selectedCompareMonth && selectedCompareMonth !== currentMonthKey;

  const comparisonData = useMemo(() => {
    if (!isComparisonMode) return null;

    const monthKeys = comparisonMonths.map((m) => m.key);

    const base = getFilteredBase(purchases);

    const grouped = {};

    base.forEach((p) => {
      const { year, month } = parseDate(p.purchase_date);
      const key = getMonthKey(year, month);

      if (monthKeys.includes(key)) {
        const catKey = p.categoryName || String(p.category_id);

        if (!grouped[catKey]) grouped[catKey] = [];

        grouped[catKey].push(p);
      }
    });

    const rows = Object.entries(grouped).map(([catKey, items]) => {
      const months = comparisonMonths.map((m) => {
        const monthItems = items.filter((i) => {
          const { year, month } = parseDate(i.purchase_date);
          return getMonthKey(year, month) === m.key;
        });

        return {
          label: m.label,
          quantity: monthItems.reduce((s, i) => s + i.quantity, 0),
          quantity_per_unit: monthItems.reduce(
            (s, i) => s + i.quantity_per_unit,
            0,
          ),
          unit_price:
            monthItems.length > 0
              ? monthItems.reduce(
                  (s, i) =>
                    s +
                    calculateUnitPrice(
                      i.quantity,
                      i.quantity_per_unit,
                      i.discount_price,
                    ),
                  0,
                ) / monthItems.length
              : 0,
          discount_amount: monthItems.reduce(
            (s, i) => s + i.discount_amount,
            0,
          ),
          total_price: monthItems.reduce((s, i) => s + i.discount_price, 0),
        };
      });

      return {
        categoryName: catKey,
        months,
      };
    });

    return rows.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [isComparisonMode, comparisonMonths, purchases, getFilteredBase]);

  const stats = useMemo(() => {
    let visiblePurchases = flatPurchases;

    if (isComparisonMode) {
      const monthKeys = comparisonMonths.map((m) => m.key);

      visiblePurchases = getFilteredBase(purchases).filter((p) => {
        const { year, month } = parseDate(p.purchase_date);
        return monthKeys.includes(getMonthKey(year, month));
      });
    }

    const totalPurchases = visiblePurchases.length;

    const totalValue = visiblePurchases.reduce(
      (sum, p) => sum + p.discount_price,
      0,
    );

    const totalQuantity = visiblePurchases.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    const avgPrice =
      visiblePurchases.length > 0
        ? visiblePurchases.reduce(
            (sum, p) =>
              sum +
              calculateUnitPrice(
                p.quantity,
                p.quantity_per_unit,
                p.discount_price,
              ),
            0,
          ) / visiblePurchases.length
        : 0;

    return {
      totalPurchases,
      totalValue,
      totalQuantity,
      avgPrice,
    };
  }, [
    purchases,
    flatPurchases,
    isComparisonMode,
    comparisonMonths,
    getFilteredBase,
  ]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              ✕
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Purchase History
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Track and manage all purchase transactions
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Purchases</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.totalPurchases}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">
                  {Math.round(stats.totalValue).toLocaleString()} MMK
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Quantity</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.totalQuantity}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isInvalidCompare && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
            You selected the current month. Please choose a different month.
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(4,max-content)] gap-5 items-end">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Category
              </label>

              <select
                value={selectedParentCategory}
                onChange={(e) => {
                  setSelectedParentCategory(e.target.value);
                  setSelectedCategory("");
                }}
                className="px-3 cursor-pointer py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
              >
                <option value="">All Categories</option>
                {categoryTree.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Sub Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm text-gray-900 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
                disabled={!selectedParentCategory}
              >
                <option value="">
                  {selectedParentCategory
                    ? "All Sub Categories"
                    : "Select category first"}
                </option>
                {subCategories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>Compare with Current Month</span>
              </div>

              <select
                value={selectedCompareMonth}
                onChange={(e) => setSelectedCompareMonth(e.target.value)}
                className="px-3 cursor-pointer py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
              >
                <option value="">Select Month</option>
                {availableMonths
                  .filter((m) => m.key !== currentMonthKey)
                  .map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedParentCategory("");
                  setSelectedCategory("");
                  setSelectedCompareMonth("");
                }}
                className="w-full cursor-pointer xl:w-auto px-4 py-2 bg-slate-600 text-white text-sm font-medium shadow-blue-500/10 hover:bg-slate-800 transition-colors focus:outline-none rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Purchase Records
            </h2>
          </div>

          {isComparisonMode && comparisonData ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Qty/Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonData.map((row) =>
                    row.months.map((m) => (
                      <tr
                        key={`${row.category_id}|${m.label}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 border-r">
                          {row.categoryName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r">
                          {m.label}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                          {m.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                          {Math.round(m.quantity_per_unit)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                          {m.unit_price.toFixed(2)} MMK
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                          {Math.round(m.discount_amount).toLocaleString()} MMK
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                          {Math.round(m.total_price).toLocaleString()} MMK
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ) : flatPurchases.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No purchases recorded
              </h3>
              <p className="text-gray-500">
                Add your first purchase to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-225 w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      DATE
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      ITEM
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      QUANTITY
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      QTY/UNIT
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      ORIGINAL PRICE
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      FINAL PRICE
                    </th>

                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      DISCOUNT
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {flatPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                          {new Date(
                            purchase.purchase_date,
                          ).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {purchase.categoryName}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {purchase.quantity}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {purchase.quantity_per_unit}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {calculateUnitPrice(
                          purchase.quantity,
                          purchase.quantity_per_unit,
                          purchase.discount_price,
                        ).toFixed(2)}{" "}
                        MMK
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {formatMMK(purchase.discount_price)} MMK
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                        {formatMMK(purchase.discount_amount)} MMK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
