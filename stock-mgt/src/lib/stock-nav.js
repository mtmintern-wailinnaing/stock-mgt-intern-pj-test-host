const STORAGE_KEY = "stockNavSource";

export function setStockNavSource(source) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, source);
  }
}

export function getStockNavSource() {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const value = sessionStorage.getItem(STORAGE_KEY);
  return value === "stock-mgt" ? "stock-mgt" : "dashboard";
}

export function isMonthStockPath(pathname) {
  if (!pathname) return false;

  return /^\/stock\/\d+\/\d+/.test(pathname);
}
