import { useState, useEffect } from "react";
import { ShoppingBag, Package, Camera, PieChart, Home } from "lucide-react";
import { GroceryPage } from "./pages/GroceryPage";
import { FinancePage } from "./pages/FinancePage";
import { HousePage } from "./pages/HousePage";
import { SetupPage } from "./pages/SetupPage";
import { LoginPage } from "./pages/LoginPage";
import { JoinPage } from "./pages/JoinPage";
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
        setCurrentUser(null);
        if (window.location.pathname !== "/setup") {
          window.history.pushState({}, "", "/setup");
          setCurrentPath("/setup");
        }
      } else {
        if (window.location.pathname === "/setup") {
          window.history.replaceState({}, "", "/");
          setCurrentPath("/");
        }

        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        } else {
          setCurrentUser(null);
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
    setCurrentUser(null);
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

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F4F9F5] text-[#14201A] flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" aria-hidden="true" />
          <span className="text-lg font-extrabold tracking-[-0.02em] font-display">Nook</span>
        </div>
      </div>
    );
  }

  if (currentPath === "/setup" || isInitialized === false) {
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

  if (currentPath === "/join") {
    return (
      <JoinPage
        onJoinSuccess={() => {
          window.history.replaceState({}, "", "/");
          setCurrentPath("/");
          checkAuthStatus();
        }}
        onNavigateLogin={() => {
          window.history.replaceState({}, "", "/");
          setCurrentPath("/");
        }}
      />
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={checkAuthStatus} />;
  }

  const effectiveTab: NavTab =
    activeTab === "grocery" && grocerySubTab === "stock" ? "stock" : activeTab;

  const desktopRoutes: {
    id: NavTab;
    label: string;
    meta: string;
    activeClass: string;
    icon: typeof ShoppingBag;
  }[] = [
    {
      id: "grocery",
      label: "Grocery Cart",
      meta: "Trip & checkoff",
      activeClass: "bg-[#DCFCE7] text-[#15803D]",
      icon: ShoppingBag,
    },
    {
      id: "stock",
      label: "Pantry Stock",
      meta: "Fridge & cupboard",
      activeClass: "bg-[#DCFCE7] text-[#15803D]",
      icon: Package,
    },
    {
      id: "finance",
      label: "Finance",
      meta: "Budgets & split",
      activeClass: "bg-[#E0F2FE] text-[#0369A1]",
      icon: PieChart,
    },
    {
      id: "house",
      label: "House",
      meta: "Assets & chores",
      activeClass: "bg-[#EDE9FE] text-[#6D28D9]",
      icon: Home,
    },
  ];

  return (
    <div className="h-[100dvh] overflow-hidden md:h-auto md:min-h-screen md:overflow-visible flex flex-col bg-[#F4F9F5] text-[#14201A]">
      <Header user={currentUser} activeTab={effectiveTab} onLogout={handleLogout} />

      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible w-full max-w-6xl mx-auto md:grid md:grid-cols-[248px_1fr] md:gap-6 md:px-6 md:py-6 md:items-start">
        {/* Desktop Botanical Floating Card Sidebar */}
        <aside
          aria-label="Desktop Route Navigation"
          className="hidden md:flex md:flex-col botanical-card h-fit sticky top-[84px] p-3.5 space-y-3"
        >
          <div className="space-y-1.5">
            {desktopRoutes.map((r) => {
              const Icon = r.icon;
              const active = effectiveTab === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleTabChange(r.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer ${
                    active
                      ? `${r.activeClass}`
                      : "text-[#5B6B61] hover:text-[#14201A] hover:bg-[#F4F9F5]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight font-display">{r.label}</div>
                    <div className="text-[11px] text-current/80 mt-0.5">{r.meta}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E2ECE4]">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-full bg-[#FF6B4A] hover:bg-[#FF5530] text-[#14201A] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer font-display"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          </div>

          <div className="pt-2.5 border-t border-[#E2ECE4] text-[11px] font-semibold text-[#5B6B61] px-1">
            Project Janus · Self-Hosted
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 pb-4 md:pb-8">
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
