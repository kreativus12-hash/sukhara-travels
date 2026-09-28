import { Star } from "lucide-react";
import ResourcePage from "./ResourcePage";
import { formatDate } from "./ui";

export function TestimonialsPage() {
  return (
    <ResourcePage
      resource="testimonials"
      title="Testimonials"
      subtitle="Traveller stories shown on the public website."
      addLabel="Add testimonial"
      searchKeys={["name", "trip", "quote", "location"]}
      defaults={{ rating: 5, published: true }}
      columns={[
        { key: "name", label: "Traveller", render: (item) => (<div><p className="text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-400">{item.location || "—"}</p></div>) },
        { key: "trip", label: "Trip" },
        { key: "quote", label: "Quote", render: (item) => <span className="text-sm text-slate-600 line-clamp-2 max-w-md block">{item.quote || "—"}</span> },
        { key: "rating", label: "Rating", render: (item) => <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600"><Star size={13} fill="currentColor" /> {item.rating || 5}</span> },
        { key: "published", label: "Published", type: "toggle" },
      ]}
      fields={[
        { key: "name", label: "Traveller name" },
        { key: "location", label: "Location", placeholder: "Kochi, Kerala" },
        { key: "trip", label: "Trip taken", placeholder: "Kashmir honeymoon" },
        { key: "rating", label: "Rating (1–5)", type: "number" },
        { key: "quote", label: "Quote", type: "textarea", rows: 4 },
        { key: "published", label: "Published (visible on website)", type: "toggle" },
      ]}
    />
  );
}

export function FaqsPage() {
  return (
    <ResourcePage
      resource="faqs"
      title="FAQs"
      subtitle="Frequently asked questions, grouped by category."
      addLabel="Add FAQ"
      searchKeys={["question", "answer", "category"]}
      defaults={{ category: "General", sort_order: 0, published: true }}
      columns={[
        { key: "question", label: "Question", render: (item) => <span className="text-sm font-semibold text-slate-800 line-clamp-2 max-w-lg block">{item.question}</span> },
        { key: "category", label: "Category" },
        { key: "sort_order", label: "Order" },
        { key: "published", label: "Published", type: "toggle" },
      ]}
      fields={[
        { key: "question", label: "Question" },
        { key: "category", label: "Category", placeholder: "General, Booking, Payments…" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "published", label: "Published (visible on website)", type: "toggle" },
        { key: "answer", label: "Answer", type: "textarea", rows: 4 },
      ]}
    />
  );
}

export function GalleryPage() {
  return (
    <ResourcePage
      resource="gallery"
      title="Gallery"
      subtitle="Images available to the public website gallery."
      addLabel="Add image"
      searchKeys={["title", "category"]}
      defaults={{ published: true }}
      grid
      columns={[]}
      fields={[
        { key: "title", label: "Image title" },
        { key: "category", label: "Category", placeholder: "Kashmir, Honeymoon…" },
        { key: "image_url", label: "Image URL", type: "image", placeholder: "https://…" },
        { key: "published", label: "Published (visible on website)", type: "toggle" },
      ]}
    />
  );
}

export function BlogPage() {
  return (
    <ResourcePage
      resource="blog-posts"
      title="Blog"
      subtitle="Travel journal posts for the public website."
      addLabel="Write a post"
      searchKeys={["title", "slug", "excerpt"]}
      defaults={{ published: false }}
      columns={[
        { key: "cover_image", label: "Cover", type: "image" },
        { key: "title", label: "Post", render: (item) => (<div><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="text-xs text-slate-400">/{item.slug}</p></div>) },
        { key: "published_at", label: "Published", render: (item) => <span className="text-xs text-slate-500">{item.published_at ? formatDate(item.published_at) : "Draft"}</span> },
        { key: "published", label: "Live", type: "toggle" },
      ]}
      fields={[
        { key: "title", label: "Post title" },
        { key: "slug", label: "URL slug", placeholder: "Auto-generated if empty" },
        { key: "cover_image", label: "Cover image URL", type: "image", placeholder: "https://…" },
        { key: "published", label: "Published (visible on website)", type: "toggle" },
        { key: "excerpt", label: "Excerpt", type: "textarea", rows: 2 },
        { key: "content", label: "Post content", type: "textarea", rows: 10 },
      ]}
    />
  );
}
