export function getPartyKitHost(): string {
  if (window.origin.endsWith("partykit.dev")) {
    return window.location.host;
  }

  return process.env.NODE_ENV === "development" 
    ? "localhost:1999" 
    : import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";
}

export function getPartyKitProtocol(host: string): string {
  return host.includes("localhost") ? "http" : "https";
}

export function createPartyKitUrl(path: string): string {
  const host = getPartyKitHost();
  const protocol = getPartyKitProtocol(host);
  return `${protocol}://${host}${path}`;
}

/**
 * Creates a URL for fetching from the PartyKit server
 * @param path The path within the quiz endpoint
 * @param roomId The room ID to use (optional)
 */
export function createPartyKitFetchUrl(path: string, roomId: string): string {
  // Ensure path starts with a single slash and remove any double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return createPartyKitUrl(`/parties/main/${roomId.toUpperCase()}${cleanPath}`);
}