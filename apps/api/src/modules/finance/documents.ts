import { eq } from "drizzle-orm";
import { FinanceDocumentInput } from "@nook/shared";
import { db as dbInstance } from "../../lib/db";
import { financeDocuments } from "../../lib/db/schema";
import { buildS3PublicUrl } from "../../lib/http-helpers";

type DbOrTx = typeof dbInstance | Parameters<Parameters<typeof dbInstance.transaction>[0]>[0];

export interface FormattedFinanceDocument {
  id: string | null;
  fileKey: string;
  fileName: string;
  mimeType: string | null;
  url: string | null;
}

export function formatFinanceDocument(doc: {
  id: string;
  fileKey: string;
  fileName: string;
  mimeType: string | null;
}): FormattedFinanceDocument {
  return {
    id: doc.id,
    fileKey: doc.fileKey,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    url: buildS3PublicUrl(doc.fileKey),
  };
}

export function buildDocumentList(
  docs: Array<{ id: string; fileKey: string; fileName: string; mimeType: string | null }>,
  legacyReceiptKey?: string | null
): FormattedFinanceDocument[] {
  if (docs.length > 0) {
    return docs.map(formatFinanceDocument);
  }
  if (legacyReceiptKey) {
    return [
      {
        id: null,
        fileKey: legacyReceiptKey,
        fileName: legacyReceiptKey.split("/").pop() || "document",
        mimeType: null,
        url: buildS3PublicUrl(legacyReceiptKey),
      },
    ];
  }
  return [];
}

export function normalizeDocumentInputs(
  documents: FinanceDocumentInput[] | undefined,
  legacyReceiptKey: string | null | undefined
): FinanceDocumentInput[] | undefined {
  if (documents !== undefined) {
    return documents;
  }
  if (legacyReceiptKey) {
    return [
      {
        fileKey: legacyReceiptKey,
        fileName: legacyReceiptKey.split("/").pop() || "document",
        mimeType: null,
      },
    ];
  }
  if (legacyReceiptKey === null) {
    return [];
  }
  return undefined;
}

export async function syncFinanceDocuments(
  tx: DbOrTx,
  householdId: string,
  target: { expenseId?: string; subscriptionPaymentId?: string },
  docs: FinanceDocumentInput[]
) {
  if (target.expenseId) {
    await tx.delete(financeDocuments).where(eq(financeDocuments.expenseId, target.expenseId));
  }
  if (target.subscriptionPaymentId) {
    await tx
      .delete(financeDocuments)
      .where(eq(financeDocuments.subscriptionPaymentId, target.subscriptionPaymentId));
  }

  if (docs.length === 0) {
    return [];
  }

  return tx
    .insert(financeDocuments)
    .values(
      docs.map((doc) => ({
        householdId,
        expenseId: target.expenseId ?? null,
        subscriptionPaymentId: target.subscriptionPaymentId ?? null,
        fileKey: doc.fileKey,
        fileName: doc.fileName,
        mimeType: doc.mimeType ?? null,
      }))
    )
    .returning();
}
