import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useParams } from "react-router-dom";
import { ArrowRight, Check, Compass, Globe2, Heart, MessageCircle, Mountain, Plane, Sparkles, Star, Users } from "lucide-react";
import "@/App.css";
import { getDestination, getDestinations, getPackage, getPackages } from "@/api";
import { DestinationCard, DetailHero, DetailShell, Gallery, PackageCard, PlannerForm, SectionHeading, useSettings, waUrl } from "@/components/public";
import AdminApp from "@/admin/AdminApp";

const heroImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85";
const categories = [["Domestic Holidays", "Find new corners closer to home", Mountain, "/#destinations"], ["International Holidays", "See the world your way", Globe2, "/#destinations"], ["Honeymoon", "A beautiful beginning together", Heart, "/honeymoon"], ["Family Holidays", "More stories to share", Users, "/family-holidays"], ["Adventure", "Take the scenic route", Compass, "/customized-trips"], ["Luxury Travel", "The considered way to go", Sparkles, "/customized-trips"], ["Group Tours", "Good company, great places", Users, "/corporate-group-travel"], ["Corporate Travel", "Travel that works smarter", Plane, "/corporate-group-travel"]];

function Home() {
  const settings = useSettings();
  const [data, setData] = useState({ destinations: [], packages: [], error: "" });
  useEffect(() => { Promise.all([getDestinations(true), getPackages(true)]).then(([destinations, packages]) => setData({ destinations, packages, error: "" })).catch((error) => setData((current) => ({ ...current, error: error.message }))); }, []);
  const { destinations, packages, error } = data;
  return <div className="site" id="top"><main><section className="hero"><img className="hero-image" src={heroImage} alt="Traveller overlooking a mountain landscape" /><div className="hero-overlay" /><div className="hero-content"><span className="eyebrow eyebrow-light">Travel, thoughtfully arranged</span><h1>Your journey<br /><em>begins with Sukhara.</em></h1><p>Discover thoughtfully planned domestic and international holidays, customized around the way you want to travel.</p><div className="hero-actions"><a href="#planner" className="button" data-testid="hero-plan-button">Plan Your Trip <ArrowRight size={17} /></a><a href="#packages" className="button button-ghost" data-testid="hero-packages-button">Explore Packages</a><a href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" className="hero-whatsapp" data-testid="hero-whatsapp-link"><MessageCircle size={19} /> WhatsApp us</a></div></div><div className="hero-note"><span>01</span><div><strong>Travel is personal.</strong><small>We make it feel that way.</small></div></div><div className="hero-scroll">Scroll to explore <span /></div></section><section className="planner-wrap" id="planner"><PlannerForm settings={settings} compact /></section>
    {error && <div className="data-notice" data-testid="content-load-error">Content is temporarily unavailable. Please try again shortly.</div>}
    <section className="section destinations" id="destinations"><SectionHeading eyebrow="A world of possibility" title="Where will you go next?" copy="From familiar shores to faraway places, find a destination that feels like yours." /><div className="destination-grid">{destinations.map((item, index) => <DestinationCard item={item} index={index} key={item.id} />)}</div></section>
    <section className="section packages-section" id="packages"><SectionHeading eyebrow="Made for the moment" title="Travel experiences worth remembering" copy="Thoughtful itineraries, beautiful stays and the right amount of room to wander." /><div className="package-grid">{packages.map((item) => <PackageCard item={item} key={item.id} />)}</div></section>
    <section className="why-section" id="about"><div className="why-image"><img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1300&q=80" alt="India travel architecture" /><span className="image-caption">A different point of view<br /><strong>is often the best souvenir.</strong></span></div><div className="why-copy"><span className="eyebrow">The Sukhara difference</span><h2>Why travel<br /><em>with Sukhara?</em></h2><p>Good travel planning is part research, part instinct. We bring both to every journey — listening carefully, then taking care of the details that make a trip feel effortless.</p><div className="benefits">{[["Personalized travel planning", "Your priorities lead the way."], ["Handpicked experiences", "The places worth making time for."], ["Transparent guidance", "Clear advice, from first call to return."], ["End-to-end support", "A considered hand whenever you need it."]].map(([title, copy], i) => <div className="benefit" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><Check size={17} /></div>)}</div><Link to="/about" className="text-link" data-testid="about-read-more-link" style={{ marginTop: "25px" }}>More about Sukhara <ArrowRight size={16} /></Link></div></section>
    <section className="section category-section" id="categories"><SectionHeading eyebrow="Find your way" title="Travel in your own language" copy="Whether you crave a quiet escape or a full calendar, there is a Sukhara way to get there." /><div className="category-grid">{categories.map(([title, copy, Icon, href]) => <a href={href} className="category-card" key={title} data-testid={`category-${title.toLowerCase().replaceAll(" ", "-")}`}><Icon size={26} strokeWidth={1.4} /><h3>{title}</h3><p>{copy}</p><ArrowRight className="category-arrow" size={18} /></a>)}</div></section>
    <section className="custom-cta" id="custom"><div><span className="eyebrow eyebrow-gold">Built around you</span><h2>Your trip.<br /><em>Your way.</em></h2><p>Tell us where you want to go, how you want to travel, and what matters to you. We'll help turn it into a personalized journey.</p><div className="hero-actions"><Link to="/customized-trips" className="button" data-testid="custom-plan-button">Plan My Trip <ArrowRight size={17} /></Link><a href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" className="button button-dark-outline" data-testid="custom-whatsapp-link"><MessageCircle size={17} /> WhatsApp Us</a></div></div><div className="cta-stamp"><span>✦</span><strong>Go<br />somewhere<br /><em>good.</em></strong></div></section>
    <section className="section inspiration-section" id="inspiration"><SectionHeading eyebrow="Notes from the road" title="Travel inspiration" copy="A little daydreaming, for whenever you are ready." link={{ label: "Read the journal", href: "/blog" }} /><div className="inspiration-grid"><article className="inspiration-feature"><img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1300&q=80" alt="Taj Mahal at sunrise" /><div><span className="card-kicker">A slower morning</span><h3>Three ways to experience India beyond the itinerary</h3><Link to="/blog" data-testid="inspiration-feature-link">Read the journal <ArrowRight size={15} /></Link></div></article><div className="inspiration-list">{destinations.slice(0, 3).map((item) => <Link to={`/destinations/${item.slug}`} className="inspiration-item" key={item.id} data-testid={`inspiration-${item.slug}`}><img src={item.hero_image} alt={item.name} /><div><span>{item.name}</span><h3>{item.short_description}</h3><small>Explore the story <ArrowRight size={14} /></small></div></Link>)}</div></div></section>
    <section className="testimonial-section"><div className="testimonial-mark">"</div><span className="eyebrow eyebrow-gold">Memories made with Sukhara</span><h2>"The best trips feel a little<br /><em>like they were always yours."</em></h2><p className="sample-label">SAMPLE / DEMO TESTIMONIAL</p><p className="testimonial-note">This space is ready for a real traveller story from your Sukhara community.</p><div className="stars" aria-label="Sample testimonial rating"><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /></div><Link to="/testimonials" className="text-link" style={{ marginTop: "25px" }} data-testid="testimonials-page-link">Visit the testimonials page <ArrowRight size={16} /></Link></section><section className="final-cta" id="contact"><div><span className="eyebrow eyebrow-light">The next destination is yours</span><h2>Let's plan your<br /><em>next journey.</em></h2><p>From weekend escapes to international holidays, tell us what you're dreaming about.</p></div><div className="final-actions"><Link to="/customized-trips" className="button" data-testid="final-plan-button">Plan Your Trip <ArrowRight size={17} /></Link><a href={waUrl(settings.whatsapp)} target="_blank" rel="noreferrer" className="button button-ghost" data-testid="final-whatsapp-link"><MessageCircle size={17} /> WhatsApp Us</a></div></section></main></div>;
}

function DestinationPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const settings = useSettings();
  useEffect(() => { getDestination(slug).then(setData).catch(() => setData({ notFound: true })); }, [slug]);
  if (!data) return <div className="detail-loading">Loading your destination…</div>;
  if (data.notFound) return <div className="detail-loading">Destination not found.</div>;
  return <DetailShell settings={settings}><DetailHero image={data.hero_image} eyebrow={data.country} title={data.name} description={data.full_description} /><section className="detail-content"><div><span className="eyebrow">The essentials</span><h2>A considered way<br /><em>to see {data.name}.</em></h2><p>{data.full_description}</p><div className="detail-facts"><div><span>Best time to visit</span><strong>{data.best_time_to_visit}</strong></div><div><span>Recommended duration</span><strong>{data.recommended_duration}</strong></div></div></div><div className="highlight-panel"><span className="eyebrow">Make it yours</span><h3>Highlights</h3>{data.highlights.map((highlight) => <div key={highlight}><Check size={15} /> {highlight}</div>)}<a href={`/?destination=${encodeURIComponent(data.name)}#planner`} className="button" data-testid="destination-enquire-button">Enquire Now <ArrowRight size={16} /></a><a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I am interested in a trip to ${data.name}.`)} target="_blank" rel="noreferrer" className="whatsapp-detail" data-testid="destination-whatsapp-link"><MessageCircle size={17} /> WhatsApp Us</a></div></section><Gallery images={data.gallery} title={`${data.name} in focus`} /><section className="related-section"><SectionHeading eyebrow="Curated for you" title="Related packages" /> <div className="package-grid">{data.related_packages.map((item) => <PackageCard item={item} key={item.id} />)}</div></section></DetailShell>;
}

function PackagePage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [destSlug, setDestSlug] = useState("");
  const settings = useSettings();
  useEffect(() => {
    getPackage(slug).then((item) => {
      setData(item);
      getDestinations().then((destinations) => {
        const match = destinations.find((destination) => destination.id === item.destination_id);
        if (match) setDestSlug(match.slug);
      }).catch(() => {});
    }).catch(() => setData({ notFound: true }));
  }, [slug]);
  if (!data) return <div className="detail-loading">Loading your itinerary…</div>;
  if (data.notFound) return <div className="detail-loading">Package not found.</div>;
  return <DetailShell settings={settings}><DetailHero image={data.hero_image} eyebrow={`${data.destination} · ${data.duration}`} title={data.title} description={data.full_description} /><section className="detail-content package-detail"><div><span className="eyebrow">Sample / demo itinerary</span><h2>Travel experiences<br /><em>worth remembering.</em></h2><div className="price-line"><strong>From {data.starting_price}</strong><span>{data.duration}</span></div><div className="itinerary">{data.itinerary.map((day) => <article key={day.id}><span>Day {day.day_number}</span><div><h3>{day.title}</h3><p>{day.description}</p><small>{day.meals} · {day.accommodation}</small></div></article>)}</div>{destSlug && <Link to={`/destinations/${destSlug}`} className="text-link" style={{ marginTop: "25px" }} data-testid="package-destination-link">Explore the {data.destination} destination guide <ArrowRight size={16} /></Link>}</div><div className="highlight-panel"><span className="eyebrow">Included in your journey</span><h3>At a glance</h3>{data.highlights.map((item) => <div key={item}><Check size={15} /> {item}</div>)}<h4>Inclusions</h4>{data.inclusions.map((item) => <p key={item}>{item}</p>)}<h4>Exclusions</h4>{data.exclusions.map((item) => <p key={item}>{item}</p>)}<a href={`/?package_id=${data.id}&destination=${encodeURIComponent(data.destination)}#planner`} className="button" data-testid="package-enquire-button">Enquire Now <ArrowRight size={16} /></a><a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I am interested in the ${data.title} package. Please share more details.`)} target="_blank" rel="noreferrer" className="whatsapp-detail" data-testid="package-whatsapp-link"><MessageCircle size={17} /> WhatsApp Us</a></div></section><Gallery images={data.gallery} title={`${data.title} gallery`} /></DetailShell>;
}

import { BlogList, BlogPost } from "@/pages/Blog";
import GalleryPage from "@/pages/GalleryPage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import FaqPage from "@/pages/FaqPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import CustomizedTripsPage from "@/pages/CustomizedTripsPage";
import { CorporatePage, FamilyPage, HoneymoonPage } from "@/pages/CategoryPages";
import { Navbar, Footer } from "@/components/public";

function PublicShell({ children }) {
  const settings = useSettings();
  return <><Navbar settings={settings} />{children}<Footer settings={settings} /></>;
}

function HomePage() {
  return <PublicShell><Home /></PublicShell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/destinations/:slug" element={<DestinationPage />} />
        <Route path="/packages/:slug" element={<PackagePage />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/customized-trips" element={<CustomizedTripsPage />} />
        <Route path="/honeymoon" element={<HoneymoonPage />} />
        <Route path="/family-holidays" element={<FamilyPage />} />
        <Route path="/corporate-group-travel" element={<CorporatePage />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
