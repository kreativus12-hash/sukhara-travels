import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { adminCreate, adminDelete, adminList, adminUpdate } from "@/api";
import { btnGold, btnGhost, DeleteButton, EmptyState, Field, inputCls, Modal, PageHead, Toggle } from "./ui";

export function buildPayload(fields, source) {
  const payload = {};
  fields.forEach((f) => {
    const value = source[f.key];
    if (f.type === "lines") payload[f.key] = Array.isArray(value) ? value : String(value || "").split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "number") payload[f.key] = Number(value) || 0;
    else if (f.type === "toggle") payload[f.key] = Boolean(value);
    else payload[f.key] = value ?? "";
  });
  return payload;
}

export default function ResourcePage({ resource, title, subtitle, columns, fields, defaults = {}, searchKeys = ["name"], grid = false, addLabel }) {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminList(resource).then(setItems).catch((e) => toast.error(e.message));
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => searchKeys.some((key) => String(item[key] || "").toLowerCase().includes(q)));
  }, [items, query, searchKeys]);

  const openNew = () => setEditing({ ...defaults });

  const openEdit = (item) => {
    const form = { id: item.id };
    fields.forEach((f) => {
      const value = item[f.key];
      form[f.key] = f.type === "lines" ? (value || []).join("\n") : value ?? defaults[f.key] ?? (f.type === "toggle" ? false : "");
    });
    setEditing(form);
  };

  const save = async () => {
    setSaving(true);
    const payload = buildPayload(fields, editing);
    try {
      if (editing.id) await adminUpdate(resource, editing.id, payload);
      else await adminCreate(resource, payload);
      toast.success(editing.id ? "Changes saved" : "Created successfully");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const quickToggle = async (item, key) => {
    try {
      const payload = buildPayload(fields, item);
      payload[key] = !item[key];
      await adminUpdate(resource, item.id, payload);
      toast.success(`${item[searchKeys[0]] || "Item"} updated`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (item) => {
    try {
      await adminDelete(resource, item.id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const renderCell = (item, column) => {
    if (column.render) return column.render(item);
    if (column.type === "image") return item[column.key] ? <img src={item[column.key]} alt="" className="h-11 w-16 rounded-lg object-cover border border-slate-200" /> : <span className="text-xs text-slate-400">No image</span>;
    if (column.type === "toggle") return <Toggle checked={!!item[column.key]} onChange={() => quickToggle(item, column.key)} testId={`toggle-${column.key}-${item.id}`} />;
    return <span className="text-sm text-slate-700">{String(item[column.key] ?? "—")}</span>;
  };

  return (
    <div className="space-y-5">
      <PageHead title={title} subtitle={subtitle}>
        <button className={btnGold} onClick={openNew} data-testid={`${resource}-create-button`}><Plus size={16} /> {addLabel || "Add new"}</button>
      </PageHead>
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder={`Search ${title.toLowerCase()}…`} value={query} onChange={(e) => setQuery(e.target.value)} data-testid={`${resource}-search-input`} />
      </div>
      {!items ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" size={22} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState title={query ? "No matches found" : `No ${title.toLowerCase()} yet`} copy={query ? "Try a different search." : `Create your first entry to show it on the website.`} action={!query && <button className={btnGold} onClick={openNew} data-testid={`${resource}-empty-create-button`}><Plus size={16} /> {addLabel || "Add new"}</button>} />
        </div>
      ) : grid ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" data-testid={`${resource}-grid`}>
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group" data-testid={`${resource}-card-${item.id}`}>
              <div className="relative h-36 bg-slate-100">
                {item.image_url || item.cover_image || item.hero_image ? <img src={item.image_url || item.cover_image || item.hero_image} alt={item.title} className="h-full w-full object-cover" /> : null}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button className="bg-white text-slate-800 rounded-lg p-2 shadow" onClick={() => openEdit(item)} data-testid={`${resource}-edit-${item.id}`} aria-label="Edit"><Pencil size={15} /></button>
                </div>
              </div>
              <div className="p-3.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate">{item.category || "—"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Toggle checked={!!item.published} onChange={() => quickToggle(item, "published")} testId={`toggle-published-${item.id}`} />
                  <DeleteButton onDelete={() => remove(item)} testId={`${resource}-delete-${item.id}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" data-testid={`${resource}-table`}>
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map((column) => <th key={column.key} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4">{column.label}</th>)}
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors" data-testid={`${resource}-row-${item.id}`}>
                  {columns.map((column) => <td key={column.key} className="py-3 px-4">{renderCell(item, column)}</td>)}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 transition-colors" onClick={() => openEdit(item)} data-testid={`${resource}-edit-${item.id}`}><Pencil size={13} /> Edit</button>
                      <DeleteButton onDelete={() => remove(item)} testId={`${resource}-delete-${item.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`} subtitle="Changes go live on the website as soon as you save." onClose={() => setEditing(null)} wide
          footer={<>
            <button className={btnGhost} onClick={() => setEditing(null)} data-testid="editor-cancel-button">Cancel</button>
            <button className={btnGold} onClick={save} disabled={saving} data-testid="editor-save-button">{saving ? <Loader2 size={15} className="animate-spin" /> : null} {saving ? "Saving…" : "Save changes"}</button>
          </>}>
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((field) => <Field key={field.key} field={field} value={editing[field.key]} onChange={(value) => setEditing((current) => ({ ...current, [field.key]: value }))} />)}
          </div>
        </Modal>
      )}
    </div>
  );
}
