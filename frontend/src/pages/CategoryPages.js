import { useEffect, useState } from "react";
import { ArrowRight, BedDouble, Bus, CalendarHeart, Check, Heart, MessageCircle, Plane, Users } from "lucide-react";
import { getDestinations, getPackages, submitEnquiry } from "@/api";
import { DestinationCard, DetailHero, DetailShell, PackageCard, PageCta, PublicEmpty, useSettings, useTitle, waUrl } from "../components/public";

const CONFIG = {
  honeymoon: {
    image: "https://images.pexels.com/photos/9149367/pexels-photo-9149367.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1800",
    eyebrow: "Honeymoon",
    title: <>A beautiful beginning,<br /><em>beautifully planned.</em></>,
    copy: "Slow mornings, rooms with a view, and days with nothing to prove. We plan honeymoons that start gently and stay unhurried.",
    experiences: [["Slow starts", "Your first days stay effortless — no dawn transfers after a wedding week."], ["Private moments", "Sunset cruises, candlelit dinners, quiet corners worth remembering."], ["Stays that matter", "Rooms chosen for the view you will actually sit in together."]],
    packageCategory: "Honeymoon",
    packageHeading: "Honeymoon packages",
    emptyNote: "Every honeymoon we plan is shaped to order. Tell us your dates and style, and we will build the first draft around you.",
    why: [["A gentle first 48 hours", "Because you arrive happily exhausted."], ["One beautiful thing a day", "Room to breathe between experiences."], ["Small surprises", "The details neither of you planned are the ones you remember."]],
  },
  family: {
    image: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=1800&q=80",
    eyebrow: "Family holidays",
    title: <>Trips the whole family<br /><em>actually enjoys.</em></>,
    copy: "Kid-friendly pacing, rooms that fit everyone, and days planned so the grandparents and the seven-year-old both have a good time.",
    experiences: [["Sensible pacing", "Shorter drives, pool time, and afternoons that do not melt down."], ["Rooms that work", "Family rooms, interconnecting options and honest advice on what fits."], ["Something for everyone", "A little adventure for the kids, a little quiet for the adults."]],
    packageCategory: "Family Holidays",
    packageHeading: "Family packages",
    emptyNote: "Family trips are our favourite puzzles. Tell us who is travelling and we will shape the plan around all of you.",
    why: [["We think about the kids", "Meal times, nap windows and attention spans are in the plan."], ["And the grandparents", "Comfortable stays and gentle days when needed."], ["One point of contact", "A planner who knows your family by name."]],
  },
};

export function CategoryLanding({ kind }) {
  const config = CONFIG[kind];
  const settings = useSettings();
  useTitle(config.eyebrow);
  const [data, setData] = useState({ destinations: [], packages: [] });

  useEffect(() => {
    Promise.all([getDestinations(true), getPackages()]).then(([destinations, packages]) => setData({ destinations, packages })).catch(() => {});
  }, []);

  const packages = data.packages.filter((item) => item.category === config.packageCategory);

  return (
    <DetailShell settings={settings}>
      <div data-testid={`${kind}-page`}>
        <DetailHero image={config.image} eyebrow={config.eyebrow} title={config.title} description={config.copy} />
        <section className="section" style={{ paddingTop: "90px", paddingBottom: "40px" }}>
          <div className="section-heading"><div><span className="eyebrow">The Sukhara way</span><h2>What we plan in</h2></div></div>
          <div className="category-grid value-grid">
            {config.experiences.map(([title, copy], i) => <div className="category-card" key={title} data-testid={`${kind}-experience-${i}`}>{kind === "honeymoon" ? <Heart size={26} strokeWidth={1.4} /> : <Users size={26} strokeWidth={1.4} />}<h3>{title}</h3><p>{copy}</p></div>)}
          </div>
        </section>
        <section className="section destinations" style={{ paddingTop: "20px", paddingBottom: "40px" }}>
          <div className="section-heading"><div><span className="eyebrow">Where to go</span><h2>Places we love for this</h2></div><p>Any of these can anchor your trip — or ask us for somewhere less obvious.</p></div>
          <div className="destination-grid">{data.destinations.slice(0, 4).map((item, index) => <DestinationCard item={item} index={index} key={item.id} />)}</div>
        </section>
        <section className="section packages-section" style={{ paddingTop: "20px" }}>
          <div className="section-heading"><div><span className="eyebrow">From the collection</span><h2>{config.packageHeading}</h2></div></div>
          {packages.length > 0 ? (
            <div className="package-grid">{packages.map((item) => <PackageCard item={item} key={item.id} />)}</div>
          ) : (
            <PublicEmpty title="Built to order" copy={config.emptyNote} />
          )}
        </section>
        <section className="why-section">
          <div className="why-copy" style={{ paddingTop: "80px", paddingBottom: "80px", gridColumn: "1 / -1" }}>
            <span className="eyebrow">Why Sukhara for this</span>
            <h2>Planned like<br /><em>it matters.</em></h2>
            <div className="benefits">
              {config.why.map(([title, copy], i) => <div className="benefit" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><Check size={17} /></div>)}
            </div>
          </div>
        </section>
      </div>
      <PageCta settings={settings} eyebrow={config.eyebrow} copy={config.copy} />
    </DetailShell>
  );
}

