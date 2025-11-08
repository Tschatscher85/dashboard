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

- [x] Fix condition field validation error (invalid value being sent)
- [x] Make property title editable in edit mode (add input field for title in header)
- [ ] Fix date field saving and display issue - dates (e.g., "Verfügbar ab") are saved to database but not displayed correctly after page reload

## API Integrations

- [x] Extend database schema with ImmoScout24-compatible fields (marketingType, interiorQuality, energyCertificateType, etc.)
- [x] Add sync-specific fields (externalId, syncSource, lastSyncedAt) to properties table
- [x] Add rental-specific fields (deposit, serviceCharge, heatingCosts, petsAllowed)
- [x] Create inquiries table for Superchat contact management
- [x] Implement properties.sync tRPC endpoint with API key authentication
- [x] Integrate Brevo API for email notifications (sendInquiryNotification, sendAppointmentConfirmation, sendFollowUpEmail)
- [x] Implement Superchat webhook endpoint for incoming messages (/api/webhooks/superchat)
- [x] Create Superchat client for sending outbound messages
- [x] Add inquiries tRPC router with CRUD operations and sendReply endpoint
- [x] Add database functions for inquiry management
- [x] Update PropertyDetailForm to support new sync fields (externalId, syncSource)
- [ ] Create UI for managing inquiries (list view, detail view, reply interface)
- [ ] Add Superchat channel configuration in settings
- [ ] Test Property-Sync API endpoint with external system
- [ ] Test Brevo email sending with real email addresses
- [ ] Test Superchat webhook integration with real messages

## Settings Page Enhancements

- [x] Create user management section in settings
- [x] Add "Neuer Benutzer" button and form
- [x] Implement user creation with email, name, and role selection
- [x] Add user list with edit/delete functionality
- [x] Create API configuration section in settings
- [x] Add form fields for API keys (Superchat, Brevo, Property-Sync, OpenAI)
- [x] Implement secure API key storage and retrieval
- [x] Add backend endpoint for creating new users (users.create, users.list, users.delete)
- [x] Add backend endpoint for saving API configuration (settings.getApiKeys, settings.saveApiKeys)
- [x] Test user creation and API key management

## Propstack-Style Landing Page Redesign

- [x] Implement sticky navigation bar with smooth scroll to sections
- [x] Redesign hero section with full-width image and emoji-enhanced title
- [x] Create Objektbeschreibung section with emoji icons (🏡, ✨)
- [x] Add green checkmark (✅) list for Ausstattung & Highlights
- [x] Implement two-column Objektdaten table with all property details
- [x] Implement Bilder section with image gallery (3-column grid)
- [x] Add Lage section with OpenStreetMap integration
- [x] Create Kontakt section with contact form and lead submission
- [x] Add "Exposé drucken" (Print) functionality with print styles
- [x] Integrate WhatsApp contact button with phone link
- [x] Ensure mobile-responsive design
- [x] Test all sections and navigation
- [x] Fetch property images from database and display in gallery
- [ ] Add Grundrisse section for floor plan display (if needed)

## Propstack-Style Property Detail Page Improvements

- [x] Implement two-column layout (left: property data, right: contacts & portals)
- [x] Add Ansprechpartner sidebar with contact fields (Eigentümer, Käufer, Notar, Hausverwaltung, Mieter)
- [x] Add Portal-Export section with ImmoScout24 and Homepage export status
- [x] Add Homepage Export portal with Veröffentlichen and Aktualisieren buttons
- [x] Add export action buttons (Veröffentlichen, Aktualisieren, Deaktivieren) for ImmoScout24
- [ ] Replace checkboxes with toggle switches for boolean fields (partially done)
- [ ] Add colored field indicators/badges
- [ ] Improve field organization and grouping
- [ ] Add contact search functionality with autocomplete
- [ ] Test two-column layout responsiveness

## Bug Fixes

- [x] Fix distance calculation showing unrealistic values (1 Minute / 1 m)
- [x] Debug Google Maps Distance Matrix API integration
- [x] Verify geocoding and distance calculation logic
- [x] Improved geocoding queries for better accuracy

## Distance Calculation Accuracy Fix

- [ ] Replace text-based geocoding with Google Places Nearby Search API
- [ ] Find nearest train station using place type "train_station"
- [ ] Find nearest highway using place type "route" or coordinates-based search
- [ ] Find nearest bus stop using place type "bus_station" or "transit_station"
- [ ] Find nearest airport using place type "airport"
- [ ] Test with Klingenweg 15, 73312 Geislingen (should be ~10 min to HBF, ~40 min to Autobahn)

## Media Upload & NAS Integration

