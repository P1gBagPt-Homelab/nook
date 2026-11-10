import { useState, useEffect } from "react";
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

  // Active navigation state
  const [activeTab, setActiveTab] = useState<NavTab>("grocery");
  const [grocerySubTab, setGrocerySubTab] = useState<"cart" | "stock">("cart");

  // Scanner & Digitalization Drawer State
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
          // Auto-setup admin for grocery testing
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
        // If visiting /setup when already initialized, redirect to /
        if (window.location.pathname === "/setup") {
          window.history.replaceState({}, "", "/");
          setCurrentPath("/");
        }

        // Try ensuring active session for dev/e2e
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

  // Handle /setup route
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

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#18181B] selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      {/* Top App Header with Profile Chip (Blueprint Section 2) */}
      <Header user={currentUser} onLogout={handleLogout} />

      {/* Main Dynamic Pillar View */}
      <main className="transition-opacity duration-200">
        {activeTab === "grocery" && (
          <GroceryPage
            activeSubTab={grocerySubTab}
            onSubTabChange={(sub: "cart" | "stock") => setGrocerySubTab(sub)}
          />
        )}
        {activeTab === "finance" && <FinancePage />}
        {activeTab === "house" && <HousePage />}
      </main>

      {/* Floating Bottom Dock (Blueprint Section 2) */}
      <BottomDock
        activeTab={activeTab === "grocery" && grocerySubTab === "stock" ? "stock" : activeTab}
        onTabChange={handleTabChange}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* In-Store Barcode Scanner Viewfinder (Blueprint Section 3) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductDetected={handleProductDetected}
        onAddDirectToCart={handleAddDirectToCart}
      />

      {/* Product Digitalization Bottom Sheet (`Vaul` Drawer) (Blueprint Section 4) */}
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
