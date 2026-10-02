import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { getBlogPost, getBlogPosts } from "@/api";
import { DetailShell, PageCta, PublicEmpty, formatPublicDate, useSettings, useTitle } from "../components/public";

export function BlogCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blog-card" data-testid={`blog-card-${post.slug}`}>
      <div className="blog-card-img">{post.cover_image ? <img src={post.cover_image} alt={post.title} loading="lazy" decoding="async" /> : null}</div>
      <div className="blog-card-body">
        <span className="card-kicker">{post.category || "Journal"}</span>
        <h3>{post.title}</h3>
        <p className="blog-excerpt">{post.excerpt}</p>
        <div className="blog-meta"><span>{formatPublicDate(post.published_at)}</span><span className="blog-read">Read more <ArrowRight size={13} /></span></div>
      </div>
    </Link>
  );
}

export function BlogList() {
  const settings = useSettings();
  useTitle("Travel Journal", "Travel notes, destination guides and planning advice from the Sukhara Travels journal.");
  const [posts, setPosts] = useState(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => { getBlogPosts().then(setPosts).catch(() => setPosts([])); }, []);

  const categories = useMemo(() => ["All", ...new Set((posts || []).map((post) => post.category || "Journal"))], [posts]);

  const filtered = useMemo(() => {
    if (!posts) return [];
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "All" && (post.category || "Journal") !== category) return false;
      if (!q) return true;
      return [post.title, post.excerpt, post.content].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [posts, category, query]);

  if (!posts) return <div className="detail-loading">Loading the journal…</div>;
  const [featured, ...rest] = filtered;

  return (
    <DetailShell settings={settings}>
      <section className="page-head" data-testid="blog-list-page">
        <span className="eyebrow">The Sukhara journal</span>
        <h2>Notes from<br /><em>the road.</em></h2>
        <p>Honest travel writing from our planners — pacing advice, destination notes and the small decisions that make a trip feel effortless.</p>
      </section>
      <div className="blog-tools">
        <div className="blog-search"><Search size={14} /><input placeholder="Search articles…" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="blog-search-input" aria-label="Search articles" /></div>
        <div className="chip-row">{categories.map((item) => <button key={item} className={`chip ${category === item ? "chip-active" : ""}`} onClick={() => setCategory(item)} data-testid={`blog-filter-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</button>)}</div>
      </div>
      {filtered.length === 0 ? (
        <div className="page-narrow"><PublicEmpty title={query || category !== "All" ? "No articles match" : "Stories are on their way"} copy={query || category !== "All" ? "Try a different search or category." : "We are preparing our first travel notes. Check back soon — or ask us anything directly."} /></div>
      ) : (
        <>
          {featured && (
            <div className="blog-feature">
              <Link to={`/blog/${featured.slug}`} className="blog-feature-inner" data-testid={`blog-featured-${featured.slug}`}>
                <div className="blog-feature-img">{featured.cover_image ? <img src={featured.cover_image} alt={featured.title} loading="lazy" decoding="async" /> : null}</div>
                <div className="blog-feature-body">
                  <span className="card-kicker">Featured · {featured.category || "Journal"}</span>
                  <h3>{featured.title}</h3>
                  <p>{featured.excerpt}</p>
                  <span className="text-link">Read the story <ArrowRight size={15} /></span>
                </div>
              </Link>
            </div>
          )}
          {rest.length > 0 && <div className="blog-grid">{rest.map((post) => <BlogCard key={post.id} post={post} />)}</div>}
        </>
      )}
      <PageCta settings={settings} eyebrow="Inspired already?" copy="Tell us which story caught your imagination — we will shape a trip around it." />
    </DetailShell>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const settings = useSettings();
  const [post, setPost] = useState(null);

  useEffect(() => { getBlogPost(slug).then(setPost).catch(() => setPost({ notFound: true })); }, [slug]);
  useTitle(post && !post.notFound ? post.title : "Travel Journal", post && !post.notFound ? post.excerpt : undefined);

  if (!post) return <div className="detail-loading">Loading the story…</div>;
  if (post.notFound) return <div className="detail-loading">Article not found. <Link to="/blog" style={{ color: "inherit" }}>Back to the journal</Link></div>;

  return (
    <DetailShell settings={settings}>
      <article data-testid="blog-article-page">
        <section className="detail-hero article-hero">
          {post.cover_image ? <img src={post.cover_image} alt={post.title} /> : null}
          <div className="hero-overlay" />
          <div className="detail-hero-copy">
            <Link to="/blog" className="back-link" data-testid="article-back-link">← The Sukhara journal</Link>
            <span className="eyebrow eyebrow-light">{post.category || "Journal"}</span>
            <h1>{post.title}</h1>
            <p className="article-byline">{post.author || "Sukhara Travels"}{post.published_at ? ` · ${formatPublicDate(post.published_at)}` : ""}</p>
          </div>
        </section>
        <div className="article-wrap">
          <div className="article-body" data-testid="article-content">
            {(post.content || "").split(/\n\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          <div className="article-cta">
            <span className="eyebrow">Plan something like this</span>
            <h3>Like the sound of it?</h3>
            <p>Tell us where this story took your imagination — we will shape a journey around it.</p>
            <div className="hero-actions">
              <Link to="/customized-trips" className="button" data-testid="article-enquire-button">Plan a similar trip <ArrowRight size={16} /></Link>
              <Link to="/#destinations" className="text-link" data-testid="article-destinations-link">Browse destinations <ArrowRight size={15} /></Link>
            </div>
          </div>
        </div>
        {post.related_posts?.length > 0 && (
          <section className="related-section" data-testid="article-related">
            <div className="section-heading"><div><span className="eyebrow">Keep reading</span><h2>More from the journal</h2></div></div>
            <div className="blog-grid blog-grid-nopad">{post.related_posts.map((related) => <BlogCard key={related.id} post={related} />)}</div>
          </section>
        )}
      </article>
      <PageCta settings={settings} />
    </DetailShell>
  );
}
