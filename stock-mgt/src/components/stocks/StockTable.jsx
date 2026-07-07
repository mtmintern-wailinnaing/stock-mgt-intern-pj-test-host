"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import DeleteStockModal from "../deleteStockModel";
import { deleteItem } from "@/lib/api";
import { toast } from "sonner";

export default function StockTable({
  groupedProducts,
  expandedCategories,
  toggleExpand,
  canEdit,
  canDeleteProduct,
  isAtMinimumThreshold,
  calculateTotalPurchase,
  calculateTotalUsed,
  calculateClosingQty,
  router,
  loadData,
  onEdit,
}) {
  const [deleteStock, setDeleteStock] = useState({
    isOpen: false,
    id: null,
    description: "",
  });

  const openDeleteModal = (productId, itemDescription) => {
    setDeleteStock({
      isOpen: true,
      id: productId,
      description: itemDescription,
    });
  };

  const onDelete = async () => {
    const targetId = deleteStock.id;
    setDeleteStock({ isOpen: false, id: null, description: "" });
    try {
      await deleteItem(targetId);
      if (loadData) {
        await loadData();
        toast.success("Product deleted successfully");
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <DeleteStockModal
        isOpen={deleteStock.isOpen}
        itemName={deleteStock.description}
        onClose={() =>
          setDeleteStock({ isOpen: false, id: null, description: "" })
        }
        onConfirm={onDelete}
      />
      <table className="w-full text-sm border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300 text-gray-700">
            <th
              className="px-3 py-3 text-center font-semibold text-xs border-r bg-gray-100 border-gray-300"
              rowSpan={2}
            >
              Sr.
            </th>
            <th
              className="px-3 py-3 text-left font-semibold text-xs border-r bg-gray-100 border-gray-300"
              rowSpan={2}
            >
              Item Description
            </th>
            <th
              className="px-3 py-3 text-center font-semibold text-xs border-r bg-gray-100 border-gray-300"
              rowSpan={2}
            >
              Price
            </th>
            <th
              className="px-3 py-3 text-center font-semibold text-xs border-r bg-gray-100 border-gray-300"
              rowSpan={2}
            >
              Opening Qty
            </th>
            <th
              className="px-3 py-2 text-center font-semibold text-xs bg-blue-50 border-r border-gray-300"
              colSpan={3}
            >
              Purchasing Information
            </th>
            <th
              className="px-3 py-2 text-center font-semibold text-xs bg-gray-50 border-r border-gray-300"
              colSpan={6}
            >
              Checking Information
            </th>
            <th
              className="px-3 py-2 text-center font-semibold text-xs bg-yellow-50 border-r border-gray-300"
              colSpan={2}
            >
              Closing Information
            </th>
            <th
              className="px-3 py-3 text-center font-semibold text-xs border-l border-gray-300"
              rowSpan={2}
            >
              Action
            </th>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-300 text-gray-600">
            <th className="px-2 py-2 border-r border-gray-300 text-center text-[11px] font-light text-blue-500 bg-blue-50">
              1st time: Purchase Qty
            </th>
            <th className="px-2 border-r border-gray-300 py-2 text-center text-[11px] font-light text-blue-500 bg-blue-50">
              2nd time: Purchase Qty
            </th>
            <th className="px-2 border-r border-gray-300 py-2 text-center text-[11px] font-light text-blue-500 bg-blue-50">
              3rd time: Purchase Qty
            </th>
            <th className="px-3 py-2 text-center font-semibold text-xs bg-yellow-100 border-r border-gray-300">
              Total Purchase For This Month
            </th>
            <th className="px-2 py-2 border-r border-gray-300 text-center text-[11px] font-light text-red-500 bg-gray-50">
              Used Qty 1st Week
            </th>
            <th className="px-2 py-2 border-r border-gray-300 text-center text-[11px] font-light text-red-500 bg-gray-50">
              Used Qty 2nd Week
            </th>
            <th className="px-2 py-2 border-r border-gray-300 text-center text-[11px] font-light text-red-500 bg-gray-50">
              Used Qty 3rd Week
            </th>
            <th className="px-2 py-2 border-r border-gray-300 text-center text-[11px] font-light text-red-500 bg-gray-50">
              Used Qty 4th Week
            </th>
            <th className="px-2 py-2 border-r border-gray-300 text-center text-[11px] font-light text-red-500 bg-gray-50">
              Used Qty 5th Week
            </th>
            <th className="px-3 py-2 text-center font-semibold text-xs bg-yellow-100 border-r border-gray-300">
              Total Used Qty
            </th>
            <th className="px-3 py-2 text-center font-semibold text-xs bg-yellow-100 border-r border-gray-300">
              Closing Qty
            </th>
          </tr>
        </thead>

        <tbody>
          {groupedProducts.length === 0 ? (
            <tr className="text-center text-gray-500">
              <td colSpan={14} className="p-8">
                No products added
              </td>
            </tr>
          ) : (
            groupedProducts.map(({ parent, products: parentProducts }) => {
              const isParentExpanded = expandedCategories.has(
                String(parent.id),
              );

              return (
                <React.Fragment key={`parent-${parent.id}`}>
                  <tr className=" border-b border-gray-300 text-gray-900 font-bold">
                    <td className="px-3 py-2.5 border-r border-gray-200 text-center"></td>
                    <td
                      className="px-3 py-2 border-r border-gray-200 pl-4 font-medium text-gray-800"
                      colSpan={14}
                    >
                      <button
                        onClick={() => toggleExpand(parent.id)}
                        className="flex items-center gap-2 text-left w-full font-semibold text-gray-900"
                      >
                        {isParentExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        <span>
                          {parent.name ||
                            parentProducts[0]?.itemName ||
                            "Unknown Category"}
                        </span>
                        <span className="text-xs bg-green-600 px-1.5 py-0.5 rounded-full font-normal text-white ml-2">
                          {parentProducts.length} items
                        </span>
                      </button>
                    </td>
                  </tr>

                  {isParentExpanded && parentProducts.length === 0 && (
                    <tr className="border-b border-gray-200 bg-white italic text-gray-400 text-xs">
                      <td className="px-3 py-2 border-r border-gray-200"></td>
                      <td
                        className="px-3 py-2 border-r border-gray-200 pl-8"
                        colSpan={14}
                      >
                        No products found under this category.
                      </td>
                    </tr>
                  )}

                  {isParentExpanded &&
                    parentProducts.map((product, index) => {
                      const closingQty =
                        product.closing_qty ??
                        product.closingQty ??
                        calculateClosingQty(product);

                      const isDeletable = canDeleteProduct(product);
                      const productPrice = product.price || 0;
                      const openingQty =
                        product.opening_qty || product.openingQty || 0;

                      const safeProductKey =
                        product.id ||
                        product.monthly_stock_id ||
                        `prod-${parent.id}-${product.category_id || index}-${index}`;

                      return (
                        <tr
                          key={safeProductKey}
                          className={`border-b border-gray-200 hover:bg-blue-50/20 bg-white text-gray-600`}
                        >
                          <td className="px-3 py-2 text-center border-r border-gray-200 text-xs text-gray-400">
                            {index + 1}
                          </td>

                          <td className="px-3 py-2 border-r border-gray-200 pl-8 font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-medium">
                                {product.displayChildName ||
                                  product.itemName ||
                                  "No Name"}
                              </span>
                              {isAtMinimumThreshold(product) && (
                                <div className="relative inline-flex group">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600 ml-1 cursor-help" />

                                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-yellow-100 border border-yellow-300 px-3 py-1.5 text-xs text-yellow-800 shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none z-50">
                                    Current stock matches the minimum threshold.
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-2 text-center border-r border-gray-200 font-bold text-blue-600">
                            {Number(productPrice).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200">
                            {openingQty}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200 bg-blue-50/20">
                            {product.purchase_qty_1st ||
                              product.purchaseQty1st ||
                              0}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200 bg-blue-50/20">
                            {product.purchase_qty_2nd ||
                              product.purchaseQty2nd ||
                              0}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200 bg-blue-50/20">
                            {product.purchase_qty_3rd ||
                              product.purchaseQty3rd ||
                              0}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200 font-semibold text-red-600 bg-yellow-50">
                            {calculateTotalPurchase(product)}
                          </td>
                          {/* 1st Week */}
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 ${product.checked_week_1 === 1 ? "bg-green-200" : ""}`}
                          >
                            {product.used_qty_1st_week ||
                              product.usedQty1stWeek ||
                              0}
                          </td>

                          {/* 2nd Week */}
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 ${product.checked_week_2 === 1 ? "bg-green-200" : ""}`}
                          >
                            {product.used_qty_2nd_week ||
                              product.usedQty2ndWeek ||
                              0}
                          </td>

                          {/* 3rd Week */}
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 ${product.checked_week_3 === 1 ? "bg-green-200" : ""}`}
                          >
                            {product.used_qty_3rd_week ||
                              product.usedQty3rdWeek ||
                              0}
                          </td>

                          {/* 4th Week */}
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 ${product.checked_week_4 === 1 ? "bg-green-200" : ""}`}
                          >
                            {product.used_qty_4th_week ||
                              product.usedQty4thWeek ||
                              0}
                          </td>

                          {/* 5th Week */}
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 ${product.checked_week_5 === 1 ? "bg-green-200" : ""}`}
                          >
                            {product.used_qty_5th_week ||
                              product.usedQty5thWeek ||
                              0}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200 font-semibold text-red-600 bg-yellow-50">
                            {calculateTotalUsed(product)}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-gray-200 font-bold  text-red-600 bg-yellow-50">
                            {closingQty}
                          </td>

                          <td className="px-3 py-2 text-center border-l border-gray-300">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() =>
                                  onEdit(
                                    product.monthlyStockId,
                                    product.categoryId,
                                  )
                                }
                                disabled={!canEdit}
                                className="p-1 text-blue-600 cursor-pointer hover:text-blue-800 disabled:opacity-40"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  openDeleteModal(product.id, product.itemName)
                                }
                                disabled={!isDeletable}
                                className="p-1 text-red-600 cursor-pointer hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
