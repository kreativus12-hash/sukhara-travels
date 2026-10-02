import { useState } from "react";
import { ArrowRight, Check, Clock, Instagram, Mail, MapPin, MessageCircle, Phone, Users, Youtube } from "lucide-react";
import { submitContact } from "@/api";
import { DetailShell, PageCta, useSettings, useTitle, waUrl } from "../components/public";

export default function ContactPage() {
  const settings = useSettings();
  useTitle("Contact");
  const [fields, setFields] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [state, setState] = useState({ loading: false, success: "", error: "" });
  const change = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (state.loading || state.success) return;
    if (fields.phone && !/^[0-9+\-\s()]{7,18}$/.test(fields.phone.trim())) { setState({ loading: false, success: "", error: "Please enter a valid phone number." }); return; }
    setState({ loading: true, success: "", error: "" });
    try {
      const result = await submitContact({ ...fields, email: fields.email.trim() || undefined, phone: fields.phone.trim() || undefined, subject: fields.subject || undefined });
      setState({ loading: false, success: result.message, error: "" });
    } catch (error) {
      setState({ loading: false, success: "", error: error.message });
    }
  };

  return (
    <DetailShell settings={settings}>
      <section className="page-head" data-testid="contact-page">
        <span className="eyebrow">Say hello</span>
        <h2>Talk to a<br /><em>real planner.</em></h2>
        <p>Call, message or write to us — a person from Sukhara replies, not a bot.</p>
      </section>
      <div className="contact-grid">
        <div className="highlight-panel contact-info" data-testid="contact-info-panel">
          <span className="eyebrow">Reach us directly</span>
          <h3>{settings.company_name}</h3>
          <div><Phone size={15} /> <a href={`tel:${settings.phone}`} data-testid="contact-phone-link">{settings.phone}</a></div>
          <div><MessageCircle size={15} /> <a href={waUrl(settings.whatsapp, `Hi ${settings.company_name}, I have a question.`) } target="_blank" rel="noreferrer" data-testid="contact-whatsapp-link">WhatsApp us</a></div>
          <div><Mail size={15} /> <a href={`mailto:${settings.email}`} data-testid="contact-email-link">{settings.email}</a></div>
          <div><MapPin size={15} /> <span>{settings.address}</span></div>
          <div><Clock size={15} /> <span>{settings.business_hours}</span></div>
          {settings.map_url ? <a href={settings.map_url} target="_blank" rel="noreferrer" className="whatsapp-detail" data-testid="contact-map-link"><MapPin size={16} /> Open in Google Maps</a> : null}
          <div className="socials socials-dark">
            {settings.instagram ? <a href={settings.instagram} aria-label="Instagram" data-testid="contact-instagram-link"><Instagram size={16} /></a> : null}
            {settings.facebook ? <a href={settings.facebook} aria-label="Facebook" data-testid="contact-facebook-link"><Users size={16} /></a> : null}
            {settings.youtube ? <a href={settings.youtube} aria-label="YouTube" data-testid="contact-youtube-link"><Youtube size={16} /></a> : null}
          </div>
        </div>
        <form className="trip-form contact-form" onSubmit={submit} data-testid="contact-form">
          <div className="trip-form-grid contact-form-grid">
            <label>Your name<input required value={fields.name} onChange={change("name")} placeholder="Full name" data-testid="contact-name" /></label>
            <label>Email<input required type="email" value={fields.email} onChange={change("email")} placeholder="you@example.com" data-testid="contact-email" /></label>
            <label>Phone (optional)<input value={fields.phone} onChange={change("phone")} placeholder="+91 …" data-testid="contact-phone" /></label>
            <label>Subject<select value={fields.subject} onChange={change("subject")} data-testid="contact-subject"><option value="">Choose a topic</option><option>Trip enquiry</option><option>Existing booking</option><option>Corporate / group travel</option><option>Feedback</option><option>Something else</option></select></label>
            <label className="trip-form-wide">Your message<textarea required rows={5} value={fields.message} onChange={change("message")} placeholder="How can we help?" data-testid="contact-message" /></label>
          </div>
          <div className="trip-form-footer">
            <button className="button" disabled={state.loading || !!state.success} data-testid="contact-submit-button">{state.loading ? "Sending…" : state.success ? <><Check size={18} /> Message sent</> : <>Send message <ArrowRight size={16} /></>}</button>
            {state.success && <div className="planner-status" data-testid="contact-success-message"><Check size={15} /> {state.success} We usually reply within business hours.</div>}
            {state.error && <div className="planner-status planner-error" data-testid="contact-error-message">{state.error}</div>}
          </div>
        </form>
      </div>
      <PageCta settings={settings} eyebrow="Prefer to start with a trip?" copy="Skip the formalities — tell us where you want to go." />
    </DetailShell>
  );
}
