import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { generateExpose } from "./exposeGenerator";
import { getBrevoClient } from "./brevoClient";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "./googleCalendar";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USERS ============
  users: router({
    list: protectedProcedure
      .query(async () => {
        return await db.getAllUsers();
      }),

    create: protectedProcedure
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Prevent deleting yourself
        if (input.id === ctx.user.id) {
          throw new Error("Sie können sich nicht selbst löschen");
        }
        
        await db.deleteUser(input.id);
        return { success: true };
      }),
  }),

  // ============ SETTINGS ============
  settings: router({
    getApiKeys: protectedProcedure
      .query(async () => {
        // In production, these should be stored in a secure settings table
        // For now, we return empty strings as placeholders
        return {
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
          propertySync: process.env.PROPERTY_SYNC_API_KEY || "",
          openai: process.env.OPENAI_API_KEY || "",
          // ImmoScout24 API
          is24ConsumerKey: process.env.IS24_CONSUMER_KEY || "",
          is24ConsumerSecret: process.env.IS24_CONSUMER_SECRET || "",
          is24AccessToken: process.env.IS24_ACCESS_TOKEN || "",
          is24AccessTokenSecret: process.env.IS24_ACCESS_TOKEN_SECRET || "",
          is24UseSandbox: process.env.IS24_USE_SANDBOX === "true" || false,
          // WebDAV (primary)
          webdavUrl: process.env.WEBDAV_URL || process.env.NAS_WEBDAV_URL || "https://ugreen.tschatscher.eu:2002",
          webdavPort: process.env.WEBDAV_PORT || "2002",
          webdavUsername: process.env.WEBDAV_USERNAME || process.env.NAS_USERNAME || "tschatscher",
          webdavPassword: process.env.WEBDAV_PASSWORD || process.env.NAS_PASSWORD || "",
          // FTP (fallback)
          ftpHost: process.env.FTP_HOST || "ftp.tschatscher.eu",
          ftpPort: process.env.FTP_PORT || "21",
          ftpUsername: process.env.FTP_USERNAME || process.env.NAS_USERNAME || "tschatscher",
          ftpPassword: process.env.FTP_PASSWORD || process.env.NAS_PASSWORD || "",
          ftpSecure: process.env.FTP_SECURE === "true" || false,
          // Shared
          nasBasePath: process.env.NAS_BASE_PATH || "/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf",
          // Legacy fields (for backward compatibility)
          nasProtocol: process.env.NAS_PROTOCOL || "webdav",
          nasUrl: process.env.NAS_WEBDAV_URL || "https://ugreen.tschatscher.eu:2002",
          nasPort: process.env.NAS_PORT || "2002",
          nasUsername: process.env.NAS_USERNAME || "tschatscher",
          nasPassword: process.env.NAS_PASSWORD || "",
        };
      }),

    saveApiKeys: protectedProcedure
      .input(z.object({
        superchat: z.string().optional(),
        brevo: z.string().optional(),
        brevoPropertyInquiryListId: z.string().optional(),
        brevoOwnerInquiryListId: z.string().optional(),
        brevoInsuranceListId: z.string().optional(),
        brevoPropertyManagementListId: z.string().optional(),
        brevoAutoSync: z.string().optional(),
        brevoDefaultInquiryType: z.string().optional(),
        googleClientId: z.string().optional(),
        googleClientSecret: z.string().optional(),
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
        // Shared
        nasBasePath: z.string().optional(),
        // Legacy (for backward compatibility)
        nasProtocol: z.enum(["webdav", "ftp", "ftps"]).optional(),
        nasUrl: z.string().optional(),
        nasPort: z.string().optional(),
        nasUsername: z.string().optional(),
        nasPassword: z.string().optional(),
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
        
        // Save shared settings
        if (input.nasBasePath) process.env.NAS_BASE_PATH = input.nasBasePath;
        
        // Legacy support (for backward compatibility)
        if (input.nasProtocol) process.env.NAS_PROTOCOL = input.nasProtocol;
        if (input.nasUrl) process.env.NAS_WEBDAV_URL = input.nasUrl;
        if (input.nasPort) process.env.NAS_PORT = input.nasPort;
        if (input.nasUsername) process.env.NAS_USERNAME = input.nasUsername;
        if (input.nasPassword) process.env.NAS_PASSWORD = input.nasPassword;
        
        console.log('[Settings] NAS configuration updated:', {
          webdav: input.webdavUrl ? '***' : '(not set)',
          ftp: input.ftpHost ? '***' : '(not set)',
          basePath: input.nasBasePath || process.env.NAS_BASE_PATH,
        });
        
        return { success: true };
      }),
  }),

  // ============ PROPERTIES ============
  properties: router({
    list: protectedProcedure
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

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        propertyType: z.enum(["apartment", "house", "commercial", "land", "parking", "other"]),
        marketingType: z.enum(["sale", "rent", "lease"]),
        status: z.enum(["acquisition", "preparation", "marketing", "negotiation", "reserved", "sold", "rented", "inactive"]).optional(),
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
        await db.createProperty({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          propertyType: z.enum(["apartment", "house", "commercial", "land", "parking", "other"]).optional(),
          marketingType: z.enum(["sale", "rent", "lease"]).optional(),
          status: z.enum(["acquisition", "preparation", "marketing", "negotiation", "reserved", "sold", "rented", "inactive"]).optional(),
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
          availableFrom: z.union([z.string(), z.date()]).optional(),
          landingPageSlug: z.string().optional(),
          landingPagePublished: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Convert string dates to Date objects before saving
        const processedData: any = { ...input.data };
        if (input.data.availableFrom && typeof input.data.availableFrom === 'string') {
          processedData.availableFrom = new Date(input.data.availableFrom);
        }
        await db.updateProperty(input.id, processedData);
        return { success: true };
      }),

    delete: protectedProcedure
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

    addImage: protectedProcedure
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

      deleteImage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePropertyImage(input.id);
        return { success: true };
      }),

    uploadToNAS: protectedProcedure
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
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        
        // Get property to build folder name
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new Error("Property not found");
        }
        
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        
        // Get NAS configuration (new separate WebDAV and FTP configs)
        const webdavUrl = process.env.WEBDAV_URL || "";
        const webdavPort = process.env.WEBDAV_PORT || "2002";
        const webdavUsername = process.env.WEBDAV_USERNAME || "";
        const webdavPassword = process.env.WEBDAV_PASSWORD || "";
        
        const ftpHost = process.env.FTP_HOST || "";
        const ftpPort = process.env.FTP_PORT || "21";
        const ftpUsername = process.env.FTP_USERNAME || "";
        const ftpPassword = process.env.FTP_PASSWORD || "";
        
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
                url = `/nas/${propertyFolderName}/${input.category}/${input.fileName}`;
                uploadSuccess = true;
                console.log('[Upload] ✅ WebDAV upload successful');
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
                url = `/nas/${propertyFolderName}/${input.category}/${input.fileName}`;
                uploadSuccess = true;
                console.log('[Upload] ✅ FTP upload successful');
              } else {
                console.log('[Upload] FTP connection failed');
              }
            } catch (ftpError: any) {
              console.log('[Upload] FTP error:', ftpError.message);
            }
          }
          
          // If both NAS methods failed, throw error to trigger S3 fallback
          if (!uploadSuccess) {
            throw new Error('Both WebDAV and FTP failed');
          }
        } catch (error: any) {
          console.error('[Upload] NAS upload failed, using S3 fallback');
          console.error('[Upload] Error details:', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          });
          usedFallback = true;
          
          // Fallback: Save to S3
          const s3Key = `properties/${input.propertyId}/${input.category}/${Date.now()}-${input.fileName}`;
          const s3Result = await storagePut(
            s3Key,
            fileBuffer,
            input.mimeType || 'application/octet-stream'
          );
          
          nasPath = s3Key;
          url = s3Result.url;
        }
        
        // If category is "Bilder" AND we used S3 fallback, save to database
        // (NAS files are listed directly from NAS, no database entry needed)
        if (input.category === "Bilder" && usedFallback) {
          await db.createPropertyImage({
            propertyId: input.propertyId,
            imageUrl: url,
            nasPath,
            title: input.fileName,
            imageType: input.imageType || "sonstiges",
          });
          console.log('[Upload] Created database entry for Cloud image with imageType:', input.imageType || "sonstiges");
        } else if (input.category === "Bilder") {
          console.log('[Upload] NAS upload - no database entry needed (files listed from NAS)');
        }
        
        return { 
          success: true, 
          nasPath,
          url,
          usedFallback,
          message: usedFallback 
            ? 'Datei wurde in Cloud gespeichert (NAS nicht erreichbar)' 
            : 'Datei erfolgreich zum NAS hochgeladen'
        };
      }),

    listNASFiles: protectedProcedure
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

    deleteFromNAS: protectedProcedure
      .input(z.object({
        nasPath: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { deleteFile } = await import("./lib/webdav-client");
        
        await deleteFile(input.nasPath);
        
        return { success: true };
      }),

    testNASConnection: protectedProcedure
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

    testWebDAVConnection: protectedProcedure
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

    testFTPConnection: protectedProcedure
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

    generateDescription: protectedProcedure
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

    generateExpose: protectedProcedure
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
    exportForHomepage: protectedProcedure
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
    syncToHomepage: protectedProcedure
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
          status: z.enum(["acquisition", "preparation", "marketing", "negotiation", "reserved", "sold", "rented", "inactive"]).optional(),
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
  }),

  // ============ CONTACTS ============
  contacts: router({
    list: protectedProcedure
      .input(z.object({
        contactType: z.string().optional(),
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllContacts(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        contactType: z.enum(["buyer", "seller", "tenant", "landlord", "interested", "other"]),
        salutation: z.enum(["mr", "ms", "diverse"]).optional(),
        firstName: z.string().optional(),
        lastName: z.string(),
        company: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        street: z.string().optional(),
        houseNumber: z.string().optional(),
        zipCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const contactId = await db.createContact({
          ...input,
          createdBy: ctx.user.id,
        });
        
        // Auto-sync to Brevo if enabled
        const autoSyncEnabled = process.env.BREVO_AUTO_SYNC === "true";
        if (autoSyncEnabled && input.email) {
          try {
            const { syncContactToBrevo } = await import("./brevo");
            const apiKey = process.env.BREVO_API_KEY || "";
            const defaultInquiryType = (process.env.BREVO_DEFAULT_INQUIRY_TYPE || "property_inquiry") as "property_inquiry" | "owner_inquiry" | "insurance" | "property_management";
            
            // Get list ID based on inquiry type
            let listId: number;
            switch (defaultInquiryType) {
              case "property_inquiry":
                listId = parseInt(process.env.BREVO_PROPERTY_INQUIRY_LIST_ID || "18");
                break;
              case "owner_inquiry":
                listId = parseInt(process.env.BREVO_OWNER_INQUIRY_LIST_ID || "19");
                break;
              case "insurance":
                listId = parseInt(process.env.BREVO_INSURANCE_LIST_ID || "20");
                break;
              case "property_management":
                listId = parseInt(process.env.BREVO_PROPERTY_MANAGEMENT_LIST_ID || "21");
                break;
              default:
                listId = 18;
            }
            
            const brevoContact = {
              email: input.email,
              attributes: {
                VORNAME: input.firstName || "",
                NACHNAME: input.lastName || "",
                WHATSAPP: input.mobile || "",
                SMS: input.phone || "",
                EXT_ID: contactId.toString(),
                LEAD: [defaultInquiryType === "property_inquiry" ? "Immobilienanfrage" : 
                       defaultInquiryType === "owner_inquiry" ? "Eigentümeranfrage" :
                       defaultInquiryType === "insurance" ? "Versicherung" : "Hausverwaltung"],
              },
              listIds: [listId],
              updateEnabled: true,
            };
            
            await syncContactToBrevo(brevoContact, {
              apiKey,
              listId,
              inquiryType: defaultInquiryType,
            });
            
            console.log(`[Brevo] Auto-synced contact ${contactId} to list ${listId}`);
          } catch (error) {
            console.error(`[Brevo] Auto-sync failed for contact ${contactId}:`, error);
            // Don't fail the contact creation if Brevo sync fails
          }
        }
        
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          contactType: z.enum(["buyer", "seller", "tenant", "landlord", "interested", "other"]).optional(),
          salutation: z.enum(["mr", "ms", "diverse"]).optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          company: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          mobile: z.string().optional(),
          street: z.string().optional(),
          houseNumber: z.string().optional(),
          zipCode: z.string().optional(),
          city: z.string().optional(),
          country: z.string().optional(),
          notes: z.string().optional(),
          source: z.string().optional(),
          tags: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateContact(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContact(input.id);
        return { success: true };
      }),
  }),

  // ============ APPOINTMENTS ============
  appointments: router({
    list: protectedProcedure
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

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAppointmentById(input.id);
      }),

    create: protectedProcedure
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
          createdBy: ctx.user.id,
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
            
            const calendarEvent = await createCalendarEvent({
              summary: appointmentData.title,
              description: appointmentData.description || appointmentData.notes,
              location,
              start_time: appointmentData.startTime.toISOString(),
              end_time: appointmentData.endTime.toISOString(),
              attendees,
              reminders: [30], // 30 minutes before
            });
            
            // Update appointment with Google Calendar event ID
            await db.updateAppointment(appointmentId, {
              googleCalendarEventId: calendarEvent.event_id,
              googleCalendarLink: calendarEvent.html_link,
              lastSyncedToGoogleCalendar: new Date(),
            });
          } catch (error) {
            console.error("Failed to sync to Google Calendar:", error);
            // Don't fail the whole operation if calendar sync fails
          }
        }
        
        return { success: true, id: appointmentId };
      }),

    update: protectedProcedure
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAppointment(input.id);
        return { success: true };
      }),
  }),

  // ============ DOCUMENTS ============
  documents: router({
    getByProperty: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByProperty(input.propertyId);
      }),

    getByContact: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByContact(input.contactId);
      }),

    create: protectedProcedure
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
          uploadedBy: ctx.user.id,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  // ============ ACTIVITIES ============
  activities: router({
    getByProperty: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActivitiesByProperty(input.propertyId);
      }),

    getByContact: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActivitiesByContact(input.contactId);
      }),

    create: protectedProcedure
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
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ============ BREVO SYNC ============
  brevo: router({
    syncLead: protectedProcedure
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

    syncContact: protectedProcedure
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

    getLists: protectedProcedure
      .query(async () => {
        const brevo = getBrevoClient();
        const lists = await brevo.getLists();
        return lists;
      }),

    // Send inquiry notification email to admin
    sendInquiryNotification: protectedProcedure
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
    sendAppointmentConfirmation: protectedProcedure
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
    sendFollowUpEmail: protectedProcedure
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
    testConnection: protectedProcedure
      .mutation(async () => {
        const { testBrevoConnection } = await import("./brevo");
        const apiKey = process.env.BREVO_API_KEY || "";
        
        if (!apiKey) {
          return { success: false, error: "Brevo API Key nicht konfiguriert" };
        }
        
        return await testBrevoConnection(apiKey);
      }),

    syncContactWithInquiry: protectedProcedure
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
  }),

  // ============ LEADS ============
  leads: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        propertyId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllLeads(input);
      }),

    getById: protectedProcedure
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
        await db.createLead(input);
        return { success: true };
      }),

    update: protectedProcedure
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLead(input.id);
        return { success: true };
      }),
  }),

  // ============ INQUIRIES ============
  inquiries: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        channel: z.string().optional(),
        propertyId: z.number().optional(),
        contactId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllInquiries(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInquiryById(input.id);
      }),

    create: protectedProcedure
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

    update: protectedProcedure
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInquiry(input.id);
        return { success: true };
      }),

    // Send reply via Superchat
    sendReply: protectedProcedure
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
  insurances: router({  list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllInsurances(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInsuranceById(input.id);
      }),

    create: protectedProcedure
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

    update: protectedProcedure
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInsurance(input.id);
        return { success: true };
      }),
  }),

  // ============ PROPERTY MANAGEMENT ============
  propertyManagement: router({    listContracts: protectedProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return await db.getAllPropertyManagementContracts();
      }),

    createContract: protectedProcedure
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

    updateContract: protectedProcedure
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

    deleteContract: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePropertyManagementContract(input.id);
        return { success: true };
      }),

    listMaintenance: protectedProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return await db.getAllMaintenanceRecords();
      }),

    createMaintenance: protectedProcedure
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

    updateMaintenance: protectedProcedure
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

    deleteMaintenance: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMaintenanceRecord(input.id);
        return { success: true };
      }),

    listUtilityBills: protectedProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return await db.getAllUtilityBills();
      }),

    createUtilityBill: protectedProcedure
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

    updateUtilityBill: protectedProcedure
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

    deleteUtilityBill: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUtilityBill(input.id);
        return { success: true };
      }),
  }),

  // ============ IMMOSCOUT24 ============
  is24: router({
    testConnection: protectedProcedure
      .mutation(async () => {
        const { testIS24Connection } = await import("./is24");
        return await testIS24Connection();
      }),

    publishProperty: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ input }) => {
        const { publishPropertyToIS24 } = await import("./is24");
        return await publishPropertyToIS24(input.propertyId);
      }),

    updateProperty: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        is24ExternalId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { updatePropertyOnIS24 } = await import("./is24");
        return await updatePropertyOnIS24(input.propertyId, input.is24ExternalId);
      }),

    unpublishProperty: protectedProcedure
      .input(z.object({ is24ExternalId: z.string() }))
      .mutation(async ({ input }) => {
        const { unpublishPropertyFromIS24 } = await import("./is24");
        return await unpublishPropertyFromIS24(input.is24ExternalId);
      }),

    syncProperty: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        is24ExternalId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { syncPropertyToIS24 } = await import("./is24");
        return await syncPropertyToIS24(input.propertyId, input.is24ExternalId);
      }),

    getStatus: protectedProcedure
      .input(z.object({ is24ExternalId: z.string() }))
      .query(async ({ input }) => {
        const { getIS24PropertyStatus } = await import("./is24");
        return await getIS24PropertyStatus(input.is24ExternalId);
      }),

    uploadImages: protectedProcedure
      .input(z.object({
        is24ExternalId: z.string(),
        imageUrls: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { uploadImagesToIS24 } = await import("./is24");
        return await uploadImagesToIS24(input.is24ExternalId, input.imageUrls);
      }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),

  // Note: Brevo router already exists above (line 1546)
  // New endpoints for Immobilienanfragen/Eigentümeranfragen will be added there
});

export type AppRouter = typeof appRouter;
