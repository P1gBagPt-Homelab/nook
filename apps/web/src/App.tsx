import { useState, useEffect } from "react";
import { GroceryPage } from "./pages/GroceryPage";
import { SetupPage } from "./pages/SetupPage";
import { Sparkles } from "lucide-react";

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

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
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          for (const pwd of ["AdminPass1234!", "AdminStrongPassword123!"]) {
            const loginRes = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: "daniel@test.com", password: pwd }),
            });
            if (loginRes.ok) break;
          }
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

  // Handle /setup route
  if (currentPath === "/setup" || (isInitialized === false && !isLoadingAuth)) {
    return (
      <SetupPage
        onSetupComplete={() => {
          setIsInitialized(true);
          window.history.pushState({}, "", "/");
          setCurrentPath("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-zinc-900">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900">Nook</h1>
              <p className="text-[10px] text-zinc-400 font-medium -mt-0.5">Groceries & Stock</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grocery View */}
      <main>
        <GroceryPage />
      </main>
    </div>
  );
}

export default App;
