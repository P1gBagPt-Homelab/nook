import { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface SetupPageProps {
  onSetupComplete: () => void;
}

export function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [householdName, setHouseholdName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdName,
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Setup failed. Please try again.");
      }

      navigator.vibrate?.(50);
      onSetupComplete();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-zinc-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Hero */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-md ring-4 ring-[#FF7A59]/20 relative">
          <Sparkles className="w-8 h-8 text-amber-300 stroke-[2]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF7A59] border-2 border-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Welcome to Nook
          </h1>
          <p className="text-xs font-semibold text-zinc-400 mt-1">
            Modular Household & Life Operating System
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-impeccable p-7 sm:p-9 space-y-5">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-sm font-bold text-zinc-800">
              Create Household & Admin Account
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              Initialize your private Nook. Registration will automatically close to outside users.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Household Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Household Name *"
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAFAF8] border border-zinc-200/90 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Your Full Name
              </label>
              <input
                type="text"
                placeholder="Your Name *"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#FAFAF8] border border-zinc-200/90 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                placeholder="Email Address *"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#FAFAF8] border border-zinc-200/90 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                placeholder="Admin Password *"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#FAFAF8] border border-zinc-200/90 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 px-4 rounded-full bg-[#FF7A59] hover:bg-[#ff6842] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md button-peach-glow transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? "Setting up..." : "Create Nook"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Privacy badge */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-semibold pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Self-hosted on Project Janus • 100% Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupPage;
