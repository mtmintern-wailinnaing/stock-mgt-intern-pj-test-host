export const MONTH_READ_ONLY_MESSAGE =
  "This month's data is read-only. You can only edit the current or previous month.";

  export const STOCK_CHECK_ERROR_MESSAGE =
  "Some products have a negative closing quantity. Please verify the stock data!"

export function isMonthEditable(
  currentYear,
  currentMonth,
  targetYear,
  targetMonth,
) {
  const cYear = Number(currentYear);
  const cMonth = Number(currentMonth);
  const tYear = Number(targetYear);
  const tMonth = Number(targetMonth);

  if (cYear === tYear && cMonth === tMonth) {
    return true;
  }

  const isPrevMonthSameYear = cYear === tYear && tMonth === cMonth - 1;

  const isDecemberPrevYear =
    cYear - tYear === 1 && cMonth === 1 && tMonth === 12;

  return isPrevMonthSameYear || isDecemberPrevYear;
}

export function validateMonth(targetYear, targetMonth) {
  const now = new Date();
  const isEditable = isMonthEditable(
    now.getFullYear(),
    now.getMonth() + 1,
    targetYear,
    targetMonth
  );

  if (!isEditable) {
    throw new Error(MONTH_READ_ONLY_MESSAGE);
  }
  
  return true;
}

export function isMonthAddable(
  currentYear,
  currentMonth,
  targetYear,
  targetMonth,
) {
  const cYear = Number(currentYear);
  const cMonth = Number(currentMonth);
  const tYear = Number(targetYear);
  const tMonth = Number(targetMonth);

  return cYear === tYear && cMonth === tMonth;
}
