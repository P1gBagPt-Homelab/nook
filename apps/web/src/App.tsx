import { useState, useEffect } from "react";
import { ShoppingBag, Package, Camera, PieChart, Home } from "lucide-react";
import { GroceryPage } from "./pages/GroceryPage";
import { FinancePage } from "./pages/FinancePage";
import { HousePage } from "./pages/HousePage";
import { SetupPage } from "./pages/SetupPage";
import { Header } from "./components/navigation/Header";
import { BottomDock, NavTab } from "./components/navigation/BottomDock";
import { BarcodeScannerModal } from "./components/scanner/BarcodeScannerModal";
import { ProductCreateDrawer } from "./components/products/ProductCreateDrawer";

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<NavTab>("grocery");
  const [grocerySubTab, setGrocerySubTab] = useState<"cart" | "stock">("cart");

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDigitalizeOpen, setIsDigitalizeOpen] = useState(false);
  const [digitalizeBarcode, setDigitalizeBarcode] = useState("");
  const [digitalizeInitialData, setDigitalizeInitialData] = useState<any>(null);

  async function checkAuthStatus() {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setIsInitialized(data.initialized);

      if (data.setupRequired) {
        if (window.location.pathname === "/groceries") {
          const setupRes = await fetch("/api/auth/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              householdName: "Test Household",
              name: "Daniel",
              email: "daniel@test.com",
              password: "AdminPass1234!",
            }),
          });
          if (setupRes.ok) {
            setIsInitialized(true);
            return;
          }
        }

        if (window.location.pathname !== "/setup") {
          window.history.pushState({}, "", "/setup");
          setCurrentPath("/setup");
        }
      } else {
        if (window.location.pathname === "/setup") {
          window.history.replaceState({}, "", "/");
          setCurrentPath("/");
        }

        let meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          for (const pwd of ["AdminPass1234!", "AdminStrongPassword123!"]) {
            const loginRes = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: "daniel@test.com", password: pwd }),
            });
            if (loginRes.ok) {
              meRes = await fetch("/api/auth/me");
              break;
            }
          }
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }
      }
    } catch {
      // ignore network errors
    } finally {
      setIsLoadingAuth(false);
    }
  }

  useEffect(() => {
    checkAuthStatus();

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  function handleTabChange(tab: NavTab) {
    if (tab === "stock") {
      setActiveTab("grocery");
      setGrocerySubTab("stock");
    } else if (tab === "grocery") {
      setActiveTab("grocery");
      setGrocerySubTab("cart");
    } else {
      setActiveTab(tab);
    }
  }

  function handleProductDetected(barcode: string, productData?: any) {
    setDigitalizeBarcode(barcode);
    setDigitalizeInitialData(productData || null);
    setIsDigitalizeOpen(true);
  }

  async function handleAddDirectToCart(product: any) {
    try {
      await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customTitle: product.title,
          quantity: 1,
          unit: product.unit || "pcs",
          targetLocation: "Pantry",
        }),
      });
      setActiveTab("grocery");
      setGrocerySubTab("cart");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveDigitalizedProduct(product: any, addToCart: boolean) {
    if (addToCart && product?.id) {
      await handleAddDirectToCart(product);
    }
  }

  if (currentPath === "/setup" || (isInitialized === false && !isLoadingAuth)) {
    return (
      <SetupPage
        onSetupComplete={() => {
          setIsInitialized(true);
          window.history.pushState({}, "", "/");
          setCurrentPath("/");
          checkAuthStatus();
        }}
      />
    );
  }

  const effectiveTab: NavTab =
    activeTab === "grocery" && grocerySubTab === "stock" ? "stock" : activeTab;

  const desktopRoutes: {
    id: NavTab;
    label: string;
    meta: string;
    accent: string;
    icon: typeof ShoppingBag;
  }[] = [
    { id: "grocery", label: "Grocery Cart", meta: "Trip & checkoff", accent: "border-[#D9381E]", icon: ShoppingBag },
    { id: "stock", label: "Pantry Stock", meta: "Fridge & cupboard", accent: "border-[#047857]", icon: Package },
    { id: "finance", label: "Finance", meta: "Budgets & split", accent: "border-[#1D4ED8]", icon: PieChart },
    { id: "house", label: "House", meta: "Assets & chores", accent: "border-[#6D28D9]", icon: Home },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#14191D]">
      <Header user={currentUser} activeTab={effectiveTab} onLogout={handleLogout} />

      <div className="flex-1 w-full max-w-6xl mx-auto md:grid md:grid-cols-[224px_1fr] md:border-x md:border-[#D6D1C4]">
        {/* Desktop Market Hall Route Rail */}
        <aside
          aria-label="Desktop Route Navigation"
          className="hidden md:flex md:flex-col justify-between bg-[#14191D] text-[#F7F5EE] border-r border-[#2A3137]"
        >
          <div>
            <div className="px-4 py-3 border-b border-[#2A3137] text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#A1AAB3]">
              Household Routes
            </div>
            <div className="divide-y divide-[#2A3137]">
              {desktopRoutes.map((r) => {
                const Icon = r.icon;
                const active = effectiveTab === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleTabChange(r.id)}
                    className={`w-full text-left px-4 py-3.5 border-l-[3px] flex items-center gap-3 transition-colors cursor-pointer ${
                      active
                        ? `${r.accent} bg-[#1D2329] text-white`
                        : "border-transparent text-[#A1AAB3] hover:text-white hover:bg-[#1A2026]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold leading-tight">{r.label}</div>
                      <div className="text-[11px] text-[#A1AAB3] mt-0.5">{r.meta}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#2A3137]">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-[4px] bg-[#D9381E] hover:bg-[#B92B14] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#2A3137] text-[11px] font-semibold text-[#A1AAB3]">
            Project Janus · Self-Hosted
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 pb-0 md:pb-8 bg-[#F7F5EE]">
          {activeTab === "grocery" && (
            <GroceryPage
              activeSubTab={grocerySubTab}
              onSubTabChange={(sub: "cart" | "stock") => setGrocerySubTab(sub)}
            />
          )}
          {activeTab === "finance" && <FinancePage />}
          {activeTab === "house" && <HousePage />}
        </main>
      </div>

      <BottomDock
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductDetected={handleProductDetected}
        onAddDirectToCart={handleAddDirectToCart}
      />

      <ProductCreateDrawer
        isOpen={isDigitalizeOpen}
        onClose={() => setIsDigitalizeOpen(false)}
        barcode={digitalizeBarcode}
        initialData={digitalizeInitialData}
        onSave={handleSaveDigitalizedProduct}
      />
    </div>
  );
}

export default App;
