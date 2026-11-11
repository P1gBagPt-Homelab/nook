import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-[#F7F5EE] text-[#14191D] flex flex-col">
      <header className="bg-[#14191D] text-[#F7F5EE] border-b-[3px] border-[#D9381E]">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D9381E]" aria-hidden="true" />
            <span className="text-base font-extrabold tracking-[-0.02em]">Nook</span>
          </div>
          <span className="text-[11px] font-bold text-[#A1AAB3]">Initial Setup</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4 py-10 max-w-md w-full mx-auto">
        <div className="enamel-plate overflow-hidden">
          <div className="bg-[#EFECE2] px-5 py-4 border-b border-[#D6D1C4]">
            <h1 className="text-xl font-extrabold tracking-[-0.025em] text-[#14191D]">
              Welcome to Nook
            </h1>
            <p className="text-xs text-[#5B6268] font-medium mt-1">
              Initialize your household and administrator account. Registration closes automatically after setup.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-[4px] text-xs font-bold border border-[#FCA5A5]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#5B6268] uppercase tracking-wider mb-1">
                  Household Name
                </label>
                <input
                  type="text"
                  placeholder="Household Name *"
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-[#F7F5EE] border border-[#D6D1C4] text-sm font-semibold text-[#14191D] focus:outline-none focus:border-[#D9381E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6268] uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name *"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-[#F7F5EE] border border-[#D6D1C4] text-sm font-semibold text-[#14191D] focus:outline-none focus:border-[#D9381E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6268] uppercase tracking-wider mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  placeholder="Email Address *"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-[#F7F5EE] border border-[#D6D1C4] text-sm font-semibold text-[#14191D] focus:outline-none focus:border-[#D9381E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6268] uppercase tracking-wider mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  placeholder="Admin Password *"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-[#F7F5EE] border border-[#D6D1C4] text-sm font-semibold text-[#14191D] focus:outline-none focus:border-[#D9381E]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-[4px] bg-[#D9381E] hover:bg-[#B92B14] active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Setting up..." : "Create Nook"}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#5B6268] font-semibold pt-2 border-t border-[#E2DDD0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
              <span>Self-hosted on Project Janus · Private Household Instance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupPage;
