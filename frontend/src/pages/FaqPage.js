import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { getFaqs } from "@/api";
import { DetailShell, PageCta, PublicEmpty, useSettings, useTitle } from "../components/public";

export default function FaqPage() {
  const settings = useSettings();
  useTitle("FAQ");
  const [faqs, setFaqs] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { getFaqs().then(setFaqs).catch(() => setFaqs([])); }, []);

  const groups = useMemo(() => {
    const grouped = [];
    (faqs || []).forEach((faq) => {
      let group = grouped.find((entry) => entry.category === faq.category);
      if (!group) { group = { category: faq.category || "General", items: [] }; grouped.push(group); }
      group.items.push(faq);
    });
    return grouped;
  }, [faqs]);

  if (!faqs) return <div className="detail-loading">Loading answers…</div>;

  return (
    <DetailShell settings={settings}>
      <section className="page-head" data-testid="faq-page">
        <span className="eyebrow">Good questions, honest answers</span>
        <h2>Before you<br /><em>pack a bag.</em></h2>
        <p>Everything travellers usually ask us — answered plainly. Something missing? Ask us directly, we reply quickly.</p>
      </section>
      {groups.length === 0 ? (
        <div className="page-narrow"><PublicEmpty title="FAQs are being prepared" copy="In the meantime, WhatsApp us any question — a real person answers." /></div>
      ) : (
        <div className="faq-wrap" data-testid="faq-accordion">
          {groups.map((group) => (
            <div key={group.category} className="faq-group">
              <h3 className="faq-group-title">{group.category}</h3>
              {group.items.map((faq, index) => {
                const key = `${group.category}-${index}`;
                const isOpen = open === key;
                return (
                  <div className={`faq-item ${isOpen ? "faq-open" : ""}`} key={faq.id} data-testid={`faq-item-${faq.id}`}>
                    <button className="faq-q" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen} data-testid={`faq-question-${faq.id}`}>
                      {faq.question}
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </button>
                    {isOpen && <div className="faq-a" data-testid={`faq-answer-${faq.id}`}>{faq.answer}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <PageCta settings={settings} eyebrow="Still curious" copy="Ask us anything about your trip — no obligation, no scripts." />
    </DetailShell>
  );
}
