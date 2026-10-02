import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getGalleryItems } from "@/api";
import { DetailShell, PageCta, PublicEmpty, useSettings, useTitle } from "../components/public";

const CATEGORIES = ["All", "Destinations", "Hotels", "Activities", "Travel Experiences", "Customer Moments"];

export default function GalleryPage() {
  const settings = useSettings();
  useTitle("Gallery", "Travel photography from destinations we love — browse the Sukhara Travels gallery.");
  const [items, setItems] = useState(null);
  const [category, setCategory] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { getGalleryItems().then(setItems).catch(() => setItems([])); }, []);

  const available = useMemo(() => {
    const present = new Set((items || []).map((item) => item.category || "Travel Experiences"));
    return CATEGORIES.filter((item) => item === "All" || present.has(item));
  }, [items]);

  const filtered = useMemo(() => (items || []).filter((item) => category === "All" || (item.category || "Travel Experiences") === category), [items, category]);

  if (!items) return <div className="detail-loading">Loading the gallery…</div>;

  const move = (direction) => setLightbox((current) => (current + direction + filtered.length) % filtered.length);

  return (
    <DetailShell settings={settings}>
      <section className="page-head" data-testid="gallery-page">
        <span className="eyebrow">Postcards from everywhere</span>
        <h2>The world,<br /><em>in frames.</em></h2>
        <p>Moments from the destinations we love — tap any image to see it properly.</p>
      </section>
      <div className="blog-tools">
        <div className="chip-row">{available.map((item) => <button key={item} className={`chip ${category === item ? "chip-active" : ""}`} onClick={() => { setCategory(item); setLightbox(null); }} data-testid={`gallery-filter-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</button>)}</div>
      </div>
      {filtered.length === 0 ? (
        <div className="page-narrow"><PublicEmpty title="The gallery is being curated" copy="Beautiful frames are on their way. Check back soon." /></div>
      ) : (
        <div className="gallery-grid" data-testid="gallery-grid">
          {filtered.map((item, index) => (
            <figure key={item.id} className="gallery-item" onClick={() => setLightbox(index)} data-testid={`gallery-item-${item.id}`}>
              <img src={item.image_url} alt={item.title} loading="lazy" />
              <figcaption><strong>{item.title}</strong>{item.destination ? <span>{item.destination}</span> : null}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {lightbox !== null && filtered[lightbox] && (
        <div className="lightbox" onClick={() => setLightbox(null)} data-testid="gallery-lightbox">
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close" data-testid="lightbox-close"><X size={22} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); move(-1); }} aria-label="Previous image" data-testid="lightbox-prev"><ChevronLeft size={26} /></button>
          <div onClick={(e) => e.stopPropagation()}>
            <img src={filtered[lightbox].image_url} alt={filtered[lightbox].title} />
            <p className="lightbox-caption">{filtered[lightbox].title}{filtered[lightbox].destination ? ` · ${filtered[lightbox].destination}` : ""}</p>
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); move(1); }} aria-label="Next image" data-testid="lightbox-next"><ChevronRight size={26} /></button>
        </div>
      )}
      <PageCta settings={settings} eyebrow="Picture yourself here" copy="Every frame above can be part of your itinerary. Tell us which one." />
    </DetailShell>
  );
}
