import type { Express, Request, Response } from "express";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Auto-login endpoint for testing purposes
 * Creates a session for the test admin user without OAuth
 */
export function registerAutoLoginRoute(app: Express) {
  app.get("/api/auto-login", async (req: Request, res: Response) => {
    try {
      // Create session token for test admin user
      const sessionToken = await sdk.createSessionToken("test-admin-123", {
        name: "Test Admin",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      // Redirect to dashboard
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[Auto-Login] Failed", error);
      res.status(500).json({ error: "Auto-login failed" });
    }
  });
}
