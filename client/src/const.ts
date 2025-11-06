export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Immo-Jaeger";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/immo-jaeger-logo.png";

// Company information
export const COMPANY_NAME = "Immo-Jaeger";
export const COMPANY_OWNER = "Sven Jaeger";
export const COMPANY_ADDRESS = "Bahnhofstraße 2, 73329 Kuchen";
export const COMPANY_PHONE = "+49 7331 3079990";
export const COMPANY_EMAIL = "info@unlog.eu";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};