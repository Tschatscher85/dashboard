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
        status: z.enum(["acquisition", "preparation", "marketing", "reserved", "sold", "rented", "inactive"]).optional(),
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
          status: z.enum(["acquisition", "preparation", "marketing", "reserved", "sold", "rented", "inactive"]).optional(),
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

    generateDescription: protectedProcedure
      .input(z.object({
        propertyData: z.any(),
        creativity: z.number().min(0).max(1).default(0.7),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        // Build property details string from data
        const p = input.propertyData;
        const details: string[] = [];
        
        if (p.marketingType) details.push(`${p.marketingType}`);
        if (p.propertyType) details.push(`${p.propertyType}`);
        if (p.rooms) details.push(`${p.rooms} Zimmer`);
        if (p.bedrooms) details.push(`${p.bedrooms} Schlafzimmer`);
        if (p.bathrooms) details.push(`${p.bathrooms} Bäder`);
        if (p.livingArea) details.push(`${p.livingArea} m²`);
        if (p.plotArea) details.push(`Grundstück ${p.plotArea} m²`);
        if (p.gardenArea) details.push(`Gartenfläche ${p.gardenArea} m²`);
        if (p.floor) details.push(`${p.floor} Etagen`);
        if (p.yearBuilt) details.push(`letzte Modernisierung ${p.yearBuilt}`);
        if (p.condition) details.push(p.condition);
        if (p.equipmentQuality) details.push(`Ausstattung ${p.equipmentQuality}`);
        
        // Flooring
        if (p.flooringTypes) {
          const floors = p.flooringTypes.split(',').filter(Boolean);
          if (floors.length > 0) details.push(`Bodenbelag ${floors.join(', ')}`);
        }
        
        // Parking
        if (p.parkingType) details.push(p.parkingType);
        if (p.parkingCount) details.push(`${p.parkingCount} Parkplätze`);
        
        // Features
        const features: string[] = [];
        if (p.hasBalcony) features.push('Balkon');
        if (p.hasTerrace) features.push('Terrasse');
        if (p.hasGarden) features.push('Garten');
        if (p.hasElevator) features.push('Aufzug');
        if (p.hasBasement) features.push('Keller');
        if (p.hasAttic) features.push('Abstellraum');
        if (p.hasGuestToilet) features.push('Gäste-WC');
        if (p.hasBuiltInKitchen) features.push('Einbauküche');
        
        // Bathroom features
        if (p.bathroomFeatures) {
          const bathFeatures = p.bathroomFeatures.split(',').filter(Boolean);
          features.push(...bathFeatures);
        }
        
        // Heating
        if (p.heatingType) features.push(p.heatingType);
        
        if (features.length > 0) details.push(features.join(', '));
        
        const prompt = `Erstelle eine professionelle Objektbeschreibung für eine Immobilienanzeige mit folgenden Details: ${details.join(', ')}. Die Beschreibung soll ansprechend und verkaufsfördernd sein.`;
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Du bist ein professioneller Immobilienmakler, der ansprechende Objektbeschreibungen erstellt." },
            { role: "user", content: prompt },
          ],
        });
        
        const content = response.choices[0].message.content;
        const description = typeof content === 'string' ? content : '';
        
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
