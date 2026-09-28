import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminCreate, adminDelete, adminList, adminUpdate, getAdminPackage } from "@/api";
import { TRAVEL_CATEGORIES } from "./Destinations";
import { btnGold, btnGhost, DeleteButton, EmptyState, Field, inputCls, labelCls, Modal, PageHead, Toggle } from "./ui";

const PKG_FIELDS = [
  { key: "title", label: "Package title" },
  { key: "slug", label: "URL slug", placeholder: "Auto-generated if empty" },
  { key: "category", label: "Category", type: "select", options: TRAVEL_CATEGORIES },
  { key: "duration", label: "Duration", placeholder: "6 days / 5 nights" },
  { key: "starting_price", label: "Starting price", placeholder: "₹42,500" },
  { key: "featured", label: "Featured on homepage", type: "toggle" },
  { key: "short_description", label: "Short description" },
  { key: "published", label: "Published (visible on website)", type: "toggle" },
  { key: "full_description", label: "Full description", type: "textarea" },
  { key: "hero_image", label: "Hero image URL", type: "image", placeholder: "https://…" },
  { key: "gallery", label: "Gallery image URLs", type: "lines", hint: "One image URL per line" },
  { key: "highlights", label: "Highlights", type: "lines", hint: "One highlight per line" },
  { key: "inclusions", label: "Inclusions", type: "lines", hint: "One per line" },
  { key: "exclusions", label: "Exclusions", type: "lines", hint: "One per line" },
  { key: "seo_title", label: "SEO title" },
  { key: "seo_description", label: "SEO description", type: "textarea", rows: 2 },
];

const emptyDay = () => ({ title: "", description: "", meals: "", accommodation: "", activities: "" });

function toPayload(form) {
  const payload = {};
  PKG_FIELDS.forEach((f) => {
    const value = form[f.key];
    if (f.type === "lines") payload[f.key] = Array.isArray(value) ? value : String(value || "").split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "toggle") payload[f.key] = Boolean(value);
    else payload[f.key] = value ?? "";
  });
  payload.destination_id = form.destination_id || "";
  payload.itinerary = (form.itinerary || []).map((day, index) => ({
    day_number: index + 1,
    title: day.title || "",
    description: day.description || "",
    meals: day.meals || "",
    accommodation: day.accommodation || "",
    activities: Array.isArray(day.activities) ? day.activities : String(day.activities || "").split("\n").map((s) => s.trim()).filter(Boolean),
  }));
  return payload;
}

function toForm(pkg) {
  const form = { id: pkg.id, destination_id: pkg.destination_id || "", itinerary: [] };
  PKG_FIELDS.forEach((f) => {
    const value = pkg[f.key];
    form[f.key] = f.type === "lines" ? (value || []).join("\n") : value ?? (f.type === "toggle" ? false : "");
  });
  form.itinerary = (pkg.itinerary || []).map((day) => ({ title: day.title, description: day.description, meals: day.meals, accommodation: day.accommodation, activities: (day.activities || []).join("\n") }));
  return form;
}

