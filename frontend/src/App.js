import { useState } from "react";
import {
  ArrowRight, CalendarDays, Check, ChevronDown, Compass, Globe2,
  Heart, Instagram, Menu, MessageCircle, Mountain, Plane, Send,
  ShieldCheck, Sparkles, Star, Users, X, Youtube
} from "lucide-react";
import "@/App.css";

const images = {
  hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
  kashmir: "https://images.unsplash.com/photo-1595815771614-ade9d1e6a3e8?auto=format&fit=crop&w=1000&q=80",
  kerala: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
  rajasthan: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80",
  maldives: "https://images.pexels.com/photos/9149367/pexels-photo-9149367.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=940",
  thailand: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=1000&q=80",
  editorial: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1300&q=80",
};

const destinations = [
  ["Goa", "Sunlit shores and slow coastal days", images.goa], ["Kashmir", "Meadows, mountains and quiet wonder", images.kashmir],
  ["Kerala", "Backwaters, spice trails and soul", images.kerala], ["Rajasthan", "Royal routes through living history", images.rajasthan],
  ["Dubai", "A bold city of unforgettable contrasts", images.dubai], ["Bali", "Rituals, rice terraces and ocean air", images.bali],
  ["Maldives", "Barefoot luxury in brilliant blue", images.maldives], ["Thailand", "Island escapes with a little more colour", images.thailand],
];

const packages = [
  { place: "Kashmir", name: "Valleys of Kashmir", duration: "6 days / 5 nights", price: "₹42,500", image: images.kashmir, tags: ["Srinagar", "Gulmarg", "Pahalgam"] },
  { place: "Bali", name: "The Bali Edit", duration: "7 days / 6 nights", price: "₹58,900", image: images.bali, tags: ["Ubud", "Nusa Dua", "Seminyak"] },
  { place: "Maldives", name: "Blue Horizon Escape", duration: "4 days / 3 nights", price: "₹68,500", image: images.maldives, tags: ["Overwater villa", "Breakfast", "Transfers"] },
];

const categories = [
  ["Domestic Holidays", "Find new corners closer to home", Mountain], ["International Holidays", "See the world your way", Globe2],
  ["Honeymoon", "A beautiful beginning together", Heart], ["Family Holidays", "More stories to share", Users],
  ["Adventure", "Take the scenic route", Compass], ["Luxury Travel", "The considered way to go", Sparkles],
  ["Group Tours", "Good company, great places", Users], ["Corporate Travel", "Travel that works smarter", Plane],
];

