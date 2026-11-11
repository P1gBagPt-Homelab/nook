import { useState, useEffect } from "react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

interface JoinPageProps {
  onJoinSuccess: () => void;
  onNavigateLogin: () => void;
}

export function JoinPage({ onJoinSuccess, onNavigateLogin }: JoinPageProps) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Activation token is missing. Please open your full invite link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Unable to activate account. Check your invite link.");
      }

      navigator.vibrate?.(45);
      onJoinSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F9F5] text-[#14201A] flex flex-col">
      <header className="bg-white border-b border-[#E2ECE4]">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
            <span className="text-lg font-extrabold tracking-[-0.02em] font-display">Nook</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
            Member Invite
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4 py-10 max-w-md w-full mx-auto">
        <div className="botanical-card p-6 space-y-5">
          <div className="border-b border-[#E2ECE4] pb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-[-0.025em] text-[#14201A] font-display">
                Join Your Household
              </h1>
              <p className="text-xs text-[#5B6B61] font-medium mt-1">
                Set your personal password to activate your Nook account and sign in automatically.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-2xl text-xs font-bold border border-[#FCA5A5]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                Invite Token
              </label>
              <input
                type="text"
                placeholder="act_..."
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters *"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475B4E] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat your password *"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-sm font-semibold text-[#14201A] focus:border-[#15803D]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] mt-2 py-3 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-sm font-display flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? "Activating..." : "Set Password & Join"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] font-semibold pt-2 border-t border-[#E2ECE4]">
            <div className="flex items-center gap-1.5 text-[#5B6B61]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>7-Day Single-Use Invite</span>
            </div>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-[#15803D] font-bold hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