- [ ] Analyze Propstack media page design
- [ ] Implement drag-and-drop file upload component
- [ ] Add "Hochladen" button for file selection
- [ ] Create WebDAV client for Synology NAS connection
- [ ] Add NAS credentials to settings (WebDAV URL, username, password)
- [ ] Implement file upload to NAS with folder structure: `/Verkauf/[Adresse]/Bilder/`
- [ ] Create `/Objektunterlagen/` folder for documents
- [ ] Add image preview grid in Media tab
- [ ] Support multiple file formats (JPG, PNG, PDF)
- [ ] Add file type filtering (Bilder vs Objektunterlagen)
- [ ] Implement image deletion from NAS
- [ ] Test WebDAV connection and file upload

## Property Description Generator Fix

- [ ] Fix "Objektbeschreibung erzeugen" to use actual property data
- [ ] Pass all property fields to LLM (address, rooms, size, features, etc.)
- [ ] Add creativity slider functionality
- [ ] Generate description based on property type (Haus, Wohnung, Grundstück)
- [ ] Test description generation with real property data

## Media Upload Implementation

- [ ] Create PropertyMedia page component with tabs (Medien, Dokumente, Links)
- [ ] Implement drag-and-drop zone for image uploads
- [ ] Add file upload button as alternative to drag-and-drop
- [ ] Create backend endpoint for uploading files to NAS
- [ ] Implement image preview grid with thumbnails
- [ ] Add image metadata (title, description, category)
- [ ] Support image reordering (drag to reorder)
- [ ] Add delete functionality for images
- [ ] Create document categories (Objektunterlagen, Sensible Daten, Vertragsunterlagen, Upload-Bereich)
- [ ] Implement links management (360° tour URL, business card URL)
- [ ] Test file upload to NAS with WebDAV
- [ ] Add loading states and error handling

## Property Description Generator Fix

- [ ] Read current implementation of description generator
- [ ] Fix data fetching to include all property fields
- [ ] Update prompt to use actual property data (rooms, area, features, location)
- [ ] Test generator with real property data

## Bug: Missing Status "Verhandlung"

- [ ] Add "negotiation" to property status enum in schema
- [ ] Run database migration to update enum
- [ ] Test status change to "Verhandlung"

## Media Upload Implementation

- [x] Create PropertyMedia page component with tabs (Medien, Dokumente, Links)
- [x] Implement drag-and-drop file upload zone
- [x] Add image gallery grid with thumbnails
- [x] Add route /dashboard/properties/:id/media
- [ ] Create NAS upload endpoint (POST /api/properties/:id/media/upload)
- [ ] Implement image categorization (Hausansicht, Küche, Bad, Grundrisse, etc.)
- [ ] Add image description/caption fields
- [x] Create document upload UI with 4 categories (Objektunterlagen, Sensible Daten, Vertragsunterlagen, Upload)
- [x] Add links management UI (360° tour, business card)
- [ ] Connect upload to NAS WebDAV
- [ ] Test file upload to NAS WebDAV

## Property Description Generator Fix

- [x] Read current property data in AIDescriptionDialog
- [x] Pass all property fields to backend generateDescription endpoint
- [x] Update LLM prompt to include property data (title, address, price, dimensions, features, energy)
- [x] Add German translations for property types and marketing types
- [x] Format price with currency formatter
- [x] Include all features (balcony, terrace, garden, elevator, heating, energy class)
- [x] Improve prompt with structured format and clear instructions
- [ ] Test description generation with real property data

## Priority 3: Media Button to PropertyDetail

- [x] Add "Medien verwalten" button to PropertyDetail page header
- [x] Position button next to "Bearbeiten" and "Löschen" buttons
- [x] Navigate to /dashboard/properties/:id/media on click
- [x] Use ImageIcon from lucide-react
- [x] Test navigation to PropertyMedia page

## Priority 1: NAS Upload Integration

- [x] Install webdav package
- [x] Create WebDAV client for Synology NAS (server/lib/webdav-client.ts)
- [x] Implement folder structure creation (Bilder, Objektunterlagen, Sensible Daten, Vertragsunterlagen)
- [x] Add uploadToNAS endpoint in properties router
- [x] Add listNASFiles endpoint to list files from NAS
- [x] Add deleteFromNAS endpoint to delete files from NAS
- [x] Connect PropertyMedia component to NAS upload endpoints
- [x] Implement file-to-base64 conversion in frontend
- [x] Add category mapping (objektunterlagen → Objektunterlagen, sensible → Sensible Daten, etc.)
- [x] Update document upload handlers to pass correct category
- [ ] Test NAS connection and file upload with real NAS
- [ ] Test file listing from NAS folders
- [ ] Test file deletion from NAS

