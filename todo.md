# Immobilien-Verwaltungsplattform TODO

## Completed Features

- [x] Basic dashboard layout with sidebar navigation
- [x] Property management (CRUD operations)
- [x] Contact management (CRUD operations)
- [x] Lead management system
- [x] Appointment scheduling
- [x] Document management
- [x] Insurance tracking
- [x] Property management (Hausverwaltung) section
- [x] Settings page
- [x] Property detail page with comprehensive form
- [x] Contact detail page
- [x] Lead detail page
- [x] Property expose generation with AI
- [x] Property landing page generation
- [x] ImmoScout24 integration
- [x] Property description AI generation
- [x] Google Maps integration for address autocomplete
- [x] Property image upload and management
- [x] Contact tagging system
- [x] Lead source tracking
- [x] Appointment types and status
- [x] Document categories
- [x] Insurance types and status
- [x] Property status workflow
- [x] Marketing type selection
- [x] Property type categories
- [x] Room and area calculations
- [x] Price formatting
- [x] Energy certificate management
- [x] Property features and amenities
- [x] Contact activities timeline
- [x] Lead conversion tracking
- [x] Property portal export
- [x] Responsive design
- [x] Loading states and skeletons
- [x] Error handling
- [x] Form validation
- [x] Toast notifications
- [x] Reorder navigation: Kontakte after Übersicht, before Immobilien
- [x] Rename "Immobilien" to "Objekte" in navigation and all UI
- [x] Update contact tags with comprehensive categories:
  - [x] Dienstleister: Architekt, Bauträger, Fotograf, Handwerker, Hausverwaltung, IT-Branche
  - [x] Kunde: Eigennutzer, Eigentümer, Eigentümer Lead, Kapitalanleger, Kaufinteressent, Käufer, Mieter, Mietinteressent, Verkäufer, Vermieter
  - [x] Partner: Finanzierung, Kooperation, Makler, Notar, Rechtsanwalt, Tippgeber
- [x] Add contact status field with options: Sonstiges, Partner, Dienstleister, Kunde, Versicherung, Hausverwaltung, Objekteigentümer
- [x] Update contact list filter to support new tag structure with categories
- [x] Update contact detail view with new tag categories
- [x] Fix travel times calculation with Google Maps Distance Matrix API
- [x] Make property title clickable in properties list table to navigate to detail page

## Pending Features

- [x] Redesign properties overview page with new layout:
  - [x] Add image/thumbnail column on the left
  - [x] Add checkboxes for multi-selection
  - [x] Add search field "Objekt suchen..."
  - [x] Add filter buttons (Status, Filter, Sortieren)
  - [x] Add new columns: Projekt, Etage, Zimmer
  - [x] Keep existing columns: Name, Fläche, Preis, Status
  - [x] Display status as colored badge

- [x] Redesign property detail page:
  - [x] Add large preview image in header
  - [x] Show title with address and status badge
  - [x] Add number badges (activities, contacts, etc.)
  - [x] Add subtitle with price and property details
  - [x] Keep tab navigation (Details, Aktivitäten, etc.)

## Future Enhancements

- [ ] Email integration
- [ ] Calendar sync
- [ ] Advanced reporting
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Print templates
- [ ] Mobile app
- [ ] API documentation
- [ ] Webhook support
- [ ] Multi-language support

- [x] Replace Projekt and Etage columns with Typ and Vermarktung in properties overview table

- [x] Add save button to property detail page when in edit mode

- [x] Make contact name clickable in contacts list table to navigate to detail page

- [x] Make status badge clickable in properties overview to change status inline
- [x] Make contact name clickable in contacts list table to navigate to detail page (already completed)

- [x] Convert parking type field to multi-select to allow multiple selections (Garage, Carport, etc.)
- [x] Improve energy certificate section design with better layout and grouping

- [x] Fix property data saving issue (save button not working)
- [x] Create API endpoint to export properties in JSON format for homepage sync
- [x] Add sync button to properties overview
- [x] Implement sync functionality to send properties to homepage
- [x] Add homepage URL configuration (for sync target)

- [x] Fix status badge to display German labels instead of English values (e.g., "Vermarktung" instead of "marketing")
