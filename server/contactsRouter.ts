import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import * as db from "./db";

/**
 * Contacts Router - Comprehensive contact management
 * Supports multi-module assignment, Google Contacts sync, Brevo CRM integration
 */
export const contactsRouter = router({
  /**
   * List all contacts with optional filters
   */
  list: publicProcedure
    .input(z.object({
      // Module filters
      moduleImmobilienmakler: z.boolean().optional(),
      moduleVersicherungen: z.boolean().optional(),
      moduleHausverwaltung: z.boolean().optional(),
      // Type & Category filters
      contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]).optional(),
      contactCategory: z.string().optional(),
      // Search
      searchTerm: z.string().optional(),
      // Status filters
      archived: z.boolean().optional(),
      // Pagination
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getAllContacts(input);
    }),

  /**
   * Get contact by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getContactById(input.id);
    }),

  /**
   * Create new contact
   */
  create: publicProcedure
    .input(z.object({
      // Module assignment
      moduleImmobilienmakler: z.boolean().optional(),
      moduleVersicherungen: z.boolean().optional(),
      moduleHausverwaltung: z.boolean().optional(),
      // Type & Category
      contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]).optional(),
      contactCategory: z.string().optional(),
      type: z.enum(["person", "company"]).optional(),
      // Stammdaten
      salutation: z.enum(["herr", "frau", "divers"]).optional(),
      title: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      language: z.string().optional(),
      age: z.number().optional(),
      birthDate: z.string().optional(),
      birthPlace: z.string().optional(),
      birthCountry: z.string().optional(),
      idType: z.string().optional(),
      idNumber: z.string().optional(),
      issuingAuthority: z.string().optional(),
      taxId: z.string().optional(),
      nationality: z.string().optional(),
      // Contact details
      email: z.string().optional(),
      alternativeEmail: z.string().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      fax: z.string().optional(),
      website: z.string().optional(),
      // Address
      street: z.string().optional(),
      houseNumber: z.string().optional(),
      zipCode: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      // Company
      companyName: z.string().optional(),
      position: z.string().optional(),
      companyStreet: z.string().optional(),
      companyHouseNumber: z.string().optional(),
      companyZipCode: z.string().optional(),
      companyCity: z.string().optional(),
      companyCountry: z.string().optional(),
      companyWebsite: z.string().optional(),
      companyPhone: z.string().optional(),
      companyMobile: z.string().optional(),
      companyFax: z.string().optional(),
      isBusinessContact: z.boolean().optional(),
      // Merkmale
      advisor: z.string().optional(),
      coAdvisor: z.string().optional(),
      followUpDate: z.string().optional(),
      source: z.string().optional(),
      status: z.string().optional(),
      tags: z.string().optional(),
      archived: z.boolean().optional(),
      notes: z.string().optional(),
      availability: z.string().optional(),
      // Verrechnung
      blockContact: z.boolean().optional(),
      sharedWithTeams: z.string().optional(),
      sharedWithUsers: z.string().optional(),
      // DSGVO
      dsgvoStatus: z.string().optional(),
      dsgvoConsentGranted: z.boolean().optional(),
      dsgvoDeleteBy: z.string().optional(),
      dsgvoDeleteReason: z.string().optional(),
      newsletterConsent: z.boolean().optional(),
      propertyMailingConsent: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const contactId = await db.createContact(input);
      
      // Auto-sync to Google Contacts if enabled
      // TODO: Implement Google Contacts sync
      
      // Auto-sync to Brevo if enabled
      // TODO: Implement Brevo sync
      
      return { id: contactId, success: true };
    }),

  /**
   * Update existing contact
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        // Module assignment
        moduleImmobilienmakler: z.boolean().optional(),
        moduleVersicherungen: z.boolean().optional(),
        moduleHausverwaltung: z.boolean().optional(),
        // Type & Category
        contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]).optional(),
        contactCategory: z.string().optional(),
        type: z.enum(["person", "company"]).optional(),
        // Stammdaten
        salutation: z.enum(["herr", "frau", "divers"]).optional(),
        title: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        language: z.string().optional(),
        age: z.number().optional(),
        birthDate: z.string().optional(),
        birthPlace: z.string().optional(),
        birthCountry: z.string().optional(),
        idType: z.string().optional(),
        idNumber: z.string().optional(),
        issuingAuthority: z.string().optional(),
        taxId: z.string().optional(),
        nationality: z.string().optional(),
        // Contact details
        email: z.string().optional(),
        alternativeEmail: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        fax: z.string().optional(),
        website: z.string().optional(),
        // Address
        street: z.string().optional(),
        houseNumber: z.string().optional(),
        zipCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        // Company
        companyName: z.string().optional(),
        position: z.string().optional(),
        companyStreet: z.string().optional(),
        companyHouseNumber: z.string().optional(),
        companyZipCode: z.string().optional(),
        companyCity: z.string().optional(),
        companyCountry: z.string().optional(),
        companyWebsite: z.string().optional(),
        companyPhone: z.string().optional(),
        companyMobile: z.string().optional(),
        companyFax: z.string().optional(),
        isBusinessContact: z.boolean().optional(),
        // Merkmale
        advisor: z.string().optional(),
        coAdvisor: z.string().optional(),
        followUpDate: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        tags: z.string().optional(),
        archived: z.boolean().optional(),
        notes: z.string().optional(),
        availability: z.string().optional(),
        // Verrechnung
        blockContact: z.boolean().optional(),
        sharedWithTeams: z.string().optional(),
        sharedWithUsers: z.string().optional(),
        // DSGVO
        dsgvoStatus: z.string().optional(),
        dsgvoConsentGranted: z.boolean().optional(),
        dsgvoDeleteBy: z.string().optional(),
        dsgvoDeleteReason: z.string().optional(),
        newsletterConsent: z.boolean().optional(),
        propertyMailingConsent: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateContact(input.id, input.data);
      
      // Auto-sync to Google Contacts if enabled
      // TODO: Implement Google Contacts sync
      
      // Auto-sync to Brevo if enabled
      // TODO: Implement Brevo sync
      
      return { success: true };
    }),

  /**
   * Delete contact
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteContact(input.id);
      return { success: true };
    }),

  /**
   * Sync contact to Google Contacts
   */
  syncToGoogle: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: Implement Google Contacts sync
      return { success: true, message: "Google Contacts sync not yet implemented" };
    }),

  /**
   * Sync contact to Brevo CRM
   */
  syncToBrevo: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: Implement Brevo sync
      return { success: true, message: "Brevo sync not yet implemented" };
    }),

  /**
   * Get contact categories by type
   */
  getCategories: publicProcedure
    .input(z.object({ contactType: z.enum(["kunde", "partner", "dienstleister", "sonstiges"]) }))
    .query(async ({ input }) => {
      const categories: Record<string, string[]> = {
        kunde: [
          "Eigentümer",
          "Eigentümer Lead",
          "Kapitalanleger",
          "Kaufinteressent",
          "Käufer",
          "Mieter",
          "Mietinteressent",
          "Verkäufer",
          "Vermieter",
        ],
        partner: [
          "Finanzierung",
          "Kooperation",
          "Makler",
          "Notar",
          "Rechtsanwalt",
          "Tippgeber",
        ],
        dienstleister: [
          "Architekt",
          "Bauträger",
          "Fotograf",
          "Handwerker",
          "Hausverwaltung",
          "IT-Branche",
          "Eigennutzer",
        ],
        sonstiges: [],
      };
      
      return categories[input.contactType] || [];
    }),
});
