import { useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { loginAdmin } from "@/api";
import { btnPrimary, displayFont, inputCls, labelCls } from "./ui";

const backdrop = "https://images.unsplash.com/photo-1564507592333-c60657eea523?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB0YWolMjBtYWhhbCUyMGluZGlhJTIwdHJhdmVsJTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzkwNTIyOTYzfDA&ixlib=rb-4.1.0&q=85";

export default function AdminLogin({ onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSuccess(await loginAdmin(form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50" data-testid="admin-login-screen">
      <div className="relative hidden lg:block">
        <img src={backdrop} alt="Taj Mahal, India" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0B192C]/80" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src="/assets/sukhara-logo.webp" alt="Sukhara Travels — Making Every Journey Easier" className="h-16 w-auto rounded-xl bg-white p-2 shadow-lg" data-testid="admin-login-logo" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight max-w-md" style={displayFont}>The workspace behind every thoughtful journey.</h2>
            <p className="text-sm text-slate-300 mt-3 max-w-sm">Manage destinations, packages, enquiries and everything travellers see on sukharatravels.com.</p>
          </div>
          <p className="text-xs text-slate-400">sukharatravels.com · Admin</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
            <div className="mb-6 lg:hidden"><img src="/assets/sukhara-logo.webp" alt="Sukhara Travels — Making Every Journey Easier" className="h-16 w-auto rounded-xl" /></div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309] bg-amber-50 border border-amber-200 rounded-full px-3 py-1"><Lock size={12} /> Secure workspace</span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3" style={displayFont}>Admin sign in</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Use your Sukhara administrator credentials.</p>
            <form onSubmit={submit} className="space-y-4" data-testid="admin-login-form">
              <div>
                <label className={labelCls} htmlFor="admin-login-email-input">Email</label>
                <input id="admin-login-email-input" data-testid="admin-login-email-input" required type="email" autoComplete="username" className={inputCls} placeholder="admin@sukharatravels.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="admin-login-password-input">Password</label>
                <input id="admin-login-password-input" data-testid="admin-login-password-input" required type="password" autoComplete="current-password" className={inputCls} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5" data-testid="admin-login-error">{error}</div>}
              <button type="submit" disabled={busy} className={`${btnPrimary} w-full`} data-testid="admin-login-submit-button">
                {busy ? <Loader2 size={16} className="animate-spin" /> : null} {busy ? "Signing in…" : "Sign in to admin"}
              </button>
            </form>
          </div>
          <a href="/" className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors" data-testid="admin-login-back-link"><ArrowLeft size={15} /> Back to sukharatravels.com</a>
        </div>
      </div>
    </div>
  );
}
