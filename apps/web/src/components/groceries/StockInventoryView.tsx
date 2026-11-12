import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Trash2,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import type { TranslationKey } from "../../i18n/locales/en";

export interface StockItem {
  id: string;
  householdId: string;
  productId: string;
  location: string;
  status: "in_stock" | "running_low" | "out_of_stock";
  quantity: string;
  unit: string;
  expiryDate: string | null;
  updatedAt: string;
  title: string;
  brand: string | null;
  category: string;
  imageKey: string | null;
}

export function StockInventoryView() {
  const { t } = useTranslation();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const locations = ["All", "Pantry", "Fridge", "Freezer", "Cleaning"];

  async function fetchStock() {
    try {
      setIsLoading(true);
      setError(null);
      const url =
        selectedLocation === "All"
          ? "/api/stock"
          : `/api/stock?location=${encodeURIComponent(selectedLocation)}`;
      const res = await fetch(url);
      if (res.status === 401) {
        throw new Error(t("stock.signInRequired"));
      }
      if (!res.ok) throw new Error(t("stock.loadFailed"));
      const data = await res.json();
      setStockItems(data || []);
    } catch (err: any) {
      setError(err.message || t("stock.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStock();
  }, [selectedLocation]);

  async function handleUpdateQuantity(item: StockItem, delta: number) {
    const currentQty = parseFloat(item.quantity) || 1;
    const nextQty = Math.max(0, currentQty + delta);

    let nextStatus = item.status;
    if (nextQty === 0) {
      nextStatus = "out_of_stock";
    } else if (nextQty <= 1 && item.status === "in_stock") {
      nextStatus = "running_low";
    } else if (nextQty > 1 && item.status === "out_of_stock") {
      nextStatus = "in_stock";
    }

    navigator.vibrate?.(15);
    setStockItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, quantity: nextQty.toString(), status: nextStatus }
          : i
      )
    );

    try {
      await fetch(`/api/stock/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: nextQty, status: nextStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchStock();
    }
  }

  async function handleCycleStatus(item: StockItem) {
    const cycleMap: Record<string, "in_stock" | "running_low" | "out_of_stock"> = {
      in_stock: "running_low",
      running_low: "out_of_stock",
      out_of_stock: "in_stock",
    };
    const nextStatus = cycleMap[item.status] || "in_stock";
    navigator.vibrate?.(20);

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
    );

    try {
      await fetch(`/api/stock/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchStock();
    }
  }

  async function handleAddToCart(item: StockItem) {
    navigator.vibrate?.(25);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          customTitle: item.title,
          quantity: 1,
          unit: item.unit,
          targetLocation: item.location,
        }),
      });

      if (res.ok) {
        setFeedback(t("stock.addedToCart", { title: item.title }));
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    navigator.vibrate?.(20);
    setStockItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/stock/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      fetchStock();
    }
  }

  const filteredItems = stockItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const runningLowCount = stockItems.filter(
    (i) => i.status === "running_low" || i.status === "out_of_stock"
  ).length;

  return (
    <div className="space-y-3.5">
      {feedback && (
        <div
          role="status"
          className="px-4 py-3 bg-[#FFF1EE] border border-[#FECAC0] rounded-[16px] text-[#C24124] text-xs font-bold flex items-center justify-between gap-2"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label={t("common.dismissNotice")}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Botanical Header */}
      <div className="px-1 pt-1 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[21px] font-bold tracking-[-0.025em] text-[#14201A] leading-tight font-display">
            {t("stock.title")}
          </h1>
          <p className="text-xs font-semibold text-[#5B6B61] mt-0.5 tabular-nums">
            {t("stock.trackedCount", { count: stockItems.length })}
          </p>
        </div>

        {runningLowCount > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-bold flex items-center gap-1.5 tabular-nums shrink-0 font-display">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{t("stock.toRestock", { count: runningLowCount })}</span>
          </div>
        )}
      </div>

      {/* Search & Zone Filter Pills */}
      <div className="space-y-2.5 md:flex md:items-center md:justify-between md:space-y-0 md:gap-3">
        <div className="relative md:flex-1">
          <Search className="w-4 h-4 text-[#5B6B61] absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder={t("stock.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-full bg-white border border-[#E2ECE4] text-xs font-semibold text-[#14201A] placeholder-[#5B6B61] focus:border-[#15803D]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border font-display ${
                selectedLocation === loc
                  ? "bg-[#14201A] text-white border-[#14201A]"
                  : "bg-white text-[#5B6B61] hover:text-[#14201A] border-[#E2ECE4]"
              }`}
            >
              {t(`location.${loc}` as TranslationKey)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5" aria-busy="true" aria-label={t("stock.loadingAria")}>
          {[1, 2, 3].map((row) => (
            <div key={row} className="botanical-card p-4 flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-[#E2ECE4] rounded-full animate-pulse" />
                <div className="h-3 w-28 bg-[#EEF7F0] rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-[#E2ECE4] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FEE2E2] text-[#991B1B] rounded-[18px] text-xs font-bold border border-[#FCA5A5] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchStock}
            className="min-h-[44px] px-4 py-1.5 rounded-full bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="botanical-card p-8 text-center">
          <div className="w-11 h-11 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto mb-3">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-[#14201A] font-display">
            {t("stock.emptyTitle")}
          </p>
          <p className="text-xs text-[#5B6B61] mt-1 max-w-xs mx-auto">
            {t("stock.emptySubtitle")}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const needsRestock =
              item.status === "running_low" || item.status === "out_of_stock";

            const statusConfig = {
              in_stock: {
                label: t("stock.status.in_stock"),
                marker: "w-2 h-2 rounded-full bg-[#16A34A]",
                badge: "bg-[#DCFCE7] text-[#15803D]",
              },
              running_low: {
                label: t("stock.status.running_low"),
                marker: "w-2.5 h-2.5 rounded-full bg-[#D97706]",
                badge: "bg-[#FEF3C7] text-[#92400E]",
              },
              out_of_stock: {
                label: t("stock.status.out_of_stock"),
                marker: "w-2.5 h-2.5 rounded-[3px] bg-[#DC2626]",
                badge: "bg-[#FEE2E2] text-[#991B1B]",
              },
            }[item.status] || {
              label: item.status,
              marker: "w-2 h-2 rounded-full bg-[#5B6B61]",
              badge: "bg-[#F4F9F5] text-[#14201A]",
            };

            const translatedLocation =
              ["Pantry", "Fridge", "Freezer", "Cleaning"].includes(item.location)
                ? t(`location.${item.location}` as TranslationKey)
                : item.location;

            return (
              <div
                key={item.id}
                className="botanical-card p-3.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1 basis-48">
                  <div className="text-sm font-bold text-[#14201A] truncate">
                    {item.title}
                  </div>
                  <div className="text-xs font-semibold text-[#5B6B61] mt-0.5 truncate">
                    {translatedLocation} · {item.category}
                    {item.brand ? ` · ${item.brand}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCycleStatus(item)}
                  className={`min-h-[36px] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 font-display ${statusConfig.badge}`}
                  title={t("stock.cycleStatusTitle")}
                >
                  <span className={statusConfig.marker} aria-hidden="true" />
                  <span>{statusConfig.label}</span>
                </button>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-2 tabular-nums">
                    <div className="flex items-center rounded-full bg-[#F4F9F5] border border-[#E2ECE4]">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        aria-label={t("stock.decreaseQtyAria")}
                        className="min-w-[44px] min-h-[44px] rounded-l-full flex items-center justify-center text-[#14201A] hover:bg-[#DCFCE7] text-sm font-extrabold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-[#14201A] px-1.5 min-w-6 text-center">
                        {parseFloat(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        aria-label={t("stock.increaseQtyAria")}
                        className="min-w-[44px] min-h-[44px] rounded-r-full flex items-center justify-center text-[#14201A] hover:bg-[#DCFCE7] text-sm font-extrabold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-[#5B6B61]">
                      {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer font-display ${
                        needsRestock
                          ? "bg-[#FF6B4A] hover:bg-[#FF5530] text-[#14201A]"
                          : "bg-[#F4F9F5] hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A]"
                      }`}
                      title={t("stock.addToCartTitle")}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.6] shrink-0" />
                      <span>{t("stock.addToCart")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#5B6B61] hover:text-[#DC2626] transition-colors cursor-pointer"
                      aria-label={t("stock.deleteAria")}
                      title={t("stock.deleteTitle")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StockInventoryView;
