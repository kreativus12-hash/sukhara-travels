import { useState } from "react";
import { Inbox, Loader2, Trash2, X } from "lucide-react";

export const displayFont = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
export const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3E62] focus:ring-2 focus:ring-[#1E3E62]/20 outline-none transition-all";
export const labelCls = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";
export const btnPrimary = "bg-[#0B192C] hover:bg-[#1E3E62] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all duration-150 shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60";
export const btnGold = "bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-150 shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60";
export const btnGhost = "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2 rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-2";

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={displayFont} data-testid="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, testId }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} data-testid={testId} onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-[#D97706]" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export function Field({ field, value, onChange }) {
  const { key, label, type = "text", options = [], placeholder, hint, rows = 3 } = field;
  const id = `field-${key}`;
  const wide = type === "textarea" || type === "lines" || type === "image";
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className={labelCls} htmlFor={id}>{label}</label>
      {type === "toggle" ? (
        <div className="pt-1"><Toggle checked={!!value} onChange={onChange} testId={id} /></div>
      ) : type === "select" ? (
        <select id={id} data-testid={id} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === "textarea" || type === "lines" ? (
        <textarea id={id} data-testid={id} rows={rows} className={inputCls} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} data-testid={id} type={type === "number" ? "number" : type === "date" ? "date" : "text"} className={inputCls} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {type === "image" && value ? <img src={value} alt="" className="mt-2 h-20 w-36 object-cover rounded-lg border border-slate-200" data-testid={`${id}-preview`} /> : null}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4" onClick={onClose} data-testid="modal-overlay">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-4xl" : "max-w-2xl"} max-h-[90vh] flex flex-col border border-slate-100`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={displayFont}>{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" data-testid="modal-close-button" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function DeleteButton({ onDelete, testId }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!confirm) {
    return (
      <button type="button" data-testid={testId} onClick={(e) => { e.stopPropagation(); setConfirm(true); }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg px-2.5 py-1.5 transition-colors">
        <Trash2 size={13} /> Delete
      </button>
    );
  }
  return (
    <button type="button" data-testid={`${testId}-confirm`} disabled={busy}
      onClick={async (e) => { e.stopPropagation(); setBusy(true); await onDelete(); setBusy(false); }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-60">
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Confirm delete
    </button>
  );
}

const STATUS_STYLES = {
  new: "bg-amber-50 text-amber-800 border-amber-200",
  contacted: "bg-blue-50 text-blue-800 border-blue-200",
  quoted: "bg-purple-50 text-purple-800 border-purple-200",
  booked: "bg-emerald-50 text-emerald-800 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
  read: "bg-blue-50 text-blue-800 border-blue-200",
  replied: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function StatusBadge({ status }) {
  const value = status || "new";
  return (
    <span data-testid={`status-badge-${value}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[value] || STATUS_STYLES.closed}`}>
      {value}
    </span>
  );
}

export function EmptyState({ title, copy, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3"><Inbox size={22} /></div>
      <h3 className="text-base font-semibold text-slate-800" style={displayFont}>{title}</h3>
      {copy && <p className="text-sm text-slate-500 mt-1 max-w-sm">{copy}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
