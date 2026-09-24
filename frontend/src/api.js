const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
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
export const loginAdmin = (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const getCurrentUser = () => request("/auth/me");