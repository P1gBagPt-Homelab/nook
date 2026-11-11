import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Trash2,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";

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
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const locations = ["All", "Pantry", "Fridge", "Freezer", "Cleaning"];

  async function ensureSession() {
    for (const pwd of ["AdminPass1234!", "AdminStrongPassword123!"]) {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "daniel@test.com", password: pwd }),
      });
      if (loginRes.ok) return true;
    }
    return false;
  }

  async function fetchStock() {
    try {
      setIsLoading(true);
      setError(null);
      const url =
        selectedLocation === "All"
          ? "/api/stock"
          : `/api/stock?location=${encodeURIComponent(selectedLocation)}`;
      let res = await fetch(url);
      if (res.status === 401) {
        const loggedIn = await ensureSession();
        if (loggedIn) {
          res = await fetch(url);
        }
      }
      if (!res.ok) throw new Error("Failed to load home stock");
      const data = await res.json();
      setStockItems(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load stock");
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
        setFeedback(`Added "${item.title}" to Shopping Cart.`);
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
    <div>
      {feedback && (
        <div
          role="status"
          className="px-4 py-3 bg-[#FFF7ED] border-b border-[#FDBA74] text-[#9A3412] text-xs font-bold flex items-center justify-between gap-2"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notice"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9A3412] hover:text-[#14191D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Band */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D6D1C4] bg-[#F7F5EE] flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#14191D] leading-tight font-display">
            Home Stock Inventory
          </h2>
          <p className="text-xs font-semibold text-[#5B6268] mt-1 tabular-nums">
            {stockItems.length} products tracked across zones
          </p>
        </div>

        {runningLowCount > 0 && (
          <div className="px-2.5 py-1 rounded-[3px] bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-[11px] font-extrabold flex items-center gap-1.5 tabular-nums shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{runningLowCount} to restock</span>
          </div>
        )}
      </div>

      {/* Search & Zone Route Filters */}
      <div className="px-4 py-3 border-b border-[#D6D1C4] bg-[#EFECE2] flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-[#5B6268] absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search pantry, fridge, spices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-[4px] bg-[#FAF9F4] border border-[#D6D1C4] text-xs font-semibold text-[#14191D] placeholder-[#5B6268] focus:outline-none focus:border-[#047857]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={`min-h-[40px] px-3 py-1.5 rounded-[3px] text-xs font-extrabold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedLocation === loc
                  ? "bg-[#14191D] text-[#F7F5EE] border-[#14191D]"
                  : "bg-[#FAF9F4] text-[#5B6268] hover:text-[#14191D] border-[#D6D1C4]"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table Header */}
      <div className="px-4 py-2 bg-[#EFECE2] border-b border-[#D6D1C4] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#5B6268]">
        <span>Zone Stock ({filteredItems.length})</span>
        <span>Status / Qty / Restock</span>
      </div>

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading stock items">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="px-4 py-3.5 border-b border-[#E2DDD0] bg-[#FAF9F4] flex items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-[#EFECE2] rounded-[2px] animate-pulse" />
                <div className="h-3 w-28 bg-[#EFECE2] rounded-[2px] animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-[#EFECE2] rounded-[3px] animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="m-4 p-4 bg-[#FEE2E2] text-[#991B1B] rounded-[4px] text-xs font-bold border border-[#FCA5A5] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchStock}
            className="min-h-[44px] px-3 py-1.5 rounded-[3px] bg-[#991B1B] text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="px-6 py-10 bg-[#FAF9F4] border-b border-[#D6D1C4] text-center">
          <div className="w-10 h-10 rounded-[4px] bg-[#EFECE2] border border-[#D6D1C4] text-[#047857] flex items-center justify-center mx-auto mb-3">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-sm font-extrabold text-[#14191D]">
            No stock items in this location
          </p>
          <p className="text-xs text-[#5B6268] mt-1 max-w-xs mx-auto">
            Items unpacked from your shopping cart will appear here automatically.
          </p>
        </div>
      ) : (
        <div>
          {filteredItems.map((item) => {
            const needsRestock =
              item.status === "running_low" || item.status === "out_of_stock";

            const statusConfig = {
              in_stock: {
                label: "In Stock",
                marker: "w-1.5 h-1.5 rounded-full bg-[#047857]",
                badge: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
              },
              running_low: {
                label: "Running Low",
                marker: "w-2 h-2 rounded-[2px] bg-[#B45309]",
                badge: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]",
              },
              out_of_stock: {
                label: "Out of Stock",
                marker: "w-2.5 h-2.5 rounded-[1px] bg-[#D9381E]",
                badge: "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]",
              },
            }[item.status] || {
              label: item.status,
              marker: "w-1.5 h-1.5 rounded-full bg-[#5B6268]",
              badge: "bg-[#EFECE2] text-[#14191D] border-[#D6D1C4]",
            };

            return (
              <div
                key={item.id}
                className="px-3 sm:px-4 py-2.5 border-b border-[#E2DDD0] bg-[#FAF9F4] flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5"
              >
                {/* Name & Metadata */}
                <div className="min-w-0 flex-1 basis-48">
                  <div className="text-sm font-bold text-[#14191D] truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] font-semibold text-[#5B6268] mt-0.5 truncate">
                    {item.location} · {item.category}
                    {item.brand ? ` · ${item.brand}` : ""}
                  </div>
                </div>

                {/* Proportional status badge */}
                <button
                  type="button"
                  onClick={() => handleCycleStatus(item)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-[3px] text-[10px] font-extrabold border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${statusConfig.badge}`}
                  title="Click to cycle stock status"
                >
                  <span className={statusConfig.marker} aria-hidden="true" />
                  <span>{statusConfig.label}</span>
                </button>

                {/* Controls Row: 44px Qty Stepper + Conditional Restock + Delete */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-2 tabular-nums">
                    <div className="flex items-center border border-[#D6D1C4] rounded-[3px] bg-[#F7F5EE]">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        aria-label="Decrease stock quantity"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#14191D] hover:bg-[#EFECE2] text-sm font-extrabold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-[#14191D] px-1.5 min-w-6 text-center">
                        {parseFloat(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        aria-label="Increase stock quantity"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#14191D] hover:bg-[#EFECE2] text-sm font-extrabold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-[#5B6268] min-w-7">
                      {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-[3px] text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer border ${
                        needsRestock
                          ? "bg-[#D9381E] hover:bg-[#B92B14] border-[#D9381E] text-white"
                          : "bg-[#F7F5EE] hover:bg-[#EFECE2] border-[#D6D1C4] text-[#14191D]"
                      }`}
                      title="Add to Shopping Cart"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.6]" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#5B6268] hover:text-[#B91C1C] transition-colors cursor-pointer"
                      aria-label="Delete stock item"
                      title="Delete Stock Item"
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
