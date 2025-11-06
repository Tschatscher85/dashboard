# Immobilien-Verwaltungsplattform TODO

## Core Features

### Database Schema & Models
- [x] Immobilien/Properties table (address, type, size, price, status, etc.)
- [x] Contacts/Customers table (name, email, phone, type: buyer/seller/tenant)
- [x] Documents table (reference to NAS paths, property links)
- [x] Appointments/Viewings table (scheduling system)
- [x] Notes/Activities table (interaction history)

### Backend API (tRPC Procedures)
- [x] Property CRUD operations
- [x] Contact/Customer CRUD operations
- [x] Document management procedures
- [x] Appointment scheduling procedures
- [x] Search and filter procedures

### Admin Dashboard
- [x] Dashboard layout with sidebar navigation
- [x] Property management interface (list, create, edit, delete)
- [x] Contact/Customer management interface
- [ ] Appointment calendar view
- [ ] Document browser with NAS integration
- [x] Quick stats overview (total properties, active listings, etc.)
- [x] Lead management interface

### Brevo CRM Integration
- [x] Brevo API client setup
- [x] Contact synchronization to Brevo
- [x] Lead synchronization to Brevo (Immobilienanfrage list)
- [ ] Webhook handler for Brevo updates
- [x] Manual sync trigger in admin panel

### Public Frontend
- [ ] Public property listings page
- [ ] Property detail page with image gallery
- [ ] Contact form for inquiries
- [ ] Property search and filters
- [ ] Responsive design for mobile

### NAS Integration
- [ ] NAS connection configuration (SMB/WebDAV/SFTP)
- [ ] Document upload interface
- [ ] Image gallery from NAS
- [ ] File browser component

### Deployment & Documentation
- [ ] Environment variables documentation
- [ ] VM deployment guide
- [ ] Brevo API key setup instructions
- [ ] NAS connection setup guide
- [ ] Database migration guide

### Exposé & Landing Page Generation
- [x] Exposé template system (multiple designs)
- [x] PDF exposé generator with property data
- [x] Image gallery integration in exposés
- [x] Landing page builder for individual properties
- [x] Landing page templates (modern, classic, luxury)
- [ ] SEO metadata for landing pages
- [x] Public URL generation for property landing pages
- [x] Preview function for exposés and landing pages

### Propstack-Inspired Property Detail View
- [x] Property detail page with tabbed interface (Details, Aktivitäten, Medien, Historie)
- [ ] Contact linking with roles (Eigentümer, Käufer, Notar, Hausverwaltung, Mieter)
- [ ] Activity timeline for property
- [x] Comprehensive property data display (Stammdaten, Adresse, Preise, Flächen, Ausstattung)
- [x] Comprehensive property detail form with all Propstack fields (editable)
- [x] Property description editor (in detail form)
- [x] Property status workflow dropdown (Akquise, Vorbereitung, Vermarktung, Reserviert, Verkauft, Vermietet, Inaktiv)
- [x] Contact detail page with tabbed interface
- [x] Navigation from list views to detail views

### Google Calendar Integration
- [ ] Appointment/Viewing scheduler
- [ ] Google Calendar API integration
- [ ] Sync appointments to Google Calendar
- [ ] Appointment list view in dashboard
- [ ] Link appointments to properties and contacts

### Document Management with NAS
- [ ] Document upload and storage
- [ ] NAS connection configuration (SMB/CIFS, WebDAV, or file path)
- [ ] Link documents to properties
- [ ] Link documents to contacts
- [ ] Image gallery for properties
- [ ] Document browser in dashboard

### Property Enhancements (All 6 Points)
- [ ] 1. Image gallery with upload, sort, drag-and-drop reorder, main image selection
- [ ] 2. Contact linking with roles (Eigentümer, Käufer, Mieter, Makler, Notar, Hausverwaltung)
- [ ] 3. Activity timeline (Notizen, Anrufe, E-Mails, Besichtigungen) with timestamps
- [ ] 4. Status workflow dropdown (Akquise → Vorbereitung → Vermarktung → Reserviert → Verkauft/Vermietet)
- [ ] 5. Advanced filters in property list (Preis von-bis, Größe, Status, Ort, Immobilientyp, Zimmer)
- [ ] 6. Document upload and management (Grundrisse, Energieausweis, Verträge, sonstige PDFs)

