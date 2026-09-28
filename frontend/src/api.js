const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

async function refreshSession() {
  const response = await fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" });
  return response.ok;
}

async function request(path, options = {}, retried = false) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (response.status === 401 && !retried && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh")) {
    const refreshed = await refreshSession().catch(() => false);
    if (refreshed) return request(path, options, true);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Something went wrong. Please try again.");
  return data;
}

export const getSettings = () => request("/settings");
export const getDestinations = (featured = false) => request(`/destinations${featured ? "?featured=true" : ""}`);
export const getPackages = (featured = false) => request(`/packages${featured ? "?featured=true" : ""}`);
export const getDestination = (slug) => request(`/destinations/${slug}`);
export const getPackage = (slug) => request(`/packages/${slug}`);
export const submitEnquiry = (payload) => request("/enquiries", { method: "POST", body: JSON.stringify(payload) });
export const submitContact = (payload) => request("/contact-submissions", { method: "POST", body: JSON.stringify(payload) });
export const getBlogPosts = () => request("/blog-posts");
export const getBlogPost = (slug) => request(`/blog-posts/${slug}`);
export const getTestimonials = () => request("/testimonials");
export const getGalleryItems = () => request("/gallery");
export const getFaqs = () => request("/faqs");
export const loginAdmin = (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const getCurrentUser = () => request("/auth/me");
export const logoutAdmin = () => request("/auth/logout", { method: "POST" });

export const getAdminStats = () => request("/admin/stats");
export const adminList = (resource) => request(`/admin/${resource}`);
export const adminCreate = (resource, payload) => request(`/admin/${resource}`, { method: "POST", body: JSON.stringify(payload) });
export const adminUpdate = (resource, id, payload) => request(`/admin/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const adminPatch = (resource, id, payload) => request(`/admin/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const adminDelete = (resource, id) => request(`/admin/${resource}/${id}`, { method: "DELETE" });
export const getAdminPackage = (id) => request(`/admin/packages/${id}`);
export const getAdminSettings = () => request("/admin/settings");
export const saveAdminSettings = (payload) => request("/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
export const addEnquiryNote = (id, text) => request(`/admin/enquiries/${id}/notes`, { method: "POST", body: JSON.stringify({ text }) });
