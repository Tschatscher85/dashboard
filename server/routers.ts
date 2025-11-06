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
        const { generateText } = await import("./_core/openai");
        
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

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