### Branding & Design
- [x] Extract color scheme from immo-jaeger.eu homepage
- [x] Apply brand colors to application theme (primary, secondary, accent colors)
- [x] Extract and integrate company logo
- [x] Apply consistent fonts from homepage
- [x] Update application title and branding information
- [x] Ensure consistent visual identity across all pages

### Property Detail Form Improvements
- [x] Replace bathroom checkboxes with multi-select dropdown (Dusche, Wanne, Fenster, Bidet, Urinal)
- [x] Replace flooring checkboxes with multi-select dropdown (Beton, Epoxidharz, Fliesen, Dielen, Laminat, Parkett, PVC, Teppichboden, etc.)
- [x] Update database schema to store bathroom and flooring as TEXT fields

### AI & UX Improvements
- [x] Add AI-powered property description generator (ChatGPT API)
- [x] Add KI-Kreativitäts-Slider for description generation
- [x] Add dropdown options for Objektzustand (14 options)
- [x] Add dropdown options for Qualität der Ausstattung (4 options)
- [x] Add dropdown options for Stellplatztyp (7 options)
- [x] Add dropdown options for Bauphase (4 options)
- [x] Add automatic "m²" suffix to area fields
- [x] Add automatic "€" suffix to price fields
- [x] Add sticky "Jetzt speichern" button at bottom of form (only visible when editing)

### Critical Fixes & Database Migration
- [x] Fix form validation errors (null values causing save failures)
- [x] Keep prices/areas as numbers in DB (display with units in UI only)
- [x] Prepare PostgreSQL migration guide for later VN setup
- [x] Configure PostgreSQL connection code (ready for migration)
- [x] Add OPENAI_API_KEY as secret
- [x] Replace Manus LLM helper with direct OpenAI API calls
- [x] Install OpenAI SDK
- [x] Test AI description generator with OpenAI API

### Energieausweis (Energy Certificate)
- [x] Add energy certificate fields to database schema
- [x] Add Energieausweis dropdown (wird nicht benötigt, liegt vor, liegt zur Besichtigung vor)
- [x] Add Erstellungsdatum dropdown (ab 1. Mai 2014, bis 30. April 2014)
- [x] Add Ausstellungsdatum date field
- [x] Add Gültig bis date field
- [x] Add Energieausweistyp dropdown (Bedarfsausweis, Verbrauchsausweis)
- [x] Add Energieeffizienzklasse dropdown (A+ to H)
- [x] Add Energiekennwert, Energiekennwert Strom, Energiekennwert Wärme number fields
- [x] Add CO2-Emissionen number field
- [x] Add Energieverbrauch für Warmwasser enthalten checkbox
- [x] Add Heizungsart dropdown (11 options)
- [x] Add Wesentlicher Energieträger dropdown (28 options)
- [x] Add Baujahr, Baujahr Anlagentechnik year fields
- [x] Add Baujahr unbekannt checkbox

### Address Autocomplete
- [x] Integrate Google Places API for address autocomplete
- [x] Add autocomplete dropdown when typing street address
- [x] Auto-populate street, city, postal code, country on selection
- [x] Use existing Maps integration from template

## Layout Redesign & Color Scheme

### Two-Column Layout for Property Detail Page
- [x] Restructure PropertyDetailView to use two-column grid layout
- [x] Left column (60-65% width): Stammdaten, Adresse, Preise, Flächen, Zusatzinformationen, Ausstattung, Energieausweis, Beschreibung
- [x] Right column (35-40% width): Ansprechpartner, Portale, Auftrag, Verkauf, Provision sections
- [x] Make layout responsive for mobile devices (stack columns on small screens)