function Brand({ light = false }) {
  return <a href="#top" className={`brand ${light ? "brand-light" : ""}`} data-testid="brand-logo-link">
    <span className="brand-mark"><Plane size={19} strokeWidth={2.5} /></span>
    <span><strong>SUKHARA</strong><small>TRAVELS & TOURISM</small></span>
  </a>;
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [["About", "about"], ["Destinations", "destinations"], ["Holiday Packages", "packages"], ["Customized Trips", "custom"], ["Honeymoon", "categories"], ["Family Holidays", "categories"], ["Corporate / Group Travel", "categories"], ["Blog", "inspiration"], ["Contact", "contact"]];
  return <header className="navbar" data-testid="site-navigation">
    <div className="nav-inner"><Brand />
      <nav className={open ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
        {links.map(([label, id]) => <a key={label} href={`#${id}`} onClick={() => setOpen(false)} data-testid={`nav-link-${label.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")}`}>{label}</a>)}
      </nav>
      <div className="nav-actions"><a className="nav-whatsapp" href="https://wa.me/919876543210" target="_blank" rel="noreferrer" data-testid="nav-whatsapp-link"><MessageCircle size={16} /> WhatsApp</a><a className="button button-small" href="#planner" data-testid="nav-plan-button">Plan Your Trip <ArrowRight size={15} /></a></div>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" data-testid="mobile-menu-button">{open ? <X /> : <Menu />}</button>
    </div>
  </header>;
}

function Planner() {
  const [sent, setSent] = useState(false);
  return <section className="planner-wrap" id="planner"><div className="planner" data-testid="trip-planner-form"><div className="planner-intro"><span className="eyebrow eyebrow-gold">Start with a feeling</span><h3>Let’s plan your<br /><em>next chapter.</em></h3></div>
    <div className="planner-fields">
      <label>Destination<input data-testid="planner-destination" placeholder="Where to?" /></label>
      <label>Travel date<input data-testid="planner-date" type="date" /></label>
      <label>Travellers<select data-testid="planner-travellers" defaultValue=""><option value="" disabled>How many?</option><option>1–2 travellers</option><option>3–5 travellers</option><option>6+ travellers</option></select></label>
      <label>Holiday type<select data-testid="planner-type" defaultValue=""><option value="" disabled>Choose a style</option><option>Leisure</option><option>Honeymoon</option><option>Family</option><option>Corporate</option></select></label>
      <label>Approx. budget<select data-testid="planner-budget" defaultValue=""><option value="" disabled>Your comfort zone</option><option>Under ₹50,000</option><option>₹50,000 – ₹1 lakh</option><option>₹1 lakh+</option></select></label>
      <button className="button planner-button" onClick={() => setSent(true)} data-testid="planner-submit-button">{sent ? <><Check size={18} /> We'll be in touch</> : <>Start planning <ArrowRight size={17} /></>}</button>
    </div></div></section>;
}

function SectionHeading({ eyebrow, title, copy, link }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{copy && <p>{copy}</p>}{link && <a href={link.href} className="text-link" data-testid={`${link.label.toLowerCase().replaceAll(" ", "-")}-link`}>{link.label} <ArrowRight size={16} /></a>}</div>; }

function DestinationCard({ item, index }) { return <article className={`destination-card ${index === 0 ? "destination-featured" : ""}`} data-testid={`destination-card-${item[0].toLowerCase()}`}><img src={item[2]} alt={item[0]} /><div className="image-shade" /><div className="destination-copy"><span>0{index + 1}</span><h3>{item[0]}</h3><p>{item[1]}</p><a href="#planner" data-testid={`destination-explore-${item[0].toLowerCase()}`}>Explore <ArrowRight size={15} /></a></div></article>; }

function PackageCard({ item }) { return <article className="package-card" data-testid={`package-card-${item.place.toLowerCase()}`}><div className="package-image"><img src={item.image} alt={item.name} /><span className="package-badge">Curated escape</span></div><div className="package-body"><span className="card-kicker">{item.place}</span><h3>{item.name}</h3><div className="package-meta"><span><CalendarDays size={15} /> {item.duration}</span><strong>From {item.price}</strong></div><div className="tag-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="card-actions"><a href="#planner" className="button button-outline" data-testid={`package-view-${item.place.toLowerCase()}`}>View package</a><a href="#planner" className="text-link" data-testid={`package-enquire-${item.place.toLowerCase()}`}>Enquire <ArrowRight size={15} /></a></div></div></article>; }

function App() {
  return <div className="site" id="top"><Navbar /><main>
    <section className="hero"><img className="hero-image" src={images.hero} alt="Traveller overlooking a mountain landscape" /><div className="hero-overlay" /><div className="hero-content"><span className="eyebrow eyebrow-light">Travel, thoughtfully arranged</span><h1>Your journey<br /><em>begins with Sukhara.</em></h1><p>Discover thoughtfully planned domestic and international holidays, customized around the way you want to travel.</p><div className="hero-actions"><a href="#planner" className="button" data-testid="hero-plan-button">Plan Your Trip <ArrowRight size={17} /></a><a href="#packages" className="button button-ghost" data-testid="hero-packages-button">Explore Packages</a><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="hero-whatsapp" data-testid="hero-whatsapp-link"><MessageCircle size={19} /> WhatsApp us</a></div></div><div className="hero-note"><span>01</span><div><strong>Travel is personal.</strong><small>We make it feel that way.</small></div></div><div className="hero-scroll">Scroll to explore <span /></div></section>
    <Planner />
    <section className="section destinations" id="destinations"><SectionHeading eyebrow="A world of possibility" title="Where will you go next?" copy="From familiar shores to faraway places, find a destination that feels like yours." link={{ label: "View all destinations", href: "#destinations" }} /><div className="destination-grid">{destinations.map((item, i) => <DestinationCard item={item} index={i} key={item[0]} />)}</div></section>
    <section className="section packages-section" id="packages"><SectionHeading eyebrow="Made for the moment" title="Travel experiences worth remembering" copy="Thoughtful itineraries, beautiful stays and the right amount of room to wander." link={{ label: "See all packages", href: "#packages" }} /><div className="package-grid">{packages.map(item => <PackageCard item={item} key={item.name} />)}</div></section>
    <section className="why-section" id="about"><div className="why-image"><img src={images.editorial} alt="India travel architecture" /><span className="image-caption">A different point of view<br /><strong>is often the best souvenir.</strong></span></div><div className="why-copy"><span className="eyebrow">The Sukhara difference</span><h2>Why travel<br /><em>with Sukhara?</em></h2><p>Good travel planning is part research, part instinct. We bring both to every journey — listening carefully, then taking care of the details that make a trip feel effortless.</p><div className="benefits">{[["Personalized travel planning", "Your priorities lead the way."], ["Handpicked experiences", "The places worth making time for."], ["Transparent guidance", "Clear advice, from first call to return."], ["End-to-end support", "A considered hand whenever you need it."]].map(([title, copy], i) => <div className="benefit" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><Check size={17} /></div>)}</div></div></section>
    <section className="section category-section" id="categories"><SectionHeading eyebrow="Find your way" title="Travel in your own language" copy="Whether you crave a quiet escape or a full calendar, there is a Sukhara way to get there." /><div className="category-grid">{categories.map(([title, copy, Icon]) => <a href="#planner" className="category-card" key={title} data-testid={`category-${title.toLowerCase().replaceAll(" ", "-")}`}><Icon size={26} strokeWidth={1.4} /><h3>{title}</h3><p>{copy}</p><ArrowRight className="category-arrow" size={18} /></a>)}</div></section>
    <section className="custom-cta" id="custom"><div><span className="eyebrow eyebrow-gold">Built around you</span><h2>Your trip.<br /><em>Your way.</em></h2><p>Tell us where you want to go, how you want to travel, and what matters to you. We'll help turn it into a personalized journey.</p><div className="hero-actions"><a href="#planner" className="button" data-testid="custom-plan-button">Plan My Trip <ArrowRight size={17} /></a><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="button button-dark-outline" data-testid="custom-whatsapp-link"><MessageCircle size={17} /> WhatsApp Us</a></div></div><div className="cta-stamp"><span>✦</span><strong>Go<br />somewhere<br /><em>good.</em></strong></div></section>
    <section className="section inspiration-section" id="inspiration"><SectionHeading eyebrow="Notes from the road" title="Travel inspiration" copy="A little daydreaming, for whenever you are ready." link={{ label: "Read the journal", href: "#inspiration" }} /><div className="inspiration-grid"><article className="inspiration-feature"><img src={images.editorial} alt="Taj Mahal at sunrise" /><div><span className="card-kicker">A slower morning</span><h3>Three ways to experience India beyond the itinerary</h3><a href="#contact" data-testid="inspiration-feature-link">Read story <ArrowRight size={15} /></a></div></article><div className="inspiration-list">{[["The art of the island day", "Maldives", images.maldives], ["A weekend in the blue city", "Rajasthan", images.rajasthan], ["When the mountains call", "Kashmir", images.kashmir]].map(([title, place, image]) => <a href="#contact" className="inspiration-item" key={title} data-testid={`inspiration-${place.toLowerCase()}`}><img src={image} alt={place} /><div><span>{place}</span><h3>{title}</h3><small>Explore the story <ArrowRight size={14} /></small></div></a>)}</div></div></section>
    <section className="testimonial-section"><div className="testimonial-mark">“</div><span className="eyebrow eyebrow-gold">Memories made with Sukhara</span><h2>“The best trips feel a little<br /><em>like they were always yours.”</em></h2><p className="sample-label">SAMPLE / DEMO TESTIMONIAL</p><p className="testimonial-note">This space is ready for a real traveller story from your Sukhara community.</p><div className="stars" aria-label="Sample testimonial rating"><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /></div></section>
    <section className="final-cta" id="contact"><div><span className="eyebrow eyebrow-light">The next destination is yours</span><h2>Let’s plan your<br /><em>next journey.</em></h2><p>From weekend escapes to international holidays, tell us what you're dreaming about.</p></div><div className="final-actions"><a href="#planner" className="button" data-testid="final-plan-button">Plan Your Trip <ArrowRight size={17} /></a><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="button button-ghost" data-testid="final-whatsapp-link"><MessageCircle size={17} /> WhatsApp Us</a></div></section>
  </main><Footer /></div>;
}

function Footer() { return <footer className="footer"><div className="footer-main"><div className="footer-brand"><Brand light /><p>Thoughtful journeys, beautifully arranged.<br />India · The world · Your way</p><a className="footer-mail" href="mailto:hello@sukharatravels.com" data-testid="footer-email-link">hello@sukharatravels.com</a></div><div className="footer-links"><div><span>Explore</span><a href="#top" data-testid="footer-home-link">Home</a><a href="#about">About</a><a href="#destinations">Destinations</a><a href="#packages">Holiday packages</a><a href="#inspiration">Travel journal</a></div><div><span>Travel with us</span><a href="#custom">Customized trips</a><a href="#categories">Honeymoon</a><a href="#categories">Family holidays</a><a href="#categories">Corporate / group</a><a href="#contact">Contact</a></div><div><span>Say hello</span><p>+91 98765 43210<br />Kerala, India<br />Mon–Sat · 9am–6pm</p><div className="socials"><a href="#contact" aria-label="Instagram" data-testid="instagram-link"><Instagram size={17} /></a><a href="#contact" aria-label="Facebook" data-testid="facebook-link"><Users size={17} /></a><a href="#contact" aria-label="YouTube" data-testid="youtube-link"><Youtube size={17} /></a></div></div></div></div><div className="footer-bottom"><span>© 2025 Sukhara Travels and Tourism</span><div><a href="#contact">Privacy policy</a><a href="#contact">Terms & conditions</a><a href="#contact">Cancellation policy</a></div><span className="footer-domain">sukharatravels.com</span></div></footer>; }

export default App;