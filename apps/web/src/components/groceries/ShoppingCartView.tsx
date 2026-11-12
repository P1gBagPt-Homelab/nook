import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import {
  Check,
  Plus,
  Trash2,
  ShoppingBag,
  Home,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Camera,
  Loader2,
  X,
} from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import { useTranslation } from "../../i18n/I18nContext";
import { translateCartTitle, translateLocation, translateUnit } from "../../i18n/helpers";

export interface ShoppingItem {
  id: string;
  listId: string;
  productId: string | null;
  customTitle: string | null;
  quantity: string;
  unit: string;
  estimatedPrice: string | null;
  isCollected: boolean;
  collectedAt: string | null;
  isTransferredToStock: boolean;
  targetLocation: string;
  notes: string | null;
  productTitle?: string | null;
  brand?: string | null;
  category?: string | null;
  imageKey?: string | null;
}

export interface ShoppingList {
  id: string;
  householdId: string;
  title: string;
  storeName: string | null;
  status: "preparing" | "shopping" | "completed" | "archived";
}

export function ShoppingCartView() {
  const { t } = useTranslation();
  const [cart, setCart] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemLocation, setNewItemLocation] = useState("Pantry");
  const [showAddForm, setShowAddForm] = useState(false);

  const [isUnpackDrawerOpen, setIsUnpackDrawerOpen] = useState(false);
  const [logExpense, setLogExpense] = useState(true);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState("");
  const [isUnpacking, setIsUnpacking] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [excludedItemIds, setExcludedItemIds] = useState<Set<string>>(new Set());

  const [showCollected, setShowCollected] = useState(true);

  const { uploadPhoto, isUploading: isUploadingReceipt } = usePhotoUpload();
  const [receiptImageKey, setReceiptImageKey] = useState<string | null>(null);

  async function fetchActiveCart() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/cart/active");
      if (res.status === 401) {
        throw new Error(t("cart.signInRequired"));
      }
      if (!res.ok) throw new Error(t("cart.loadFailed"));
      const data = await res.json();
      setCart(data.cart);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || t("cart.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchActiveCart();
  }, []);

  const toBuyItems = items.filter((i) => !i.isCollected);
  const collectedItems = items.filter((i) => i.isCollected);

  const totalItemsCount = items.length;
  const collectedCount = collectedItems.length;
  const progressPercent =
    totalItemsCount > 0 ? Math.round((collectedCount / totalItemsCount) * 100) : 0;

  const totalEstimatedPrice = items.reduce((acc, item) => {
    const p = parseFloat(item.estimatedPrice || "0");
    const q = parseFloat(item.quantity || "1");
    return acc + (isNaN(p) ? 0 : p * q);
  }, 0);

  const collectedEstimatedPrice = collectedItems.reduce((acc, item) => {
    const p = parseFloat(item.estimatedPrice || "0");
    const q = parseFloat(item.quantity || "1");
    return acc + (isNaN(p) ? 0 : p * q);
  }, 0);

  async function handleAddItem(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newItemTitle.trim()) return;

    const titleToAdd = newItemTitle.trim();
    const qtyToAdd = parseFloat(newItemQty) || 1;
    const priceToAdd = newItemPrice ? parseFloat(newItemPrice) : undefined;
    const locToAdd = newItemLocation;

    setNewItemTitle("");
    setNewItemPrice("");
    setNewItemQty("1");
    setShowAddForm(false);

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: cart?.id,
          customTitle: titleToAdd,
          quantity: qtyToAdd,
          estimatedPrice: priceToAdd,
          targetLocation: locToAdd,
        }),
      });

      if (res.ok) {
        const savedItem = await res.json();
        setItems((prev) => [...prev, savedItem]);
        navigator.vibrate?.(20);
      }
    } catch (err) {
      console.error(err);
      fetchActiveCart();
    }
  }

  async function handleToggleCollect(item: ShoppingItem) {
    const newStatus = !item.isCollected;
    navigator.vibrate?.(20);

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isCollected: newStatus } : i))
    );

    try {
      await fetch(`/api/cart/items/${item.id}/collect`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCollected: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchActiveCart();
    }
  }

  async function handleUpdateQuantity(
    item: ShoppingItem,
    delta: number,
    e?: React.MouseEvent
  ) {
    if (e) e.stopPropagation();
    const currentQty = parseFloat(item.quantity) || 1;
    const nextQty = Math.max(1, currentQty + delta);
    if (nextQty === currentQty) return;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: nextQty.toString() } : i))
    );

    try {
      await fetch(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: nextQty }),
      });
    } catch (err) {
      console.error(err);
      fetchActiveCart();
    }
  }

  async function handleDeleteItem(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      fetchActiveCart();
    }
  }

  function openUnpackDrawer() {
    setTotalExpenseAmount(
      collectedEstimatedPrice > 0 ? collectedEstimatedPrice.toFixed(2) : ""
    );
    setExcludedItemIds(new Set());
    setIsUnpackDrawerOpen(true);
  }

  function toggleExcludeItem(id: string) {
    setExcludedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadPhoto(file, "receipts");
      setReceiptImageKey(res.fileKey);
      navigator.vibrate?.(25);
    } catch (err) {
      console.error("Receipt upload error:", err);
    }
  }

  async function handleConfirmUnpack() {
    if (!cart?.id) return;
    setIsUnpacking(true);
    try {
      const res = await fetch(`/api/cart/${cart.id}/unpack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferAll: true,
          targetLocation: "Pantry",
          logExpense,
          totalAmount:
            logExpense && totalExpenseAmount ? parseFloat(totalExpenseAmount) : undefined,
          receiptImageKey: logExpense ? receiptImageKey || undefined : undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setIsUnpackDrawerOpen(false);
        navigator.vibrate?.(50);
        setFeedbackMsg(
          t("cart.unpackedFeedback", { count: result.unpackedCount })
        );
        setTimeout(() => setFeedbackMsg(null), 5000);
        await fetchActiveCart();
      }
    } catch (err: any) {
      alert(t("cart.unpackFailed", { message: err.message }));
    } finally {
      setIsUnpacking(false);
    }
  }

  if (isLoading && !cart) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={t("cart.loadingAria")}>
        <div className="flex justify-between items-center py-2">
          <div className="h-6 w-40 bg-[#E2ECE4] rounded-full animate-pulse" />
          <div className="h-7 w-20 bg-[#DCFCE7] rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="botanical-card p-4 flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-[#E2ECE4] rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-[#E2ECE4] rounded-full animate-pulse" />
              <div className="h-3 w-24 bg-[#EEF7F0] rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-14 bg-[#E2ECE4] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#FEE2E2] text-[#991B1B] rounded-[18px] text-xs font-bold border border-[#FCA5A5] flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={fetchActiveCart}
          className="min-h-[44px] px-4 py-1.5 rounded-full bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {feedbackMsg && (
        <div
          role="status"
          className="px-4 py-3 bg-[#DCFCE7] border border-[#86EFAC] rounded-[16px] text-[#15803D] text-xs font-bold flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            aria-label={t("common.dismissNotice")}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#15803D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Botanical Summary Header (matches botanical-lexend.html) */}
      <div className="px-1 pt-0.5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] leading-tight truncate font-display">
              {translateCartTitle(t, cart?.title)}
            </h1>
            <p className="text-xs font-semibold text-[#5B6B61] mt-0.5 tabular-nums">
              {t("cart.summary", { pending: toBuyItems.length, percent: progressPercent })}
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-sm font-extrabold font-display tabular-nums shrink-0">
            €{totalEstimatedPrice.toFixed(2)}
          </div>
        </div>

        <div className="w-full h-1.5 bg-[#E2ECE4] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#15803D] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Inline Add Form (when toggled open) */}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="botanical-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#14201A] font-display">
              {t("cart.addItemTitle")}
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="min-h-[36px] px-3 rounded-full text-xs font-bold text-[#5B6B61] hover:text-[#14201A] hover:bg-[#F4F9F5] cursor-pointer"
            >
              {t("common.cancel")}
            </button>
          </div>

          <input
            type="text"
            placeholder={t("cart.itemNamePlaceholder")}
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
            autoFocus
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("cart.qtyLabel")}
              </label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("cart.unitPriceLabel")}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("cart.storageLabel")}
              </label>
              <select
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#15803D]"
              >
                <option value="Pantry">{t("location.Pantry")}</option>
                <option value="Fridge">{t("location.Fridge")}</option>
                <option value="Freezer">{t("location.Freezer")}</option>
                <option value="Cleaning">{t("location.Cleaning")}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleAddItem}
            disabled={!newItemTitle.trim()}
            className="w-full min-h-[44px] py-2.5 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold font-display text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 pointer-events-none" />
            <span className="pointer-events-none">{t("cart.addToCart")}</span>
          </button>
        </form>
      )}

      {/* Phase 1: To Buy Botanical Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-[#5B6B61] font-display">
            {t("cart.toBuy", { count: toBuyItems.length })}
          </span>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A] text-xs font-bold transition-colors cursor-pointer font-display"
            >
              {t("cart.addItemButton")}
            </button>
          )}
        </div>

        {toBuyItems.length === 0 ? (
          <div className="botanical-card p-8 text-center">
            <div className="w-11 h-11 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#14201A] font-display">
              {t("cart.emptyTitle")}
            </p>
            <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
              {t("cart.emptySubtitle")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {toBuyItems.map((item) => {
              const qtyNum = parseFloat(item.quantity) || 1;
              const unitPriceNum = item.estimatedPrice
                ? parseFloat(item.estimatedPrice)
                : null;
              const lineTotal =
                unitPriceNum !== null && !isNaN(unitPriceNum)
                  ? unitPriceNum * qtyNum
                  : null;

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("button")) return;
                    handleToggleCollect(item);
                  }}
                  className="botanical-card px-3.5 py-2 hover:border-[#86EFAC] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCollect(item);
                      }}
                      aria-label={t("cart.collectAria")}
                      className="min-w-[44px] min-h-[44px] -ml-1.5 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <span className="w-[22px] h-[22px] rounded-full border-2 border-[#86EFAC] group-hover:border-[#16A34A] block transition-colors" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#14201A] truncate">
                        {item.productTitle || item.customTitle}
                      </div>
                      <div className="text-xs font-semibold text-[#5B6B61] truncate mt-0.5">
                        {translateLocation(t, item.targetLocation)}
                        {item.brand ? ` · ${item.brand}` : ""}
                        {unitPriceNum !== null && qtyNum > 1
                          ? ` · €${unitPriceNum.toFixed(2)}/${t("common.eachShort")}`
                          : ""}
                      </div>
                    </div>

                    {/* Desktop-inline pill stepper */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="hidden sm:flex items-center rounded-full bg-[#F4F9F5] border border-[#E2ECE4] shrink-0 tabular-nums"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleUpdateQuantity(item, -1, e)}
                        aria-label={t("cart.decreaseQtyAria")}
                        className="min-w-[44px] min-h-[44px] rounded-l-full flex items-center justify-center text-[#14201A] hover:bg-[#DCFCE7] text-sm font-extrabold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-[#14201A] px-1 min-w-6 text-center">
                        {qtyNum}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUpdateQuantity(item, 1, e)}
                        aria-label={t("cart.increaseQtyAria")}
                        className="min-w-[44px] min-h-[44px] rounded-r-full flex items-center justify-center text-[#14201A] hover:bg-[#DCFCE7] text-sm font-extrabold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Reconciled Line Total */}
                    <div className="text-right tabular-nums w-[68px] shrink-0">
                      <div className="text-sm font-bold text-[#14201A] font-display">
                        {lineTotal !== null ? `€${lineTotal.toFixed(2)}` : "—"}
                      </div>
                      <div className="text-[11px] font-semibold text-[#5B6B61] truncate">
                        {qtyNum} {translateUnit(t, item.unit)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="hidden sm:flex min-w-[44px] min-h-[44px] -mr-2 items-center justify-center text-[#5B6B61] hover:text-[#DC2626] transition-colors shrink-0 cursor-pointer"
                      aria-label={t("cart.removeItemAria")}
                      title={t("cart.removeTitle")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile compact control row so item title never truncates */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex sm:hidden items-center justify-between pl-[38px] mt-1"
                  >
                    <div className="flex items-center rounded-full bg-[#F4F9F5] border border-[#E2ECE4] tabular-nums">
                      <button
                        type="button"
                        onClick={(e) => handleUpdateQuantity(item, -1, e)}
                        aria-label={t("cart.decreaseQtyAria")}
                        className="min-w-[44px] min-h-[44px] rounded-l-full flex items-center justify-center text-[#14201A] hover:bg-[#DCFCE7] text-sm font-extrabold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-[#14201A] px-2 min-w-6 text-center">
                        {qtyNum}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUpdateQuantity(item, 1, e)}
                        aria-label={t("cart.increaseQtyAria")}
                        className="min-w-[44px] min-h-[44px] rounded-r-full flex items-center justify-center text-[#14201A] hover:bg-[#DCFCE7] text-sm font-extrabold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#5B6B61] hover:text-[#DC2626] transition-colors cursor-pointer"
                      aria-label={t("cart.removeItemAria")}
                      title={t("cart.removeTitle")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase 2: In-Store Collected Cards */}
      {collectedItems.length > 0 && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowCollected(!showCollected)}
            className="w-full min-h-[40px] px-1 flex items-center justify-between text-xs font-extrabold text-[#15803D] hover:text-[#16A34A] cursor-pointer font-display"
          >
            <span>{t("cart.collectedInCart", { count: collectedItems.length })}</span>
            {showCollected ? (
              <ChevronUp className="w-4 h-4 pointer-events-none" />
            ) : (
              <ChevronDown className="w-4 h-4 pointer-events-none" />
            )}
          </button>

          {showCollected && (
            <div className="space-y-2">
              {collectedItems.map((item) => {
                const qtyNum = parseFloat(item.quantity) || 1;
                const unitPriceNum = item.estimatedPrice
                  ? parseFloat(item.estimatedPrice)
                  : null;
                const lineTotal =
                  unitPriceNum !== null && !isNaN(unitPriceNum)
                    ? unitPriceNum * qtyNum
                    : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCollect(item)}
                    className="botanical-card-settled px-3.5 py-2.5 flex items-center gap-2 cursor-pointer"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCollect(item);
                      }}
                      aria-label={t("cart.collectAria")}
                      className="min-w-[44px] min-h-[44px] -ml-1.5 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <span className="w-[22px] h-[22px] rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3] pointer-events-none" />
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#475B4E] line-through truncate block">
                        {item.productTitle || item.customTitle}
                      </span>
                      <div className="text-xs font-semibold text-[#475B4E]">
                        {translateLocation(t, item.targetLocation)}
                      </div>
                    </div>

                    <div className="hidden sm:block w-[112px] text-center tabular-nums text-xs font-bold text-[#475B4E] shrink-0">
                      {qtyNum} {translateUnit(t, item.unit)}
                    </div>

                    <div className="text-right tabular-nums w-[68px] shrink-0">
                      <div className="text-sm font-bold text-[#15803D] font-display">
                        {lineTotal !== null ? `€${lineTotal.toFixed(2)}` : "—"}
                      </div>
                      <div className="sm:hidden text-[11px] font-semibold text-[#475B4E]">
                        {qtyNum} {translateUnit(t, item.unit)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      aria-label={t("cart.removeCollectedAria")}
                      className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#475B4E] hover:text-[#DC2626] transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Unpack CTA Pill: sticky in mobile scroll thumb-zone so always visible in first viewport */}
      <div
        className={
          collectedCount > 0
            ? "sticky bottom-0 z-20 md:static bg-[#F4F9F5]/95 pt-2 pb-1 md:pt-1 md:pb-0"
            : "hidden"
        }
      >
        <button
          type="button"
          onClick={openUnpackDrawer}
          className="w-full min-h-[48px] py-3.5 px-5 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold font-display text-sm flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 pointer-events-none">
            <Home className="w-4 h-4" />
            <span>{t("cart.unpackCta")}</span>
          </span>
          <ArrowRight className="w-4 h-4 opacity-90 pointer-events-none" />
        </button>
      </div>

      {/* Phase 3: Unpack Bottom Sheet Drawer (`Vaul`) */}
      <Drawer.Root open={isUnpackDrawerOpen} onOpenChange={setIsUnpackDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2" />

            <div className="px-5 py-3 border-b border-[#E2ECE4] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
                  {t("cart.unpackCta")}
                </Drawer.Title>
                <p className="text-xs text-[#5B6B61] font-medium">
                  {t("cart.unpackSubtitle", { count: collectedCount })}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-bold text-[#5B6B61] mb-2">
                  {t("cart.unpackManifest", {
                    count: collectedItems.length - excludedItemIds.size,
                  })}
                </div>
                <div className="max-h-44 overflow-y-auto border border-[#E2ECE4] rounded-2xl bg-[#F4F9F5] divide-y divide-[#E2ECE4]">
                  {collectedItems.map((item) => {
                    const isExcluded = excludedItemIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleExcludeItem(item.id)}
                        className={`px-3.5 py-2.5 flex items-center gap-3 cursor-pointer ${
                          isExcluded ? "bg-[#F4F9F5] text-[#475B4E]" : "bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleExcludeItem(item.id)}
                          className="w-4 h-4 rounded accent-[#16A34A] pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-[#14201A] truncate block">
                            {item.productTitle || item.customTitle}
                          </span>
                          <span className="text-[11px] text-[#5B6B61] tabular-nums">
                            {item.quantity} {translateUnit(t, item.unit)}
                          </span>
                        </div>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EEF7F0] text-[#15803D] font-bold">
                          {translateLocation(t, item.targetLocation)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#F4F9F5] rounded-2xl p-4 border border-[#E2ECE4] space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logExpense}
                    onChange={(e) => setLogExpense(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#0284C7]"
                  />
                  <span className="text-xs font-bold text-[#14201A]">
                    {t("cart.recordExpense")}
                  </span>
                </label>

                {logExpense && (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-[#5B6B61] font-bold text-xs">
                        €
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={t("cart.totalReceiptPlaceholder")}
                        value={totalExpenseAmount}
                        onChange={(e) => setTotalExpenseAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-white border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#0369A1]"
                      />
                    </div>

                    <label className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white border border-[#E2ECE4] text-xs text-[#14201A] cursor-pointer hover:border-[#0369A1] transition-colors">
                      <Camera className="w-4 h-4 text-[#0369A1]" />
                      <span className="font-bold flex-1">
                        {receiptImageKey
                          ? t("cart.receiptAttached")
                          : t("cart.attachReceiptOptional")}
                      </span>
                      {isUploadingReceipt && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0369A1]" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleReceiptUpload}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmUnpack}
                  disabled={isUnpacking}
                  className="w-full min-h-[48px] py-3 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUnpacking ? (
                    <span>{t("cart.unpacking")}</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 pointer-events-none" />
                      <span className="pointer-events-none">{t("cart.putAllIntoStock")}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsUnpackDrawerOpen(false)}
                  className="w-full min-h-[44px] py-2 rounded-full text-xs font-bold text-[#5B6B61] hover:text-[#14201A] cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

export default ShoppingCartView;
