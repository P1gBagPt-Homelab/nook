import type { TranslationKey } from "./locales/en";
import type { TranslationParams } from "./types";

type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

const STORAGE_LOCATIONS = new Set([
  "All",
  "Pantry",
  "Fridge",
  "Freezer",
  "Cleaning",
]);

const ROOM_LOCATIONS = new Set([
  "Kitchen",
  "Laundry",
  "Utility",
  "Living Room",
  "Bathroom",
  "Home",
]);

const PRODUCT_CATEGORIES = new Set([
  "Produce",
  "Dairy",
  "Bakery",
  "Meat",
  "Pantry",
  "Beverage",
  "Frozen",
  "Household",
  "General",
]);

const SHORT_UNITS = new Set(["pcs", "pack", "bunch"]);

const FINANCE_CATEGORIES = new Set([
  "Groceries",
  "Utilities",
  "Household",
  "Dining",
]);

const KNOWN_API_ERRORS: Record<string, TranslationKey> = {
  "Invalid email or password.": "auth.login.invalidCredentials",
  "Setup has already been completed. Public registration is permanently closed.":
    "api.error.setupClosed",
  "A user with this email address already exists.": "api.error.emailExists",
  "Activation token is invalid or has expired.": "api.error.invalidToken",
  "Shopping item not found.": "api.error.itemNotFound",
  "Stock item not found.": "api.error.stockNotFound",
  "productId is required to add stock.": "api.error.productIdRequired",
  "Failed to get presigned upload URL": "api.error.presignedUrlFailed",
  "Direct S3 upload failed": "api.error.s3UploadFailed",
};

export function translateLocation(t: TranslateFn, location: string): string {
  if (STORAGE_LOCATIONS.has(location)) {
    return t(`location.${location}` as TranslationKey);
  }
  if (ROOM_LOCATIONS.has(location)) {
    return t(`asset.room.${location}` as TranslationKey);
  }
  return location;
}

export function translateProductCategory(t: TranslateFn, category: string): string {
  if (PRODUCT_CATEGORIES.has(category)) {
    return t(`product.cat.${category}` as TranslationKey);
  }
  return category;
}

export function translateUnit(t: TranslateFn, unit: string): string {
  if (SHORT_UNITS.has(unit)) {
    return t(`unit.short.${unit}` as TranslationKey);
  }
  return unit;
}

export function translateFinanceCategory(t: TranslateFn, name: string): string {
  if (FINANCE_CATEGORIES.has(name)) {
    return t(`api.finance.cat.${name}` as TranslationKey);
  }
  return name;
}

export function translateCartTitle(
  t: TranslateFn,
  title?: string | null
): string {
  if (!title || title === "Supermarket Run") {
    return t("cart.defaultTitle");
  }
  if (title === "Weekly Groceries") {
    return t("api.cart.weeklyGroceries");
  }
  return title;
}

export function translateExpenseTitle(t: TranslateFn, title: string): string {
  if (title === "Supermarket Trip") {
    return t("api.cart.supermarketTrip");
  }
  return title;
}

export function translateApiError(
  t: TranslateFn,
  detail: unknown,
  fallbackKey: TranslationKey
): string {
  if (typeof detail === "string") {
    const mappedKey = KNOWN_API_ERRORS[detail];
    if (mappedKey) {
      return t(mappedKey);
    }
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first.message === "string") {
      return first.message;
    }
  }
  return t(fallbackKey);
}
