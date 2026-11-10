import { useState } from "react";
import { Sparkles } from "lucide-react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAFAF8] text-neutral-800">
      <main className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-neutral-200/80 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 text-white shadow-sm">
          <Sparkles className="w-6 h-6 text-amber-300" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Nook</h1>
          <p className="text-sm text-neutral-500 mt-1">Open-Source Modular Household & Life Operating System</p>
        </div>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="w-full py-2.5 px-4 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition active:scale-[0.98]"
        >
          Count is {count}
        </button>
      </main>
    </div>
  );
}

export default App;
