import { DetailShell, useSettings, useTitle } from "../components/public";

const LEGAL = {
  "privacy-policy": {
    title: "Privacy Policy",
    description: "How Sukhara Travels and Tourism collects, uses and protects the personal information you share with us.",
    intro: "This policy explains what information Sukhara Travels and Tourism collects through this website, why we collect it, and the choices you have.",
    sections: [
      ["Who we are", "Sukhara Travels and Tourism is an Indian travel agency and tour operator. We help travellers plan domestic and international holidays through enquiries, consultations and customised itinerary planning. This website is operated by Sukhara Travels and Tourism (sukharatravels.com)."],
      ["Information we collect", "When you submit an enquiry, contact form or trip-planning request, we collect the details you provide — typically your name, phone number, email address and travel preferences such as destination, dates, group size and budget. We do not collect payment card details through this website."],
      ["How we use your information", "We use the information you share to respond to your enquiry, prepare itineraries and quotations, and communicate with you about your trip. We do not sell your personal information to third parties, and we do not use it for unrelated marketing without your consent."],
      ["Sharing with travel suppliers", "If you ask us to proceed with a booking, relevant details (such as traveller names and contact information) are shared with the hotels, airlines, transport providers and other suppliers involved in your itinerary — only to the extent needed to fulfil your request. Each supplier's own terms and privacy practices apply to their services."],
      ["Data storage and security", "Enquiry and contact records are stored securely in our systems and are accessible only to authorised team members. We apply reasonable technical and organisational measures to protect your information; no method of transmission over the internet is completely secure, so we encourage you not to share sensitive documents through general forms."],
      ["Your choices", "You may ask us to correct or delete the personal information we hold about you at any time by contacting us using the details below. We will action reasonable requests promptly, subject to any records we are required to keep for completed bookings or legal purposes."],
      ["Cookies and analytics", "This website may use basic cookies and standard analytics to understand how the site is used and to keep it working reliably. You can control cookies through your browser settings."],
      ["Changes to this policy", "We may update this policy from time to time. The current version will always be available on this page."],
    ],
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    description: "The terms that govern use of the Sukhara Travels and Tourism website and our travel planning services.",
    intro: "These terms govern your use of this website and the travel planning services offered by Sukhara Travels and Tourism. By using this website or submitting an enquiry, you accept these terms.",
    sections: [
      ["Nature of our service", "Sukhara Travels and Tourism is a travel service and lead-generation business: we plan, coordinate and arrange travel services that are delivered by independent suppliers such as airlines, hotels, transport providers and tour operators. Unless expressly confirmed in writing, we act as an agent or facilitator for those suppliers, and their own terms and conditions apply to the services they provide."],
      ["Enquiries and quotations", "Submitting an enquiry through this website does not create a booking. Quotations and itineraries we share are indicative until availability and pricing are confirmed in writing, and prices may change until a booking is confirmed."],
      ["Bookings and payments", "A booking is confirmed only when we confirm it in writing and the applicable advance payment is received. Payment schedules, inclusions and exclusions are shared with you in writing before you confirm. Please review them carefully — they form part of the agreement for your trip."],
      ["Pricing and availability", "Travel pricing is dynamic. Fares, hotel rates and availability shown or quoted can change at short notice and are not guaranteed until the relevant supplier confirms them."],
      ["Traveller responsibilities", "Travellers are responsible for providing accurate information, holding valid identification, passports, visas and any required permits, and meeting supplier requirements (such as check-in times or health regulations). We will guide you on documentation and timelines for your destination, but visa and entry decisions rest with the relevant authorities."],
      ["Changes and cancellations", "Requests to change or cancel a confirmed booking are governed by our Cancellation Policy and the terms of the suppliers in your itinerary. Please read the Cancellation Policy on this website."],
      ["Liability", "We exercise reasonable care in selecting suppliers and planning itineraries. To the extent permitted by law, we are not liable for acts, omissions, delays or failures of independent suppliers, nor for events beyond our reasonable control such as weather, natural events, strikes, or government action."],
      ["Website content", "Content on this website — including destination information, sample itineraries and indicative prices — is general information, may change without notice, and does not constitute a binding offer unless confirmed in writing."],
      ["Governing terms", "These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of the courts in India."],
    ],
  },
  "cancellation-policy": {
    title: "Cancellation Policy",
    description: "How cancellations, amendments and refunds work for trips arranged by Sukhara Travels and Tourism.",
    intro: "We know plans change. This policy explains how cancellations and amendments are handled for trips arranged through Sukhara Travels and Tourism.",
    sections: [
      ["The general principle", "Every itinerary is made up of services from independent suppliers — hotels, airlines, transport providers and activity operators — and each has its own cancellation terms. Because of this, the exact cancellation terms for your trip are shared with you in writing before you confirm your booking, so you always know where you stand before any money is committed."],
      ["How to cancel", "To cancel or change a confirmed booking, contact us in writing by email or through WhatsApp, quoting your booking or enquiry reference. Cancellation is effective from the date we acknowledge your request during business hours."],
      ["Refunds", "Where a refund is due, it is calculated after applying the cancellation charges of the suppliers in your itinerary and any non-refundable amounts already communicated to you (such as supplier advances or ticketing charges). Refunds are processed after the corresponding amounts are received back from suppliers; timelines vary by supplier and payment method."],
      ["Amendments", "Date changes, name corrections and itinerary amendments are handled case by case and depend on supplier rules and availability. We will always tell you any cost difference before applying a change."],
      ["No-shows and unused services", "Services that are unused or missed — including no-shows for stays, transfers or activities — are generally non-refundable, as suppliers charge for them in full."],
      ["Events beyond our control", "In case of events beyond reasonable control (severe weather, natural events, strikes, government restrictions and similar), we will work with suppliers to secure the best available outcome for you, which may include rescheduling or partial refunds depending on supplier policies."],
      ["Our commitment", "Whatever the situation, we will explain your options clearly and honestly before any decision is made, and we will never apply a charge that was not communicated to you."],
    ],
  },
};

function LegalPage({ pageKey }) {
  const settings = useSettings();
  const page = LEGAL[pageKey];
  useTitle(page.title, page.description);

  return (
    <DetailShell settings={settings}>
      <section className="page-head" data-testid={`${pageKey}-page`}>
        <span className="eyebrow">Sukhara Travels and Tourism</span>
        <h2>{page.title}</h2>
        <p>{page.intro}</p>
      </section>
      <div className="legal-wrap">
        <p className="legal-updated">Last updated · October 2026</p>
        {page.sections.map(([heading, body]) => (
          <div key={heading} className="legal-section" data-testid={`legal-section-${heading.toLowerCase().replaceAll(" ", "-")}`}>
            <h3>{heading}</h3>
            <p>{body}</p>
          </div>
        ))}
        <div className="legal-section">
          <h3>Questions?</h3>
          <p>Write to us at <a href={`mailto:${settings.email}`}>{settings.email}</a> or call <a href={`tel:${settings.phone}`}>{settings.phone}</a>. We are happy to explain anything in plain language.</p>
        </div>
      </div>
    </DetailShell>
  );
}

export function PrivacyPolicyPage() {
  return <LegalPage pageKey="privacy-policy" />;
}

export function TermsPage() {
  return <LegalPage pageKey="terms-and-conditions" />;
}

export function CancellationPolicyPage() {
  return <LegalPage pageKey="cancellation-policy" />;
}
