"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeft, Bell, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getMonths,
  getMonthlyStockProducts,
  getProductEditTarget,
} from "@/lib/api";
import StockTable from "@/components/stocks/StockTable";
import {
  isMonthEditable,
  isMonthAddable,
  MONTH_READ_ONLY_MESSAGE,
  STOCK_CHECK_ERROR_MESSAGE,
} from "@/lib/stock-utils";
import { monthNames } from "@/lib/constant";
import ProductFormModal from "@/components/products/ProductForm";

export default function MonthStockPage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year;
  const monthId = params.monthId;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthInfo, setMonthInfo] = useState(null);
  const [allMonths, setAllMonths] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [showNotification, setShowNotification] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadData = useCallback(async () => {
    if (!monthId || !year) return;

    try {
      setLoading(true);
      setError("");

      const monthsData = await getMonths();
      setAllMonths(monthsData);

      const currentMonthInfo = monthsData.find(
        (m) =>
          String(m.id) === String(monthId) && String(m.year) === String(year),
      );

      if (!currentMonthInfo) {
        setError(
          `No stock record found for Year: ${year} with Month ID: ${monthId}`,
        );
        return;
      }

      setMonthInfo({
        month: currentMonthInfo.month,
        name: `${year}_${monthNames[currentMonthInfo.month - 1]}`,
      });

      const response = await getMonthlyStockProducts(monthId);

      const rawProducts = Array.isArray(response)
        ? response
        : response.products || [];

      setProducts(rawProducts);
    } catch (err) {
      setError(err.message || "Failed to load real-time stock data");
    } finally {
      setLoading(false);
    }
  }, [year, monthId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setShowNotification(false);
    }, 5000);
    return () => clearTimeout(hideTimer);
  }, []);

  const calculateTotalPurchase = (p) =>
    Number(p.purchase_qty_1st ?? p.purchaseQty1st ?? 0) +
    Number(p.purchase_qty_2nd ?? p.purchaseQty2nd ?? 0) +
    Number(p.purchase_qty_3rd ?? p.purchaseQty3rd ?? 0);

  const calculateTotalUsed = (p) =>
    Number(p.used_qty_1st_week ?? p.usedQty1stWeek ?? 0) +
    Number(p.used_qty_2nd_week ?? p.usedQty2ndWeek ?? 0) +
    Number(p.used_qty_3rd_week ?? p.usedQty3rdWeek ?? 0) +
    Number(p.used_qty_4th_week ?? p.usedQty4thWeek ?? 0) +
    Number(p.used_qty_5th_week ?? p.usedQty5thWeek ?? 0);

  const calculateClosingQty = (p) => Number(p.closing_qty ?? p.closingQty ?? 0);

  const isClosingQtyNegative = (product) => {
    return calculateClosingQty(product) < 0;
  };

  const isAtMinimumThreshold = (product) => {
    const threshold =
      product.minimum_threshold ?? product.minimumThreshold ?? 0;
    const currentStock = product.closing_qty ?? product.closingQty ?? 0;
    return currentStock <= threshold;
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const canEdit = monthInfo
    ? isMonthEditable(currentYear, currentMonth, Number(year), monthInfo.month)
    : false;

  const canAdd = monthInfo
    ? isMonthAddable(currentYear, currentMonth, Number(year), monthInfo.month)
    : false;

  const isPreviousMonth = () => {
    if (!monthInfo) return false;
    if (Number(year) < currentYear) return true;
    if (Number(year) === currentYear && monthInfo.month < currentMonth)
      return true;
    return false;
  };

  const canDeleteProduct = (product) => {
    if (!canEdit || isPreviousMonth()) return false;
    const opening = product.opening_qty ?? product.openingQty ?? 0;
    return Number(opening) === 0 && calculateTotalPurchase(product) === 0;
  };

  const toggleExpand = (categoryId) => {
    const newCollapsed = new Set(collapsedCategories);
    const idStr = String(categoryId);
    if (newCollapsed.has(idStr)) {
      newCollapsed.delete(idStr);
    } else {
      newCollapsed.add(idStr);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleDelete = (productId) => {
    if (!canEdit) {
      toast.error(MONTH_READ_ONLY_MESSAGE);
      return;
    }
    try {
      setProducts(products.filter((p) => String(p.id) !== String(productId)));
      toast.success("Product removed from view");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const groupedProducts = useMemo(() => {
    const groups = {};

    if (!Array.isArray(products)) return [];

    products.forEach((product) => {
      const parentName =
        product.parentName || product.category_name || product.categoryName;
      const parentId =
        product.parentId || product.parent_category_id || "parent-1";

      if (!groups[parentName]) {
        groups[parentName] = {
          parent: { id: parentId, name: parentName },
          products: [],
        };
      }

      const childName =
        product.productName ||
        product.product_name ||
        product.productDescription ||
        product.item_description ||
        product.itemDescription ||
        product.itemName ||
        "Unknown Item";

      groups[parentName].products.push({
        ...product,
        displayChildName: childName,
      });
    });

    return Object.values(groups);
  }, [products]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !monthInfo) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push("/stock")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Stock</span>
        </button>
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (msdId, categoryId) => {
    try {
      setLoading(true);

      const productData = await getProductEditTarget(msdId, categoryId);

      setSelectedProduct(productData);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error running edit setup handler:", err);
      toast.error(
        err.message || "Network interface error updating form records.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-8 relative min-h-screen bg-slate-200 selection:bg-blue-500/10">
      <div className="max-w-7xl mx-auto">
        {!canEdit && allMonths.length > 0 && (
          <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-sm">
            {MONTH_READ_ONLY_MESSAGE} This month is view-only.
          </div>
        )}
        {showNotification && products.some(isAtMinimumThreshold) && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <Bell className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">
              Warning: Some products have current stock at or below minimum
              threshold.
            </span>
          </div>
        )}
        {showNotification && products.some(isClosingQtyNegative) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <Bell className="w-5 h-5 text-red-600" />
            <span className="text-red-800">
              Warning: {STOCK_CHECK_ERROR_MESSAGE}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push(`/stock/${year}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
            >
              <ArrowLeft className="cursor-pointer w-5 h-5" />
              <span>Back to Months</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              Stock Management - {monthInfo?.name || year}
            </h1>
          </div>
          {canEdit && (
            <div className="flex items-center gap-3">
              <Link href={`/stock/${year}/${monthId}/check`}>
                <span className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <CheckCircle className="w-5 h-5" />
                  <span>Stock Check</span>
                </span>
              </Link>
              {canAdd && (
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          )}
        </div>
        <StockTable
          groupedProducts={groupedProducts}
          expandedCategories={
            new Set(
              groupedProducts
                .map((g) => String(g.parent.id))
                .filter((id) => !collapsedCategories.has(id)),
            )
          }
          toggleExpand={toggleExpand}
          canDeleteProduct={canDeleteProduct}
          calculateTotalPurchase={calculateTotalPurchase}
          calculateTotalUsed={calculateTotalUsed}
          calculateClosingQty={calculateClosingQty}
          isAtMinimumThreshold={isAtMinimumThreshold}
          canEdit={canEdit}
          handleDelete={handleDelete}
          router={router}
          year={year}
          monthId={monthId}
          loadData={loadData}
          onEdit={handleOpenEdit}
        />
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedProduct}
        onSuccess={loadData}
      />
    </div>
  );
}
