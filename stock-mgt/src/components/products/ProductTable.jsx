"use client";

import React from "react";
import { Edit3, PackageOpen } from "lucide-react";

export default function ProductTable({ products = [], onEdit }) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 bg-white shadow-sm flex flex-col items-center justify-center gap-2">
        <PackageOpen className="w-8 h-8 text-gray-400" />
        <p className="text-sm font-medium">
          No stock records found for this month.
        </p>
        <p className="text-xs text-gray-400">
          Click "+ Add Product" above to create your first entry.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4 text-center">Opening Qty</th>
              <th className="px-6 py-4 text-center">Closing Qty</th>
              <th className="px-6 py-4 text-center">Purchased Batches</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-blue-50/40 transition duration-150 ease-in-out"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {product.category_name || "Uncategorized Item"}
                </td>
                <td className="px-6 py-4 text-center font-mono font-medium">
                  {product.opening_qty || 0}
                </td>
                <td className="px-6 py-4 text-center font-mono font-medium">
                  {product.closing_qty || 0}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {product.raw_purchases?.length || 0} batches
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onEdit(product)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Batch
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
