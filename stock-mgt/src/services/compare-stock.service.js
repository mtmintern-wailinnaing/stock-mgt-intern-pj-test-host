import { monthNames } from "@/lib/constant";

export const MONTHS = monthNames.map((name, index) => ({
  id: index + 1,
  name: name,
}));

export function generateSelectedMonthsRange(
  startYear,
  startMonth,
  endYear,
  endMonth,
) {
  const monthsRange = [];
  const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
  const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
  let current = new Date(start);

  while (current <= end) {
    const monthId = current.getMonth() + 1;
    const yearStr = String(current.getFullYear());
    const monthObj = MONTHS.find((m) => m.id === monthId);

    monthsRange.push({
      monthNumber: String(monthId).padStart(2, "0"),
      monthName: monthObj ? monthObj.name : "",
      year: yearStr,
    });

    current.setMonth(current.getMonth() + 1);
  }
  return monthsRange;
}

export function normalizeReportResponse(response, generatedMonths = []) {
  let comparisonData = [];
  let allCategories = new Set();

  if (response?.comparisonData && Array.isArray(response.comparisonData)) {
    comparisonData = response.comparisonData;
    comparisonData.forEach((item) => {
      if (item.parentCategory) {
        allCategories.add(item.parentCategory);
      }
    });
  }

  const finalSelectedMonths =
    response?.selectedMonths && response.selectedMonths.length > 0
      ? response.selectedMonths
      : generatedMonths;

  return {
    years: response?.years || [],
    months: response?.months || [],
    totalMonths: response?.totalMonths || 0,
    defaultRange: {
      startYear: response?.defaultRange?.startYear || "",
      startMonth: response?.defaultRange?.startMonth || "01",
      endYear: response?.defaultRange?.endYear || "",
      endMonth: response?.defaultRange?.endMonth || "02",
    },
    selectedMonths: finalSelectedMonths,
    comparisonData,
    allCategories,
    totalCategories: allCategories.size || response?.totalCategories || 0,
    totalItems: comparisonData.length || response?.totalItems || 0,
  };
}

export function getDefaultDateRange(baseYear) {
  const currentDate = new Date();
  const currentYear = baseYear ? parseInt(baseYear) : currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const defaultPrev = new Date(currentYear, currentMonth - 1, 1);
  return {
    startYear: String(defaultPrev.getFullYear()),
    startMonth: String(defaultPrev.getMonth() + 1).padStart(2, "0"),
    endYear: String(currentYear),
    endMonth: String(currentMonth + 1).padStart(2, "0"),
  };
}

export function getAvailableYears(months) {
  const yearSet = new Set();
  yearSet.add(String(new Date().getFullYear()));

  if (Array.isArray(months)) {
    months.forEach((m) => {
      if (!m) return;
      let y = typeof m === "object" ? m.year || m.value : m;
      if (y && String(y).toLowerCase() !== "year")
        yearSet.add(String(y).trim());
    });
  }
  return Array.from(yearSet).sort((a, b) => parseInt(a) - parseInt(b));
}

export async function getInitialComparisonData() {
  const now = new Date();
  const currentYear = String(now.getFullYear());

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startYear = String(lastMonthDate.getFullYear());
  const startMonth = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
  const endYear = currentYear;
  const endMonth = String(now.getMonth() + 1).padStart(2, "0");

  const lastYear = String(now.getFullYear() - 1);
  const years = [lastYear, currentYear];

  const defaultRange = {
    startYear,
    startMonth,
    endYear,
    endMonth,
  };

  try {
    const comparisonResult = await fetchComparisonData(
      defaultRange.startYear,
      defaultRange.startMonth,
      defaultRange.endYear,
      defaultRange.endMonth,
    );

    return {
      years,
      defaultRange,
      selectedMonths: comparisonResult?.selectedMonths || [],
      comparisonData: comparisonResult?.comparisonData || [],
      allCategories: comparisonResult?.allCategories || new Set(),
      totalCategories: comparisonResult?.totalCategories || 0,
      totalItems: comparisonResult?.totalItems || 0,
    };
  } catch (error) {
    console.error(" Background logic fallback:", error);
    const fallbackMonths = generateSelectedMonthsRange(
      defaultRange.startYear,
      defaultRange.startMonth,
      defaultRange.endYear,
      defaultRange.endMonth,
    );
    return {
      years,
      defaultRange,
      selectedMonths: fallbackMonths,
      comparisonData: [],
      allCategories: new Set(),
      totalCategories: 0,
      totalItems: 0,
    };
  }
}
export async function fetchComparisonData(
  startYear,
  startMonth,
  endYear,
  endMonth,
) {
  const generatedMonths = generateSelectedMonthsRange(
    startYear,
    startMonth,
    endYear,
    endMonth,
  );

  try {
    const response = await fetch(
      `/api/stock/compare-stock?startYear=${startYear}&startMonth=${startMonth}&endYear=${endYear}&endMonth=${endMonth}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      const htmlText = await response.text();
      console.error("Received HTML instead of JSON:", htmlText.slice(0, 300));
      throw new Error(
        `Server returned an invalid HTML page (Status ${response.status})`,
      );
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown backend error" }));
      throw new Error(
        errorData.error || `Failed to fetch data (Status ${response.status})`,
      );
    }

    const data = await response.json();
    return normalizeReportResponse(data, generatedMonths);
  } catch (error) {
    console.error("API Fetch Error:", error.message);
    throw error;
  }
}

export function validateSelection(startYear, startMonth, endYear, endMonth) {
  if (!startYear || !startMonth || !endYear || !endMonth) {
    return {
      isValid: false,
      message: "Please select all starting and ending dates.",
    };
  }
  if (
    new Date(parseInt(startYear), parseInt(startMonth) - 1, 1) >
    new Date(parseInt(endYear), parseInt(endMonth) - 1, 1)
  ) {
    return {
      isValid: false,
      message:
        "Invalid date range! End date must be after or equal to start date.",
    };
  }
  return { isValid: true, message: "" };
}
