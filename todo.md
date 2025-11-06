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