export default function Packages() {
  const [items, setItems] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminList("packages").then(setItems).catch((e) => toast.error(e.message));
    adminList("destinations").then(setDestinations).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.title, item.destination, item.category].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [items, query]);

  const openNew = () => setEditing({ ...toForm({}), id: undefined, published: true, itinerary: [emptyDay()] });

  const openEdit = async (item) => {
    try {
      setEditing(toForm(await getAdminPackage(item.id)));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const save = async () => {
    if (!editing.title || editing.title.trim().length < 2) {
      toast.error("Package title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(editing);
      if (editing.id) await adminUpdate("packages", editing.id, payload);
      else await adminCreate("packages", payload);
      toast.success(editing.id ? "Package updated" : "Package created");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const remove = async (item) => {
    try {
      await adminDelete("packages", item.id);
      toast.success("Package deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const quickToggle = async (item, key) => {
    try {
      const full = await getAdminPackage(item.id);
      const payload = toPayload(toForm(full));
      payload[key] = !item[key];
      await adminUpdate("packages", item.id, payload);
      toast.success("Package updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const setDay = (index, key, value) => setEditing((current) => {
    const itinerary = [...current.itinerary];
    itinerary[index] = { ...itinerary[index], [key]: value };
    return { ...current, itinerary };
  });

  const moveDay = (index, direction) => setEditing((current) => {
    const itinerary = [...current.itinerary];
    const target = index + direction;
    if (target < 0 || target >= itinerary.length) return current;
    [itinerary[index], itinerary[target]] = [itinerary[target], itinerary[index]];
    return { ...current, itinerary };
  });

  const setField = (key) => (value) => setEditing((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-5" data-testid="admin-packages-page">
      <PageHead title="Packages" subtitle="Holiday packages and their day-by-day itineraries.">
        <button className={btnGold} onClick={openNew} data-testid="packages-create-button"><Plus size={16} /> Add package</button>
      </PageHead>
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="Search packages…" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="packages-search-input" />
      </div>
      {!items ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" size={22} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState title={query ? "No matches found" : "No packages yet"} copy={query ? "Try a different search." : "Create your first holiday package."} action={!query && <button className={btnGold} onClick={openNew} data-testid="packages-empty-create-button"><Plus size={16} /> Add package</button>} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" data-testid="packages-table">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Package", "Destination", "Duration", "Price from", "Featured", "Published", ""].map((head, i) => (
                  <th key={head || i} className={`text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4 ${i === 6 ? "text-right" : "text-left"}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors" data-testid={`package-row-${item.id}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {item.hero_image ? <img src={item.hero_image} alt="" className="h-11 w-16 rounded-lg object-cover border border-slate-200 shrink-0" /> : null}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-400">/{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{item.destination || "—"}</td>
                  <td className="py-3 px-4 text-sm text-slate-700"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-slate-400" />{item.duration || "—"}</span></td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800">{item.starting_price || "—"}</td>
                  <td className="py-3 px-4"><Toggle checked={!!item.featured} onChange={() => quickToggle(item, "featured")} testId={`package-featured-${item.id}`} /></td>
                  <td className="py-3 px-4"><Toggle checked={!!item.published} onChange={() => quickToggle(item, "published")} testId={`package-published-${item.id}`} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 transition-colors" onClick={() => openEdit(item)} data-testid={`package-edit-${item.id}`}><Pencil size={13} /> Edit</button>
                      <DeleteButton onDelete={() => remove(item)} testId={`package-delete-${item.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit package" : "New package"} subtitle="Changes go live on the website as soon as you save." onClose={() => setEditing(null)} wide
          footer={<>
            <button className={btnGhost} onClick={() => setEditing(null)} data-testid="package-editor-cancel">Cancel</button>
            <button className={btnGold} onClick={save} disabled={saving} data-testid="package-editor-save">{saving ? <Loader2 size={15} className="animate-spin" /> : null} {saving ? "Saving…" : "Save package"}</button>
          </>}>
          <div className="grid sm:grid-cols-2 gap-4">
            {PKG_FIELDS.slice(0, 2).map((field) => <Field key={field.key} field={field} value={editing[field.key]} onChange={setField(field.key)} />)}
            <div>
              <label className={labelCls} htmlFor="field-destination_id">Destination</label>
              <select id="field-destination_id" className={inputCls} value={editing.destination_id} onChange={(e) => setField("destination_id")(e.target.value)} data-testid="field-destination_id">
                <option value="">Select a destination…</option>
                {destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">Manage destinations under Content → Destinations.</p>
            </div>
            {PKG_FIELDS.slice(2).map((field) => <Field key={field.key} field={field} value={editing[field.key]} onChange={setField(field.key)} />)}
          </div>
          <div className="mt-8" data-testid="itinerary-builder">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Day-by-day itinerary</h3>
                <p className="text-xs text-slate-400">Days are numbered automatically in the order shown.</p>
              </div>
              <button className={btnGhost} onClick={() => setEditing((current) => ({ ...current, itinerary: [...current.itinerary, emptyDay()] }))} data-testid="itinerary-add-day"><Plus size={14} /> Add day</button>
            </div>
            <div className="space-y-3">
              {editing.itinerary.map((day, index) => (
                <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60" data-testid={`itinerary-day-${index + 1}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B45309] bg-amber-50 border border-amber-200 rounded-full px-3 py-1">Day {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30" onClick={() => moveDay(index, -1)} disabled={index === 0} aria-label="Move day up" data-testid={`itinerary-move-up-${index + 1}`}><ArrowUp size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30" onClick={() => moveDay(index, 1)} disabled={index === editing.itinerary.length - 1} aria-label="Move day down" data-testid={`itinerary-move-down-${index + 1}`}><ArrowDown size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 disabled:opacity-30" onClick={() => setEditing((current) => ({ ...current, itinerary: current.itinerary.filter((_, i) => i !== index) }))} disabled={editing.itinerary.length <= 1} aria-label="Remove day" data-testid={`itinerary-remove-day-${index + 1}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className={inputCls} placeholder="Day title (e.g. Arrive in Srinagar)" value={day.title} onChange={(e) => setDay(index, "title", e.target.value)} data-testid={`itinerary-title-${index + 1}`} />
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputCls} placeholder="Meals" value={day.meals} onChange={(e) => setDay(index, "meals", e.target.value)} data-testid={`itinerary-meals-${index + 1}`} />
                      <input className={inputCls} placeholder="Stay" value={day.accommodation} onChange={(e) => setDay(index, "accommodation", e.target.value)} data-testid={`itinerary-stay-${index + 1}`} />
                    </div>
                    <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="What happens on this day…" value={day.description} onChange={(e) => setDay(index, "description", e.target.value)} data-testid={`itinerary-description-${index + 1}`} />
                    <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Activities, one per line" value={day.activities} onChange={(e) => setDay(index, "activities", e.target.value)} data-testid={`itinerary-activities-${index + 1}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
