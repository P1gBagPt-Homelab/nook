import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import { FinanceDocumentItem, isImageDocument } from "./documentUtils";

interface MultiDocumentPickerProps {
  documents: FinanceDocumentItem[];
  onChange: (docs: FinanceDocumentItem[]) => void;
  onError: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function MultiDocumentPicker({
  documents,
  onChange,
  onError,
  onUploadingChange,
}: MultiDocumentPickerProps) {
  const { t } = useTranslation();
  const { uploadPhoto, isUploading } = usePhotoUpload();

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    onUploadingChange?.(true);
    try {
      const uploaded: FinanceDocumentItem[] = [];
      for (const file of files) {
        const res = await uploadPhoto(file, "receipts");
        uploaded.push({
          fileKey: res.fileKey,
          fileName: file.name,
          mimeType: file.type || null,
          url: res.publicUrl,
        });
      }
      onChange([...documents, ...uploaded]);
      navigator.vibrate?.(25);
    } catch (err: any) {
      onError(translateApiError(t, err?.message, "expense.uploadFailed"));
    } finally {
      onUploadingChange?.(false);
    }
  }

  function handleRemove(index: number) {
    onChange(documents.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2.5">
      <label className="w-full min-h-[52px] px-4 py-2.5 rounded-2xl bg-[#F4F9F5] border border-dashed border-[#7DD3FC] hover:border-[#0369A1] flex items-center justify-between gap-3 cursor-pointer transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-[#14201A] font-display">
              {t("expense.receiptSnap")}
            </div>
            <div className="text-[11px] text-[#5B6B61] font-medium truncate">
              {t("expense.documentHint")}
            </div>
          </div>
        </div>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic"
          className="hidden"
          onChange={handleFilesSelected}
        />
      </label>

      {documents.length > 0 && (
        <div className="space-y-1.5">
          {documents.map((doc, idx) => {
            const isImg =
              doc.mimeType?.startsWith("image/") ||
              isImageDocument(doc.url || doc.fileName || doc.fileKey);
            return (
              <div
                key={`${doc.fileKey}-${idx}`}
                className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-[#F4F9F5] border border-[#E2ECE4]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImg && doc.url ? (
                    <img
                      src={doc.url}
                      alt={doc.fileName}
                      className="w-8 h-8 rounded-lg object-cover border border-[#E2ECE4] shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-[#14201A] truncate">
                    {doc.fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  aria-label={t("expense.removeDocumentAria")}
                  className="w-7 h-7 rounded-full hover:bg-[#FEE2E2] text-[#5B6B61] hover:text-[#DC2626] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
