import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getDb } from "./db";
import { generateExpose } from "./exposeGenerator";
import { getBrevoClient } from "./brevoClient";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "./googleCalendar";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(async (opts) => {
      // Check for demo mode cookie
      const cookies = opts.ctx.req.cookies;
      if (cookies && cookies['manus-session'] === 'demo-session-token') {
        // Return demo user
        return {
          id: 1,
          openId: 'demo-user',
          name: 'Demo Admin',
          email: 'demo@immojaeger.de',
          role: 'admin' as const,
          createdAt: new Date(),
        };
      }
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USERS ============
  users: router({
    list: publicProcedure
      .query(async () => {
        return await db.getAllUsers();
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["user", "admin"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        // Generate a temporary openId for the user
        // In production, this should be replaced with proper OAuth flow
        const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await db.upsertUser({
          openId: tempOpenId,
          name: input.name,
          email: input.email,
          role: input.role,
        });
        
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // No authentication - allow all deletions
        await db.deleteUser(input.id);
        return { success: true };
      }),
  }),

  // ============ SETTINGS ============
  settings: router({
    // Public endpoint for company branding (used on landing pages)
    getCompanyBranding: publicProcedure
      .query(async () => {
        return {
          companyLogo: process.env.COMPANY_LOGO || "",
          companyName: process.env.COMPANY_NAME || "",
          companyPhone: process.env.COMPANY_PHONE || "",
          companyEmail: process.env.COMPANY_EMAIL || "",
          companyAddress: process.env.COMPANY_ADDRESS || "",
          companyWebsite: process.env.COMPANY_WEBSITE || "",
          impressum: process.env.IMPRESSUM || "",
          agb: process.env.AGB || "",
          datenschutz: process.env.DATENSCHUTZ || "",
        };
      }),

    getApiKeys: publicProcedure
      .query(async () => {
        // Load configuration from database (appConfig table)
        const db = await getDb();
        const configMap = new Map<string, string>();
        
        if (db) {
          try {
            const { appConfig } = await import('../drizzle/schema');
            const configs = await db.select().from(appConfig);
            configs.forEach(c => configMap.set(c.configKey, c.configValue || ''));
          } catch (error) {
            console.error('[getApiKeys] Failed to load from database:', error);
          }
        }
        
        // Helper to get value from DB or fallback to env
        const getConfig = (key: string, envKey?: string, defaultValue: string = '') => {
          return configMap.get(key) || (envKey ? process.env[envKey] : '') || defaultValue;
        };
        
        return {
          dashboardLogo: getConfig('DASHBOARD_LOGO', 'DASHBOARD_LOGO', ''),
          superchat: process.env.SUPERCHAT_API_KEY || "",
          brevo: process.env.BREVO_API_KEY || "",
          brevoPropertyInquiryListId: process.env.BREVO_PROPERTY_INQUIRY_LIST_ID || "18",
          brevoOwnerInquiryListId: process.env.BREVO_OWNER_INQUIRY_LIST_ID || "19",
          brevoInsuranceListId: process.env.BREVO_INSURANCE_LIST_ID || "20",
          brevoPropertyManagementListId: process.env.BREVO_PROPERTY_MANAGEMENT_LIST_ID || "21",
          brevoAutoSync: process.env.BREVO_AUTO_SYNC || "false",
          brevoDefaultInquiryType: process.env.BREVO_DEFAULT_INQUIRY_TYPE || "property_inquiry",
          googleClientId: process.env.GOOGLE_CLIENT_ID || "",
          googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          googleMaps: process.env.GOOGLE_MAPS_API_KEY || "",
          propertySync: process.env.PROPERTY_SYNC_API_KEY || "",
          openai: process.env.OPENAI_API_KEY || "",
          // ImmoScout24 API
          is24ConsumerKey: process.env.IS24_CONSUMER_KEY || "",
          is24ConsumerSecret: process.env.IS24_CONSUMER_SECRET || "",
          is24AccessToken: process.env.IS24_ACCESS_TOKEN || "",
          is24AccessTokenSecret: process.env.IS24_ACCESS_TOKEN_SECRET || "",
          is24UseSandbox: process.env.IS24_USE_SANDBOX === "true" || false,
          // WebDAV (primary)
          webdavUrl: getConfig('WEBDAV_URL', 'NAS_WEBDAV_URL', 'https://ugreen.tschatscher.eu/'),
          webdavPort: getConfig('WEBDAV_PORT', 'WEBDAV_PORT', '2002'),
          webdavUsername: getConfig('WEBDAV_USERNAME', 'NAS_USERNAME', 'tschatscher'),
          webdavPassword: getConfig('WEBDAV_PASSWORD', 'NAS_PASSWORD', ''),
          // FTP (fallback)
          ftpHost: getConfig('FTP_HOST', 'FTP_HOST', 'ftp.tschatscher.eu'),
          ftpPort: getConfig('FTP_PORT', 'FTP_PORT', '21'),
          ftpUsername: getConfig('FTP_USERNAME', 'NAS_USERNAME', 'tschatscher'),
          ftpPassword: getConfig('FTP_PASSWORD', 'NAS_PASSWORD', ''),
          ftpSecure: getConfig('FTP_SECURE', 'FTP_SECURE', 'false') === 'true',
          // Public Read-Only Access
          nasPublicUsername: getConfig('NAS_PUBLIC_USERNAME', 'NAS_PUBLIC_USERNAME', ''),
          nasPublicPassword: getConfig('NAS_PUBLIC_PASSWORD', 'NAS_PUBLIC_PASSWORD', ''),
          // Shared
          nasBasePath: getConfig('NAS_BASE_PATH', 'NAS_BASE_PATH', '/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf'),
          // Immobilienmakler Branding
          realestateLogo: process.env.REALESTATE_LOGO || "",
          realestateName: process.env.REALESTATE_NAME || "",
          realestatePhone: process.env.REALESTATE_PHONE || "",
          realestateEmail: process.env.REALESTATE_EMAIL || "",
          realestateAddress: process.env.REALESTATE_ADDRESS || "",
          realestateWebsite: process.env.REALESTATE_WEBSITE || "",
          realestateImpressum: process.env.REALESTATE_IMPRESSUM || "",
          realestateAgb: process.env.REALESTATE_AGB || "",
          realestateDatenschutz: process.env.REALESTATE_DATENSCHUTZ || "",
          // Versicherungen Branding
          insuranceLogo: process.env.INSURANCE_LOGO || "",
          insuranceName: process.env.INSURANCE_NAME || "",
          insurancePhone: process.env.INSURANCE_PHONE || "",
          insuranceEmail: process.env.INSURANCE_EMAIL || "",
          insuranceAddress: process.env.INSURANCE_ADDRESS || "",
          insuranceWebsite: process.env.INSURANCE_WEBSITE || "",
          insuranceImpressum: process.env.INSURANCE_IMPRESSUM || "",
          insuranceAgb: process.env.INSURANCE_AGB || "",
          insuranceDatenschutz: process.env.INSURANCE_DATENSCHUTZ || "",
          // Hausverwaltung Branding
          propertyMgmtLogo: process.env.PROPERTYMGMT_LOGO || "",
          propertyMgmtName: process.env.PROPERTYMGMT_NAME || "",
          propertyMgmtPhone: process.env.PROPERTYMGMT_PHONE || "",
          propertyMgmtEmail: process.env.PROPERTYMGMT_EMAIL || "",
          propertyMgmtAddress: process.env.PROPERTYMGMT_ADDRESS || "",
          propertyMgmtWebsite: process.env.PROPERTYMGMT_WEBSITE || "",
          propertyMgmtImpressum: process.env.PROPERTYMGMT_IMPRESSUM || "",
          propertyMgmtAgb: process.env.PROPERTYMGMT_AGB || "",
          propertyMgmtDatenschutz: process.env.PROPERTYMGMT_DATENSCHUTZ || "",
          // Legacy Company Branding (for backward compatibility)
          companyLogo: process.env.COMPANY_LOGO || process.env.REALESTATE_LOGO || "",
          companyName: process.env.COMPANY_NAME || process.env.REALESTATE_NAME || "",
          companyPhone: process.env.COMPANY_PHONE || process.env.REALESTATE_PHONE || "",
          companyEmail: process.env.COMPANY_EMAIL || process.env.REALESTATE_EMAIL || "",
          companyAddress: process.env.COMPANY_ADDRESS || process.env.REALESTATE_ADDRESS || "",
          companyWebsite: process.env.COMPANY_WEBSITE || process.env.REALESTATE_WEBSITE || "",
          impressum: process.env.IMPRESSUM || process.env.REALESTATE_IMPRESSUM || "",
          agb: process.env.AGB || process.env.REALESTATE_AGB || "",
          datenschutz: process.env.DATENSCHUTZ || process.env.REALESTATE_DATENSCHUTZ || "",
          // Legacy fields (for backward compatibility)
          nasProtocol: process.env.NAS_PROTOCOL || "webdav",
          nasUrl: process.env.NAS_WEBDAV_URL || "https://ugreen.tschatscher.eu:2002",
          nasPort: process.env.NAS_PORT || "2002",
          nasUsername: process.env.NAS_USERNAME || "tschatscher",
          nasPassword: process.env.NAS_PASSWORD || "",
          // Module Activation (default: true if not set)
          moduleImmobilienmakler: process.env.MODULE_IMMOBILIENMAKLER === "false" ? false : true,
          moduleVersicherungen: process.env.MODULE_VERSICHERUNGEN === "false" ? false : true,
          moduleHausverwaltung: process.env.MODULE_HAUSVERWALTUNG === "false" ? false : true,
        };
      }),

    saveApiKeys: publicProcedure
      .input(z.object({
        dashboardLogo: z.string().optional(),
        superchat: z.string().optional(),
        brevo: z.string().optional(),
        // E-Mail settings per module
        realestateEmailFrom: z.string().optional(),
        realestateEmailFromName: z.string().optional(),
        realestateEmailNotificationTo: z.string().optional(),
        insuranceEmailFrom: z.string().optional(),
        insuranceEmailFromName: z.string().optional(),
        insuranceEmailNotificationTo: z.string().optional(),
        propertyMgmtEmailFrom: z.string().optional(),
        propertyMgmtEmailFromName: z.string().optional(),
        propertyMgmtEmailNotificationTo: z.string().optional(),
        landingPageTemplate: z.string().optional(),
        exposeTemplate: z.string().optional(),
        onePagerTemplate: z.string().optional(),
        invoiceTemplate: z.string().optional(),
        maklervertragTemplate: z.string().optional(),
        brevoPropertyInquiryListId: z.string().optional(),
        brevoOwnerInquiryListId: z.string().optional(),
        brevoInsuranceListId: z.string().optional(),
        brevoPropertyManagementListId: z.string().optional(),
        brevoAutoSync: z.string().optional(),
        brevoDefaultInquiryType: z.string().optional(),
        googleClientId: z.string().optional(),
        googleClientSecret: z.string().optional(),
        googleMaps: z.string().optional(),
        propertySync: z.string().optional(),
        openai: z.string().optional(),
        // ImmoScout24 API
        is24ConsumerKey: z.string().optional(),
        is24ConsumerSecret: z.string().optional(),
        is24AccessToken: z.string().optional(),
        is24AccessTokenSecret: z.string().optional(),
        is24UseSandbox: z.boolean().optional(),
        // WebDAV
        webdavUrl: z.string().optional(),
        webdavPort: z.string().optional(),
        webdavUsername: z.string().optional(),
        webdavPassword: z.string().optional(),
        // FTP
        ftpHost: z.string().optional(),
        ftpPort: z.string().optional(),
        ftpUsername: z.string().optional(),
        ftpPassword: z.string().optional(),
        ftpSecure: z.boolean().optional(),
        // Public Read-Only Access
        nasPublicUsername: z.string().optional(),
        nasPublicPassword: z.string().optional(),
        // Shared
        nasBasePath: z.string().optional(),
        // Immobilienmakler Branding
        realestateLogo: z.string().optional(),
        realestateName: z.string().optional(),
        realestatePhone: z.string().optional(),
        realestateEmail: z.string().optional(),
        realestateAddress: z.string().optional(),
        realestateWebsite: z.string().optional(),
        realestateImpressum: z.string().optional(),
        realestateAgb: z.string().optional(),
        realestateDatenschutz: z.string().optional(),
        // Versicherungen Branding
        insuranceLogo: z.string().optional(),
        insuranceName: z.string().optional(),
        insurancePhone: z.string().optional(),
        insuranceEmail: z.string().optional(),
        insuranceAddress: z.string().optional(),
        insuranceWebsite: z.string().optional(),
        insuranceImpressum: z.string().optional(),
        insuranceAgb: z.string().optional(),
        insuranceDatenschutz: z.string().optional(),
        // Hausverwaltung Branding
        propertyMgmtLogo: z.string().optional(),
        propertyMgmtName: z.string().optional(),
        propertyMgmtPhone: z.string().optional(),
        propertyMgmtEmail: z.string().optional(),
        propertyMgmtAddress: z.string().optional(),
        propertyMgmtWebsite: z.string().optional(),
        propertyMgmtImpressum: z.string().optional(),
        propertyMgmtAgb: z.string().optional(),
        propertyMgmtDatenschutz: z.string().optional(),
        // Legacy Company Branding (for backward compatibility)
        companyLogo: z.string().optional(),
        companyName: z.string().optional(),
        companyPhone: z.string().optional(),
        companyEmail: z.string().optional(),
        companyAddress: z.string().optional(),
        companyWebsite: z.string().optional(),
        impressum: z.string().optional(),
        agb: z.string().optional(),
        datenschutz: z.string().optional(),
        // Legacy (for backward compatibility)
        nasProtocol: z.enum(["webdav", "ftp", "ftps"]).optional(),
        nasUrl: z.string().optional(),
        nasPort: z.string().optional(),
        nasUsername: z.string().optional(),
        nasPassword: z.string().optional(),
        // Module Activation
        moduleImmobilienmakler: z.boolean().optional(),
        moduleVersicherungen: z.boolean().optional(),
        moduleHausverwaltung: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        // In production, save these to a secure settings table or update .env file
        // For now, we just return success
        // TODO: Implement proper API key storage
        console.log("API Keys to save:", {
          superchat: input.superchat ? "***" : "(empty)",
          brevo: input.brevo ? "***" : "(empty)",
          propertySync: input.propertySync ? "***" : "(empty)",
          openai: input.openai ? "***" : "(empty)",
          is24ConsumerKey: input.is24ConsumerKey ? "***" : "(empty)",
          is24ConsumerSecret: input.is24ConsumerSecret ? "***" : "(empty)",
          is24AccessToken: input.is24AccessToken ? "***" : "(empty)",
          is24AccessTokenSecret: input.is24AccessTokenSecret ? "***" : "(empty)",
          is24UseSandbox: input.is24UseSandbox || false,
          nasUrl: input.nasUrl ? "***" : "(empty)",
          nasUsername: input.nasUsername ? "***" : "(empty)",
          nasPassword: input.nasPassword ? "***" : "(empty)",
          nasBasePath: input.nasBasePath || "(default)",
        });
        
        // Save Brevo configuration
        if (input.brevoPropertyInquiryListId) process.env.BREVO_PROPERTY_INQUIRY_LIST_ID = input.brevoPropertyInquiryListId;
        if (input.brevoOwnerInquiryListId) process.env.BREVO_OWNER_INQUIRY_LIST_ID = input.brevoOwnerInquiryListId;
        if (input.brevoInsuranceListId) process.env.BREVO_INSURANCE_LIST_ID = input.brevoInsuranceListId;
        if (input.brevoPropertyManagementListId) process.env.BREVO_PROPERTY_MANAGEMENT_LIST_ID = input.brevoPropertyManagementListId;
        if (input.brevoAutoSync !== undefined) process.env.BREVO_AUTO_SYNC = input.brevoAutoSync;
        if (input.brevoDefaultInquiryType) process.env.BREVO_DEFAULT_INQUIRY_TYPE = input.brevoDefaultInquiryType;
        
        // Save Google Calendar credentials
        if (input.googleClientId) process.env.GOOGLE_CLIENT_ID = input.googleClientId;
        if (input.googleClientSecret) process.env.GOOGLE_CLIENT_SECRET = input.googleClientSecret;
        
        // Save ImmoScout24 credentials
        if (input.is24ConsumerKey) process.env.IS24_CONSUMER_KEY = input.is24ConsumerKey;
        if (input.is24ConsumerSecret) process.env.IS24_CONSUMER_SECRET = input.is24ConsumerSecret;
        if (input.is24AccessToken) process.env.IS24_ACCESS_TOKEN = input.is24AccessToken;
        if (input.is24AccessTokenSecret) process.env.IS24_ACCESS_TOKEN_SECRET = input.is24AccessTokenSecret;
        if (input.is24UseSandbox !== undefined) process.env.IS24_USE_SANDBOX = input.is24UseSandbox.toString();
        
        // Save WebDAV credentials
        if (input.webdavUrl) process.env.WEBDAV_URL = input.webdavUrl;
        if (input.webdavPort) process.env.WEBDAV_PORT = input.webdavPort;
        if (input.webdavUsername) process.env.WEBDAV_USERNAME = input.webdavUsername;
        if (input.webdavPassword) process.env.WEBDAV_PASSWORD = input.webdavPassword;
        
        // Save FTP credentials
        if (input.ftpHost) process.env.FTP_HOST = input.ftpHost;
        if (input.ftpPort) process.env.FTP_PORT = input.ftpPort;
        if (input.ftpUsername) process.env.FTP_USERNAME = input.ftpUsername;
        if (input.ftpPassword) process.env.FTP_PASSWORD = input.ftpPassword;
        if (input.ftpSecure !== undefined) process.env.FTP_SECURE = String(input.ftpSecure);
        
        // Save Public Read-Only credentials
        if (input.nasPublicUsername) process.env.NAS_PUBLIC_USERNAME = input.nasPublicUsername;
        if (input.nasPublicPassword) process.env.NAS_PUBLIC_PASSWORD = input.nasPublicPassword;
        
        // Save shared settings
        if (input.nasBasePath) process.env.NAS_BASE_PATH = input.nasBasePath;
        
        // Save Immobilienmakler branding
        if (input.realestateLogo) process.env.REALESTATE_LOGO = input.realestateLogo;
        if (input.realestateName) process.env.REALESTATE_NAME = input.realestateName;
        if (input.realestatePhone) process.env.REALESTATE_PHONE = input.realestatePhone;
        if (input.realestateEmail) process.env.REALESTATE_EMAIL = input.realestateEmail;
        if (input.realestateAddress) process.env.REALESTATE_ADDRESS = input.realestateAddress;
        if (input.realestateWebsite) process.env.REALESTATE_WEBSITE = input.realestateWebsite;
        if (input.realestateImpressum) process.env.REALESTATE_IMPRESSUM = input.realestateImpressum;
        if (input.realestateAgb) process.env.REALESTATE_AGB = input.realestateAgb;
        if (input.realestateDatenschutz) process.env.REALESTATE_DATENSCHUTZ = input.realestateDatenschutz;
        
        // Save Versicherungen branding
        if (input.insuranceLogo) process.env.INSURANCE_LOGO = input.insuranceLogo;
        if (input.insuranceName) process.env.INSURANCE_NAME = input.insuranceName;
        if (input.insurancePhone) process.env.INSURANCE_PHONE = input.insurancePhone;
        if (input.insuranceEmail) process.env.INSURANCE_EMAIL = input.insuranceEmail;
        if (input.insuranceAddress) process.env.INSURANCE_ADDRESS = input.insuranceAddress;
        if (input.insuranceWebsite) process.env.INSURANCE_WEBSITE = input.insuranceWebsite;
        if (input.insuranceImpressum) process.env.INSURANCE_IMPRESSUM = input.insuranceImpressum;
        if (input.insuranceAgb) process.env.INSURANCE_AGB = input.insuranceAgb;
        if (input.insuranceDatenschutz) process.env.INSURANCE_DATENSCHUTZ = input.insuranceDatenschutz;
        
        // Save Hausverwaltung branding
        if (input.propertyMgmtLogo) process.env.PROPERTYMGMT_LOGO = input.propertyMgmtLogo;
        if (input.propertyMgmtName) process.env.PROPERTYMGMT_NAME = input.propertyMgmtName;
        if (input.propertyMgmtPhone) process.env.PROPERTYMGMT_PHONE = input.propertyMgmtPhone;
        if (input.propertyMgmtEmail) process.env.PROPERTYMGMT_EMAIL = input.propertyMgmtEmail;
        if (input.propertyMgmtAddress) process.env.PROPERTYMGMT_ADDRESS = input.propertyMgmtAddress;
        if (input.propertyMgmtWebsite) process.env.PROPERTYMGMT_WEBSITE = input.propertyMgmtWebsite;
        if (input.propertyMgmtImpressum) process.env.PROPERTYMGMT_IMPRESSUM = input.propertyMgmtImpressum;
        if (input.propertyMgmtAgb) process.env.PROPERTYMGMT_AGB = input.propertyMgmtAgb;
        if (input.propertyMgmtDatenschutz) process.env.PROPERTYMGMT_DATENSCHUTZ = input.propertyMgmtDatenschutz;
        
        // Save legacy company branding (for backward compatibility)
        if (input.companyLogo) process.env.COMPANY_LOGO = input.companyLogo;
        if (input.companyName) process.env.COMPANY_NAME = input.companyName;
        if (input.companyPhone) process.env.COMPANY_PHONE = input.companyPhone;
        if (input.companyEmail) process.env.COMPANY_EMAIL = input.companyEmail;
        if (input.companyAddress) process.env.COMPANY_ADDRESS = input.companyAddress;
        if (input.companyWebsite) process.env.COMPANY_WEBSITE = input.companyWebsite;
        if (input.impressum) process.env.IMPRESSUM = input.impressum;
        if (input.agb) process.env.AGB = input.agb;
        if (input.datenschutz) process.env.DATENSCHUTZ = input.datenschutz;
        
        // Legacy support (for backward compatibility)
        if (input.nasProtocol) process.env.NAS_PROTOCOL = input.nasProtocol;
        if (input.nasUrl) process.env.NAS_WEBDAV_URL = input.nasUrl;
        if (input.nasPort) process.env.NAS_PORT = input.nasPort;
        if (input.nasUsername) process.env.NAS_USERNAME = input.nasUsername;
        if (input.nasPassword) process.env.NAS_PASSWORD = input.nasPassword;
        
        // Save module activation settings
        if (input.moduleImmobilienmakler !== undefined) process.env.MODULE_IMMOBILIENMAKLER = String(input.moduleImmobilienmakler);
        if (input.moduleVersicherungen !== undefined) process.env.MODULE_VERSICHERUNGEN = String(input.moduleVersicherungen);
        if (input.moduleHausverwaltung !== undefined) process.env.MODULE_HAUSVERWALTUNG = String(input.moduleHausverwaltung);
        
        console.log('[Settings] NAS configuration updated:', {
          webdav: input.webdavUrl ? '***' : '(not set)',
          ftp: input.ftpHost ? '***' : '(not set)',
          basePath: input.nasBasePath || process.env.NAS_BASE_PATH,
        });
        
        // Save to database (appConfig table)
        const db = await getDb();
        if (db) {
          try {
            const { appConfig } = await import('../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            
            // Helper to upsert config
            const upsertConfig = async (key: string, value: string | undefined) => {
              if (value === undefined) return;
              const existing = await db!.select().from(appConfig).where(eq(appConfig.configKey, key)).limit(1);
              if (existing.length > 0) {
                await db!.update(appConfig).set({ configValue: value }).where(eq(appConfig.configKey, key));
              } else {
                await db!.insert(appConfig).values({ configKey: key, configValue: value });
              }
            };
            
            // Save all WebDAV/FTP/NAS settings to database
            await upsertConfig('WEBDAV_URL', input.webdavUrl);
            await upsertConfig('WEBDAV_PORT', input.webdavPort);
            await upsertConfig('WEBDAV_USERNAME', input.webdavUsername);
            await upsertConfig('WEBDAV_PASSWORD', input.webdavPassword);
            await upsertConfig('FTP_HOST', input.ftpHost);
            await upsertConfig('FTP_PORT', input.ftpPort);
            await upsertConfig('FTP_USERNAME', input.ftpUsername);
            await upsertConfig('FTP_PASSWORD', input.ftpPassword);
            await upsertConfig('FTP_SECURE', input.ftpSecure?.toString());
            await upsertConfig('NAS_PUBLIC_USERNAME', input.nasPublicUsername);
            await upsertConfig('NAS_PUBLIC_PASSWORD', input.nasPublicPassword);
            await upsertConfig('NAS_BASE_PATH', input.nasBasePath);
            
            console.log('[Settings] Configuration saved to database');
          } catch (error) {
            console.error('[Settings] Failed to save to database:', error);
          }
          
          // Update settings table
          try {
            const { settings } = await import('../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            
            // Build update object with only provided fields
            const updateData: any = {};
            if (input.dashboardLogo !== undefined) updateData.dashboardLogo = input.dashboardLogo;
            if (input.superchat !== undefined) updateData.superchatApiKey = input.superchat;
            if (input.brevo !== undefined) updateData.brevoApiKey = input.brevo;
            if (input.googleMaps !== undefined) updateData.googleMapsApiKey = input.googleMaps;
            if (input.openai !== undefined) updateData.openaiApiKey = input.openai;
            if (input.landingPageTemplate !== undefined) updateData.landingPageTemplate = input.landingPageTemplate;
            
            // E-Mail settings per module
            if (input.realestateEmailFrom !== undefined) updateData.realestateEmailFrom = input.realestateEmailFrom;
            if (input.realestateEmailFromName !== undefined) updateData.realestateEmailFromName = input.realestateEmailFromName;
            if (input.realestateEmailNotificationTo !== undefined) updateData.realestateEmailNotificationTo = input.realestateEmailNotificationTo;
            if (input.insuranceEmailFrom !== undefined) updateData.insuranceEmailFrom = input.insuranceEmailFrom;
            if (input.insuranceEmailFromName !== undefined) updateData.insuranceEmailFromName = input.insuranceEmailFromName;
            if (input.insuranceEmailNotificationTo !== undefined) updateData.insuranceEmailNotificationTo = input.insuranceEmailNotificationTo;
            if (input.propertyMgmtEmailFrom !== undefined) updateData.propertyMgmtEmailFrom = input.propertyMgmtEmailFrom;
            if (input.propertyMgmtEmailFromName !== undefined) updateData.propertyMgmtEmailFromName = input.propertyMgmtEmailFromName;
            if (input.propertyMgmtEmailNotificationTo !== undefined) updateData.propertyMgmtEmailNotificationTo = input.propertyMgmtEmailNotificationTo;
            
            // Document templates
            if (input.exposeTemplate !== undefined) updateData.exposeTemplate = input.exposeTemplate;
            if (input.onePagerTemplate !== undefined) updateData.onePagerTemplate = input.onePagerTemplate;
            if (input.invoiceTemplate !== undefined) updateData.invoiceTemplate = input.invoiceTemplate;
            if (input.maklervertragTemplate !== undefined) updateData.maklervertragTemplate = input.maklervertragTemplate;
            
            // Branding per module
            if (input.realestateLogo !== undefined) updateData.realestateLogo = input.realestateLogo;
            if (input.realestateName !== undefined) updateData.realestateName = input.realestateName;
            if (input.realestatePhone !== undefined) updateData.realestatePhone = input.realestatePhone;
            if (input.realestateEmail !== undefined) updateData.realestateEmail = input.realestateEmail;
            if (input.realestateAddress !== undefined) updateData.realestateAddress = input.realestateAddress;
            if (input.realestateWebsite !== undefined) updateData.realestateWebsite = input.realestateWebsite;
            if (input.realestateImpressum !== undefined) updateData.realestateImpressum = input.realestateImpressum;
            if (input.realestateAgb !== undefined) updateData.realestateAgb = input.realestateAgb;
            if (input.realestateDatenschutz !== undefined) updateData.realestateDatenschutz = input.realestateDatenschutz;
            
            if (input.insuranceLogo !== undefined) updateData.insuranceLogo = input.insuranceLogo;
            if (input.insuranceName !== undefined) updateData.insuranceName = input.insuranceName;
            if (input.insurancePhone !== undefined) updateData.insurancePhone = input.insurancePhone;
            if (input.insuranceEmail !== undefined) updateData.insuranceEmail = input.insuranceEmail;
            if (input.insuranceAddress !== undefined) updateData.insuranceAddress = input.insuranceAddress;
            if (input.insuranceWebsite !== undefined) updateData.insuranceWebsite = input.insuranceWebsite;
            if (input.insuranceImpressum !== undefined) updateData.insuranceImpressum = input.insuranceImpressum;
            if (input.insuranceAgb !== undefined) updateData.insuranceAgb = input.insuranceAgb;
            if (input.insuranceDatenschutz !== undefined) updateData.insuranceDatenschutz = input.insuranceDatenschutz;
            
            if (input.propertyMgmtLogo !== undefined) updateData.propertyMgmtLogo = input.propertyMgmtLogo;
            if (input.propertyMgmtName !== undefined) updateData.propertyMgmtName = input.propertyMgmtName;
            if (input.propertyMgmtPhone !== undefined) updateData.propertyMgmtPhone = input.propertyMgmtPhone;
            if (input.propertyMgmtEmail !== undefined) updateData.propertyMgmtEmail = input.propertyMgmtEmail;
            if (input.propertyMgmtAddress !== undefined) updateData.propertyMgmtAddress = input.propertyMgmtAddress;
            if (input.propertyMgmtWebsite !== undefined) updateData.propertyMgmtWebsite = input.propertyMgmtWebsite;
            if (input.propertyMgmtImpressum !== undefined) updateData.propertyMgmtImpressum = input.propertyMgmtImpressum;
            if (input.propertyMgmtAgb !== undefined) updateData.propertyMgmtAgb = input.propertyMgmtAgb;
            if (input.propertyMgmtDatenschutz !== undefined) updateData.propertyMgmtDatenschutz = input.propertyMgmtDatenschutz;
            
            // Update settings (id=1)
            if (Object.keys(updateData).length > 0) {
              await db!.update(settings).set(updateData).where(eq(settings.id, 1));
              console.log('[Settings] Settings table updated with', Object.keys(updateData).length, 'fields');
            }
          } catch (error) {
            console.error('[Settings] Failed to update settings table:', error);
          }
        }
        
        return { success: true };
      }),
  }),

  // ============ PROPERTIES ============
  properties: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        propertyType: z.string().optional(),
        marketingType: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        city: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllProperties(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property) return undefined;
        
        // Ensure availableFrom is a string, not a Date object
        if (property.availableFrom) {
          const dateValue = property.availableFrom instanceof Date 
            ? property.availableFrom 
            : new Date(property.availableFrom as any);
          (property as any).availableFrom = dateValue.toISOString().split('T')[0];
        }
        
        // Fetch images for this property
        const images = await db.getPropertyImages(input.id);
        
        return {
          ...property,
          images: images, // Return full image objects with all fields including id
        };
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getPropertyBySlug(input.slug);
      }),

    create: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        propertyType: z.enum(["apartment", "house", "commercial", "land", "parking", "other"]),
        marketingType: z.enum(["sale", "rent", "lease"]),
        status: z.enum(["acquisition", "preparation", "marketing", "reserved", "notary", "sold", "completed"]).optional(),
        street: z.string().optional(),
        houseNumber: z.string().optional(),
        zipCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        livingArea: z.number().optional(),
        plotArea: z.number().optional(),
        rooms: z.number().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        floor: z.number().optional(),
        totalFloors: z.number().optional(),
        price: z.number().optional(),
        additionalCosts: z.number().optional(),
        heatingCosts: z.number().optional(),
        deposit: z.number().optional(),
        hasBalcony: z.boolean().optional(),
        hasTerrace: z.boolean().optional(),
        hasGarden: z.boolean().optional(),
        hasElevator: z.boolean().optional(),
        hasParking: z.boolean().optional(),
        hasBasement: z.boolean().optional(),
        energyClass: z.string().optional(),
        energyConsumption: z.number().optional(),
        heatingType: z.string().optional(),
        yearBuilt: z.number().optional(),
        condition: z.enum([
          "erstbezug", "erstbezug_nach_sanierung", "neuwertig", "saniert", "teilsaniert",
          "sanierungsbedürftig", "baufällig", "modernisiert", "vollständig_renoviert",
          "teilweise_renoviert", "gepflegt", "renovierungsbedürftig", "nach_vereinbarung", "abbruchreif"
        ]).optional(),
        availableFrom: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Auto-generate title from address (same format as NAS path)
        let title = input.title || '';
        if (input.street && input.city) {
          const parts = [input.street, input.houseNumber].filter(Boolean).join(' ');
          const location = [input.zipCode, input.city].filter(Boolean).join(' ');
          title = [parts, location].filter(Boolean).join(', ');
        }
        
        await db.createProperty({
          ...input,
          title,
          createdBy: 1, // Default user since no authentication
        });
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          propertyType: z.enum(["apartment", "house", "commercial", "land", "parking", "other"]).optional(),
          subType: z.string().optional(),
          marketingType: z.enum(["sale", "rent", "lease"]).optional(),
          status: z.enum(["acquisition", "preparation", "marketing", "reserved", "notary", "sold", "completed"]).optional(),
          street: z.string().optional(),
          houseNumber: z.string().optional(),
          zipCode: z.string().optional(),
          city: z.string().optional(),
          region: z.string().optional(),
          country: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          hideStreetOnPortals: z.boolean().optional(),
          districtCourt: z.string().optional(),
          landRegisterSheet: z.string().optional(),
          landRegisterOf: z.string().optional(),
          cadastralDistrict: z.string().optional(),
          corridor: z.string().optional(),
          parcel: z.string().optional(),
          livingArea: z.number().optional(),
          plotArea: z.number().optional(),
          usableArea: z.number().optional(),
          balconyArea: z.number().optional(),
          gardenArea: z.number().optional(),
          rooms: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          floor: z.number().optional(),
          floorLevel: z.string().optional(),
          totalFloors: z.number().optional(),
          price: z.number().optional(),
          priceOnRequest: z.boolean().optional(),
          priceByNegotiation: z.boolean().optional(),
          coldRent: z.number().optional(),
          warmRent: z.number().optional(),
          additionalCosts: z.number().optional(),
          heatingCosts: z.number().optional(),
          heatingIncludedInAdditional: z.boolean().optional(),
          nonRecoverableCosts: z.number().optional(),
          houseMoney: z.number().optional(),
          maintenanceReserve: z.number().optional(),
          parkingPrice: z.number().optional(),
          monthlyRentalIncome: z.number().optional(),
          deposit: z.number().optional(),
          hasElevator: z.boolean().optional(),
          isBarrierFree: z.boolean().optional(),
          hasBasement: z.boolean().optional(),
          hasGuestToilet: z.boolean().optional(),
          hasBuiltInKitchen: z.boolean().optional(),
          hasBalcony: z.boolean().optional(),
          hasTerrace: z.boolean().optional(),
          hasLoggia: z.boolean().optional(),
          hasGarden: z.boolean().optional(),
          isMonument: z.boolean().optional(),
          suitableAsHoliday: z.boolean().optional(),
          hasStorageRoom: z.boolean().optional(),
          hasFireplace: z.boolean().optional(),
          hasPool: z.boolean().optional(),
          hasSauna: z.boolean().optional(),
          hasAlarm: z.boolean().optional(),
          hasWinterGarden: z.boolean().optional(),
          hasAirConditioning: z.boolean().optional(),
          hasParking: z.boolean().optional(),
          parkingCount: z.number().optional(),
          parkingType: z.string().optional(),
          bathroomFeatures: z.string().optional(),
          flooringTypes: z.string().optional(),
          energyCertificateAvailability: z.string().optional(),
          energyCertificateCreationDate: z.string().optional(),
          energyCertificateIssueDate: z.string().optional(),
          energyCertificateValidUntil: z.string().optional(),
          energyCertificateType: z.string().optional(),
          energyClass: z.string().optional(),
          energyConsumption: z.number().optional(),
          energyConsumptionElectricity: z.number().optional(),
          energyConsumptionHeat: z.number().optional(),
          co2Emissions: z.number().optional(),
          includesWarmWater: z.boolean().optional(),
          heatingType: z.string().optional(),
          mainEnergySource: z.string().optional(),
          buildingYearUnknown: z.boolean().optional(),
          heatingSystemYear: z.number().optional(),
          yearBuilt: z.number().optional(),
          lastModernization: z.number().optional(),
          condition: z.enum([
            "erstbezug", "erstbezug_nach_sanierung", "neuwertig", "saniert", "teilsaniert",
            "sanierungsbedürftig", "baufällig", "modernisiert", "vollständig_renoviert",
            "teilweise_renoviert", "gepflegt", "renovierungsbedürftig", "nach_vereinbarung", "abbruchreif"
          ]).optional(),
          buildingPhase: z.string().optional(),
          equipmentQuality: z.string().optional(),
          isRented: z.boolean().optional(),
          availableFrom: z.union([z.string(), z.date()]).optional(),
          supervisorId: z.number().optional(),
          ownerId: z.number().optional(),
          ownerType: z.string().optional(),
          buyerId: z.number().optional(),
          notaryId: z.number().optional(),
          propertyManagementId: z.number().optional(),
          tenantId: z.number().optional(),
          assignmentType: z.string().optional(),
          assignmentDuration: z.string().optional(),
          assignmentFrom: z.union([z.string(), z.date()]).optional(),
          assignmentTo: z.union([z.string(), z.date()]).optional(),
          internalCommissionPercent: z.string().optional(),
          internalCommissionType: z.enum(["percent", "euro"]).optional(),
          externalCommissionInternalPercent: z.string().optional(),
          externalCommissionInternalType: z.enum(["percent", "euro"]).optional(),
          totalCommission: z.number().optional(),
          externalCommissionForExpose: z.string().optional(),
          commissionNote: z.string().optional(),
          walkingTimeToPublicTransport: z.number().optional(),
          distanceToPublicTransport: z.number().optional(),
          drivingTimeToHighway: z.number().optional(),
          distanceToHighway: z.number().optional(),
          drivingTimeToMainStation: z.number().optional(),
          distanceToMainStation: z.number().optional(),
          drivingTimeToAirport: z.number().optional(),
          distanceToAirport: z.number().optional(),
          landingPageSlug: z.string().optional(),
          landingPagePublished: z.boolean().optional(),
          headline: z.string().optional(),
          descriptionHighlights: z.string().optional(),
          descriptionLocation: z.string().optional(),
          descriptionFazit: z.string().optional(),
          descriptionCTA: z.string().optional(),
          linkedContactIds: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        console.log('[tRPC] properties.update called with:', JSON.stringify(input, null, 2));
        
        // Convert string dates to Date objects before saving
        const processedData: any = { ...input.data };
        if (input.data.availableFrom && typeof input.data.availableFrom === 'string') {
          processedData.availableFrom = new Date(input.data.availableFrom);
        }
        
        // Auto-generate title from address if address fields are being updated (same format as NAS path)
        if (input.data.street || input.data.city || input.data.houseNumber || input.data.zipCode) {
          // Get current property to merge with updates
          const currentProperty = await db.getPropertyById(input.id);
          if (currentProperty) {
            const street = input.data.street ?? currentProperty.street;
            const houseNumber = input.data.houseNumber ?? currentProperty.houseNumber;
            const zipCode = input.data.zipCode ?? currentProperty.zipCode;
            const city = input.data.city ?? currentProperty.city;
            
            if (street && city) {
              const parts = [street, houseNumber].filter(Boolean).join(' ');
              const location = [zipCode, city].filter(Boolean).join(' ');
              const title = [parts, location].filter(Boolean).join(', ');
              
              processedData.title = title;
            }
          }
        }
        
        await db.updateProperty(input.id, processedData);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProperty(input.id);
        return { success: true };
      }),

    getImages: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPropertyImages(input.propertyId);
      }),

    addImage: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        imageUrl: z.string(),
        nasPath: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageType: z.enum(["main", "exterior", "interior", "floorplan", "map", "other"]).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPropertyImage(input);
        return { success: true };
      }),

      deleteImage: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePropertyImage(input.id);
        return { success: true };
      }),

    uploadToNAS: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        category: z.enum(["Bilder", "Objektunterlagen", "Sensible Daten", "Vertragsunterlagen"]),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file data
        mimeType: z.string().optional(),
        imageType: z.enum([
          "hausansicht", "kueche", "bad", "wohnzimmer", "schlafzimmer",
          "garten", "balkon", "keller", "dachboden", "garage",
          "grundrisse", "sonstiges"
        ]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        
        // Get property to build folder name
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        
        // Get NAS configuration from database (appConfig table)
        const nasConfig = await db.getNASConfig();
        const webdavUrl = nasConfig.WEBDAV_URL || "";
        const webdavPort = nasConfig.WEBDAV_PORT || "2002";
        const webdavUsername = nasConfig.WEBDAV_USERNAME || "";
        const webdavPassword = nasConfig.WEBDAV_PASSWORD || "";
        
        const ftpHost = nasConfig.FTP_HOST || "";
        const ftpPort = nasConfig.FTP_PORT || "21";
        const ftpUsername = nasConfig.FTP_USERNAME || "";
        const ftpPassword = nasConfig.FTP_PASSWORD || "";
        

        
        // Public Read-Only credentials for image URLs
        const nasPublicUsername = process.env.NAS_PUBLIC_USERNAME || "";
        const nasPublicPassword = process.env.NAS_PUBLIC_PASSWORD || "";
        
        console.log('\n========== UPLOAD DEBUG ==========');
        console.log('[Upload] WebDAV Configuration:', {
          url: webdavUrl || '(not set)',
          port: webdavPort,
          username: webdavUsername || '(not set)',
          hasPassword: !!webdavPassword,
        });
        console.log('[Upload] FTP Configuration:', {
          host: ftpHost || '(not set)',
          port: ftpPort,
          username: ftpUsername || '(not set)',
          hasPassword: !!ftpPassword,
        });
        console.log('[Upload] File:', {
          fileName: input.fileName,
          category: input.category,
        });
        
        let nasPath: string = '';
        let url: string = '';
        let usedFallback = false;
        
        // Try WebDAV first, then FTP, then S3 fallback
        try {
          let uploadSuccess = false;
          
          // Try WebDAV first (if configured)
          if (webdavUrl && webdavUsername && webdavPassword) {
            console.log('[Upload] Trying WebDAV first...');
            try {
              const webdavClient = await import("./lib/webdav-client");
              const propertyFolderName = webdavClient.getPropertyFolderName(property);
              
              // Test connection with timeout
              const connectionOk = await Promise.race([
                webdavClient.testConnection(),
                new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10000))
              ]);
              
              if (connectionOk) {
                console.log('[Upload] WebDAV connection OK, uploading...');
                nasPath = await webdavClient.uploadFile(
                  propertyFolderName,
                  input.category,
                  input.fileName,
                  fileBuffer
                );
                
                // Build proxy URL (browser accesses via /api/nas/* which handles authentication)
                // Format: /api/nas/Daten/.../filename.jpg
                // The proxy endpoint will authenticate with read-only credentials
                const relativePath = nasPath.replace(/^\/volume1/, '');
                // Build proxy URL with proper encoding
                const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
                url = `/api/nas${encodedPath}`;
                console.log('[Upload] Using proxy URL:', url);
                
                uploadSuccess = true;
                console.log('[Upload] ✅ WebDAV upload successful');
                console.log('[Upload] Public URL:', url);
              } else {
                console.log('[Upload] WebDAV connection failed, trying FTP...');
              }
            } catch (webdavError: any) {
              console.log('[Upload] WebDAV error:', webdavError.message);
              console.log('[Upload] Falling back to FTP...');
            }
          }
          
          // Try FTP if WebDAV failed or not configured
          if (!uploadSuccess && ftpHost && ftpUsername && ftpPassword) {
            console.log('[Upload] Trying FTP...');
            try {
              const ftpClient = await import("./lib/ftp-client");
              const propertyFolderName = ftpClient.getPropertyFolderName(property);
              
              console.log('[Upload] FTP config:', {
                host: ftpHost,
                port: parseInt(ftpPort),
                propertyFolder: propertyFolderName,
              });
              
              // Test connection with timeout
              const connectionOk = await Promise.race([
                ftpClient.testConnection({
                  host: ftpHost,
                  port: parseInt(ftpPort),
                  user: ftpUsername,
                  password: ftpPassword,
                  secure: false,
                }),
                new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10000))
              ]);
              
              if (connectionOk) {
                console.log('[Upload] FTP connection OK, uploading...');
                nasPath = await ftpClient.uploadFile(
                  {
                    host: ftpHost,
                    port: parseInt(ftpPort),
                    user: ftpUsername,
                    password: ftpPassword,
                    secure: false,
                  },
                  propertyFolderName,
                  input.category,
                  input.fileName,
                  fileBuffer
                );
                
                // Build proxy URL (browser accesses via /api/nas/* which handles authentication)
                const relativePath = nasPath.replace(/^\/volume1/, '');
                const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
                url = `/api/nas${encodedPath}`;
                console.log('[Upload] Using proxy URL:', url);
                
                uploadSuccess = true;
                console.log('[Upload] ✅ FTP upload successful');
              } else {
                console.log('[Upload] FTP connection failed');
              }
            } catch (ftpError: any) {
              console.log('[Upload] FTP error:', ftpError.message);
            }
          }
          
          // If both NAS methods failed, throw error
          if (!uploadSuccess) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'NAS-Upload fehlgeschlagen. Bitte überprüfen Sie die NAS-Verbindung in den Einstellungen.',
            });
          }
        } catch (error: any) {
          console.error('[Upload] NAS upload failed');
          console.error('[Upload] Error details:', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `NAS-Upload fehlgeschlagen: ${error.message}`,
          });
        }
        
        // Save to database
        if (input.category === "Bilder") {
          try {
            console.log('[Upload] Attempting to save to database:', {
              propertyId: input.propertyId,
              imageUrl: url,
              nasPath,
              title: input.fileName,
              imageType: input.imageType || "sonstiges",
            });
            await db.createPropertyImage({
              propertyId: input.propertyId,
              imageUrl: url,
              nasPath,
              title: input.fileName,
              imageType: input.imageType || "sonstiges",
            });
            console.log('[Upload] ✅ Database entry created successfully');
          } catch (dbError: any) {
            console.error('[Upload] ❌ Failed to save image to database!');
            console.error('[Upload] Error:', dbError.message);
            console.error('[Upload] Stack:', dbError.stack);
            // Continue anyway - file is uploaded to NAS/S3
          }
        } else {
          // Save documents to database
          try {
            console.log('[Upload] Attempting to save document to database:', {
              propertyId: input.propertyId,
              fileUrl: url,
              nasPath,
              title: input.fileName,
              category: input.category,
            });
            await db.createDocument({
              propertyId: input.propertyId,
              title: input.fileName,
              fileUrl: url,
              nasPath,
              documentType: "other", // Default type
              category: input.category,
              uploadedBy: 1, // Default user since no authentication
            });
            console.log('[Upload] ✅ Document database entry created successfully');
          } catch (dbError: any) {
            console.error('[Upload] ❌ Failed to save document to database!');
            console.error('[Upload] Error:', dbError.message);
            console.error('[Upload] Stack:', dbError.stack);
            // Continue anyway - file is uploaded to NAS
          }
        }
        
        return { 
          success: true, 
          nasPath,
          url,
          message: 'Datei erfolgreich zum NAS hochgeladen'
        };
      }),

    listNASFiles: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        category: z.enum(["Bilder", "Objektunterlagen", "Sensible Daten", "Vertragsunterlagen"]),
      }))
      .query(async ({ input }) => {
        const { listFiles, getPropertyFolderName } = await import("./lib/webdav-client");
        
        // Get property to build folder name
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        
        const propertyFolderName = getPropertyFolderName(property);
        const files = await listFiles(propertyFolderName, input.category);
        
        return files;
      }),

    syncFromNAS: publicProcedure
      .input(z.object({
        propertyId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { listFiles, getPropertyFolderName } = await import("./lib/webdav-client");
        
        // Get property to build folder name
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        
        const propertyFolderName = getPropertyFolderName(property);
        const results = {
          newImages: 0,
          newDocuments: 0,
          errors: [] as string[],
        };
        
        // Sync images from Bilder folder
        try {
          const imageFiles = await listFiles(propertyFolderName, "Bilder");
          const existingImages = await db.getPropertyImages(input.propertyId);
          const existingPaths = new Set(existingImages.map(img => img.nasPath));
          
          for (const file of imageFiles) {
            // Skip if already in database
            if (existingPaths.has(file.filename)) {
              continue;
            }
            
            // Only process image files
            if (!file.basename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              continue;
            }
            
            // Build Proxy URL (instead of direct NAS URL to avoid auth popup)
            const relativePath = file.filename.replace(/^\/volume1/, '');
            const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
            const url = `/api/nas${encodedPath}`;
            
            // Determine image type from filename
            let imageType = "sonstiges";
            const lowerName = file.basename.toLowerCase();
            if (lowerName.includes('hausansicht') || lowerName.includes('aussen')) imageType = "hausansicht";
            else if (lowerName.includes('kueche') || lowerName.includes('küche')) imageType = "kueche";
            else if (lowerName.includes('bad')) imageType = "bad";
            else if (lowerName.includes('wohnzimmer') || lowerName.includes('wohnen')) imageType = "wohnzimmer";
            else if (lowerName.includes('schlafzimmer') || lowerName.includes('schlaf')) imageType = "schlafzimmer";
            else if (lowerName.includes('garten')) imageType = "garten";
            else if (lowerName.includes('balkon') || lowerName.includes('terrasse')) imageType = "balkon";
            else if (lowerName.includes('keller')) imageType = "keller";
            else if (lowerName.includes('dachboden') || lowerName.includes('dach')) imageType = "dachboden";
            else if (lowerName.includes('garage') || lowerName.includes('carport')) imageType = "garage";
            else if (lowerName.includes('grundriss')) imageType = "grundrisse";
            
            try {
              await db.createPropertyImage({
                propertyId: input.propertyId,
                imageUrl: url,
                nasPath: file.filename,
                title: file.basename,
                imageType: imageType as any,
              });
              results.newImages++;
            } catch (error: any) {
              results.errors.push(`Bild ${file.basename}: ${error.message}`);
            }
          }
        } catch (error: any) {
          results.errors.push(`Bilder-Ordner: ${error.message}`);
        }
        
        // Sync documents from Objektunterlagen, Sensible Daten, and Vertragsunterlagen folders
        for (const category of ["Objektunterlagen", "Sensible Daten", "Vertragsunterlagen"] as const) {
          try {
            const docFiles = await listFiles(propertyFolderName, category);
            const existingDocs = await db.getDocumentsByProperty(input.propertyId);
            const existingPaths = new Set(existingDocs.map(doc => doc.nasPath));
            
            for (const file of docFiles) {
              // Skip if already in database
              if (existingPaths.has(file.filename)) {
                continue;
              }
              
              // Only process document files (skip images)
              if (file.basename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                continue;
              }
              
              // Build Proxy URL (instead of direct NAS URL to avoid auth popup)
              const relativePath = file.filename.replace(/^\/volume1/, '');
              const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
              const url = `/api/nas${encodedPath}`;
              
              try {
                await db.createDocument({
                  propertyId: input.propertyId,
                  title: file.basename,
                  fileUrl: url,
                  nasPath: file.filename,
                  documentType: "other",
                  category: category,
                  uploadedBy: 1, // System user for synced documents
                });
                results.newDocuments++;
              } catch (error: any) {
                results.errors.push(`Dokument ${file.basename}: ${error.message}`);
              }
            }
          } catch (error: any) {
            results.errors.push(`${category}: ${error.message}`);
          }
        }
        
        return {
          success: true,
          ...results,
          message: `${results.newImages} neue Bilder und ${results.newDocuments} Dokumente importiert${results.errors.length > 0 ? ` (${results.errors.length} Fehler)` : ''}`
        };
      }),

    deleteFromNAS: publicProcedure
      .input(z.object({
        nasPath: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { deleteFile } = await import("./lib/webdav-client");
        
        await deleteFile(input.nasPath);
        
        return { success: true };
      }),

    testNASConnection: publicProcedure
      .input(z.object({
        propertyId: z.number(),
      }))
      .query(async ({ input }) => {
        const { testConnection, getPropertyFolderName, ensurePropertyFolders, uploadFile } = await import("./lib/webdav-client");
        
        const results: any = {
          timestamp: new Date().toISOString(),
          tests: [],
        };
        
        // Test 1: Basic connection
        try {
          const startTime = Date.now();
          const connected = await testConnection();
          const duration = Date.now() - startTime;
          results.tests.push({
            name: 'Basic Connection',
            success: connected,
            duration: `${duration}ms`,
            message: connected ? 'NAS is reachable' : 'NAS is not reachable',
          });
        } catch (error: any) {
          results.tests.push({
            name: 'Basic Connection',
            success: false,
            error: error.message,
          });
        }
        
        // Test 2: Get property folder name
        try {
          const property = await db.getPropertyById(input.propertyId);
          if (!property) {
            throw new Error('Property not found');
          }
          const folderName = getPropertyFolderName(property);
          results.tests.push({
            name: 'Property Folder Name',
            success: true,
            folderName,
          });
          results.propertyFolderName = folderName;
        } catch (error: any) {
          results.tests.push({
            name: 'Property Folder Name',
            success: false,
            error: error.message,
          });
        }
        
        // Test 3: Create folders
        if (results.propertyFolderName) {
          try {
            const startTime = Date.now();
            await ensurePropertyFolders(results.propertyFolderName);
            const duration = Date.now() - startTime;
            results.tests.push({
              name: 'Create Folders',
              success: true,
              duration: `${duration}ms`,
              message: 'Folders created/verified successfully',
            });
          } catch (error: any) {
            results.tests.push({
              name: 'Create Folders',
              success: false,
              error: error.message,
            });
          }
        }
        
        // Test 4: Upload test file
        if (results.propertyFolderName) {
          try {
            const startTime = Date.now();
            const testContent = Buffer.from('NAS Upload Test - ' + new Date().toISOString());
            const testFileName = `test-${Date.now()}.txt`;
            const path = await uploadFile(results.propertyFolderName, 'Bilder', testFileName, testContent);
            const duration = Date.now() - startTime;
            results.tests.push({
              name: 'Upload Test File',
              success: true,
              duration: `${duration}ms`,
              path,
              message: 'Test file uploaded successfully',
            });
          } catch (error: any) {
            results.tests.push({
              name: 'Upload Test File',
              success: false,
              error: error.message,
            });
          }
        }
        
        // Summary
        const successCount = results.tests.filter((t: any) => t.success).length;
        const totalCount = results.tests.length;
        results.summary = {
          passed: successCount,
          failed: totalCount - successCount,
          total: totalCount,
          allPassed: successCount === totalCount,
        };
        
        return results;
      }),

    testWebDAVConnection: publicProcedure
      .input(z.object({
        propertyId: z.number(),
      }))
      .query(async ({ input }) => {
        const { testConnection: testWebDAV, getPropertyFolderName } = await import("./lib/webdav-client");
        
        const results: any = {
          timestamp: new Date().toISOString(),
          tests: [],
        };
        
        // Test WebDAV connection
        try {
          const startTime = Date.now();
          const connected = await testWebDAV();
          const duration = Date.now() - startTime;
          results.tests.push({
            name: 'WebDAV Connection',
            success: connected,
            duration: `${duration}ms`,
            message: connected ? 'WebDAV is reachable' : 'WebDAV is not reachable',
          });
        } catch (error: any) {
          results.tests.push({
            name: 'WebDAV Connection',
            success: false,
            error: error.message,
          });
        }
        
        // Get property folder name
        try {
          const property = await db.getPropertyById(input.propertyId);
          if (!property) {
            throw new Error('Property not found');
          }
          const folderName = getPropertyFolderName(property);
          results.tests.push({
            name: 'Property Folder Name',
            success: true,
            folderName,
          });
          results.propertyFolderName = folderName;
        } catch (error: any) {
          results.tests.push({
            name: 'Property Folder Name',
            success: false,
            error: error.message,
          });
        }
        
        // Summary
        const successCount = results.tests.filter((t: any) => t.success).length;
        const totalCount = results.tests.length;
        results.summary = {
          passed: successCount,
          failed: totalCount - successCount,
          total: totalCount,
          allPassed: successCount === totalCount,
        };
        
        return results;
      }),

    testFTPConnection: publicProcedure
      .input(z.object({
        propertyId: z.number(),
      }))
      .query(async ({ input }) => {
        const { testConnection: testFTP, getPropertyFolderName } = await import("./lib/ftp-client");
        
        const results: any = {
          timestamp: new Date().toISOString(),
          tests: [],
        };
        
        // Get FTP config from env
        const ftpHost = process.env.FTP_HOST || "";
        const ftpPort = parseInt(process.env.FTP_PORT || "21");
        const ftpUsername = process.env.FTP_USERNAME || process.env.NAS_USERNAME || "";
        const ftpPassword = process.env.FTP_PASSWORD || process.env.NAS_PASSWORD || "";
        
        if (!ftpHost || !ftpUsername || !ftpPassword) {
          results.tests.push({
            name: 'FTP Configuration',
            success: false,
            error: 'FTP credentials not configured',
          });
          results.summary = { passed: 0, failed: 1, total: 1, allPassed: false };
          return results;
        }
        
        // Test FTP connection
        try {
          const startTime = Date.now();
          const connected = await testFTP({
            host: ftpHost,
            port: ftpPort,
            user: ftpUsername,
            password: ftpPassword,
          });
          const duration = Date.now() - startTime;
          results.tests.push({
            name: 'FTP Connection',
            success: connected,
            duration: `${duration}ms`,
            message: connected ? 'FTP is reachable' : 'FTP is not reachable',
          });
        } catch (error: any) {
          results.tests.push({
            name: 'FTP Connection',
            success: false,
            error: error.message,
          });
        }
        
        // Get property folder name
        try {
          const property = await db.getPropertyById(input.propertyId);
          if (!property) {
            throw new Error('Property not found');
          }
          const folderName = getPropertyFolderName(property);
          results.tests.push({
            name: 'Property Folder Name',
            success: true,
            folderName,
          });
          results.propertyFolderName = folderName;
        } catch (error: any) {
          results.tests.push({
            name: 'Property Folder Name',
            success: false,
            error: error.message,
          });
        }
        
        // Summary
        const successCount = results.tests.filter((t: any) => t.success).length;
        const totalCount = results.tests.length;
        results.summary = {
          passed: successCount,
          failed: totalCount - successCount,
          total: totalCount,
          allPassed: successCount === totalCount,
        };
        
        return results;
      }),

    generateDescription: publicProcedure
      .input(z.object({
        propertyData: z.any(),
        creativity: z.number().min(0).max(1).default(0.7),
      }))
      .mutation(async ({ input }) => {
        const { generateText } = await import("./_core/openai");
        
        // Build property details string from data
        const p = input.propertyData;
        const details: string[] = [];
        
        // Basic info
        if (p.title) details.push(`Titel: ${p.title}`);
        if (p.street && p.houseNumber && p.city) {
          details.push(`Adresse: ${p.street} ${p.houseNumber}, ${p.zipCode || ''} ${p.city}`.trim());
        }
        
        // Type and marketing
        const typeMap: Record<string, string> = {
          'apartment': 'Wohnung',
          'house': 'Haus',
          'commercial': 'Gewerbe',
          'land': 'Grundstück',
          'parking': 'Stellplatz',
          'other': 'Sonstige'
        };
        const marketingMap: Record<string, string> = {
          'sale': 'Verkauf',
          'rent': 'Vermietung',
          'lease': 'Pacht'
        };
        if (p.propertyType) details.push(`Immobilientyp: ${typeMap[p.propertyType] || p.propertyType}`);
        if (p.marketingType) details.push(`Vermarktungsart: ${marketingMap[p.marketingType] || p.marketingType}`);
        
        // Price
        if (p.price) {
          const priceStr = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(p.price);
          details.push(`Preis: ${priceStr}`);
        }
        
        // Dimensions
        if (p.rooms) details.push(`${p.rooms} Zimmer`);
        if (p.bedrooms) details.push(`${p.bedrooms} Schlafzimmer`);
        if (p.bathrooms) details.push(`${p.bathrooms} Badezimmer`);
        if (p.livingArea) details.push(`Wohnfläche: ${p.livingArea} m²`);
        if (p.plotArea) details.push(`Grundstücksfläche: ${p.plotArea} m²`);
        if (p.gardenArea) details.push(`Gartenfläche: ${p.gardenArea} m²`);
        if (p.floor && p.totalFloors) details.push(`${p.floor}. Etage von ${p.totalFloors}`);
        else if (p.floor) details.push(`${p.floor}. Etage`);
        
        // Building details
        if (p.yearBuilt) details.push(`Baujahr: ${p.yearBuilt}`);
        if (p.lastModernization) details.push(`Letzte Modernisierung: ${p.lastModernization}`);
        if (p.condition) details.push(`Zustand: ${p.condition}`);
        if (p.equipmentQuality) details.push(`Ausstattungsqualität: ${p.equipmentQuality}`);
        
        // Flooring
        if (p.flooringTypes) {
          const floors = p.flooringTypes.split(',').filter(Boolean);
          if (floors.length > 0) details.push(`Bodenbelag: ${floors.join(', ')}`);
        }
        
        // Parking
        if (p.parkingType) details.push(`Parkplatz: ${p.parkingType}`);
        if (p.parkingCount) details.push(`${p.parkingCount} Stellplätze`);
        
        // Features
        const features: string[] = [];
        if (p.hasBalcony) features.push('Balkon');
        if (p.hasTerrace) features.push('Terrasse');
        if (p.hasGarden) features.push('Garten');
        if (p.hasElevator) features.push('Aufzug');
        if (p.hasBasement) features.push('Keller');
        if (p.hasAttic) features.push('Dachboden');
        if (p.hasGuestToilet) features.push('Gäste-WC');
        if (p.hasBuiltInKitchen) features.push('Einbauküche');
        if (p.hasChimney) features.push('Kamin');
        if (p.hasAirConditioning) features.push('Klimaanlage');
        if (p.hasAlarmSystem) features.push('Alarmanlage');
        if (p.hasSwimmingPool) features.push('Schwimmbad');
        if (p.hasSauna) features.push('Sauna');
        
        // Bathroom features
        if (p.bathroomFeatures) {
          const bathFeatures = p.bathroomFeatures.split(',').filter(Boolean);
          features.push(...bathFeatures);
        }
        
        // Heating & Energy
        if (p.heatingType) features.push(`Heizung: ${p.heatingType}`);
        if (p.energyClass) features.push(`Energieklasse: ${p.energyClass}`);
        if (p.energyConsumption) features.push(`Energieverbrauch: ${p.energyConsumption} kWh/(m²·a)`);
        
        if (features.length > 0) details.push(`Ausstattung: ${features.join(', ')}`);
        
        // Location highlights
        if (p.distancePublicTransport) details.push(`ÖPNV: ${p.distancePublicTransport}`);
        if (p.distanceHighway) details.push(`Autobahn: ${p.distanceHighway}`);
        
        const prompt = `Erstelle eine professionelle und ansprechende Objektbeschreibung für eine Immobilienanzeige mit folgenden Informationen:

${details.join('\n')}

Die Beschreibung soll:
- Verkaufsfördernd und emotional ansprechend sein
- Die wichtigsten Merkmale hervorheben
- Potenzielle Käufer/Mieter ansprechen
- Professionell formuliert sein
- Etwa 150-250 Wörter umfassen`;
        
        const description = await generateText({
          messages: [
            { role: "system", content: "Du bist ein professioneller Immobilienmakler, der ansprechende Objektbeschreibungen erstellt." },
            { role: "user", content: prompt },
          ],
          temperature: input.creativity,
        });
        
        return { description };
      }),

    generateExpose: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        
        const images = await db.getPropertyImages(input.propertyId);
        const pdfBytes = await generateExpose({
          property,
          images: images.map(img => ({ url: img.imageUrl, type: img.imageType || 'other' })),
        });
        
        // Convert to base64 for transmission
        const base64 = Buffer.from(pdfBytes).toString('base64');
        return { pdf: base64 };
      }),

    // Export properties for homepage sync
    exportForHomepage: publicProcedure
      .input(z.object({
        propertyIds: z.array(z.number()).optional(), // If not provided, export all active properties
      }).optional())
      .query(async ({ input }) => {
        // Get properties - either specific ones or all active ones
        const properties = await db.getAllProperties({
          status: input?.propertyIds ? undefined : 'marketing', // Only marketing properties if no specific IDs
        });
        
        // Filter by IDs if provided
        const filteredProperties = input?.propertyIds 
          ? properties.filter(p => input.propertyIds!.includes(p.id))
          : properties;
        
        // Transform to homepage format
        const exportData = await Promise.all(
          filteredProperties.map(async (property) => {
            const images = await db.getPropertyImages(property.id);
            
            return {
              id: property.id.toString(),
              title: property.title || '',
              type: property.propertyType || 'other',
              subType: property.subType || '',
              price: property.price || 0,
              livingSpace: property.livingArea || 0,
              plotSize: property.plotArea || 0,
              rooms: property.rooms || 0,
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              buildYear: property.yearBuilt || 0,
              address: {
                street: property.street || '',
                houseNumber: property.houseNumber || '',
                postalCode: property.zipCode || '',
                city: property.city || '',
              },
              description: property.description || '',
              features: [
                ...(property.hasBalcony ? ['Balkon'] : []),
                ...(property.hasTerrace ? ['Terrasse'] : []),
                ...(property.hasGarden ? ['Garten'] : []),
                ...(property.hasElevator ? ['Aufzug'] : []),
                ...(property.hasParking ? ['Parkplatz'] : []),
                ...(property.hasBasement ? ['Keller'] : []),
                ...(property.hasBuiltInKitchen ? ['Einbauküche'] : []),
                ...(property.hasGuestToilet ? ['Gäste-WC'] : []),
              ],
              images: images.map(img => img.imageUrl),
              status: property.status || 'available',
              marketingType: property.marketingType || 'sale',
            };
          })
        );
        
        return { properties: exportData };
      }),

    // Sync properties to homepage
    syncToHomepage: publicProcedure
      .input(z.object({
        homepageUrl: z.string().url(),
        propertyIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Get export data
        const exportData = await db.getAllProperties({
          status: input.propertyIds ? undefined : 'marketing',
        });
        
        const filteredProperties = input.propertyIds
          ? exportData.filter(p => input.propertyIds!.includes(p.id))
          : exportData;
        
        const formattedData = await Promise.all(
          filteredProperties.map(async (property) => {
            const images = await db.getPropertyImages(property.id);
            
            return {
              id: property.id.toString(),
              title: property.title || '',
              type: property.propertyType || 'other',
              subType: property.subType || '',
              price: property.price || 0,
              livingSpace: property.livingArea || 0,
              plotSize: property.plotArea || 0,
              rooms: property.rooms || 0,
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              buildYear: property.yearBuilt || 0,
              address: {
                street: property.street || '',
                houseNumber: property.houseNumber || '',
                postalCode: property.zipCode || '',
                city: property.city || '',
              },
              description: property.description || '',
              features: [
                ...(property.hasBalcony ? ['Balkon'] : []),
                ...(property.hasTerrace ? ['Terrasse'] : []),
                ...(property.hasGarden ? ['Garten'] : []),
                ...(property.hasElevator ? ['Aufzug'] : []),
                ...(property.hasParking ? ['Parkplatz'] : []),
                ...(property.hasBasement ? ['Keller'] : []),
                ...(property.hasBuiltInKitchen ? ['Einbauküche'] : []),
                ...(property.hasGuestToilet ? ['Gäste-WC'] : []),
              ],
              images: images.map(img => img.imageUrl),
              status: property.status || 'available',
              marketingType: property.marketingType || 'sale',
            };
          })
        );
        
        // Send to homepage
        try {
          const response = await fetch(input.homepageUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties: formattedData }),
          });
          
          if (!response.ok) {
            throw new Error(`Homepage sync failed: ${response.statusText}`);
          }
          
          return { 
            success: true, 
            message: `${formattedData.length} Immobilien erfolgreich synchronisiert`,
            count: formattedData.length,
          };
        } catch (error) {
          throw new Error(`Sync fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        }
      }),

    // Sync properties from external systems (Homepage, ImmoScout24, etc.)
    sync: publicProcedure
      .input(z.object({
        apiKey: z.string(),
        properties: z.array(z.object({
          externalId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          propertyType: z.enum(["apartment", "house", "commercial", "land", "parking", "other"]),
          status: z.enum(["acquisition", "preparation", "marketing", "reserved", "notary", "sold", "completed"]).optional(),
          price: z.number().optional(),
          priceType: z.string().optional(), // kaufpreis, miete, pacht
          street: z.string().optional(),
          houseNumber: z.string().optional(),
          postalCode: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          livingSpace: z.number().optional(),
          plotSize: z.number().optional(),
          rooms: z.number().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          buildYear: z.number().optional(),
          features: z.string().optional(), // JSON array as string
          images: z.string().optional(), // JSON array as string
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate API key
        const validApiKey = process.env.PROPERTY_SYNC_API_KEY || 'mein-geheimer-sync-key-2024';
        if (input.apiKey !== validApiKey) {
          throw new Error('Invalid API key');
        }

        // Import sync helper
        const { upsertPropertyByExternalId } = await import('./db-sync');

        // Get user ID (use system user if not authenticated)
        const userId = ctx.user?.id || 1;

        // Process each property
        const results = await Promise.all(
          input.properties.map(async (prop) => {
            try {
              // Parse features and images from JSON strings
              let features: string[] = [];
              let images: string[] = [];
              
              if (prop.features) {
                try {
                  features = JSON.parse(prop.features);
                } catch (e) {
                  console.error('Failed to parse features:', e);
                }
              }
              
              if (prop.images) {
                try {
                  images = JSON.parse(prop.images);
                } catch (e) {
                  console.error('Failed to parse images:', e);
                }
              }

              // Map to internal property structure
              const propertyData = {
                title: prop.title,
                description: prop.description,
                propertyType: prop.propertyType,
                marketingType: prop.priceType === 'miete' || prop.priceType === 'pacht' ? 'rent' as const : 'sale' as const,
                status: prop.status || 'marketing' as const,
                street: prop.street,
                houseNumber: prop.houseNumber,
                zipCode: prop.postalCode,
                city: prop.city,
                region: prop.state,
                country: prop.country || 'Deutschland',
                livingArea: prop.livingSpace,
                plotArea: prop.plotSize,
                rooms: prop.rooms,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                price: prop.price,
                yearBuilt: prop.buildYear,
                // Parse features into boolean fields
                hasBalcony: features.some(f => f.toLowerCase().includes('balkon')),
                hasTerrace: features.some(f => f.toLowerCase().includes('terrasse')),
                hasGarden: features.some(f => f.toLowerCase().includes('garten')),
                hasElevator: features.some(f => f.toLowerCase().includes('aufzug')),
                hasParking: features.some(f => f.toLowerCase().includes('garage') || f.toLowerCase().includes('stellplatz')),
                hasBasement: features.some(f => f.toLowerCase().includes('keller')),
                hasBuiltInKitchen: features.some(f => f.toLowerCase().includes('einbauküche')),
              };

              // Upsert property
              const result = await upsertPropertyByExternalId(
                prop.externalId,
                'homepage', // sync source
                propertyData,
                userId
              );

              // TODO: Handle images (upload to S3 and create propertyImages records)
              // For now, we just track the image URLs in the property data

              return { externalId: prop.externalId, success: true, created: result.created, id: result.id };
            } catch (error) {
              console.error(`Failed to sync property ${prop.externalId}:`, error);
              return { externalId: prop.externalId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
          })
        );

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return {
          success: true,
          synced: successCount,
          failed: failedCount,
          message: `${successCount} properties synced successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
          results,
        };
      }),

    // Reorder images
    reorderImages: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        imageIds: z.array(z.string()), // Array of image IDs in new order (format: "db-123" or "nas-filename.jpg")
      }))
      .mutation(async ({ input }) => {
        // Update sortOrder for database images
        const dbImageIds = input.imageIds
          .filter(id => id.startsWith('db-'))
          .map(id => parseInt(id.replace('db-', '')));
        
        // Update each image's sortOrder based on its position in the array
        for (let i = 0; i < dbImageIds.length; i++) {
          const imageId = dbImageIds[i];
          await db.updateImageSortOrder(imageId, i);
        }
        
        return { success: true, message: "Bildersortierung gespeichert" };
      }),

    // Update image metadata
    updateImage: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.string().optional(),
        displayName: z.string().optional(),
        imageType: z.string().optional(),
        showOnLandingPage: z.number().optional(),
        isFeatured: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateImageMetadata(input);
        return { success: true };
      }),
  }),

  // ============ CONTACTS ============
  contacts: router({
    list: publicProcedure
      .input(z.object({
        moduleImmobilienmakler: z.boolean().optional(),
        moduleVersicherungen: z.boolean().optional(),
        moduleHausverwaltung: z.boolean().optional(),
        contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]).optional(),
        contactCategory: z.string().optional(),
        searchTerm: z.string().optional(),
        archived: z.boolean().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllContacts(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        moduleImmobilienmakler: z.boolean().optional(),
        moduleVersicherungen: z.boolean().optional(),
        moduleHausverwaltung: z.boolean().optional(),
        contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]).optional(),
        contactCategory: z.string().optional(),
        type: z.enum(["person", "company"]).optional(),
        salutation: z.enum(["herr", "frau", "divers"]).optional(),
        title: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        language: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        street: z.string().optional(),
        houseNumber: z.string().optional(),
        zipCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        companyName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createContact(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          moduleImmobilienmakler: z.boolean().optional(),
          moduleVersicherungen: z.boolean().optional(),
          moduleHausverwaltung: z.boolean().optional(),
          contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]).optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateContact(input.id, input.data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteContact(input.id);
      }),
  }),

  // ============ APPOINTMENTS ============
  appointments: router({
    list: publicProcedure
      .input(z.object({
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllAppointments(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAppointmentById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        appointmentType: z.enum(["viewing", "meeting", "phone_call", "other"]).optional(),
        startTime: z.date(),
        endTime: z.date(),
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
        notes: z.string().optional(),
        syncToGoogleCalendar: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { syncToGoogleCalendar, ...appointmentData } = input;
        
        // Create appointment in database
        const appointmentId = await db.createAppointment({
          ...appointmentData,
          createdBy: 1, // Default user since no authentication
        });
        
        // Sync to Google Calendar if requested
        if (syncToGoogleCalendar) {
          try {
            // Get property and contact details for location and attendees
            let location = "";
            let attendees: string[] = [];
            
            if (appointmentData.propertyId) {
              const property = await db.getPropertyById(appointmentData.propertyId);
              if (property) {
                location = `${property.street || ""} ${property.houseNumber || ""}, ${property.zipCode || ""} ${property.city || ""}`.trim();
              }
            }
            
            if (appointmentData.contactId) {
              const contact = await db.getContactById(appointmentData.contactId);
              if (contact?.email) {
                attendees.push(contact.email);
              }
            }
            
            // TODO: Implement Google Calendar sync with OAuth
            // const calendarEvent = await createCalendarEvent({
            //   summary: appointmentData.title,
            //   description: appointmentData.description || appointmentData.notes,
            //   location,
            //   start_time: appointmentData.startTime.toISOString(),
            //   end_time: appointmentData.endTime.toISOString(),
            //   attendees,
            //   reminders: [30],
            // }, accessToken);
            
            // For now, skip Google Calendar sync (requires OAuth setup)
            console.log('[Calendar] Google Calendar sync skipped - OAuth not configured');
          } catch (error) {
            console.error("Failed to sync to Google Calendar:", error);
            // Don't fail the whole operation if calendar sync fails
          }
        }
        
        return { success: true, id: appointmentId };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          appointmentType: z.enum(["viewing", "meeting", "phone_call", "other"]).optional(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
          propertyId: z.number().optional(),
          contactId: z.number().optional(),
          status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateAppointment(input.id, input.data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAppointment(input.id);
        return { success: true };
      }),
  }),

  // ============ PROPERTY LINKS ============
  propertyLinks: router({
    getByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPropertyLinksByPropertyId(input.propertyId);
      }),

    create: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        name: z.string(),
        url: z.string(),
        showOnLandingPage: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPropertyLink(input);
        return { id };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().optional(),
        showOnLandingPage: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updatePropertyLink(id, updates);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePropertyLink(input.id);
        return { success: true };
      }),
  }),

  // ============ DOCUMENTS ============
  documents: router({
    getByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByProperty(input.propertyId);
      }),

    getByContact: publicProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByContact(input.contactId);
      }),

    create: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        documentType: z.enum(["contract", "expose", "floorplan", "energy_certificate", "other"]).optional(),
        fileUrl: z.string().optional(),
        nasPath: z.string().optional(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createDocument({
          ...input,
          uploadedBy: 1, // Default user since no authentication
        });
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.id);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.string().optional(),
        showOnLandingPage: z.number().optional(),
        isFloorPlan: z.number().optional(),
        useInExpose: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDocumentMetadata(input);
        return { success: true };
      }),

    // Alias for compatibility
    listByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByProperty(input.propertyId);
      }),
  }),

  // ============ ACTIVITIES ============
  activities: router({
    getByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActivitiesByProperty(input.propertyId);
      }),

    getByContact: publicProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActivitiesByContact(input.contactId);
      }),

    create: publicProcedure
      .input(z.object({
        activityType: z.enum(["note", "email", "call", "meeting", "viewing", "other"]),
        subject: z.string().optional(),
        content: z.string().optional(),
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createActivity({
          ...input,
          createdBy: 1, // Default user since no authentication
        });
        return { success: true };
      }),
  }),

  // ============ BREVO SYNC ============
  brevo: router({
    syncLead: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead) {
          throw new Error("Lead not found");
        }

        const brevo = getBrevoClient();
        
        // Get property title if propertyId exists
        let propertyTitle: string | undefined;
        if (lead.propertyId) {
          const property = await db.getPropertyById(lead.propertyId);
          propertyTitle = property?.title;
        }

        await brevo.syncPropertyLead({
          email: lead.email,
          firstName: lead.firstName ?? undefined,
          lastName: lead.lastName ?? undefined,
          phone: lead.phone ?? undefined,
          message: lead.message ?? undefined,
          propertyTitle,
          source: lead.source ?? undefined,
        });

        return { success: true };
      }),

    syncContact: publicProcedure
      .input(z.object({ contactId: z.number() }))
      .mutation(async ({ input }) => {
        const contact = await db.getContactById(input.contactId);
        if (!contact) {
          throw new Error("Contact not found");
        }

        if (!contact.email) {
          throw new Error("Contact must have an email address for Brevo sync");
        }

        const brevo = getBrevoClient();
        await brevo.syncContact({
          email: contact.email,
          firstName: contact.firstName ?? undefined,
          lastName: contact.lastName ?? undefined,
          phone: contact.phone ?? undefined,
          contactType: contact.contactType ?? undefined,
        });

        return { success: true };
      }),

    getLists: publicProcedure
      .query(async () => {
        const brevo = getBrevoClient();
        const lists = await brevo.getLists();
        return lists;
      }),

    // Send inquiry notification email to admin
    sendInquiryNotification: publicProcedure
      .input(z.object({
        inquiryId: z.number(),
        adminEmail: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        // Get inquiry from inquiries table
        const inquiry = await db.getInquiryById(input.inquiryId);
        if (!inquiry) {
          throw new Error('Inquiry not found');
        }

        // Get property details if propertyId exists
        let propertyTitle: string | undefined;
        let propertyAddress: string | undefined;
        if (inquiry.propertyId) {
          const property = await db.getPropertyById(inquiry.propertyId);
          if (property) {
            propertyTitle = property.title || undefined;
            propertyAddress = property.street && property.city 
              ? `${property.street} ${property.houseNumber || ''}, ${property.zipCode || ''} ${property.city}`.trim()
              : undefined;
          }
        }

        const brevo = getBrevoClient();
        await brevo.sendInquiryNotification({
          adminEmail: input.adminEmail,
          inquiryType: 'property',
          contactName: inquiry.contactName || 'Unbekannt',
          contactEmail: inquiry.contactEmail || '',
          contactPhone: inquiry.contactPhone || undefined,
          message: inquiry.messageText || undefined,
          propertyTitle,
          propertyAddress,
        });

        return { success: true };
      }),

    // Send appointment confirmation email
    sendAppointmentConfirmation: publicProcedure
      .input(z.object({
        contactEmail: z.string().email(),
        contactName: z.string(),
        appointmentDate: z.string(),
        appointmentTime: z.string(),
        propertyId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get property details if propertyId exists
        let propertyTitle: string | undefined;
        let propertyAddress: string | undefined;
        if (input.propertyId) {
          const property = await db.getPropertyById(input.propertyId);
          if (property) {
            propertyTitle = property.title || undefined;
            propertyAddress = property.street && property.city 
              ? `${property.street} ${property.houseNumber || ''}, ${property.zipCode || ''} ${property.city}`.trim()
              : undefined;
          }
        }

        const brevo = getBrevoClient();
        await brevo.sendAppointmentConfirmation({
          contactEmail: input.contactEmail,
          contactName: input.contactName,
          appointmentDate: input.appointmentDate,
          appointmentTime: input.appointmentTime,
          propertyTitle,
          propertyAddress,
          notes: input.notes,
        });

        return { success: true };
      }),

    // Send follow-up email
    sendFollowUpEmail: publicProcedure
      .input(z.object({
        contactEmail: z.string().email(),
        contactName: z.string(),
        subject: z.string(),
        message: z.string(),
        propertyId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get property title if propertyId exists
        let propertyTitle: string | undefined;
        if (input.propertyId) {
          const property = await db.getPropertyById(input.propertyId);
          propertyTitle = property?.title || undefined;
        }

        const brevo = getBrevoClient();
        await brevo.sendFollowUpEmail({
          contactEmail: input.contactEmail,
          contactName: input.contactName,
          subject: input.subject,
          message: input.message,
          propertyTitle,
        });

        return { success: true };
      }),

    // ===== NEW: Contact Sync with Inquiry Types =====
    testConnection: publicProcedure
      .mutation(async () => {
        const { testBrevoConnection } = await import("./brevo");
        const apiKey = process.env.BREVO_API_KEY || "";
        
        if (!apiKey) {
          return { success: false, error: "Brevo API Key nicht konfiguriert" };
        }
        
        return await testBrevoConnection(apiKey);
      }),

    syncContactWithInquiry: publicProcedure
      .input(z.object({
        contactId: z.number(),
        inquiryType: z.enum(["property_inquiry", "owner_inquiry", "insurance", "property_management"]),
        propertyId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { syncContactToBrevo } = await import("./brevo");
        
        const apiKey = process.env.BREVO_API_KEY || "";
        if (!apiKey) {
          return { success: false, error: "Brevo API Key nicht konfiguriert" };
        }
        
        const listId = input.inquiryType === "property_inquiry"
          ? parseInt(process.env.BREVO_PROPERTY_INQUIRY_LIST_ID || "18")
          : parseInt(process.env.BREVO_OWNER_INQUIRY_LIST_ID || "19");
        
        const contact = await db.getContactById(input.contactId);
        if (!contact) {
          return { success: false, error: "Kontakt nicht gefunden" };
        }
        
        const brevoContact = {
          email: contact.email || `contact${contact.id}@placeholder.local`,
          attributes: {
            VORNAME: contact.firstName || "",
            NACHNAME: contact.lastName || "",
            WHATSAPP: contact.mobile || "",
            SMS: contact.phone || "",
            EXT_ID: contact.id.toString(),
            LEAD: [input.inquiryType === "property_inquiry" ? "Immobilienanfrage" : "Eigentümeranfrage"],
          },
          listIds: [listId],
          updateEnabled: true,
        };
        
        const result = await syncContactToBrevo(brevoContact, {
          apiKey,
          listId,
          inquiryType: input.inquiryType,
        });
        
        return result;
      }),

    // Reorder images
    // reorderImages and updateImage moved to properties router
  }),

  // ============ LEADS ============
  leads: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        propertyId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllLeads(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeadById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        propertyId: z.number().optional(),
        source: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string(),
        phone: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Create lead in database
        await db.createLead(input);
        
        // Send email notifications + add to Brevo CRM List 18
        try {
          const { processLead } = await import("./email");
          const property = input.propertyId ? await db.getPropertyById(input.propertyId) : null;
          
          const leadData = {
            firstName: input.firstName || "Unbekannt",
            lastName: input.lastName || "",
            email: input.email,
            phone: input.phone,
            message: input.message,
            propertyTitle: property?.title,
          };
          
          // Complete lead processing: emails + CRM
          await processLead(leadData);
          
          console.log(`✅ Lead processed: ${input.email} added to Brevo List 18`);
        } catch (emailError) {
          console.error("Failed to process lead:", emailError);
          // Don't fail the request if email/CRM processing fails
        }
        
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["new", "contacted", "qualified", "converted", "rejected"]).optional(),
          convertedToContactId: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateLead(input.id, input.data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLead(input.id);
        return { success: true };
      }),
  }),

  // ============ INQUIRIES ============
  inquiries: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        channel: z.string().optional(),
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllInquiries(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInquiryById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        channel: z.enum(["whatsapp", "facebook", "instagram", "telegram", "email", "phone", "form", "other"]),
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        subject: z.string().optional(),
        messageText: z.string().optional(),
        status: z.enum(["new", "in_progress", "replied", "closed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createInquiry(input);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["new", "in_progress", "replied", "closed"]).optional(),
          assignedTo: z.number().optional(),
          contactId: z.number().optional(),
          propertyId: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateInquiry(input.id, input.data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInquiry(input.id);
        return { success: true };
      }),

    // Send reply via Superchat
    sendReply: publicProcedure
      .input(z.object({
        inquiryId: z.number(),
        channelId: z.string(), // Superchat channel ID
        message: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get inquiry details
        const inquiry = await db.getInquiryById(input.inquiryId);
        if (!inquiry) {
          throw new Error('Inquiry not found');
        }

        // Determine recipient identifier
        let recipientIdentifier = '';
        if (inquiry.channel === 'whatsapp' || inquiry.channel === 'telegram') {
          recipientIdentifier = inquiry.contactPhone || '';
        } else if (inquiry.channel === 'email') {
          recipientIdentifier = inquiry.contactEmail || '';
        } else if (inquiry.superchatContactId) {
          recipientIdentifier = inquiry.superchatContactId;
        }

        if (!recipientIdentifier) {
          throw new Error('No recipient identifier found for this inquiry');
        }

        // Send message via Superchat
        const { getSuperchatClient } = await import('./superchatClient');
        const superchat = getSuperchatClient();
        
        const result = await superchat.sendTextMessage({
          to: recipientIdentifier,
          channelId: input.channelId,
          text: input.message,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to send message');
        }

        // Update inquiry status and response tracking
        const now = new Date();
        await db.updateInquiry(input.inquiryId, {
          status: 'replied',
          lastResponseAt: now,
          firstResponseAt: inquiry.firstResponseAt || now,
          responseCount: (inquiry.responseCount || 0) + 1,
        });

        return { success: true, messageId: result.messageId };
      }),
  }),

  // ============ INSURANCES ============
  insurances: router({  list: publicProcedure
      .input(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllInsurances(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInsuranceById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        policyNumber: z.string(),
        insuranceType: z.string(),
        provider: z.string(),
        contactId: z.number().nullable().optional(),
        propertyId: z.number().nullable().optional(),
        startDate: z.date(),
        endDate: z.date().nullable().optional(),
        premium: z.number(),
        paymentInterval: z.string(),
        status: z.enum(["active", "expired", "cancelled"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createInsurance(input);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        policyNumber: z.string().optional(),
        insuranceType: z.string().optional(),
        provider: z.string().optional(),
        contactId: z.number().nullable().optional(),
        propertyId: z.number().nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        premium: z.number().optional(),
        paymentInterval: z.string().optional(),
        status: z.enum(["active", "expired", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateInsurance(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInsurance(input.id);
        return { success: true };
      }),
  }),

  // ============ PROPERTY MANAGEMENT ============
  propertyManagement: router({    listContracts: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return await db.getAllPropertyManagementContracts();
      }),

    createContract: publicProcedure
      .input(z.object({
        contractNumber: z.string(),
        propertyId: z.number().nullable().optional(),
        managerId: z.number().nullable().optional(),
        startDate: z.date(),
        endDate: z.date().nullable().optional(),
        monthlyFee: z.number(),
        services: z.string().optional(),
        status: z.enum(["active", "expired", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.createPropertyManagementContract(input);
        return { success: true };
      }),

    updateContract: publicProcedure
      .input(z.object({
        id: z.number(),
        contractNumber: z.string().optional(),
        propertyId: z.number().nullable().optional(),
        managerId: z.number().nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        monthlyFee: z.number().optional(),
        services: z.string().optional(),
        status: z.enum(["active", "expired", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePropertyManagementContract(id, data);
        return { success: true };
      }),

    deleteContract: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePropertyManagementContract(input.id);
        return { success: true };
      }),

    listMaintenance: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return await db.getAllMaintenanceRecords();
      }),

    createMaintenance: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        date: z.date(),
        description: z.string(),
        cost: z.number(),
        category: z.string(),
        vendor: z.string().optional(),
        status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.createMaintenanceRecord(input);
        return { success: true };
      }),

    updateMaintenance: publicProcedure
      .input(z.object({
        id: z.number(),
        propertyId: z.number().optional(),
        date: z.date().optional(),
        description: z.string().optional(),
        cost: z.number().optional(),
        category: z.string().optional(),
        vendor: z.string().optional(),
        status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMaintenanceRecord(id, data);
        return { success: true };
      }),

    deleteMaintenance: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMaintenanceRecord(input.id);
        return { success: true };
      }),

    listUtilityBills: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return await db.getAllUtilityBills();
      }),

    createUtilityBill: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        year: z.number(),
        month: z.number(),
        type: z.string(),
        amount: z.number(),
        paidBy: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue"]),
      }))
      .mutation(async ({ input }) => {
        await db.createUtilityBill(input);
        return { success: true };
      }),

    updateUtilityBill: publicProcedure
      .input(z.object({
        id: z.number(),
        propertyId: z.number().optional(),
        year: z.number().optional(),
        month: z.number().optional(),
        type: z.string().optional(),
        amount: z.number().optional(),
        paidBy: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateUtilityBill(id, data);
        return { success: true };
      }),

    deleteUtilityBill: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUtilityBill(input.id);
        return { success: true };
      }),
  }),

  // ============ IMMOSCOUT24 ============
  is24: router({
    testConnection: publicProcedure
      .mutation(async () => {
        const { testIS24Connection } = await import("./is24");
        return await testIS24Connection();
      }),

    publishProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const { publishPropertyToIS24 } = await import("./is24");
        return await publishPropertyToIS24(input.propertyId);
      }),

    updateProperty: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        is24ExternalId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { updatePropertyOnIS24 } = await import("./is24");
        return await updatePropertyOnIS24(input.propertyId, input.is24ExternalId);
      }),

    unpublishProperty: publicProcedure
      .input(z.object({ is24ExternalId: z.string() }))
      .mutation(async ({ input }) => {
        const { unpublishPropertyFromIS24 } = await import("./is24");
        return await unpublishPropertyFromIS24(input.is24ExternalId);
      }),

    syncProperty: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        is24ExternalId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { syncPropertyToIS24 } = await import("./is24");
        return await syncPropertyToIS24(input.propertyId, input.is24ExternalId);
      }),

    getStatus: publicProcedure
      .input(z.object({ is24ExternalId: z.string() }))
      .query(async ({ input }) => {
        const { getIS24PropertyStatus } = await import("./is24");
        return await getIS24PropertyStatus(input.is24ExternalId);
      }),

    uploadImages: publicProcedure
      .input(z.object({
        is24ExternalId: z.string(),
        imageUrls: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { uploadImagesToIS24 } = await import("./is24");
        return await uploadImagesToIS24(input.is24ExternalId, input.imageUrls);
      }),
   }),

  // ============ PROPERTY LINKS ============
  propertyLinks: router({
    getByProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPropertyLinksByProperty(input.propertyId);
      }),

    create: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        name: z.string(),
        url: z.string(),
        showOnLandingPage: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPropertyLink(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().optional(),
        showOnLandingPage: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updatePropertyLink(input.id, input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePropertyLink(input.id);
      }),
  }),

    // ============ DASHBOARD ============
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),
  
  // ============ TEMPLATE RENDERING ============
  templates: router({
    // Get available templates
    list: publicProcedure
      .query(async () => {
        const { getAvailableTemplates } = await import('./templateRenderer');
        return getAvailableTemplates();
      }),
    
    // Get default template from settings
    getDefault: publicProcedure
      .query(async () => {
        const { getDefaultTemplate } = await import('./templateRenderer');
        return await getDefaultTemplate();
      }),
    
    // Render property landing page with template
    renderLandingPage: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        template: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { renderPropertyLandingPage, getDefaultTemplate } = await import('./templateRenderer');
        const template = input.template || await getDefaultTemplate();
        const html = await renderPropertyLandingPage(input.propertyId, template);
        return { html, template };
      }),
  }),
  
  // ============ PDF GENERATION ============
  pdf: router({
    // Generate Exposé PDF
    generateExpose: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateExpose } = await import('./pdfGenerator');
        const pdfBuffer = await generateExpose(input.propertyId);
        // Return base64 encoded PDF
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `expose_${input.propertyId}.pdf`,
        };
      }),
    
    // Generate One-Pager PDF
    generateOnePager: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateOnePager } = await import('./pdfGenerator');
        const pdfBuffer = await generateOnePager(input.propertyId);
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `onepager_${input.propertyId}.pdf`,
        };
      }),
    
    // Generate Invoice PDF
    generateInvoice: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        recipientType: z.enum(['buyer', 'seller']),
        invoiceNumber: z.string(),
        recipientName: z.string(),
        recipientAddress: z.string(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        subtotal: z.number(),
        tax: z.number(),
        total: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { generateInvoice } = await import('./pdfGenerator');
        const { propertyId, recipientType, ...invoiceData } = input;
        const pdfBuffer = await generateInvoice(
          propertyId,
          recipientType,
          {
            ...invoiceData,
            date: new Date().toLocaleDateString('de-DE'),
          }
        );
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `rechnung_${recipientType}_${propertyId}.pdf`,
        };
      }),
    
    // Generate Maklervertrag PDF
    generateMaklervertrag: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        ownerId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { generateMaklervertrag } = await import('./pdfGenerator');
        const pdfBuffer = await generateMaklervertrag(input.propertyId, input.ownerId);
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `maklervertrag_${input.propertyId}.pdf`,
        };
      }),
  }),
  
  // Note: Brevo router already exists above (line 1546)
  // New endpoints for Immobilienanfragen/Eigentümeranfragen will be added there
});
export type AppRouter = typeof appRouter;
