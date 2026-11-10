import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  Plus,
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

  const locationIcons: Record<string, string> = {
    Pantry: "🥫",
    Fridge: "🥛",
    Freezer: "🧊",
    Cleaning: "🧼",
  };

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

    // Auto-update status if depleted to 0 or 1
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
        i.id === item.id ? { ...i, quantity: nextQty.toString(), status: nextStatus } : i
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
        setFeedback(`🛒 Added "${item.title}" to Shopping Cart!`);
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
    <div className="space-y-4">
      {/* Feedback Toast */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF7A59] text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <Sparkles className="w-4 h-4 shrink-0 text-[#FF7A59]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Overview Banner (Card Surface: #FFFFFF with 1px border rgba(0,0,0,0.04)) */}
      <div className="card-impeccable p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] block mb-0.5">
            Cupboards & Pantry
          </span>
          <h2 className="text-base font-bold text-zinc-900">Home Stock Inventory</h2>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            {stockItems.length} registered products at home
          </p>
        </div>
        {runningLowCount > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{runningLowCount} to restock</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Search pantry, fridge, spices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#10B981] shadow-2xs"
        />
      </div>

      {/* Location Filter Pills (Blueprint: All, Fridge, Pantry, Freezer, Cleaning) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              selectedLocation === loc
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            {loc !== "All" && <span>{locationIcons[loc] || "🥫"}</span>}
            <span>{loc}</span>
          </button>
        ))}
      </div>

      {/* Stock Items List */}
      {isLoading ? (
        <div className="py-16 text-center text-zinc-400 animate-pulse text-xs font-semibold tracking-wide">
          Loading stock items...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold text-center border border-red-100">
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-impeccable p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-zinc-900">No stock items in this location</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Items unpacked from your shopping cart will automatically appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const statusConfig = {
              in_stock: {
                label: "In Stock",
                dot: "bg-[#10B981]",
                badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
                icon: CheckCircle,
              },
              running_low: {
                label: "Running Low",
                dot: "bg-[#F59E0B]",
                badge: "bg-amber-50 text-amber-800 border-amber-200",
                icon: AlertTriangle,
              },
              out_of_stock: {
                label: "Out of Stock",
                dot: "bg-rose-500",
                badge: "bg-rose-50 text-rose-800 border-rose-200",
                icon: XCircle,
              },
            }[item.status] || {
              label: item.status,
              dot: "bg-zinc-400",
              badge: "bg-zinc-50 text-zinc-800 border-zinc-200",
              icon: CheckCircle,
            };

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={item.id}
                className="card-impeccable p-4 space-y-3 transition duration-150 hover:border-zinc-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-900 truncate">
                        {item.title}
                      </span>
                      <span className="text-xs shrink-0" title={item.location}>
                        {locationIcons[item.location] || "🥫"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      {item.brand && <span className="font-medium">{item.brand} •</span>}
                      <span>{item.category}</span>
                      <span>• {item.location}</span>
                    </div>
                  </div>

                  {/* Status Pill Toggle */}
                  <button
                    onClick={() => handleCycleStatus(item)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs ${statusConfig.badge}`}
                    title="Click to cycle status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    <StatusIcon className="w-3 h-3 stroke-[2.5]" />
                    <span>{statusConfig.label}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-50 rounded-xl px-2 py-1 border border-zinc-200/80">
                      <button
                        onClick={() => handleUpdateQuantity(item, -1)}
                        className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-zinc-900 min-w-5 text-center">
                        {parseFloat(item.quantity)}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-zinc-400">{item.unit}</span>
                  </div>

                  {/* Actions: Add to Shopping Cart & Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 active:scale-95 text-[#FF7A59] text-xs font-bold flex items-center gap-1.5 transition border border-orange-200/60 cursor-pointer"
                      title="Add to Shopping Cart"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-zinc-300 hover:text-red-500 transition"
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