### Color Scheme Update (immo-jaeger.eu branding)
- [x] Update primary blue color to #0066B3 in index.css
- [x] Add turquoise/cyan accent color #00D4AA for action buttons
- [x] Update button colors: green (#4CAF50), yellow (#FFC107), red (#F44336)
- [x] Apply orange/coral accent #FF6B35 where appropriate
- [x] Update text colors for consistency
- [x] Test all components with new color scheme

## Right Column Sections Implementation

### Ansprechpartner Section
- [x] Add Betreuer dropdown (linked to users)
- [x] Add Eigentümer field with contact search
- [x] Add Käufer contact search field
- [x] Add Notar contact search field
- [x] Add Hausverwaltung contact search field
- [x] Add Mieter contact search field
- [x] Add Verknüpfte Kontakte field with type dropdown

### Portale Section
- [x] Create Portal-Export list display (3 portals)
- [x] Add "Überall veröffentlichen" button
- [x] Add individual "Veröffentlichen" buttons per portal
- [x] Add "Aktualisieren" button (green)
- [x] Add "Deaktivieren" button (yellow)
- [x] Add "Löschen" button (red)
- [x] Add "Jetzt buchen" button (turquoise)
- [x] Add IS24-Ansprechpartner dropdown
- [x] Add IS24-ID field
- [x] Add IS24-Gruppen-Nr field
- [x] Add Übersetzungen field
- [ ] Prepare API integration structure for ImmoScout24
- [ ] Prepare API integration structure for custom homepage

### Auftrag Section
- [x] Add Auftragsart dropdown (Alleinauftrag, etc.)
- [x] Add Laufzeit dropdown (Unbefristet, Befristet)
- [x] Add "Auftrag von" date field
- [x] Add "Auftrag bis" date field

### Verkauf Section
- [x] Add Verkauf section placeholder

### Provision Intern Section
- [x] Add Innenprovision (intern) field with % / € toggle
- [x] Add Außenprovision (intern) field with % / € toggle
- [x] Add Gesamtprovision calculated field (read-only)
- [ ] Implement automatic commission calculation logic

### Provision Extern Section
- [x] Add Außenprovision für Exposé field
- [x] Add Provisionshinweis textarea

### Verrechnung Section
- [x] Add Verrechnung section placeholder

### Fahrzeiten Section
- [x] Add Fußweg zu ÖPNV field (minutes + km)
- [x] Add Fahrzeit nächste Autobahn field (minutes + km)
- [x] Add Fahrzeit nächster HBF field (minutes + km)
- [x] Add Fahrzeit nächster Flughafen field (minutes + km)
- [x] Add "Distanzen berechnen" button
- [ ] Implement distance calculation using Google Maps API

## Future Module Preparation

### Contact Tagging System - Enhanced
- [x] Add tags field to contacts table (TEXT, JSON array)
- [x] Update contact tags with comprehensive categories:
  - [x] Dienstleister: Architekt, Bauträger, Fotograf, Handwerker, Hausverwaltung, IT-Branche
  - [x] Kunde: Eigennutzer, Eigentümer, Eigentümer Lead, Kapitalanleger, Kaufinteressent, Käufer, Mieter, Mietinteressent, Verkäufer, Vermieter
  - [x] Partner: Finanzierung, Kooperation, Makler, Notar, Rechtsanwalt, Tippgeber
- [x] Add contact status field with options: Sonstiges, Partner, Dienstleister, Kunde, Versicherung, Hausverwaltung, Objekteigentümer
- [x] Update contact list filter to support new tag structure with categories
- [x] Update contact detail view with new tag categories
- [ ] Update contact form with status dropdown

### Versicherungen (Insurance) Module - Database Preparation
- [x] Create insurancePolicies table
- [x] Fields: policyNumber, insuranceType, provider, contactId, propertyId, startDate, endDate, premium, paymentInterval, status
- [x] Add insuranceType enum (Gebäudeversicherung, Haftpflicht, Rechtsschutz, Hausrat, Elementarschaden, etc.)
- [x] Add relationship to contacts and properties tables

### Makler (Broker) Module - Database Preparation
- [x] Create brokerContracts table
- [x] Fields: contractNumber, contactId, propertyId, contractType, startDate, endDate, commissionRate, commissionAmount, status
- [x] Add contractType enum (Alleinauftrag, Einfacher Auftrag, Qualifizierter Alleinauftrag)
- [x] Add commission tracking fields

### Hausverwaltung (Property Management) Module - Database Preparation
- [x] Create propertyManagementContracts table
- [x] Fields: contractNumber, propertyId, managerId (contactId), startDate, endDate, monthlyFee, services, status
- [x] Create maintenanceRecords table
- [x] Fields: propertyId, date, description, cost, category, vendor, status
- [x] Create utilityBills table for Nebenkostenabrechnung
- [x] Fields: propertyId, year, month, type, amount, paidBy, status

### UI Preparation
- [ ] Add "Versicherungen" navigation item (initially hidden/disabled)
- [ ] Add "Maklerverträge" navigation item (initially hidden/disabled)
- [ ] Add "Hausverwaltung" navigation item (initially hidden/disabled)
- [ ] Add feature flags to enable/disable modules
- [ ] Prepare placeholder pages for future modules

## Layout Adjustments

### Energieausweis Section Relocation
- [x] Move Energieausweis section from left column to right column
- [x] Position after Provision Extern section
- [x] Maintain all 16 energy certificate fields
- [x] Test responsive layout

### Travel Time Calculation
- [x] Clear default values from travel time fields
- [x] Make travel time fields read-only
- [ ] Fix Google Maps Distance Matrix API integration for travel time calculation
- [ ] Ensure calculated values populate form fields correctly
- [ ] Test that values persist after calculation
- [x] Calculate walking time to nearest public transport
- [x] Calculate driving time to nearest highway
- [x] Calculate driving time to nearest main train station
- [x] Calculate driving time to nearest airport
- [x] Show loading state during calculation
- [x] Handle API errors gracefully

## Versicherungen (Insurance) Module - UI Implementation

### Navigation & Routing
- [x] Add "Versicherungen" navigation item in DashboardLayout
- [x] Create route /dashboard/insurances for insurance list
- [x] Create route /dashboard/insurances/new for creating new policy
- [x] Create route /dashboard/insurances/:id for editing policy

### Insurance List Page
- [x] Create Insurances.tsx list page
- [x] Display all insurance policies in table
- [x] Add filters: insurance type, status, property, contact
- [x] Add search by policy number
- [x] Add "Neue Versicherung" button
- [x] Show policy details: number, type, provider, premium, dates
- [x] Add edit and delete actions

### Insurance Detail/Form Page
- [x] Create InsuranceDetail.tsx page
- [x] Add policy number field
- [x] Add insurance type dropdown (7 types)
- [x] Add provider/company field
- [x] Add contact selection (Versicherungsnehmer)
- [x] Add property selection (optional)
- [x] Add start date and end date fields
- [x] Add premium amount and payment interval
- [x] Add status dropdown (active, expired, cancelled)
- [x] Add notes textarea
- [x] Implement save functionality

### Backend Procedures
- [x] Create insurances.list tRPC procedure
- [x] Create insurances.getById procedure
- [x] Create insurances.create procedure
- [x] Create insurances.update procedure
- [x] Create insurances.delete procedure
- [x] Add filters and search to list procedure

## Hausverwaltung (Property Management) Module - UI Implementation

### Navigation & Routing
- [x] Add "Hausverwaltung" navigation item in DashboardLayout
- [x] Create route /dashboard/property-management for overview
- [x] Create tabbed interface: Verträge, Instandhaltung, Nebenkosten

### Verträge (Contracts) Tab
- [x] Create PropertyManagementContracts component
- [x] Display all management contracts in table
- [x] Add "Neuer Vertrag" button
- [x] Show contract details: number, property, manager, dates, fee
- [x] Add contract form dialog
- [x] Implement create/edit/delete operations

### Instandhaltung (Maintenance) Tab
- [x] Create MaintenanceRecords component
- [x] Display maintenance records in table
- [x] Add filters: property, category, status, date range
- [x] Add "Neue Wartung" button
- [x] Show maintenance details: date, description, cost, vendor
- [x] Add maintenance form dialog
- [x] Implement create/edit/delete operations

### Nebenkosten (Utility Bills) Tab
- [x] Create UtilityBills component
- [x] Display utility bills in table
- [x] Add filters: property, year, month, type
- [x] Add "Neue Abrechnung" button
- [x] Show bill details: period, type, amount, paid by
- [x] Add utility bill form dialog
- [x] Implement create/edit/delete operations

### Backend Procedures
- [x] Create propertyManagement.listContracts procedure
- [x] Create propertyManagement.createContract procedure
- [x] Create propertyManagement.updateContract procedure
- [x] Create propertyManagement.deleteContract procedure
- [x] Create propertyManagement.listMaintenance procedure
- [x] Create propertyManagement.createMaintenance procedure
- [x] Create propertyManagement.updateMaintenance procedure
- [x] Create propertyManagement.deleteMaintenance procedure
- [x] Create propertyManagement.listUtilityBills procedure
- [x] Create propertyManagement.createUtilityBill procedure
- [x] Create propertyManagement.updateUtilityBill procedure
- [x] Create propertyManagement.deleteUtilityBill procedure

## Bug Fixes

### Travel Time Calculation
- [ ] Fix issue where calculated travel times are not populating form fields
- [ ] Rewrite to use Google Maps JavaScript API in browser instead of server requests
- [ ] Test that values persist after calculation

### Navigation Improvements
- [x] Reorder navigation: Kontakte after Übersicht, before Immobilien
- [x] Rename "Immobilien" to "Objekte" in navigation and all UI

- [x] Fix travel times calculation with Google Maps Distance Matrix API
