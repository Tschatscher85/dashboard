import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

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
        return await db.getPropertyById(input.id);
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
        status: z.enum(["available", "reserved", "sold", "rented", "inactive"]).optional(),
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
        condition: z.enum(["new", "renovated", "good", "needs_renovation", "demolished"]).optional(),
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
          status: z.enum(["available", "reserved", "sold", "rented", "inactive"]).optional(),
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
          condition: z.enum(["new", "renovated", "good", "needs_renovation", "demolished"]).optional(),
          availableFrom: z.date().optional(),
          landingPageSlug: z.string().optional(),
          landingPagePublished: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateProperty(input.id, input.data);
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
        await db.createContact({
          ...input,
          createdBy: ctx.user.id,
        });
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
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createAppointment({
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

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
