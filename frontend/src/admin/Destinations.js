import ResourcePage from "./ResourcePage";

export const TRAVEL_CATEGORIES = ["Domestic Holidays", "International Holidays", "Honeymoon", "Family Holidays", "Adventure", "Luxury Travel", "Group Tours", "Corporate Travel"];

const columns = [
  { key: "hero_image", label: "Image", type: "image" },
  {
    key: "name", label: "Destination", render: (item) => (
      <div>
        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
        <p className="text-xs text-slate-400">{item.country || "—"} · /{item.slug}</p>
      </div>
    ),
  },
  { key: "category", label: "Category" },
  { key: "featured", label: "Featured", type: "toggle" },
  { key: "published", label: "Published", type: "toggle" },
];

const fields = [
  { key: "name", label: "Destination name" },
  { key: "slug", label: "URL slug", placeholder: "Auto-generated if empty" },
  { key: "country", label: "Country" },
  { key: "category", label: "Category", type: "select", options: TRAVEL_CATEGORIES },
  { key: "short_description", label: "Short description" },
  { key: "best_time_to_visit", label: "Best time to visit", placeholder: "October to March" },
  { key: "recommended_duration", label: "Recommended duration", placeholder: "5–7 days" },
  { key: "featured", label: "Featured on homepage", type: "toggle" },
  { key: "full_description", label: "Full description", type: "textarea" },
  { key: "hero_image", label: "Hero image URL", type: "image", placeholder: "https://…" },
  { key: "gallery", label: "Gallery image URLs", type: "lines", hint: "One image URL per line" },
  { key: "highlights", label: "Highlights", type: "lines", hint: "One highlight per line" },
  { key: "published", label: "Published (visible on website)", type: "toggle" },
  { key: "seo_title", label: "SEO title" },
  { key: "seo_description", label: "SEO description", type: "textarea", rows: 2 },
];

export default function Destinations() {
  return (
    <ResourcePage
      resource="destinations"
      title="Destinations"
      subtitle="Every destination page on the public website is driven from here."
      columns={columns}
      fields={fields}
      defaults={{ published: true, featured: false, country: "India" }}
      searchKeys={["name", "country", "category"]}
      addLabel="Add destination"
    />
  );
}
