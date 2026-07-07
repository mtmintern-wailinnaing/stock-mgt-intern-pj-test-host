// src/lib/validate.js
export function formatZodErrors(zodError) {
  const formattedErrors = {};

  if (!zodError) {
    return formattedErrors;
  }

  zodError.issues.forEach((issue) => {
    const path = issue.path.join(".");

    if (path) {
      formattedErrors[path] = issue.message;
    }
  });

  return formattedErrors;
}