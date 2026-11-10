import { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Trash2,
  ShoppingBag,
  Home,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  const [cart, setCart] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New item form state
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemLocation, setNewItemLocation] = useState("Pantry");
  const [showAddForm, setShowAddForm] = useState(false);

  // Unpack modal state
  const [isUnpackModalOpen, setIsUnpackModalOpen] = useState(false);
  const [logExpense, setLogExpense] = useState(true);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState("");
  const [isUnpacking, setIsUnpacking] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Accordion for collected items
  const [showCollected, setShowCollected] = useState(true);

  async function fetchActiveCart() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/cart/active");
      if (!res.ok) throw new Error("Failed to load active cart");
      const data = await res.json();
      setCart(data.cart);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || "Could not fetch cart");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchActiveCart();
  }, []);

  const toBuyItems = items.filter((i) => !i.isCollected);
  const collectedItems = items.filter((i) => i.isCollected);

  // Calculate totals
  const totalItemsCount = items.length;
  const collectedCount = collectedItems.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((collectedCount / totalItemsCount) * 100) : 0;

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

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: cart?.id,
          customTitle: newItemTitle.trim(),
          quantity: parseFloat(newItemQty) || 1,
          estimatedPrice: newItemPrice ? parseFloat(newItemPrice) : undefined,
          targetLocation: newItemLocation,
        }),
      });

      if (res.ok) {
        setNewItemTitle("");
        setNewItemPrice("");
        setNewItemQty("1");
        setShowAddForm(false);
        fetchActiveCart();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleCollect(item: ShoppingItem) {
    const newStatus = !item.isCollected;
    // Optimistic UI update
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

  async function handleUpdateQuantity(item: ShoppingItem, delta: number) {
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

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      fetchActiveCart();
    }
  }

  function openUnpackModal() {
    setTotalExpenseAmount(
      collectedEstimatedPrice > 0 ? collectedEstimatedPrice.toFixed(2) : ""
    );
    setIsUnpackModalOpen(true);
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
          totalAmount: logExpense && totalExpenseAmount ? parseFloat(totalExpenseAmount) : undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setIsUnpackModalOpen(false);
        setFeedbackMsg(`✨ Successfully stocked ${result.unpackedCount} items into your pantry!`);
        setTimeout(() => setFeedbackMsg(null), 5000);
        await fetchActiveCart();
      }
    } catch (err: any) {
      alert("Failed to unpack: " + err.message);
    } finally {
      setIsUnpacking(false);
    }
  }

  const locationIcons: Record<string, string> = {
    Pantry: "🥫",
    Fridge: "🥛",
    Freezer: "🧊",
    Cleaning: "🧼",
  };

  if (isLoading && !cart) {
    return (
      <div className="py-12 text-center text-zinc-400 animate-pulse text-sm">
        Loading active cart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 transition animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Shopping Trip Progress & Metrics Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <span>{cart?.title || "Active Shopping List"}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {collectedCount} of {totalItemsCount} items collected ({progressPercent}%)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 font-medium">Estimated</span>
            <div className="text-lg font-bold text-zinc-900">
              €{totalEstimatedPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF7A59] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Arrived Home / Unpack CTA */}
        {collectedCount > 0 && (
          <button
            onClick={openUnpackModal}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
          >
            <Home className="w-4 h-4" />
            <span>Arrived Home? Unpack {collectedCount} Items to Stock</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-80" />
          </button>
        )}
      </div>

      {/* Quick Add Toggle / Form */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-zinc-100">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 transition text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#FF7A59]" />
            <span>Add Item to Cart</span>
          </button>
        ) : (
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">Quick Add Item</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g. Greek Yogurt, Eggs, Olive Oil *"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
              autoFocus
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Qty</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Est. Price (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Location</label>
                <select
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                >
                  <option value="Pantry">🥫 Pantry</option>
                  <option value="Fridge">🥛 Fridge</option>
                  <option value="Freezer">🧊 Freezer</option>
                  <option value="Cleaning">🧼 Clean</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!newItemTitle.trim()}
              className="w-full py-2.5 rounded-xl bg-[#FF7A59] hover:bg-[#ff6842] text-white font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Shopping Cart</span>
            </button>
          </form>
        )}
      </div>

      {/* Phase 1: To Buy Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            To Buy ({toBuyItems.length})
          </span>
        </div>

        {toBuyItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-zinc-100 shadow-xs">
            <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-800">Your cart is empty</p>
            <p className="text-xs text-zinc-400 mt-1">
              Add products or check items from your stock inventory below!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {toBuyItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 shadow-xs border border-zinc-100 flex items-center gap-3 transition hover:border-zinc-200"
              >
                <button
                  onClick={() => handleToggleCollect(item)}
                  className="w-7 h-7 rounded-full border-2 border-zinc-300 hover:border-[#FF7A59] flex items-center justify-center transition shrink-0"
                >
                  <Circle className="w-4 h-4 text-transparent hover:text-zinc-300" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                      {item.productTitle || item.customTitle}
                    </span>
                    <span className="text-xs" title={item.targetLocation}>
                      {locationIcons[item.targetLocation] || "🥫"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.brand && (
                      <span className="text-[11px] text-zinc-400">{item.brand} •</span>
                    )}
                    <span className="text-[11px] text-zinc-500 font-medium">
                      {item.quantity} {item.unit}
                    </span>
                    {item.estimatedPrice && (
                      <span className="text-[11px] text-zinc-400 font-medium">
                        • €{parseFloat(item.estimatedPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Adjustment */}
                <div className="flex items-center gap-1 bg-zinc-50 rounded-xl px-1.5 py-1 border border-zinc-100">
                  <button
                    onClick={() => handleUpdateQuantity(item, -1)}
                    className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-800 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold text-zinc-700 min-w-4 text-center">
                    {parseFloat(item.quantity)}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item, 1)}
                    className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-800 text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-zinc-300 hover:text-red-500 transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 2: In-Store Collected Section */}
      {collectedItems.length > 0 && (
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowCollected(!showCollected)}
            className="w-full flex items-center justify-between px-1 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-700"
          >
            <span>
              Collected in Cart ({collectedItems.length})
            </span>
            {showCollected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCollected && (
            <div className="space-y-2 opacity-90">
              {collectedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-emerald-50/50 rounded-2xl p-3.5 shadow-2xs border border-emerald-100/80 flex items-center gap-3 transition"
                >
                  <button
                    onClick={() => handleToggleCollect(item)}
                    className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center transition shrink-0"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-500 line-through truncate block">
                      {item.productTitle || item.customTitle}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span>{item.quantity} {item.unit}</span>
                      <span>• {locationIcons[item.targetLocation] || "🥫"} {item.targetLocation}</span>
                      {item.estimatedPrice && (
                        <span>• €{parseFloat(item.estimatedPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-zinc-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 3 Modal: Arrived Home Unpack to Stock */}
      {isUnpackModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto sm:hidden" />

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Arrived Home</h3>
              <p className="text-xs text-zinc-500">
                Transfer {collectedCount} collected items directly into household Stock.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={logExpense}
                  onChange={(e) => setLogExpense(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-zinc-800">
                  Log trip expense to Finance module
                </span>
              </label>

              {logExpense && (
                <div className="relative pt-1">
                  <span className="absolute left-3 top-3.5 text-zinc-400 font-semibold text-xs">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Total receipt amount"
                    value={totalExpenseAmount}
                    onChange={(e) => setTotalExpenseAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmUnpack}
                disabled={isUnpacking}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUnpacking ? (
                  <span>Unpacking...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Stock Pantry</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsUnpackModalOpen(false)}
                className="w-full py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShoppingCartView;
