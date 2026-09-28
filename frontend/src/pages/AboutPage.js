import { Check, Compass, Ear, HandHeart } from "lucide-react";
import { DetailHero, DetailShell, PageCta, useSettings, useTitle } from "../components/public";

const aboutImage = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80";

const VALUES = [
  ["Listen first", "Your trip starts with a conversation, not a catalogue. We ask before we suggest.", Ear],
  ["Sweat the details", "Transfers, timings, room views — the small things are the trip.", Compass],
  ["Be honest", "If something is not worth your money or your time, we will tell you.", HandHeart],
];

const STEPS = [
  ["Tell us how you travel", "A short conversation about where, when, and what matters to you."],
  ["We shape the journey", "A tailored itinerary with clear costs — no padding, no pressure."],
  ["Refine it together", "We adjust until it feels like yours, then handle the bookings."],
  ["Travel with a safety net", "A real person stays reachable for the whole trip."],
];

export default function AboutPage() {
  const settings = useSettings();
  useTitle("About");

  return (
    <DetailShell settings={settings}>
      <div data-testid="about-page">
        <DetailHero image={aboutImage} eyebrow="About Sukhara" title={<>Travel, thoughtfully<br /><em>arranged.</em></>} description="Sukhara Travels and Tourism is an Indian travel agency helping travellers plan domestic and international holidays — from quick escapes to once-in-a-lifetime journeys." />
        <section className="detail-content">
          <div>
            <span className="eyebrow">Our story</span>
            <h2>It starts with<br /><em>listening.</em></h2>
            <p>Sukhara began with a simple observation: most trips go wrong in the planning, not in the place. Too many itineraries are copied, rushed, or built around what is easy to sell rather than what is right for the traveller.</p>
            <p>We wanted to do the opposite — plan each journey around the person taking it. The pace you enjoy, the experiences you care about, the budget you are comfortable with. That is the whole idea, and we work at it one trip at a time.</p>
          </div>
          <div className="highlight-panel">
            <span className="eyebrow">What guides us</span>
            <h3>Mission & vision</h3>
            <div><Check size={15} /> <span><strong>Mission:</strong> to make well-planned travel feel personal, clear and calm — for every traveller, on every budget we work with.</span></div>
            <div><Check size={15} /> <span><strong>Vision:</strong> a travel company people recommend because planning felt as good as the trip itself.</span></div>
          </div>
        </section>
        <section className="section" style={{ paddingTop: "20px" }}>
          <div className="section-heading"><div><span className="eyebrow">Our values</span><h2>How we work</h2></div></div>
          <div className="category-grid value-grid">
            {VALUES.map(([title, copy, Icon]) => (
              <div className="category-card" key={title} data-testid={`value-${title.toLowerCase().replaceAll(" ", "-")}`}><Icon size={26} strokeWidth={1.4} /><h3>{title}</h3><p>{copy}</p></div>
            ))}
          </div>
        </section>
        <section className="why-section">
          <div className="why-copy" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
            <span className="eyebrow">How we plan your trips</span>
            <h2>A simple,<br /><em>careful process.</em></h2>
            <div className="benefits">
              {STEPS.map(([title, copy], i) => <div className="benefit" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><Check size={17} /></div>)}
            </div>
          </div>
          <div className="why-copy" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
            <span className="eyebrow">Why travel with Sukhara</span>
            <h2>What you can<br /><em>count on.</em></h2>
            <p>We do not claim awards or rankings. We simply promise careful planning, honest advice and a human on the other end when you need one.</p>
            <div className="benefits">
              {[["Personalized planning", "Your priorities lead the way."], ["Transparent guidance", "Clear costs and honest advice."], ["End-to-end support", "From first call to safe return."]].map(([title, copy], i) => <div className="benefit" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><Check size={17} /></div>)}
            </div>
          </div>
        </section>
      </div>
      <PageCta settings={settings} eyebrow="Nice to meet you" copy="Tell us about the trip on your mind — we will take it from there." />
    </DetailShell>
  );
}
