import {
  getCategoryByIdRepo,
  getCategoryByNameRepo,
  createCategoryRepo,
  getAllCategoriesRepo,
  updateCategoryRepo,
  deleteCategoryRepo,
  getSubcategoriesRepo,
  checkActiveStockRepo,
  checkPurchasesRepo,
} from "@/repositories/category.repo";
import { AppError } from "@/lib/errors";

export async function getAllCategoriesService() {
  try {
    const categories = await getAllCategoriesRepo();
    return {
      success: true,
      data: categories,
      message: "Categories retrieved successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to retrieve categories",
        details: error.message,
      },
    };
  }
}

export async function createCategoryService(data) {
  try {
    if (!data.name || data.name.trim() === "") {
      throw new AppError("Category name is required", 400, "VALIDATION_ERROR");
    }

    const name = data.name.trim();
    const existingCategory = await getCategoryByNameRepo(name);
    if (existingCategory) {
      throw new AppError(
        "A category with this name already exists",
        409,
        "DUPLICATE_CATEGORY",
      );
    }

    let parent_id = null;
    let minimum_threshold = 0;
    let remark = null;

    if (data.parentId) {
      parent_id = Number(data.parentId);

      const parentExists = await getCategoryByIdRepo(parent_id);
      if (!parentExists) {
        throw new AppError(
          "The selected parent category does not exist",
          404,
          "PARENT_NOT_FOUND",
        );
      }

      minimum_threshold = data.minimumThreshold
        ? Number(data.minimumThreshold)
        : 0;

      remark =
        data.remark && data.remark.trim() !== "" ? data.remark.trim() : null;
    }

    const result = await createCategoryRepo({
      name,
      parent_id,
      minimum_threshold,
      remark,
    });

    return {
      success: true,
      data: {
        id: result.insertId,
        name,
        parentId: parent_id,
        minimumThreshold: minimum_threshold,
        remark,
      },
      message: "Category created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: error.message || "failed to create category",
        details: error.details,
      },
    };
  }
}

export async function updateCategoryService(id, data) {
  try {
    const existingCategory = await getCategoryByIdRepo(id);
    if (!existingCategory) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
    if (!data.name || data.name.trim() === "") {
      throw new AppError("Category name is required", 400, "VALIDATION_ERROR");
    }
    const name = data.name.trim();

    const duplicateCategory = await getCategoryByNameRepo(name);
    if (duplicateCategory && duplicateCategory.id !== parseInt(id)) {
      throw new AppError(
        "A category with this name already exists",
        404,
        "DUPLICATE_CATEGORY",
      );
    }

    const updateData = {
      name,
      minimum_threshold:
        data.minimumThreshold !== undefined ? Number(data.minimumThreshold) : 0,
      remark:
        data.remark && data.remark.trim() !== "" ? data.remark.trim() : null,
    };

    await updateCategoryRepo(id, updateData);

    return {
      success: true,
      data: {
        id: parseInt(id),
        name,
        minimumThreshold: updateData.minimum_threshold,
        remark: updateData.remark,
      },
      message: "Category updated successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INERNAL_ERROR",
        message: "failed to update category",
        details: error.message,
      },
    };
  }
}

export async function deleteCategoryService(id) {
  try {
    const existingCategory = await getCategoryByIdRepo(id);
    if (!existingCategory) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    const hasStock = await checkActiveStockRepo(id);
    if (hasStock) {
      throw new AppError(
        "Cannot delete category with existing stock data",
        400,
        "STOCK_DATA_EXIST",
      );
    }

    const hasPurchases = await checkPurchasesRepo(id);
    if (hasPurchases) {
      throw new AppError(
        "Cannot delete category with existing purchases",
        400,
        "PURCHASES_EXIST",
      );
    }

    const subcategories = await getSubcategoriesRepo(id);

    if (subcategories && subcategories.length > 0) {
      const subcategoryNames = subcategories.map((c) => c.name).join(", ");
      throw new AppError(
        `Cannot delete category: stock quantity still exists in category or subcategories`,
      );
    }
    await deleteCategoryRepo(id);

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete category",
        details: error.message,
      },
    };
  }
}
