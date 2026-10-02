import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Instagram, Menu, MessageCircle, Users, X, Youtube } from "lucide-react";
import { getSettings, submitEnquiry } from "@/api";

const SITE_URL = "https://sukharatravels.com";
const DEFAULT_OG_IMAGE = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
const DEFAULT_DESCRIPTION = "Thoughtfully planned domestic and international journeys by Sukhara Travels and Tourism.";

export const fallbackSettings = { company_name: "Sukhara Travels and Tourism", whatsapp: "919876543210", email: "hello@sukharatravels.com", phone: "+91 98765 43210", address: "Kerala, India", business_hours: "Mon–Sat · 9am–6pm", instagram: "", facebook: "", youtube: "", map_url: "" };

export function waUrl(number, message = "Hi Sukhara Travels and Tourism, I would like help planning my trip.") {
  return `https://wa.me/${number || fallbackSettings.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function useSettings() {
  const [settings, setSettings] = useState(fallbackSettings);
  useEffect(() => { getSettings().then((data) => setSettings({ ...fallbackSettings, ...data })).catch(() => {}); }, []);
  return settings;
}

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function useTitle(title, description) {
  const path = window.location.pathname;
  useEffect(() => {
    const fullTitle = title ? (title.includes("Sukhara") ? title : `${title} | Sukhara Travels and Tourism`) : "Sukhara Travels & Tourism | Thoughtful Journeys";
    document.title = fullTitle;
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
    upsertMeta("property", "og:site_name", "Sukhara Travels and Tourism");
    upsertMeta("name", "description", description || DEFAULT_DESCRIPTION);
    upsertMeta("property", "og:description", description || DEFAULT_DESCRIPTION);
    upsertMeta("name", "twitter:card", "summary_large_image");
  }, [title, description, path]);
}

export function Brand({ light = false }) {
  return (
    <Link to="/" className={`brand ${light ? "brand-light" : ""}`} data-testid="brand-logo-link" aria-label="Sukhara Travels — home">
      <picture>
        <source srcSet="/assets/sukhara-logo.webp" type="image/webp" />
        <img src="/assets/sukhara-logo.png" alt="Sukhara Travels — Making Every Journey Easier" className="brand-logo" width="640" height="640" />
      </picture>
    </Link>
  );
}

const EXPLORE_LINKS = [["Destinations", "/#destinations"], ["Holiday Packages", "/#packages"], ["Honeymoon", "/honeymoon"], ["Family Holidays", "/family-holidays"], ["Corporate / Group Travel", "/corporate-group-travel"]];
const MORE_LINKS = [["Gallery", "/gallery"], ["Testimonials", "/testimonials"], ["FAQ", "/faq"]];
const MOBILE_LINKS = [["Home", "/"], ["About", "/about"], ["Destinations", "/#destinations"], ["Holiday Packages", "/#packages"], ["Customized Trips", "/customized-trips"], ["Honeymoon", "/honeymoon"], ["Family Holidays", "/family-holidays"], ["Corporate / Group Travel", "/corporate-group-travel"], ["Blog", "/blog"], ["Gallery", "/gallery"], ["Testimonials", "/testimonials"], ["FAQ", "/faq"], ["Contact", "/contact"]];

function NavItem({ label, href, onClick }) {
  const testId = `nav-link-${label.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")}`;
  if (href.startsWith("/#")) return <a href={href} onClick={onClick} data-testid={testId}>{label}</a>;
  return <Link to={href} onClick={onClick} data-testid={testId}>{label}</Link>;
}

export function Navbar({ settings }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let script = document.getElementById("ld-json-business");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "ld-json-business";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: settings.company_name,
      url: SITE_URL,
      description: "Indian travel agency and tour operator offering domestic and international holidays, customized trips, honeymoon packages, family holidays and corporate or group travel.",
      telephone: settings.phone,
      email: settings.email,
      address: settings.address,
    });
  }, [settings]);

  return (
    <header className="navbar" data-testid="site-navigation">
      <div className="nav-inner">
        <Brand />
        <nav className={open ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <div className="nav-desktop-only">
            <NavItem label="Home" href="/" onClick={() => setOpen(false)} />
            <NavItem label="About" href="/about" onClick={() => setOpen(false)} />
            <div className="nav-dropdown">
              <button type="button" data-testid="nav-dropdown-explore" aria-haspopup="true">Explore <ChevronDown size={12} /></button>
              <div className="nav-dropdown-menu">{EXPLORE_LINKS.map(([label, href]) => <NavItem key={label} label={label} href={href} onClick={() => setOpen(false)} />)}</div>
            </div>
            <NavItem label="Customized Trips" href="/customized-trips" onClick={() => setOpen(false)} />
            <NavItem label="Blog" href="/blog" onClick={() => setOpen(false)} />
            <div className="nav-dropdown">
              <button type="button" data-testid="nav-dropdown-more" aria-haspopup="true">More <ChevronDown size={12} /></button>
              <div className="nav-dropdown-menu">{MORE_LINKS.map(([label, href]) => <NavItem key={label} label={label} href={href} onClick={() => setOpen(false)} />)}</div>
            </div>
            <NavItem label="Contact" href="/contact" onClick={() => setOpen(false)} />
          </div>
          <div className="nav-mobile-only">{MOBILE_LINKS.map(([label, href]) => <NavItem key={label} label={label} href={href} onClick={() => setOpen(false)} />)}</div>
        </nav>
        <div className="nav-actions">
          <a className="nav-whatsapp" href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" data-testid="nav-whatsapp-link"><MessageCircle size={16} /> WhatsApp</a>
          <Link className="button button-small" to="/customized-trips" data-testid="nav-plan-button">Plan Your Trip <ArrowRight size={15} /></Link>
        </div>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" data-testid="mobile-menu-button">{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}

export function Footer({ settings }) {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Brand light />
          <p>Thoughtful journeys, beautifully arranged.<br />India · The world · Your way</p>
          <a className="footer-mail" href={`mailto:${settings.email}`} data-testid="footer-email-link">{settings.email}</a>
        </div>
        <div className="footer-links">
          <div>
            <span>Explore</span>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <a href="/#destinations">Destinations</a>
            <a href="/#packages">Holiday packages</a>
            <Link to="/customized-trips">Customized trips</Link>
            <Link to="/blog">Travel journal</Link>
          </div>
          <div>
            <span>Travel styles</span>
            <Link to="/honeymoon">Honeymoon</Link>
            <Link to="/family-holidays">Family holidays</Link>
            <Link to="/corporate-group-travel">Corporate / group</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/testimonials">Testimonials</Link>
            <Link to="/faq">FAQ</Link>
          </div>
          <div>
            <span>Say hello</span>
            <p>{settings.phone}<br /><a href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" data-testid="footer-whatsapp-link">WhatsApp us</a><br />{settings.address}<br />{settings.business_hours}</p>
            <Link to="/contact">Contact page</Link>
            {(settings.instagram || settings.facebook || settings.youtube) && (
              <div className="socials">
                {settings.instagram ? <a href={settings.instagram} aria-label="Instagram" data-testid="instagram-link"><Instagram size={17} /></a> : null}
                {settings.facebook ? <a href={settings.facebook} aria-label="Facebook" data-testid="facebook-link"><Users size={17} /></a> : null}
                {settings.youtube ? <a href={settings.youtube} aria-label="YouTube" data-testid="youtube-link"><Youtube size={17} /></a> : null}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Sukhara Travels and Tourism</span>
        <div><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms-and-conditions">Terms & conditions</Link><Link to="/cancellation-policy">Cancellation policy</Link></div>
        <span className="footer-domain">sukharatravels.com</span>
      </div>
    </footer>
  );
}

export function SectionHeading({ eyebrow, title, copy, link }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{copy && <p>{copy}</p>}{link && <a href={link.href} className="text-link" data-testid={`${link.label.toLowerCase().replaceAll(" ", "-")}-link`}>{link.label} <ArrowRight size={16} /></a>}</div>;
}

export function DestinationCard({ item, index }) {
  return <article className={`destination-card ${index === 0 ? "destination-featured" : ""}`} data-testid={`destination-card-${item.slug}`}><img src={item.hero_image} alt={item.name} loading="lazy" decoding="async" /><div className="image-shade" /><div className="destination-copy"><span>0{index + 1}</span><h3>{item.name}</h3><p>{item.short_description}</p><Link to={`/destinations/${item.slug}`} data-testid={`destination-explore-${item.slug}`}>Explore <ArrowRight size={15} /></Link></div></article>;
}

export function PackageCard({ item }) {
  return <article className="package-card" data-testid={`package-card-${item.slug}`}><div className="package-image"><img src={item.hero_image} alt={item.title} loading="lazy" decoding="async" /><span className="package-badge">Sample / demo package</span></div><div className="package-body"><span className="card-kicker">{item.destination}</span><h3>{item.title}</h3><div className="package-meta"><span><CalendarDays size={15} /> {item.duration}</span><strong>From {item.starting_price}</strong></div><div className="tag-row">{item.highlights?.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="card-actions"><Link to={`/packages/${item.slug}`} className="button button-outline" data-testid={`package-view-${item.slug}`}>View package</Link><a href={`/?package_id=${item.id}&destination=${encodeURIComponent(item.destination || "")}#planner`} className="text-link" data-testid={`package-enquire-${item.slug}`}>Enquire <ArrowRight size={15} /></a></div></div></article>;
}

export function DetailShell({ children, settings }) {
  return <div className="site detail-site"><Navbar settings={settings} /><main>{children}</main><Footer settings={settings} /></div>;
}

export function DetailHero({ image, eyebrow, title, description }) {
  return <section className="detail-hero"><img src={image} alt={typeof title === "string" ? title : "Sukhara Travels"} /><div className="hero-overlay" /><div className="detail-hero-copy"><Link to="/" className="back-link"><ArrowLeft size={15} /> Back to Sukhara</Link><span className="eyebrow eyebrow-light">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section>;
}

export function Gallery({ images, title }) {
  return <section className="detail-gallery"><div className="detail-gallery-heading"><span className="eyebrow">A closer look</span><h2>{title}</h2></div><div>{images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${title} ${index + 1}`} loading="lazy" decoding="async" />)}</div></section>;
}

export function PageCta({ settings, eyebrow = "The next destination is yours", title = <>Let’s plan your<br /><em>next journey.</em></>, copy = "From weekend escapes to international holidays, tell us what you're dreaming about." }) {
  return (
    <section className="final-cta" data-testid="page-cta">
      <div><span className="eyebrow eyebrow-light">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>
      <div className="final-actions">
        <Link to="/customized-trips" className="button" data-testid="page-cta-plan">Plan Your Trip <ArrowRight size={17} /></Link>
        <a href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" className="button button-ghost" data-testid="page-cta-whatsapp"><MessageCircle size={17} /> WhatsApp Us</a>
      </div>
    </section>
  );
}

export function PublicEmpty({ title, copy }) {
  return <div className="public-empty" data-testid="public-empty-state"><span className="eyebrow">Coming soon</span><h3>{title}</h3><p>{copy}</p></div>;
}

export function formatPublicDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function PlannerForm({ settings, compact = false, source, holidayType = "" }) {
  const params = new URLSearchParams(window.location.search);
  const [fields, setFields] = useState({
    name: "", phone: "", email: "",
    destination: params.get("destination") || "",
    package_id: params.get("package_id") || "",
    travel_date: "", travellers: "", adults: "", children: "",
    holiday_type: holidayType, budget: "",
    hotel_preference: "", transportation_preference: "", special_requirements: "", message: "",
  });
  const [state, setState] = useState({ loading: false, success: "", error: "" });
  const change = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (state.loading || state.success) return;
    if (!/^[0-9+\-\s()]{7,18}$/.test(fields.phone.trim())) { setState({ loading: false, success: "", error: "Please enter a valid phone number." }); return; }
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) { setState({ loading: false, success: "", error: "Please enter a valid email address." }); return; }
    setState({ loading: true, success: "", error: "" });
    try {
      const resolvedSource = source || (params.get("source") === "customized-trip" ? "Customized Trip" : window.location.pathname);
      const payload = { ...fields, email: fields.email.trim() || undefined, package_id: fields.package_id || undefined, source: resolvedSource };
      if (compact) {
        ["adults", "children", "hotel_preference", "transportation_preference", "special_requirements", "message"].forEach((key) => delete payload[key]);
      } else {
        payload.travellers = [fields.adults && `${fields.adults} adults`, fields.children && `${fields.children} children`].filter(Boolean).join(" + ");
      }
      const result = await submitEnquiry(payload);
      setState({ loading: false, success: `${result.message}${result.lead_id ? ` Your reference: ${result.lead_id}.` : ""}`, error: "" });
    } catch (error) {
      setState({ loading: false, success: "", error: error.message });
    }
  };

  if (compact) {
    return <form className="planner" onSubmit={submit} data-testid="trip-planner-form"><div className="planner-intro"><span className="eyebrow eyebrow-gold">Start with a feeling</span><h3>Let’s plan your<br /><em>next chapter.</em></h3></div><div className="planner-fields"><label>Name<input required value={fields.name} onChange={change("name")} data-testid="planner-name" placeholder="Your name" /></label><label>Phone<input required value={fields.phone} onChange={change("phone")} data-testid="planner-phone" placeholder="Phone number" /></label><label>Email (optional)<input type="email" value={fields.email} onChange={change("email")} data-testid="planner-email" placeholder="you@example.com" /></label><label>Destination<input value={fields.destination} onChange={change("destination")} data-testid="planner-destination" placeholder="Where to?" /></label><label>Travel date<input value={fields.travel_date} onChange={change("travel_date")} data-testid="planner-date" type="date" /></label><label>Travellers<select value={fields.travellers} onChange={change("travellers")} data-testid="planner-travellers"><option value="">How many?</option><option>1–2 travellers</option><option>3–5 travellers</option><option>6+ travellers</option></select></label><label>Holiday type<select value={fields.holiday_type} onChange={change("holiday_type")} data-testid="planner-type"><option value="">Choose a style</option><option>Leisure</option><option>Honeymoon</option><option>Family</option><option>Corporate</option></select></label><label>Approx. budget<select value={fields.budget} onChange={change("budget")} data-testid="planner-budget"><option value="">Your comfort zone</option><option>Under ₹50,000</option><option>₹50,000 – ₹1 lakh</option><option>₹1 lakh+</option></select></label><button className="button planner-button" disabled={state.loading || !!state.success} data-testid="planner-submit-button">{state.loading ? "Sending…" : state.success ? <><Check size={18} /> Received</> : <>Start planning <ArrowRight size={17} /></>}</button>{state.success && <div className="planner-status" data-testid="planner-success-message"><Check size={15} /> {state.success} <a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I just sent a trip enquiry.`)} target="_blank" rel="noreferrer" data-testid="planner-whatsapp-link">Continue on WhatsApp</a></div>}{state.error && <div className="planner-status planner-error" data-testid="planner-error-message">{state.error}</div>}</div></form>;
  }

  return (
    <form className="trip-form" onSubmit={submit} data-testid="custom-trip-form">
      <div className="trip-form-grid">
        <label>Full name<input required value={fields.name} onChange={change("name")} placeholder="Your name" data-testid="custom-trip-name" /></label>
        <label>Phone<input required value={fields.phone} onChange={change("phone")} placeholder="+91 …" data-testid="custom-trip-phone" /></label>
        <label>Email<input type="email" value={fields.email} onChange={change("email")} placeholder="you@example.com" data-testid="custom-trip-email" /></label>
        <label>Destination<input value={fields.destination} onChange={change("destination")} placeholder="Where to? (or “not sure yet”)" data-testid="custom-trip-destination" /></label>
        <label>Travel date<input type="date" value={fields.travel_date} onChange={change("travel_date")} data-testid="custom-trip-date" /></label>
        <label>Adults<select value={fields.adults} onChange={change("adults")} data-testid="custom-trip-adults"><option value="">Adults</option>{[1, 2, 3, 4, 5, 6, "7+"].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label>Children<select value={fields.children} onChange={change("children")} data-testid="custom-trip-children"><option value="">Children</option>{[0, 1, 2, 3, 4, "5+"].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label>Approx. budget<select value={fields.budget} onChange={change("budget")} data-testid="custom-trip-budget"><option value="">Your comfort zone</option><option>Under ₹50,000</option><option>₹50,000 – ₹1 lakh</option><option>₹1–2 lakh</option><option>₹2 lakh+</option></select></label>
        <label>Trip type<select value={fields.holiday_type} onChange={change("holiday_type")} data-testid="custom-trip-type"><option value="">Choose a style</option><option>Leisure</option><option>Honeymoon</option><option>Family</option><option>Adventure</option><option>Luxury</option><option>Corporate</option></select></label>
        <label>Hotel preference<select value={fields.hotel_preference} onChange={change("hotel_preference")} data-testid="custom-trip-hotel"><option value="">No preference</option><option>Comfortable (3–4 star)</option><option>Premium (4–5 star)</option><option>Luxury / boutique</option><option>A mix of styles</option></select></label>
        <label>Transport preference<select value={fields.transportation_preference} onChange={change("transportation_preference")} data-testid="custom-trip-transport"><option value="">No preference</option><option>Private car throughout</option><option>Flights + local transfers</option><option>A mix</option><option>Not sure — advise me</option></select></label>
        <label className="trip-form-wide">Special requirements<input value={fields.special_requirements} onChange={change("special_requirements")} placeholder="Accessibility, celebrations, dietary needs…" data-testid="custom-trip-special" /></label>
        <label className="trip-form-wide">Tell us about the trip you’re imagining<textarea rows={4} value={fields.message} onChange={change("message")} placeholder="Pace, interests, must-sees, things to avoid…" data-testid="custom-trip-message" /></label>
      </div>
      <div className="trip-form-footer">
        <button className="button" disabled={state.loading || !!state.success} data-testid="custom-trip-submit-button">{state.loading ? "Sending…" : state.success ? <><Check size={18} /> Received</> : <>Request my itinerary <ArrowRight size={17} /></>}</button>
        {state.success && <div className="planner-status" data-testid="custom-trip-success-message"><Check size={15} /> {state.success} <a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I just sent a customized trip request.`)} target="_blank" rel="noreferrer" data-testid="custom-trip-whatsapp-link">Continue on WhatsApp</a></div>}
        {state.error && <div className="planner-status planner-error" data-testid="custom-trip-error-message">{state.error}</div>}
      </div>
    </form>
  );
}
