export interface FinanceDocumentItem {
  id?: string | null;
  fileKey: string;
  fileName: string;
  mimeType?: string | null;
  url?: string | null;
}

const IMAGE_EXT_REGEX = /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic)$/i;
const PDF_EXT_REGEX = /\.pdf$/i;

export function isImageDocument(urlOrName: string | null | undefined): boolean {
  if (!urlOrName) return false;
  const clean = urlOrName.split("?")[0].split("#")[0];
  return IMAGE_EXT_REGEX.test(clean);
}

export function isPdfDocument(urlOrName: string | null | undefined): boolean {
  if (!urlOrName) return false;
  const clean = urlOrName.split("?")[0].split("#")[0];
  return PDF_EXT_REGEX.test(clean);
}

export function getDocumentFileName(urlOrKey: string | null | undefined): string {
  if (!urlOrKey) return "";
  const clean = urlOrKey.split("?")[0].split("#")[0];
  return clean.split("/").pop() || clean;
}
