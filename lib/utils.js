import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Utility function for handling API errors consistently
export function extractErrorMessage(error) {
  if (!error.response?.data) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorData = error.response.data;
  
  // Handle non_field_errors (general validation errors)
  if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
    return errorData.non_field_errors.join(' ');
  }
  
  // Handle field-specific errors
  const fieldErrors = [];
  Object.keys(errorData).forEach(key => {
    if (key !== 'detail' && key !== 'error' && errorData[key]) {
      const errorMsg = Array.isArray(errorData[key]) 
        ? errorData[key].join(' ') 
        : errorData[key];
      fieldErrors.push(`${key}: ${errorMsg}`);
    }
  });
  
  if (fieldErrors.length > 0) {
    return fieldErrors.join(' ');
  }
  
  // Fallback to detail or error message
  return errorData.detail || errorData.error || 'An error occurred. Please try again.';
}