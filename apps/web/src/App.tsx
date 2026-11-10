import { GroceryPage } from "./pages/GroceryPage";
import { Sparkles } from "lucide-react";

export function App() {
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
