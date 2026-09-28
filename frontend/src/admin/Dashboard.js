import { Link } from "react-router-dom";
import { AlarmClock, ArrowRight, ArrowUpRight, CalendarClock, Images, Inbox, Loader2, Map, Newspaper, Package, PhoneCall } from "lucide-react";
import { EmptyState, formatDate, PageHead, StatusBadge } from "./ui";
import { ENQUIRY_STATUSES } from "./Enquiries";

const PIPELINE_DOTS = {
  new: "bg-amber-500",
  contacted: "bg-blue-500",
  "follow-up": "bg-orange-500",
  "quotation-sent": "bg-purple-500",
  confirmed: "bg-emerald-500",
  closed: "bg-slate-400",
  lost: "bg-red-400",
};

function FollowupCard({ title, items, overdue, testId }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${overdue && items.length ? "border-red-200" : "border-slate-200"}`} data-testid={testId}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          {overdue ? <AlarmClock size={16} className={items.length ? "text-red-500" : "text-slate-400"} /> : <CalendarClock size={16} className="text-slate-400" />}
          {title}
        </h2>
        <Link to="/admin/enquiries" className="text-xs font-semibold text-[#B45309] hover:text-[#92400E] inline-flex items-center gap-1" data-testid={`${testId}-view-all`}>Enquiries <ArrowRight size={13} /></Link>
      </div>
      {items.length === 0 ? (
        <EmptyState title={overdue ? "Nothing overdue" : "No follow-ups scheduled"} copy={overdue ? "You're all caught up." : "Set a follow-up date on any enquiry to see it here."} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`/admin/enquiries?lead=${item.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors" data-testid={`${testId}-item-${item.id}`}>
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${overdue ? "bg-red-50 text-red-600" : "bg-amber-50 text-[#B45309]"}`}>{item.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 truncate">{item.follow_up_note || item.destination || "Follow up"}</p>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${overdue ? "text-red-600" : "text-slate-500"}`}>{formatDate(item.follow_up_date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard({ stats, user }) {
  if (!stats) {
    return <div className="flex justify-center py-24 text-slate-400" data-testid="dashboard-loading"><Loader2 className="animate-spin" size={24} /></div>;
  }
  const { counts, recent_enquiries = [], recent_contacts = [], upcoming_followups = [], overdue_followups = [] } = stats;
  const statusCounts = counts.status_counts || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const cards = [
    { label: "New enquiries", value: statusCounts.new ?? 0, to: "/admin/enquiries?status=new", icon: Inbox, highlight: (statusCounts.new ?? 0) > 0 },
    { label: "Overdue follow-ups", value: counts.overdue_followups ?? 0, to: "/admin/enquiries", icon: AlarmClock, highlight: (counts.overdue_followups ?? 0) > 0 },
    { label: "Total enquiries", value: counts.enquiries, to: "/admin/enquiries", icon: Inbox },
    { label: "Confirmed", value: statusCounts.confirmed ?? 0, to: "/admin/enquiries?status=confirmed", icon: Package },
    { label: "Packages", value: counts.packages, to: "/admin/packages", icon: Package },
    { label: "Destinations", value: counts.destinations, to: "/admin/destinations", icon: Map },
    { label: "Gallery images", value: counts.gallery, to: "/admin/gallery", icon: Images },
    { label: "Blog posts", value: counts.blog_posts, to: "/admin/blog", icon: Newspaper },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <PageHead title={`${greeting}, ${(user?.name || "Admin").split(" ")[0]}`} subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="dashboard-stat-cards">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} data-testid={`stat-card-${card.label.toLowerCase().replaceAll(" ", "-")}`}
            className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 group ${card.highlight ? "border-[#D97706]/50 ring-1 ring-[#D97706]/20" : "border-slate-200/80"}`}>
            <div className="flex items-center justify-between">
              <span className={`h-9 w-9 rounded-lg flex items-center justify-center ${card.highlight ? "bg-amber-50 text-[#B45309]" : "bg-slate-100 text-slate-600"}`}><card.icon size={17} /></span>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-[#D97706] transition-colors" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{card.value}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{card.label}</p>
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="dashboard-pipeline">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Lead pipeline</h2>
          <Link to="/admin/enquiries" className="text-xs font-semibold text-[#B45309] hover:text-[#92400E] inline-flex items-center gap-1" data-testid="pipeline-view-all">All enquiries <ArrowRight size={13} /></Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {ENQUIRY_STATUSES.map((status) => (
            <Link key={status.value} to={`/admin/enquiries?status=${status.value}`} data-testid={`pipeline-chip-${status.value}`}
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 rounded-full px-3.5 py-1.5 transition-colors">
              <span className={`h-2 w-2 rounded-full ${PIPELINE_DOTS[status.value]}`} />
              <span className="text-xs font-semibold text-slate-700">{status.label}</span>
              <span className="text-xs font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{statusCounts[status.value] ?? 0}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="dashboard-recent-enquiries">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Recent enquiries</h2>
              <Link to="/admin/enquiries" className="text-xs font-semibold text-[#B45309] hover:text-[#92400E] inline-flex items-center gap-1" data-testid="dashboard-view-enquiries-link">View all <ArrowRight size={13} /></Link>
            </div>
            {recent_enquiries.length === 0 ? (
              <EmptyState title="No enquiries yet" copy="New trip enquiries from the website will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent_enquiries.map((item) => (
                  <li key={item.id}>
                    <Link to={`/admin/enquiries?lead=${item.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors" data-testid={`dashboard-enquiry-${item.id}`}>
                      <span className="h-9 w-9 rounded-full bg-[#0B192C] text-white flex items-center justify-center text-xs font-bold shrink-0">{item.name.slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.name} <span className="text-[10px] font-mono font-normal text-slate-400">{item.lead_id}</span></p>
                        <p className="text-xs text-slate-400 truncate">{[item.destination, item.holiday_type, item.travellers].filter(Boolean).join(" · ") || "General trip enquiry"}</p>
                      </div>
                      <span className="text-xs text-slate-400 hidden sm:block shrink-0">{formatDate(item.created_at)}</span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <FollowupCard title="Upcoming follow-ups" items={upcoming_followups} testId="dashboard-upcoming-followups" />
            <FollowupCard title="Overdue follow-ups" items={overdue_followups} overdue testId="dashboard-overdue-followups" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="dashboard-quick-actions">
            <h2 className="text-base font-semibold text-slate-800 mb-3">Quick actions</h2>
            <div className="space-y-2">
              <Link to="/admin/packages" className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-[#B45309] border border-slate-200 hover:border-[#D97706]/40 rounded-lg px-3.5 py-2.5 transition-colors" data-testid="quick-action-add-package"><Package size={15} /> Add a package</Link>
              <Link to="/admin/destinations" className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-[#B45309] border border-slate-200 hover:border-[#D97706]/40 rounded-lg px-3.5 py-2.5 transition-colors" data-testid="quick-action-add-destination"><Map size={15} /> Add a destination</Link>
              <Link to="/admin/blog" className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-[#B45309] border border-slate-200 hover:border-[#D97706]/40 rounded-lg px-3.5 py-2.5 transition-colors" data-testid="quick-action-write-post"><Newspaper size={15} /> Write a blog post</Link>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="dashboard-recent-contacts">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">Contact messages</h2>
              <Link to="/admin/contacts" className="text-xs font-semibold text-[#B45309] hover:text-[#92400E] inline-flex items-center gap-1" data-testid="dashboard-view-contacts-link">View all <ArrowRight size={13} /></Link>
            </div>
            {recent_contacts.length === 0 ? (
              <EmptyState title="No messages yet" copy="Contact form submissions will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent_contacts.map((item) => (
                  <li key={item.id} className="px-5 py-3.5" data-testid={`dashboard-contact-${item.id}`}>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><PhoneCall size={13} className="text-slate-400" /> {item.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.subject || item.message}</p>
                    <p className="text-[11px] text-slate-300 mt-1">{formatDate(item.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
