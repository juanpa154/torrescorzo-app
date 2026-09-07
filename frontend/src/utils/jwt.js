export function decodeToken(token) {
  if (!token) return null;
  try {
    // JWT usa base64url; reemplazar - y _ antes de atob
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