## Display NAS Files in PropertyMedia Page

- [x] Add listNASFiles query to PropertyMedia component for images
- [x] Display uploaded images from NAS in image gallery grid
- [x] Add listNASFiles query for each document category (Objektunterlagen, Sensible Daten, Vertragsunterlagen)
- [x] Display uploaded documents in document sections with file names and sizes
- [x] Implement delete functionality for images (with confirmation dialog)
- [x] Implement delete functionality for documents (with confirmation dialog)
- [x] Add automatic refetch after upload to show new files immediately
- [x] Show file count badges in image gallery header
- [x] Show file count for each document category
- [x] Display file sizes in KB for all files

## Fix Upload Hanging and Navigation Issues

- [x] Debug why upload hangs at "Bilder werden hochgeladen..." (NAS connection timeout)
- [x] Check server logs for NAS connection errors
- [x] Add better error handling to upload mutation with specific error messages
- [x] Add 3-second timeout to NAS connection test
- [x] Implement S3 fallback when NAS is not reachable
- [x] Show specific success/warning messages to user (NAS vs Cloud storage)
- [x] Add "Zurück" (Back) button to PropertyMedia page header with ArrowLeft icon
- [x] Navigate back using window.history.back()
- [ ] Test upload with small image file to verify fallback works
- [ ] Verify error messages are displayed correctly

## Display S3 Files from Database

- [x] Show images from database (property.images) in gallery alongside NAS files
- [x] Combine NAS files and database files in single list with total count
- [x] Show actual image previews using imageUrl from database
- [x] Add delete functionality for database images with deleteImageMutation
- [x] Label images as "Cloud" or "NAS" for clarity
- [x] Fallback to icon if image fails to load
- [ ] Test with uploaded S3 files to verify display works

## Public Property Landing Page (Exposé)

