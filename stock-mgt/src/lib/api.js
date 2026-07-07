import { toast } from "sonner";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(url, options = {}) {
  const MINIMUM_LOADING_TIME = 500;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const fetchPromise = await fetch(url, {
    ...options,
    headers,
  });

  const delayPromise = delay(MINIMUM_LOADING_TIME);
  const [res] = await Promise.all([fetchPromise, delayPromise]);
  if (res.status === 401 && url !== "/api/auth/login") {
    if (typeof window !== "undefined") {
      toast.error("Session expired. Please login again.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
    return new Promise(() => {});
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || JSON.stringify(data));
  }

  return res.json();
}

export async function loginUser(data) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export async function changePassword(data) {
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logoutUser() {
  return { success: true };
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "An unexpected network error occurred");
  }
  return data;
}

export async function getCategories() {
  const res = await request("/api/categories", {
    method: "GET",
    // headers: { "Cache-Control": "no-cache" },
  });
  return res;
}

export async function createCategory(categoryData) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categoryData),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(
      result.error?.message || result.message || "Something went wrong",
    );
  }
  return result;
}

export async function updateCategory(id, categoryData) {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categoryData),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(
      result.error?.message || result.message || "Failed to update category",
    );
  }
  return result;
}

export async function deleteCategory(id) {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(
      result.error?.message || result.message || "Failed to delete category",
    );
  }

  return result;
}

export const mapCategoryFromAPI = (item) => ({
  id: item.id,
  name: item.name,
  parentId: item.parent_id,
  remark: item.remark,
  minQuantity: item.minimum_threshold,
});

export async function getUsers() {
  return request("/api/users");
}

export async function createUser(data) {
  return request("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id) {
  return request(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export async function updateUser(id, updateData) {
  return request(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
}

export async function searchUsers(searchQuery) {
  return request(`/api/users?search=${encodeURIComponent(searchQuery)}`);
}

export async function getMonths(signal) {
  return request("/api/stock/months", { signal });
}

export async function createMonth(data) {
  return request("/api/stock/months", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProducts(year, month) {
  return request(`/api/stock/products?year=${year}&month=${month}`);
}

/**
 * @param {string|number} monthId
 */
export async function getMonthlyStockProducts(monthId) {
  const result = await request(`/api/stock/monthly/${monthId}`);

  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  if (result && Array.isArray(result.products)) return result.products;

  return [];
}
// stockcheck
export async function getWeeklyStockCheck(monthId) {
  return request(`/api/stockcheck?monthId=${monthId}`);
}

// stockcheck
export async function upsertWeeklyStockCheck(payload) {
  const res = await fetch("/api/stockcheck", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || JSON.stringify(data.errors));
  }
  return data;
}

export async function getAllPurchases() {
  return request("/api/purchases");
}

export async function getStockComparisonReport(
  startYear,
  startMonth,
  endYear,
  endMonth,
) {
  try {
    const res = await fetch(
      `/api/compare-stock?startYear=${startYear}&startMonth=${startMonth}&endYear=${endYear}&endMonth=${endMonth}`,
      { method: "GET", headers: { "Cache-Control": "no-cache" } },
    );

    if (!res.ok) {
      console.warn(
        `[Bypass 404] Handled status: ${res.status}. Rendering table wireframe.`,
      );
      return {
        success: true,
        years: [startYear],
        selectedMonths: [
          { monthName: "Start Month", year: startYear },
          { monthName: "End Month", year: endYear },
        ],
        groupedData: {},
        comparisonData: [],
      };
    }

    return await res.json();
  } catch (error) {
    console.error("⚠️ Guarded fetch failure:", error.message);
    return {
      success: true,
      years: [startYear],
      selectedMonths: [],
      groupedData: {},
      comparisonData: [],
    };
  }
}
export async function deleteItem(targetId) {
  const response = await fetch(`/api/stock/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryId: targetId,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed");
  }

  return result;
}

// add products
export async function addProduct(data) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorInstance = new Error(resData.message || "Operation failed");
    errorInstance.status = res.status;
    errorInstance.errors = resData.errors || null;
    throw errorInstance;
  }
  return resData;
}

// get purchase for edit
export async function getProductEditTarget(msdId, categoryId) {
  const url = `/api/products/edit-target?msdId=${msdId || ""}&categoryId=${categoryId || ""}`;

  const result = await request(url, { method: "GET" });
  return result.product;
}
