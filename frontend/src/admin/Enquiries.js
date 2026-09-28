import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, FilterX, History, Loader2, Mail, MessageCircle, NotebookPen, Phone, Search, X } from "lucide-react";
import { toast } from "sonner";
import { addEnquiryNote, adminDelete, adminList, adminPatch } from "@/api";
import { btnGhost, btnGold, displayFont, EmptyState, formatDateTime, inputCls, labelCls, PageHead, StatusBadge } from "./ui";

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow-up", label: "Follow-up" },
  { value: "quotation-sent", label: "Quotation Sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

const EMPTY_FILTERS = { status: "all", destination: "", package: "", holiday_type: "", date: "" };

function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
}

function travellerText(item) {
  if (item.adults || item.children) {
    const parts = [];
    if (item.adults) parts.push(`${item.adults} adult${String(item.adults) === "1" ? "" : "s"}`);
    if (item.children) parts.push(`${item.children} child${String(item.children) === "1" ? "" : "ren"}`);
    return parts.join(" · ");
  }
  return item.travellers || "—";
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value || "—"}</p>
    </div>
  );
}

function DrawerSection({ title, children, testId }) {
  return (
    <div data-testid={testId}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">{title}</p>
      {children}
    </div>
  );
}

export default function Enquiries({ onChanged }) {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [packages, setPackages] = useState([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, status: searchParams.get("status") || "all" });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: "new", follow_up_date: "", follow_up_note: "" });
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const load = useCallback(() => {
    adminList("enquiries").then(setItems).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    load();
    adminList("packages").then(setPackages).catch(() => {});
  }, [load]);

  const open = useCallback((item) => {
    setSelected(item);
    setForm({ status: item.status || "new", follow_up_date: item.follow_up_date || "", follow_up_note: item.follow_up_note || "" });
    setNoteText("");
  }, []);

  useEffect(() => {
    const lead = searchParams.get("lead");
    if (lead && items) {
      const found = items.find((item) => item.id === lead);
      if (found) open(found);
    }
  }, [items, searchParams, open]);

  const destinations = useMemo(() => [...new Set((items || []).map((item) => item.destination).filter(Boolean))].sort(), [items]);
  const holidayTypes = useMemo(() => [...new Set((items || []).map((item) => item.holiday_type).filter(Boolean))].sort(), [items]);

  const counts = useMemo(() => {
    const tally = { all: (items || []).length };
    ENQUIRY_STATUSES.forEach((s) => { tally[s.value] = 0; });
    (items || []).forEach((item) => { tally[item.status || "new"] = (tally[item.status || "new"] || 0) + 1; });
    return tally;
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.status !== "all" && (item.status || "new") !== filters.status) return false;
      if (filters.destination && item.destination !== filters.destination) return false;
      if (filters.package && (item.package_title || "") !== filters.package) return false;
      if (filters.holiday_type && item.holiday_type !== filters.holiday_type) return false;
      if (filters.date && !(item.created_at || "").startsWith(filters.date)) return false;
      if (!q) return true;
      return [item.name, item.email, item.phone, item.lead_id].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [items, filters, query]);

  const hasFilters = filters.destination || filters.package || filters.holiday_type || filters.date;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminPatch("enquiries", selected.id, { status: form.status, follow_up_date: form.follow_up_date, follow_up_note: form.follow_up_note });
      toast.success("Enquiry updated");
      setSelected(updated);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      const note = await addEnquiryNote(selected.id, noteText.trim());
      setSelected((current) => ({
        ...current,
        notes: [...(current.notes || []), note],
        timeline: [...(current.timeline || []), { event: "Internal note added", at: note.created_at, by: note.by }],
      }));
      setNoteText("");
      toast.success("Note added");
      load();
    } catch (e) {
      toast.error(e.message);
    }
    setNoteSaving(false);
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
      toast.success(`Marked as ${ENQUIRY_STATUSES.find((s) => s.value === next)?.label || next}`);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-enquiries-page">
      <PageHead title="Enquiries" subtitle="Every trip enquiry is a lead. Click any row for the full lead record." />
      <div className="flex flex-wrap items-center gap-2" data-testid="enquiry-status-filters">
        {[{ value: "all", label: "All" }, ...ENQUIRY_STATUSES].map((status) => (
          <button key={status.value} onClick={() => setFilters((current) => ({ ...current, status: status.value }))} data-testid={`enquiry-filter-status-${status.value}`}
            className={`text-xs font-semibold rounded-full border px-3.5 py-1.5 transition-colors ${filters.status === status.value ? "bg-[#0B192C] text-white border-[#0B192C]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {status.label} <span className={filters.status === status.value ? "text-amber-300" : "text-slate-400"}>({counts[status.value] || 0})</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" data-testid="enquiry-filters">
        <div className="relative col-span-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search name, phone, email, lead ID…" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="enquiry-search-input" />
        </div>
        <select className={inputCls} value={filters.destination} onChange={(e) => setFilters((current) => ({ ...current, destination: e.target.value }))} data-testid="enquiry-filter-destination" aria-label="Filter by destination">
          <option value="">All destinations</option>
          {destinations.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select className={inputCls} value={filters.package} onChange={(e) => setFilters((current) => ({ ...current, package: e.target.value }))} data-testid="enquiry-filter-package" aria-label="Filter by package">
          <option value="">All packages</option>
          {packages.map((pkg) => <option key={pkg.id} value={pkg.title}>{pkg.title}</option>)}
        </select>
        <select className={inputCls} value={filters.holiday_type} onChange={(e) => setFilters((current) => ({ ...current, holiday_type: e.target.value }))} data-testid="enquiry-filter-holiday-type" aria-label="Filter by holiday type">
          <option value="">All holiday types</option>
          {holidayTypes.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" className={inputCls} value={filters.date} onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))} data-testid="enquiry-filter-date" aria-label="Filter by date" />
          {hasFilters && (
            <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors shrink-0" onClick={() => setFilters((current) => ({ ...EMPTY_FILTERS, status: current.status }))} aria-label="Clear filters" data-testid="enquiry-clear-filters"><FilterX size={16} /></button>
          )}
        </div>
      </div>
      {!items ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" size={22} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState title={query || hasFilters || filters.status !== "all" ? "Nothing matches" : "No enquiries yet"} copy={query || hasFilters || filters.status !== "all" ? "Try a different filter or search." : "New trip enquiries from the website will appear here."} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" data-testid="enquiries-table">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Customer", "Destination / Package", "Travel date", "Travellers", "Status", "Created", ""].map((head, i) => (
                  <th key={head || i} className={`text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4 ${i === 6 ? "text-right" : "text-left"}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => open(item)} data-testid={`enquiry-row-${item.id}`}>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      {item.name}
                      {item.possible_duplicate && <AlertTriangle size={13} className="text-amber-500" aria-label="Possible existing lead" />}
                    </p>
                    <p className="text-xs text-slate-400">{item.phone} · <span className="font-mono">{item.lead_id || ""}</span></p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-slate-700">{item.destination || item.holiday_type || "General"}</p>
                    {item.package_title && <p className="text-xs text-slate-400">{item.package_title}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{item.travel_date || "Flexible"}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{travellerText(item)}</td>
                  <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                  <td className="py-3 px-4 text-xs text-slate-400">{formatDateTime(item.created_at)}</td>
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
                <p className="text-xs text-slate-400 mt-0.5 font-mono" data-testid="enquiry-lead-id">{selected.lead_id || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Close" data-testid="enquiry-drawer-close"><X size={18} /></button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-6">
              {selected.possible_duplicate && (
                <div className="flex items-start gap-2.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5" data-testid="enquiry-duplicate-warning">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span><strong>Possible existing lead.</strong> Another enquiry shares this phone number or email — kept separate, as the same customer may enquire about different trips.</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2" data-testid="enquiry-quick-actions">
                <a href={`tel:${selected.phone}`} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0B192C] border border-slate-200 hover:border-slate-400 rounded-lg py-2.5 transition-colors" data-testid="enquiry-action-call"><Phone size={14} /> Call</a>
                <a href={`https://wa.me/${waNumber(selected.phone)}?text=${encodeURIComponent(`Hi ${selected.name}, this is Sukhara Travels and Tourism regarding your travel enquiry${selected.destination ? ` for ${selected.destination}` : ""}. We would be happy to assist you with your trip.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:border-emerald-400 rounded-lg py-2.5 transition-colors" data-testid="enquiry-action-whatsapp"><MessageCircle size={14} /> WhatsApp</a>
                {selected.email ? (
                  <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Your Sukhara Travels enquiry${selected.destination ? ` — ${selected.destination}` : ""}`)}`} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E3E62] border border-slate-200 hover:border-slate-400 rounded-lg py-2.5 transition-colors" data-testid="enquiry-action-email"><Mail size={14} /> Email</a>
                ) : <span className="flex items-center justify-center gap-1.5 text-xs text-slate-300 border border-slate-100 rounded-lg py-2.5"><Mail size={14} /> No email</span>}
              </div>
              <DrawerSection title="Customer" testId="enquiry-section-customer">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Name" value={selected.name} />
                  <Info label="Phone" value={selected.phone} />
                  <div className="col-span-2"><Info label="Email" value={selected.email} /></div>
                </div>
              </DrawerSection>
              <DrawerSection title="Trip" testId="enquiry-section-trip">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Destination" value={selected.destination} />
                  <Info label="Package" value={selected.package_title} />
                  <Info label="Travel date" value={selected.travel_date || "Flexible"} />
                  <Info label="Holiday type" value={selected.holiday_type} />
                  <Info label="Adults" value={selected.adults} />
                  <Info label="Children" value={selected.children} />
                  <Info label="Total travellers" value={travellerText(selected)} />
                  <Info label="Budget" value={selected.budget} />
                  <Info label="Hotel preference" value={selected.hotel_preference} />
                  <Info label="Transport preference" value={selected.transportation_preference} />
                  <div className="col-span-2"><Info label="Special requirements" value={selected.special_requirements} /></div>
                </div>
              </DrawerSection>
              <DrawerSection title="Enquiry" testId="enquiry-section-enquiry">
                <div className="space-y-3">
                  {selected.message && <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3 leading-relaxed" data-testid="enquiry-message">{selected.message}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Source page" value={selected.source} />
                    <Info label="Created" value={formatDateTime(selected.created_at)} />
                  </div>
                </div>
              </DrawerSection>
              <DrawerSection title="Lead management" testId="enquiry-section-management">
                <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div>
                    <label className={labelCls} htmlFor="enquiry-status-select">Status</label>
                    <select id="enquiry-status-select" className={inputCls} value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} data-testid="enquiry-status-select">
                      {ENQUIRY_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="enquiry-follow-up-date">Follow-up date</label>
                      <input id="enquiry-follow-up-date" type="date" className={inputCls} value={form.follow_up_date} onChange={(e) => setForm((current) => ({ ...current, follow_up_date: e.target.value }))} data-testid="enquiry-follow-up-date" />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="enquiry-follow-up-note">Follow-up note</label>
                      <input id="enquiry-follow-up-note" className={inputCls} placeholder="e.g. Share Kerala quote" value={form.follow_up_note} onChange={(e) => setForm((current) => ({ ...current, follow_up_note: e.target.value }))} data-testid="enquiry-follow-up-note" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className={btnGold} onClick={save} disabled={saving} data-testid="enquiry-save-button">{saving ? <Loader2 size={15} className="animate-spin" /> : null} {saving ? "Saving…" : "Save changes"}</button>
                  </div>
                </div>
              </DrawerSection>
              <DrawerSection title="Internal notes" testId="enquiry-section-notes">
                <div className="space-y-3">
                  {(selected.notes || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No notes yet. Notes are private to this admin panel.</p>
                  ) : (
                    <ul className="space-y-2" data-testid="enquiry-notes-list">
                      {(selected.notes || []).map((note) => (
                        <li key={note.id} className="bg-amber-50/60 border border-amber-100 rounded-lg px-3.5 py-2.5">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.text}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{note.by} · {formatDateTime(note.created_at)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <textarea rows={2} className={`${inputCls} flex-1`} placeholder="Add a private note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} data-testid="enquiry-note-input" />
                    <button className={`${btnGhost} self-end`} onClick={addNote} disabled={noteSaving || !noteText.trim()} data-testid="enquiry-add-note-button">
                      {noteSaving ? <Loader2 size={14} className="animate-spin" /> : <NotebookPen size={14} />} Add
                    </button>
                  </div>
                </div>
              </DrawerSection>
              <DrawerSection title="Timeline" testId="enquiry-section-timeline">
                <ul className="space-y-0" data-testid="enquiry-timeline">
                  {[...(selected.timeline || [])].reverse().map((event, index) => (
                    <li key={index} className="flex gap-3 relative pb-4 last:pb-0">
                      <span className="flex flex-col items-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#D97706] mt-1 shrink-0" />
                        {index < (selected.timeline || []).length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                      </span>
                      <div className="pb-1">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><History size={13} className="text-slate-300" />{event.event}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(event.at)} · {event.by}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </DrawerSection>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white">
              <button onClick={remove} className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg px-3 py-2 transition-colors" data-testid="enquiry-delete-button">Delete enquiry</button>
              <button className={btnGhost} onClick={() => setSelected(null)} data-testid="enquiry-cancel-button">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
