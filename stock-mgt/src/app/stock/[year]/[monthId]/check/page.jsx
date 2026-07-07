"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getWeeklyStockCheck, upsertWeeklyStockCheck } from "@/lib/api";
import { Pencil, ArrowLeft, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import StockCheckModal from "@/components/stock/StockCheckModal";
import { useRouter } from "next/navigation";
import { monthNames } from "@/lib/constant";

export default function StockCheckPage() {
  const router = useRouter();
  const params = useParams();
  const monthId = parseInt(params.monthId, 10);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCategories, setOpenCategories] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openCheckModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const toggleCategory = (id) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [canEdit, setCanEdit] = useState(false);
  const [monthTitle, setMonthTitle] = useState("");

  const fetchData = useCallback(async () => {
    if (!monthId) return;
    try {
      setLoading(true);
      const result = await getWeeklyStockCheck(monthId);
      setCategories(result.data);
      setCanEdit(result.isEditable);
      setMonthTitle(`${monthNames[result.month - 1]}_${result.year}`);

      const allCategoryIds = {};
      result.data.forEach((cat) => {
        allCategoryIds[cat.id] = true;
      });
      setOpenCategories(allCategoryIds);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [monthId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 mb-4 font-semibold">Error: {error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const handleSave = async (updatedData) => {
    try {
      const payload = {
        ...updatedData,
        month_id: monthId,
        category_id: updatedData.category_id,
      };
      const response = await upsertWeeklyStockCheck(payload);

      if (response.warning) {
        toast.warning(response.warning);
      } else {
        toast.success("Stock checked successfully!");
      }

      const result = await getWeeklyStockCheck(monthId);
      setCategories(result.data);
      setIsModalOpen(false);
      return true;
    } catch (error) {
      let errorMessage = "Failed to check stock.";
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      return false;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-slate-200">
      <div className="max-w-10xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
            >
              <ArrowLeft className="w-5 h-5 cursor-pointer" />
              <span>Back to Stock Management</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              Stock Check- {monthTitle || "Loading..."}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Review and update weekly usage / checking information
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700">
                <th className="px-3 py-3 text-center w-12 border-r border-gray-300">
                  Sr.
                </th>
                <th className="px-3 py-3 text-left border-r border-gray-300">
                  Item Description
                </th>
                {["1st", "2nd", "3rd", "4th", "5th"].map((week) => (
                  <th
                    key={week}
                    className="px-2 py-2 text-center text-sm font-medium text-red-600 border-r border-gray-300"
                  >
                    Used {week} Week
                  </th>
                ))}
                <th className="px-3 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((parent) => (
                <React.Fragment key={parent.id}>
                  {/* Parent Category */}
                  <tr
                    className="bg-slate-100 border-b border-gray-300 cursor-pointer"
                    onClick={() => toggleCategory(parent.id)}
                  >
                    <td className="border-r border-gray-300"></td>
                    <td
                      colSpan={6}
                      className="px-4 py-3 font-bold text-gray-800 items-center gap-2"
                    >
                      <span className="ml-auto text-xs">
                        {openCategories[parent.id] ? "▼ " : "▶ "}
                      </span>
                      {parent.name}
                    </td>
                    <td className="border-l border-gray-300"></td>
                  </tr>

                  {/* Sub-categories */}
                  {openCategories[parent.id] &&
                    (parent.children.length > 0 ? (
                      parent.children.map((child, index) => (
                        <tr
                          key={child.id}
                          className="border-b border-gray-200 hover:bg-slate-50"
                        >
                          <td className="px-4 py-2 text-center text-gray-700 border-r border-gray-300">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 text-left text-gray-700 pl-10 border-r border-gray-300">
                            {child.name}
                          </td>
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 text-gray-700 ${Number(child.checked_week_1) === 1 ? "bg-green-200" : ""}`}
                          >
                            {child.used_qty_1st_week ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 text-gray-700 ${Number(child.checked_week_2) === 1 ? "bg-green-200" : ""}`}
                          >
                            {child.used_qty_2nd_week ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 text-gray-700 ${Number(child.checked_week_3) === 1 ? "bg-green-200" : ""}`}
                          >
                            {child.used_qty_3rd_week ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 text-gray-700 ${Number(child.checked_week_4) === 1 ? "bg-green-200" : ""}`}
                          >
                            {child.used_qty_4th_week ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 text-center border-r border-gray-200 text-gray-700 ${Number(child.checked_week_5) === 1 ? "bg-green-200" : ""}`}
                          >
                            {child.used_qty_5th_week ?? 0}
                          </td>
                          <td className="text-center">
                            <button
                              disabled={!canEdit}
                              onClick={() => openCheckModal(child)}
                              className="p-1 hover:bg-gray-200 disabled:cursor-not-allowed cursor-pointer rounded text-gray-500 hover:text-green-600"
                              title="Edit Check"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-3 text-center text-gray-400 italic text-xs"
                        >
                          No items in {parent.name}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <StockCheckModal
            key={selectedItem?.id}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            monthId={monthId}
            selectedItem={selectedItem}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
