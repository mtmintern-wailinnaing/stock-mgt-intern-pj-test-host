import { NextResponse } from "next/server";
import { compareStockRepo } from "@/repositories/compare-stock.repo";
import { monthNames } from "@/lib/constant";

async function getStockComparisonReport(
  startYear,
  startMonth,
  endYear,
  endMonth,
) {
  const rows = await compareStockRepo.executeStockComparisonQuery(
    startYear,
    startMonth,
    endYear,
    endMonth,
  );

  const selectedMonths = [];
  let current = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
  const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);

  while (current <= end) {
    const mNum = String(current.getMonth() + 1).padStart(2, "0");
    selectedMonths.push({
      monthName: monthNames[current.getMonth()],
      year: String(current.getFullYear()),
      monthNumber: mNum,
    });
    current.setMonth(current.getMonth() + 1);
  }

  const itemMap = new Map();
  const allCategories = new Set();

  rows.forEach((row) => {
    const category = row.category_name || "Uncategorized";
    const itemDesc = row.item_description || "No Description";
    allCategories.add(category);

    const key = `${category}____${itemDesc}`;

    if (!itemMap.has(key)) {
      itemMap.set(key, {
        parentCategory: category,
        itemDescription: itemDesc,
        rawMonths: {},
      });
    }

    const totalUsed =
      // Fixed: Safe fallback evaluation sequence for week calculations
      Number(row.used_qty_1st_week || 0) +
      Number(row.used_qty_2nd_week || 0) +
      Number(row.used_qty_3rd_week || 0) +
      Number(row.used_qty_4th_week || 0) +
      Number(row.used_qty_5th_week || 0);

    const mNumKey = String(row.month_num).padStart(2, "0");
    itemMap.get(key).rawMonths[`${row.year}-${mNumKey}`] = {
      totalUsed: totalUsed,
      totalPurchase: Number(row.total_purchase_qty || 0),
      price: Number(row.unit_price || 0),
    };
  });

  const comparisonData = Array.from(itemMap.values()).map((item) => {
    const alignedMonths = selectedMonths.map((m) => {
      const lookupKey = `${m.year}-${m.monthNumber}`;
      return (
        item.rawMonths[lookupKey] || {
          totalUsed: 0,
          totalPurchase: 0,
          price: 0,
        }
      );
    });

    return {
      parentCategory: item.parentCategory,
      itemDescription: item.itemDescription,
      months: alignedMonths,
    };
  });

  return {
    success: true, // Let frontend know this data collection ran successfully
    years: [startYear, endYear],
    selectedMonths,
    comparisonData,
    allCategories: Array.from(allCategories),
    totalCategories: allCategories.size,
    totalItems: comparisonData.length,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startYear = searchParams.get("startYear");
  const startMonth = searchParams.get("startMonth");
  const endYear = searchParams.get("endYear");
  const endMonth = searchParams.get("endMonth");

  try {
    // Check if initial parameters are missing
    if (!startYear || !startMonth || !endYear || !endMonth) {
      const allYears = await compareStockRepo.getAvailableYears();

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const defaultPrev = new Date(currentYear, currentMonth - 1, 1);

      return NextResponse.json({
        success: false, // Informs UI that no generated report exists yet
        years: allYears,
        defaultRange: {
          startYear: String(defaultPrev.getFullYear()),
          startMonth: String(defaultPrev.getMonth() + 1).padStart(2, "0"),
          endYear: String(currentYear),
          endMonth: String(currentMonth + 1).padStart(2, "0"),
        },
        selectedMonths: [],
        comparisonData: [],
        allCategories: [],
        totalCategories: 0,
        totalItems: 0,
      });
    }

    const reportData = await getStockComparisonReport(
      startYear,
      startMonth,
      endYear,
      endMonth,
    );
    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Critical Route Handler Crash:", error);

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
