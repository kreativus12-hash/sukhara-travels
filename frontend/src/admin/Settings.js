import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getAdminSettings, saveAdminSettings } from "@/api";
import { btnGold, displayFont, Field, PageHead } from "./ui";

const SECTIONS = [
  {
    title: "Brand",
    fields: [
      { key: "company_name", label: "Company name" },
      { key: "logo", label: "Logo image URL", type: "image", placeholder: "https://…" },
      { key: "favicon", label: "Favicon URL", placeholder: "https://…" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
      { key: "whatsapp", label: "WhatsApp number", placeholder: "919876543210", hint: "Digits only, with country code — used for all WhatsApp buttons." },
      { key: "email", label: "Email" },
      { key: "business_hours", label: "Business hours", placeholder: "Mon–Sat · 9am–6pm" },
      { key: "address", label: "Address", type: "textarea", rows: 2 },
      { key: "map_url", label: "Google Maps link", placeholder: "https://maps.google.com/…" },
    ],
  },
  {
    title: "Social",
    fields: [
      { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/…" },
      { key: "facebook", label: "Facebook URL", placeholder: "https://facebook.com/…" },
      { key: "youtube", label: "YouTube URL", placeholder: "https://youtube.com/…" },
    ],
  },
  {
    title: "Default SEO",
    fields: [
      { key: "default_seo_title", label: "Default SEO title" },
      { key: "default_seo_description", label: "Default SEO description", type: "textarea", rows: 2 },
    ],
  },
];

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminSettings().then((settings) => {
      const initial = {};
      SECTIONS.forEach((section) => section.fields.forEach((field) => { initial[field.key] = settings[field.key] ?? ""; }));
      setForm(initial);
    }).catch((e) => toast.error(e.message));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await saveAdminSettings(form);
      toast.success("Settings saved — live on the website now");
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (!form) {
    return <div className="flex justify-center py-24 text-slate-400" data-testid="settings-loading"><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-settings-page">
      <PageHead title="Website Settings" subtitle="Global details used across the public website. Saved changes go live instantly.">
        <button className={btnGold} onClick={save} disabled={saving} data-testid="admin-settings-save-button">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save settings"}</button>
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid={`settings-section-${section.title.toLowerCase().replaceAll(" ", "-")}`}>
            <h2 className="text-base font-semibold text-slate-800 mb-4" style={displayFont}>{section.title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <Field key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
