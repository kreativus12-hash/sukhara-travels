import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Mail, MessageCircle, Phone, Search, X } from "lucide-react";
import { toast } from "sonner";
import { adminDelete, adminList, adminPatch } from "@/api";
import { displayFont, EmptyState, formatDateTime, inputCls, PageHead, StatusBadge } from "./ui";

function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function Contacts() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    adminList("contact-submissions").then(setItems).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.name, item.email, item.subject, item.message].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [items, query]);

  const setStatus = async (item, status) => {
    try {
      await adminPatch("contact-submissions", item.id, { status });
      toast.success(`Marked as ${status}`);
      setSelected((current) => (current && current.id === item.id ? { ...current, status } : current));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (item) => {
    try {
      await adminDelete("contact-submissions", item.id);
      toast.success("Submission deleted");
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openMessage = (item) => {
    setSelected(item);
    if ((item.status || "new") === "new") setStatus(item, "read");
  };

  return (
    <div className="space-y-5" data-testid="admin-contacts-page">
      <PageHead title="Contact Messages" subtitle="Messages sent through the website contact form." />
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="Search messages…" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="contacts-search-input" />
      </div>
      {!items ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" size={22} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState title={query ? "No matches found" : "No messages yet"} copy={query ? "Try a different search." : "Contact form submissions from the website will appear here."} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" data-testid="contacts-table">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["From", "Subject", "Message", "Received", "Status", ""].map((head, i) => (
                  <th key={head || i} className={`text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4 ${i === 5 ? "text-right" : "text-left"}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors" data-testid={`contact-row-${item.id}`}>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.email || item.phone || "—"}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{item.subject || "—"}</td>
                  <td className="py-3 px-4"><span className="text-sm text-slate-500 line-clamp-1 max-w-xs block">{item.message}</span></td>
                  <td className="py-3 px-4 text-xs text-slate-400">{formatDateTime(item.created_at)}</td>
                  <td className="py-3 px-4"><StatusBadge status={item.status || "new"} /></td>
                  <td className="py-3 px-4 text-right">
                    <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 transition-colors" onClick={() => openMessage(item)} data-testid={`contact-view-${item.id}`}><Eye size={13} /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setSelected(null)} data-testid="contact-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900" style={displayFont} data-testid="contact-modal-name">{selected.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(selected.created_at)} · <StatusBadge status={selected.status || "new"} /></p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Close" data-testid="contact-modal-close"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {selected.phone ? <a href={`tel:${selected.phone}`} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0B192C] border border-slate-200 hover:border-slate-400 rounded-lg py-2.5 transition-colors" data-testid="contact-action-call"><Phone size={14} /> Call</a> : null}
                {selected.phone ? <a href={`https://wa.me/${waNumber(selected.phone)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:border-emerald-400 rounded-lg py-2.5 transition-colors" data-testid="contact-action-whatsapp"><MessageCircle size={14} /> WhatsApp</a> : null}
                {selected.email ? <a href={`mailto:${selected.email}`} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E3E62] border border-slate-200 hover:border-slate-400 rounded-lg py-2.5 transition-colors" data-testid="contact-action-email"><Mail size={14} /> Email</a> : null}
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-800">Email:</span> {selected.email || "—"}</p>
                <p><span className="font-semibold text-slate-800">Phone:</span> {selected.phone || "—"}</p>
                <p><span className="font-semibold text-slate-800">Subject:</span> {selected.subject || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Message</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3 leading-relaxed whitespace-pre-wrap" data-testid="contact-modal-message">{selected.message}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button onClick={() => remove(selected)} className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg px-3 py-2 transition-colors" data-testid="contact-delete-button">Delete</button>
              <button onClick={() => setStatus(selected, "replied")} className="text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg px-3.5 py-2 transition-colors" data-testid="contact-mark-replied-button">Mark as replied</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
