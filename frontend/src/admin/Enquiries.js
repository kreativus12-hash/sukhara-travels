import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Mail, MapPin, MessageCircle, Phone, Search, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { adminDelete, adminList, adminPatch } from "@/api";
import { btnGold, btnGhost, displayFont, EmptyState, formatDateTime, inputCls, labelCls, PageHead, StatusBadge } from "./ui";

const STATUSES = ["new", "contacted", "quoted", "booked", "closed"];

function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function Enquiries({ onChanged }) {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminList("enquiries").then(setItems).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const tally = { all: (items || []).length };
    STATUSES.forEach((s) => { tally[s] = 0; });
    (items || []).forEach((item) => { tally[item.status || "new"] = (tally[item.status || "new"] || 0) + 1; });
    return tally;
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && (item.status || "new") !== filter) return false;
      if (!q) return true;
      return [item.name, item.email, item.phone, item.destination, item.holiday_type].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [items, filter, query]);

  const open = (item) => {
    setSelected(item);
    setStatus(item.status || "new");
    setNotes(item.admin_notes || "");
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminPatch("enquiries", selected.id, { status, admin_notes: notes });
      toast.success("Enquiry updated");
      setSelected(updated);
      setStatus(updated.status);
      setNotes(updated.admin_notes || "");
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const remove = async () => {
    try {
      await adminDelete("enquiries", selected.id);
      toast.success("Enquiry deleted");
      setSelected(null);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const quickStatus = async (item, next) => {
    try {
      await adminPatch("enquiries", item.id, { status: next });
      toast.success(`Marked as ${next}`);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-enquiries-page">
      <PageHead title="Enquiries" subtitle="Trip enquiries from across the website. Click any row for full details." />
      <div className="flex flex-wrap items-center gap-2" data-testid="enquiry-status-filters">
        {["all", ...STATUSES].map((value) => (
          <button key={value} onClick={() => setFilter(value)} data-testid={`enquiry-filter-${value}`}
            className={`text-xs font-semibold capitalize rounded-full border px-3.5 py-1.5 transition-colors ${filter === value ? "bg-[#0B192C] text-white border-[#0B192C]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {value} <span className={filter === value ? "text-amber-300" : "text-slate-400"}>({counts[value] || 0})</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search name, phone, destination…" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="enquiry-search-input" />
        </div>
      </div>
      {!items ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" size={22} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState title={query || filter !== "all" ? "Nothing matches" : "No enquiries yet"} copy={query || filter !== "all" ? "Try a different filter or search." : "New trip enquiries from the website will appear here."} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" data-testid="enquiries-table">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Traveller", "Trip", "Travel date", "Received", "Status", ""].map((head, i) => (
                  <th key={head || i} className={`text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4 ${i === 5 ? "text-right" : "text-left"}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => open(item)} data-testid={`enquiry-row-${item.id}`}>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.phone}{item.email ? ` · ${item.email}` : ""}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{item.destination || item.holiday_type || "General"}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{item.travel_date || "Flexible"}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{formatDateTime(item.created_at)}</td>
                  <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {(item.status || "new") === "new" && (
                      <button className="text-xs font-semibold text-[#1E3E62] hover:text-[#0B192C] border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 transition-colors" onClick={() => quickStatus(item, "contacted")} data-testid={`enquiry-quick-contact-${item.id}`}>Mark contacted</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50" data-testid="enquiry-drawer">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900" style={displayFont} data-testid="enquiry-drawer-name">{selected.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Received {formatDateTime(selected.created_at)} · Source: {selected.source || "website"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Close" data-testid="enquiry-drawer-close"><X size={18} /></button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-3 gap-2" data-testid="enquiry-quick-actions">
                <a href={`tel:${selected.phone}`} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0B192C] border border-slate-200 hover:border-slate-400 rounded-lg py-2.5 transition-colors" data-testid="enquiry-action-call"><Phone size={14} /> Call</a>
                <a href={`https://wa.me/${waNumber(selected.phone)}?text=${encodeURIComponent(`Hi ${selected.name}, this is Sukhara Travels and Tourism regarding your trip enquiry${selected.destination ? ` for ${selected.destination}` : ""}.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:border-emerald-400 rounded-lg py-2.5 transition-colors" data-testid="enquiry-action-whatsapp"><MessageCircle size={14} /> WhatsApp</a>
                {selected.email ? (
                  <a href={`mailto:${selected.email}`} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E3E62] border border-slate-200 hover:border-slate-400 rounded-lg py-2.5 transition-colors" data-testid="enquiry-action-email"><Mail size={14} /> Email</a>
                ) : <span className="flex items-center justify-center gap-1.5 text-xs text-slate-300 border border-slate-100 rounded-lg py-2.5"><Mail size={14} /> No email</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm" data-testid="enquiry-details">
                {[["Destination", selected.destination, MapPin], ["Holiday type", selected.holiday_type, null], ["Travel date", selected.travel_date, CalendarDays], ["Travellers", selected.travellers, Users], ["Budget", selected.budget, Wallet], ["Phone", selected.phone, Phone]].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-lg px-3.5 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {selected.message && (
                <div>
                  <p className={labelCls}>Message</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3 leading-relaxed" data-testid="enquiry-message">{selected.message}</p>
                </div>
              )}
              <div>
                <label className={labelCls} htmlFor="enquiry-status-select">Status</label>
                <select id="enquiry-status-select" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} data-testid="enquiry-status-select">
                  {STATUSES.map((value) => <option key={value} value={value} className="capitalize">{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="enquiry-notes">Internal notes</label>
                <textarea id="enquiry-notes" rows={4} className={inputCls} placeholder="Call outcomes, quotes shared, follow-up reminders…" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="enquiry-notes-input" />
                <p className="text-xs text-slate-400 mt-1">Only visible inside this admin panel.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white">
              <button onClick={remove} className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg px-3 py-2 transition-colors" data-testid="enquiry-delete-button">Delete enquiry</button>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => setSelected(null)} data-testid="enquiry-cancel-button">Close</button>
                <button className={btnGold} onClick={save} disabled={saving} data-testid="enquiry-save-button">{saving ? <Loader2 size={15} className="animate-spin" /> : null} {saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
