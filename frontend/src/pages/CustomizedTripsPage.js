import { Check } from "lucide-react";
import { DetailHero, DetailShell, PlannerForm, useSettings, useTitle, waUrl } from "../components/public";
import { MessageCircle } from "lucide-react";

const heroImage = "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=80";

const STEPS = [
  ["Tell us everything", "Where, when, who is coming, and what a perfect day looks like for you."],
  ["We draft your itinerary", "A route, stays and experiences shaped around your answers — with clear costs."],
  ["Refine until it fits", "We adjust the plan together until it feels exactly right, then book it."],
];

export default function CustomizedTripsPage() {
  const settings = useSettings();
  useTitle("Customized Trips");

  return (
    <DetailShell settings={settings}>
      <div data-testid="customized-trips-page">
        <DetailHero image={heroImage} eyebrow="Built around you" title={<>Your trip.<br /><em>Your way.</em></>} description="Tell us where you want to go, how you want to travel, and what matters to you. We'll help turn it into a personalized journey — planned around you, not a template." />
        <section className="section" style={{ paddingTop: "90px", paddingBottom: "40px" }}>
          <div className="section-heading"><div><span className="eyebrow">How it works</span><h2>Three easy steps</h2></div><p>No forms lost in the void — your request goes straight to a Sukhara planner.</p></div>
          <div className="benefits benefits-flat">
            {STEPS.map(([title, copy], i) => <div className="benefit" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><Check size={17} /></div>)}
          </div>
        </section>
        <section className="trip-form-section" id="custom-trip-form">
          <div className="trip-form-intro">
            <span className="eyebrow">Start here</span>
            <h2>Request your<br /><em>custom itinerary.</em></h2>
            <p>The more you tell us, the better the first draft. Rough answers are perfectly fine.</p>
            <a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I would like a customized trip planned.`)} target="_blank" rel="noreferrer" className="whatsapp-detail" data-testid="custom-trip-page-whatsapp"><MessageCircle size={17} /> Prefer WhatsApp? Message us instead</a>
          </div>
          <PlannerForm settings={settings} source="Customized Trip" />
        </section>
      </div>
    </DetailShell>
  );
}
