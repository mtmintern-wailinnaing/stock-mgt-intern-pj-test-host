"use client";

import React, { useState, useEffect, Fragment, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  MONTHS,
  fetchComparisonData,
  getInitialComparisonData,
  validateSelection,
  generateSelectedMonthsRange,
} from "@/services/compare-stock.service";

export default function CompareStockPage() {
  const router = useRouter();

  const [years, setYears] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [comparisonData, setComparisonData] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // Error modal state
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    if (errorModal.isOpen) {
      const timer = setTimeout(() => {
        closeErrorModal();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorModal.isOpen]);

  const getYearValue = (y) => {
    if (!y) return "";
    let cleanYear = "";
    if (typeof y === "object") {
      cleanYear = String(y.year || y.value || y.yearNumber || "");
    } else {
      cleanYear = String(y);
    }
    return cleanYear.trim().toLowerCase() === "year" ? "" : cleanYear.trim();
  };

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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getInitialComparisonData();
        const cleanedYears = (data?.years || [])
          .map((y) => getYearValue(y))
          .filter(Boolean);

        setYears(cleanedYears);

        const fallbackYear =
          cleanedYears.length > 0
            ? cleanedYears[0]
            : String(new Date().getFullYear());

        const defaultStartYear =
          getYearValue(data?.defaultRange?.startYear) || fallbackYear;
        const defaultEndYear =
          getYearValue(data?.defaultRange?.endYear) || fallbackYear;
        const defaultStartMonth = data?.defaultRange?.startMonth || "01";
        const defaultEndMonth = data?.defaultRange?.endMonth || "02";

        setStartYear(defaultStartYear);
        setStartMonth(defaultStartMonth);
        setEndYear(defaultEndYear);
        setEndMonth(defaultEndMonth);

        const allMonths = generateSelectedMonthsRange(
          defaultStartYear,
          defaultStartMonth,
          defaultEndYear,
          defaultEndMonth,
        );

        setSelectedMonths(
          data?.selectedMonths && data.selectedMonths.length > 0
            ? data.selectedMonths
            : allMonths,
        );

        const dataToUse = data?.comparisonData || [];
        setComparisonData(dataToUse);

        if (dataToUse && dataToUse.length > 0) {
          const allCategories = new Set(
            dataToUse.map((item) => item.parentCategory || "Uncategorized"),
          );
          setExpandedCategories(allCategories);
        }
      } catch (err) {
        console.error("UI Initial Load Error:", err);
        openErrorModal("Failed to parse initial data layout.");
      }
    };

    loadInitialData();
  }, []);

  const handleCompare = async () => {
    const validation = validateSelection(
      startYear,
      startMonth,
      endYear,
      endMonth,
    );

    if (!validation.isValid) {
      openErrorModal(validation.message);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const data = await fetchComparisonData(
        startYear,
        startMonth,
        endYear,
        endMonth,
      );

      const allMonthsInRange = generateSelectedMonthsRange(
        startYear,
        startMonth,
        endYear,
        endMonth,
      );

      const dataToUse = data?.comparisonData || [];
      setComparisonData(dataToUse);
      setSelectedMonths(
        data?.selectedMonths && data.selectedMonths.length > 0
          ? data.selectedMonths
          : allMonthsInRange,
      );

      if (dataToUse && dataToUse.length > 0) {
        const allCategories = new Set(
          dataToUse.map((item) => item.parentCategory || "Uncategorized"),
        );
        setExpandedCategories(allCategories);
      } else {
        toast.info("No data found for the selected range.");
      }
    } catch (err) {
      console.error("Error handler caught:", err);

      openErrorModal(
        err.message || "Failed to load comparison data. Please try again.",
      );

      setComparisonData([]);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const groupedData = useMemo(() => {
    return (comparisonData || []).reduce((acc, item) => {
      const categoryKey = item.parentCategory || "Uncategorized";
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(item);
      return acc;
    }, {});
  }, [comparisonData]);

  const toggleCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const getMonthData = (item, monthIndex) => {
    if (item.months && item.months.length > monthIndex) {
      return item.months[monthIndex];
    }
    return null;
  };

  const ErrorModal = () => {
    if (!errorModal.isOpen) return null;

    return (
      <div className="fixed top-4 right-4 z-[9999]  pointer-events-auto max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
        <div className="bg-red-50 rounded-xl border border-red-200/50 p-4 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-50">
            <div className="h-full animate-[shrink_5s_linear_forwards] rounded-full" />
          </div>
          <button
            onClick={closeErrorModal}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pl-2 pr-6 pb-1">
            <div className="flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-600 font-medium leading-relaxed pr-4">
                {errorModal.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-200 bg-linear-to-br ">
      {/* Render ErrorModal Component */}
      <ErrorModal />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/stock")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Stock</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Compare Stock</h1>
          <p className="text-gray-600 mt-2">
            Select two months to compare stock data side by side
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Select Date Range
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-end gap-4">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                START DATE
              </label>
              <div className="grid grid-cols-5 gap-2">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {years
                    .filter((y) => y !== "")
                    .map((year, idx) => (
                      <option key={idx} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="col-span-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {MONTHS.map((month) => (
                    <option
                      key={month.id}
                      value={String(month.id).padStart(2, "0")}
                    >
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                END DATE
              </label>
              <div className="grid grid-cols-5 gap-2">
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {years
                    .filter((y) => y !== "")
                    .map((year, idx) => (
                      <option key={idx} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="col-span-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {MONTHS.map((month) => (
                    <option
                      key={month.id}
                      value={String(month.id).padStart(2, "0")}
                    >
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full lg:w-auto mt-2 lg:mt-0">
              <button
                onClick={handleCompare}
                disabled={isLoading}
                className="w-full lg:w-auto lg:min-w-[36px] px-6 py-2.5 bg-blue-600 text-white rounded-xl active:scale-[0.98] transition-all font-medium text-sm h-11 flex items-center justify-center disabled:bg-gray-400 disabled:text-gray-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Compare"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        {selectedMonths?.length > 0 && !isLoading && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  Comparison Results
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Comparison {selectedMonths.length} months
                </div>
              </div>
            </div>

            <div className="overflow-x-auto relative">
              <div className="min-w-max">
                <table className="w-full text-sm border-collapse relative">
                  <thead className="sticky top-0 z-30 bg-white">
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th
                        rowSpan={2}
                        className="px-4 py-3 text-left font-semibold text-gray-700 border-r-2 border-gray-400 sticky left-0 bg-gray-100 z-40 min-w-[60px]"
                      >
                        No
                      </th>
                      <th
                        rowSpan={2}
                        className="px-4 py-3 text-left font-semibold text-gray-700 border-r-2 border-gray-400 sticky left-[60px] bg-gray-100 z-40 min-w-[250px]"
                      >
                        Item Description
                      </th>

                      {selectedMonths.map((month, index) => (
                        <th
                          key={index}
                          colSpan={3}
                          className="px-4 py-3 text-center font-semibold text-gray-700 border-r-2 border-gray-400 bg-linear-to-b from-blue-50 to-gray-50"
                        >
                          <div className="font-bold text-base">
                            {month?.monthName}
                          </div>
                          <div className="text-xs font-normal text-gray-500">
                            {month?.year}
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-gray-50 border-b-2 border-gray-400">
                      {selectedMonths.map((_, monthIndex) => (
                        <Fragment key={monthIndex}>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-red-700 border-r border-gray-300 bg-red-50 min-w-[90px]">
                            <span>📉</span> Used Qty
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-blue-700 border-r border-gray-300 bg-blue-50 min-w-[90px]">
                            <span>📦</span> Purchase Qty
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 border-r-2 border-gray-400 bg-green-50 min-w-[100px]">
                            <span>💰</span> Purchase Price
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(groupedData).length === 0 ? (
                      <tr>
                        <td
                          colSpan={2 + selectedMonths.length * 3}
                          className="px-4 py-12 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-[48px] h-[48px] text-gray-400" />
                            <p>No data available for the selected date range</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        let globalRowNumber = 0;

                        return Object.entries(groupedData).map(
                          ([categoryKey, items]) => {
                            const isExpanded =
                              expandedCategories.has(categoryKey);

                            return (
                              <Fragment key={categoryKey}>
                                <tr className="bg-linear-to-r from-blue-100 to-blue-50 border-b-2 border-blue-300 hover:from-blue-200 hover:to-blue-100 transition-colors">
                                  <td className="px-4 py-3 sticky left-0 z-20 bg-linear-to-r from-blue-100 to-blue-50 border-r border-gray-300">
                                    <button
                                      onClick={() =>
                                        toggleCategory(categoryKey)
                                      }
                                      className="flex items-center gap-2 font-bold text-gray-800 text-base"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5 text-blue-600" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 sticky left-[60px] z-20 bg-linear-to-r from-blue-100 to-blue-50 border-r-2 border-gray-400">
                                    <span className="font-bold text-blue-900">
                                      {categoryKey}
                                    </span>
                                  </td>
                                  <td
                                    colSpan={selectedMonths.length * 3}
                                    className="bg-linear-to-r from-blue-100 to-blue-50"
                                  ></td>
                                </tr>

                                {isExpanded &&
                                  items.map((item, itemIndex) => {
                                    globalRowNumber += 1;

                                    return (
                                      <tr
                                        key={`${categoryKey}_${itemIndex}`}
                                        className="border-b border-gray-200 hover:bg-blue-50/20 transition-colors"
                                      >
                                        <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-300 sticky left-0 bg-white z-10 font-medium">
                                          {globalRowNumber}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 border-r-2 border-gray-400 sticky left-[60px] bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                          <div className="font-semibold">
                                            {item.itemDescription}
                                          </div>
                                        </td>

                                        {selectedMonths.map((_, mIdx) => {
                                          const monthData = getMonthData(
                                            item,
                                            mIdx,
                                          );

                                          return (
                                            <Fragment key={mIdx}>
                                              <td className="px-3 py-3 text-center border-r border-gray-300 bg-white">
                                                {monthData &&
                                                monthData.totalUsed !==
                                                  undefined &&
                                                monthData.totalUsed > 0 ? (
                                                  <span className="font-semibold text-red-700">
                                                    {monthData.totalUsed}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400">
                                                    -
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-3 py-3 text-center border-r border-gray-300 bg-white">
                                                {monthData &&
                                                monthData.totalPurchase !==
                                                  undefined &&
                                                monthData.totalPurchase > 0 ? (
                                                  <span className="font-semibold text-blue-700">
                                                    {monthData.totalPurchase}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400">
                                                    -
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-3 py-3 text-center border-r-2 border-gray-400 bg-white">
                                                {monthData &&
                                                monthData.price !== undefined &&
                                                monthData.price > 0 ? (
                                                  <span className="font-semibold text-green-700">
                                                    {monthData.price.toLocaleString()}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400">
                                                    -
                                                  </span>
                                                )}
                                              </td>
                                            </Fragment>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                              </Fragment>
                            );
                          },
                        );
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {Object.keys(groupedData).length > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      <strong>{Object.keys(groupedData).length}</strong>{" "}
                      categories
                    </span>
                    <span className="text-gray-400">•</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