### Design Analysis (from Propstack PDF)
- [ ] Clean, professional design with blue headings (#0066A1 color)
- [ ] Page 1: Hero with title, main image, address, property ID
- [ ] Page 2-3: "Daten im Überblick" - two-column table with all property details
- [ ] Page 4-5: "Beschreibung" with sections (Objektbeschreibung, Ausstattung & Highlights, Lage, Fazit)
- [ ] Page 6: Location details and contact info
- [ ] Page 7+: Image gallery with 2 images per page, labeled (Hausansicht, Terrasse, Eingangsbereich, Küche, etc.)
- [ ] Footer: "Immo-Jaeger" branding on every page

### Implementation Tasks
- [ ] Create PropertyLanding.tsx component for public exposé page
- [ ] Add public route `/expose/:id` (no login required)
- [ ] Hero section with property title and main image
- [ ] "Daten im Überblick" section with all property details in table format
- [ ] "Beschreibung" section with AI-generated or manual description
- [ ] "Ausstattung & Highlights" section with bullet points
- [ ] "Lage" section with location description
- [ ] Image gallery with labeled images (2-column grid)
- [ ] Contact section with phone, WhatsApp, email
- [ ] Responsive design for mobile/tablet/desktop
- [ ] PDF export button to generate downloadable exposé
- [ ] Share functionality (copy link, QR code)

## Update PropertyLanding to Match Propstack Design

- [x] Change heading colors to Propstack blue (#0066A1)
- [x] Remove emojis from headings for professional look
- [x] Rename "Objektdaten" to "Daten im Überblick"
- [x] Rename "Bilder" to "Bildergalerie"
- [x] Add complete data table with all available property fields (energy data, distances, heating, etc.)
- [x] Fix property field names to match schema (mainEnergySource, energyClass, distanceToHighway, etc.)
- [ ] Implement labeled image gallery (images with category labels like "Hausansicht", "Küche", etc.)
- [ ] Add image category field to property images schema
- [ ] Update PropertyMedia to allow setting image categories
- [ ] Test landing page with real property data

## Fix Image Display and NAS Configuration

- [x] Configure NAS WebDAV credentials as secrets (NAS_WEBDAV_URL, NAS_USERNAME, NAS_PASSWORD)
- [x] Update PropertyDetail Medien tab to show uploaded images from database in grid layout
- [x] Add image count to Medien tab title
- [x] Add hover effect and image labels
- [x] Add fallback for broken images
- [ ] Test NAS upload with real credentials
- [ ] Verify images appear in both PropertyMedia and PropertyDetail pages

## Add Delete, Rename Buttons and Fix NAS Upload

- [x] Add delete button to each image in PropertyMedia gallery (always visible, top-right corner)
- [ ] Add rename/edit button to each image in PropertyMedia gallery (postponed)
- [x] Add delete button to each image in PropertyDetail Medien tab
- [ ] Implement rename functionality with inline editing or dialog (postponed)
- [x] Test NAS connection with current credentials (working - 15s timeout)
- [x] Verify NAS upload path (correct: /Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/[Adresse]/Bilder/)
- [x] Increase NAS timeout from 3s to 15s
- [ ] Test actual NAS upload and verify file appears on NAS

## NAS Upload Diagnostic and Fix

- [x] Create test endpoint to diagnose NAS connection (testNASConnection)
- [x] Add NAS test dialog to PropertyMedia page (button in header)
- [ ] User: Test NAS connection with real credentials (click "NAS-Verbindung testen" button)
- [ ] Check if folders can be created on NAS (will be shown in test results)
- [ ] Test file upload to NAS (will be shown in test results)
- [ ] Identify why uploads go to S3 instead of NAS (test will reveal this)
- [ ] Fix NAS upload issues based on test results
- [ ] Verify files appear on NAS after upload

## Fix NAS Connection Issues (from diagnostic test)

- [ ] Fix "TypeError: Invalid URL" in Create Folders step
- [ ] Fix "NAS is not reachable" in Basic Connection step
- [ ] Check WebDAV URL format in environment variables
- [ ] Verify NAS is accessible from server (network/firewall issue?)
- [ ] Test connection again after fixes

## NAS WebDAV Path Fix

- [x] Fix BASE_PATH in webdav-client.ts to use WebDAV-relative path (remove /volume1/)
- [x] Test NAS connection with corrected paths
- [x] Verify folder creation works
- [x] Test file upload to NAS

## NAS Settings UI Fix

- [x] Update Settings page to show correct base path (/Daten/... instead of /volume1/Daten/...)

## FTP/FTPS Implementation

- [x] Install basic-ftp package
- [x] Create FTP client module (server/lib/ftp-client.ts)
- [x] Add FTP configuration fields to Settings UI (protocol, host, port, secure)
- [x] Update upload logic to support FTP protocol
- [ ] Test FTP upload with UGREEN NAS

## FTP Connection Debugging

- [ ] Check server logs for FTP connection errors
- [ ] Verify FTP credentials are being read correctly from env
- [ ] Test FTP connection directly with testConnection function
- [ ] Fix any path or configuration issues
- [ ] Verify upload works end-to-end

## FTP/FTPS Implementation ✅

- [x] Install basic-ftp package
- [x] Create FTP client module (server/lib/ftp-client.ts)
- [x] Add FTP configuration fields to Settings UI (protocol, host, port, secure)
- [x] Update upload logic to support FTP protocol
- [x] Test FTP upload with UGREEN NAS
- [x] Fix FTP host configuration (ftp.tschatscher.eu)
- [x] Verify images upload to NAS successfully
- [x] Add detailed logging for upload debugging

## Next Steps: Document Upload & Sync

- [ ] Test document upload to NAS (PDF, DOCX, etc.)
- [ ] Verify documents appear in correct NAS folders
- [ ] Implement bidirectional NAS synchronization
  - [ ] Add "Mit NAS synchronisieren" button
  - [ ] Scan NAS folders for manually added files
  - [ ] Add missing files to database
  - [ ] Remove deleted files from database
  - [ ] Show sync status and last sync time
- [ ] Optimize WebDAV as alternative to FTP
  - [ ] Fix WebDAV path construction
  - [ ] Test WebDAV connection with UGREEN NAS
  - [ ] Add protocol switching in UI

## Urgent Fixes - Propstack-Style Media Page

- [ ] Fix document upload to only upload to selected category (not all categories)
- [ ] Redesign PropertyMedia page layout:
  - [ ] Separate "Medien" section (images only) at top
  - [ ] Separate "Dokumente" section below with folder structure
  - [ ] Add view toggle for images (compact grid vs large grid)
  - [ ] Add image category labels (Hausansicht, Küche, Bad, Grundrisse, etc.)
- [ ] Fix NAS image display - images show placeholder icons instead of actual previews
- [ ] Generate proper URLs for FTP-uploaded files (currently no URL available)
- [ ] Enable deletion of old cloud images from database
- [ ] Test document upload to NAS (PDF, DOCX to Objektunterlagen folder)

## Cleanup and Multi-Select Deletion

- [x] Delete old cloud images via SQL for clean testing (not needed - using multi-select instead)
- [x] Implement multi-select feature with checkboxes
- [x] Add "Select All" checkbox
- [x] Add "Delete Selected" button (appears when items selected)
- [x] Add confirmation dialog before bulk deletion
