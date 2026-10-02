import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getTestimonials } from "@/api";
import { DetailShell, PageCta, useSettings, useTitle } from "../components/public";

function Stars({ rating }) {
  return <div className="stars stars-left" aria-label={`${rating || 5} star rating`}>{Array.from({ length: Math.max(1, Math.min(5, rating || 5)) }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>;
}

export default function TestimonialsPage() {
  const settings = useSettings();
  useTitle("Testimonials", "Traveller stories and reviews for holidays planned by Sukhara Travels and Tourism.");
  const [items, setItems] = useState(null);

  useEffect(() => { getTestimonials().then(setItems).catch(() => setItems([])); }, []);

  if (!items) return <div className="detail-loading">Loading traveller stories…</div>;

  return (
    <DetailShell settings={settings}>
      <section className="page-head" data-testid="testimonials-page">
        <span className="eyebrow">Memories made with Sukhara</span>
        <h2>Stories from<br /><em>the road.</em></h2>
        <p>In their own words — what travelling with a thoughtfully planned itinerary feels like.</p>
      </section>
      {items.length === 0 ? (
        <div className="testimonial-section" data-testid="testimonials-demo-note">
          <div className="testimonial-mark">“</div>
          <h2>“The best trips feel a little<br /><em>like they were always yours.”</em></h2>
          <p className="sample-label">SAMPLE / DEMO CONTENT</p>
          <p className="testimonial-note">We are collecting our first genuine traveller stories. Until real reviews arrive, this space shows sample content only — we will never present demo words as real customer reviews.</p>
          <Stars rating={5} />
        </div>
      ) : (
        <div className="testimonial-grid" data-testid="testimonial-grid">
          {items.map((item) => (
            <article key={item.id} className="testimonial-card" data-testid={`testimonial-card-${item.id}`}>
              {item.sample ? <span className="sample-badge" data-testid={`testimonial-sample-${item.id}`}>Sample / demo</span> : null}
              <Stars rating={item.rating} />
              <p className="testimonial-quote">“{item.quote}”</p>
              <div className="testimonial-person">
                {item.photo ? <img src={item.photo} alt={item.name} /> : <span className="testimonial-initial">{item.name.slice(0, 1).toUpperCase()}</span>}
                <div>
                  <strong>{item.name}</strong>
                  <small>{[item.location, item.trip, item.date].filter(Boolean).join(" · ")}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <PageCta settings={settings} eyebrow="Your story next" copy="Travel with us once, and tell it your way." />
    </DetailShell>
  );
}