export function HoneymoonPage() {
  return <CategoryLanding kind="honeymoon" />;
}

export function FamilyPage() {
  return <CategoryLanding kind="family" />;
}

const SERVICES = [
  ["Corporate travel", "Offsites, conferences and business trips with clear budgets and tidy logistics.", Plane],
  ["Group tours", "Friends, clubs and communities travelling together — without the spreadsheet chaos.", Users],
  ["Team travel", "Team-building getaways planned around your people and your calendar.", CalendarHeart],
  ["Custom group itineraries", "Routes built for your group size, pace and interests — not a fixed departure.", BedDouble],
  ["Hotel coordination", "Room blocks, check-in flow and meal arrangements handled for the whole group.", BedDouble],
  ["Transportation", "Coaches, transfers and multi-city movement planned so nobody is left waiting.", Bus],
];

export function CorporatePage() {
  const settings = useSettings();
  useTitle("Corporate & Group Travel");
  const [fields, setFields] = useState({ name: "", phone: "", email: "", travellers: "", message: "" });
  const [state, setState] = useState({ loading: false, success: "", error: "" });
  const change = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (state.loading || state.success) return;
    if (!/^[0-9+\-\s()]{7,18}$/.test(fields.phone.trim())) { setState({ loading: false, success: "", error: "Please enter a valid phone number." }); return; }
    setState({ loading: true, success: "", error: "" });
    try {
      const result = await submitEnquiry({ name: fields.name, phone: fields.phone, email: fields.email.trim() || undefined, travellers: fields.travellers || undefined, message: fields.message || undefined, holiday_type: "Corporate", source: "Corporate / Group Travel" });
      setState({ loading: false, success: `${result.message}${result.lead_id ? ` Your reference: ${result.lead_id}.` : ""}`, error: "" });
    } catch (error) {
      setState({ loading: false, success: "", error: error.message });
    }
  };

  return (
    <DetailShell settings={settings}>
      <div data-testid="corporate-page">
        <DetailHero image="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=80" eyebrow="Corporate & group travel" title={<>Travel that works<br /><em>for everyone.</em></>} description="Offsites, group tours and team travel — planned with clear budgets, tidy logistics and one accountable point of contact." />
        <section className="section" style={{ paddingTop: "90px", paddingBottom: "50px" }}>
          <div className="section-heading"><div><span className="eyebrow">What we handle</span><h2>Group travel, end to end</h2></div><p>From a ten-person offsite to a hundred-person tour, the planning standard stays the same.</p></div>
          <div className="category-grid value-grid">
            {SERVICES.map(([title, copy, Icon], i) => <div className="category-card" key={title} data-testid={`corporate-service-${i}`}><Icon size={26} strokeWidth={1.4} /><h3>{title}</h3><p>{copy}</p></div>)}
          </div>
        </section>
        <section className="trip-form-section" id="group-enquiry">
          <div className="trip-form-intro">
            <span className="eyebrow">Start the conversation</span>
            <h2>Tell us about<br /><em>your group.</em></h2>
            <p>A few details and we will come back with a practical plan and a clear estimate.</p>
            <a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I would like to discuss a corporate / group trip.`)} target="_blank" rel="noreferrer" className="whatsapp-detail" data-testid="corporate-whatsapp-link"><MessageCircle size={17} /> Prefer WhatsApp? Message us instead</a>
          </div>
          <form className="trip-form" onSubmit={submit} data-testid="corporate-enquiry-form">
            <div className="trip-form-grid">
              <label>Your name<input required value={fields.name} onChange={change("name")} placeholder="Full name" data-testid="corporate-name" /></label>
              <label>Phone<input required value={fields.phone} onChange={change("phone")} placeholder="+91 …" data-testid="corporate-phone" /></label>
              <label>Email<input type="email" value={fields.email} onChange={change("email")} placeholder="you@company.com" data-testid="corporate-email" /></label>
              <label>Group size<select value={fields.travellers} onChange={change("travellers")} data-testid="corporate-travellers"><option value="">How many people?</option><option>Under 10</option><option>10–25</option><option>25–50</option><option>50+</option></select></label>
              <label className="trip-form-wide">What are you planning?<textarea rows={4} value={fields.message} onChange={change("message")} placeholder="Occasion, rough dates, destination ideas, budget range…" data-testid="corporate-message" /></label>
            </div>
            <div className="trip-form-footer">
              <button className="button" disabled={state.loading || !!state.success} data-testid="corporate-submit-button">{state.loading ? "Sending…" : state.success ? <><Check size={18} /> Received</> : <>Request a group plan <ArrowRight size={17} /></>}</button>
              {state.success && <div className="planner-status" data-testid="corporate-success-message"><Check size={15} /> {state.success}</div>}
              {state.error && <div className="planner-status planner-error" data-testid="corporate-error-message">{state.error}</div>}
            </div>
          </form>
        </section>
      </div>
      <PageCta settings={settings} eyebrow="Corporate & group travel" copy="One conversation is usually enough to know if we are the right planners for your group." />
    </DetailShell>
  );
}
