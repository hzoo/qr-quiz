export function getPartyKitHost(): string {
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

export function createPartyKitFetchUrl(path: string): string {
  return createPartyKitUrl(`/parties/main/quiz${path}`);
}

export function createPartyKitQrCodeUrl(optionId: string): string {
  return createPartyKitFetchUrl(`/${optionId}`);
} 