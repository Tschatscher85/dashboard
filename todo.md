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
- [ ] Brevo API client setup
- [ ] Contact synchronization to Brevo
- [ ] Webhook handler for Brevo updates
- [ ] Manual sync trigger in admin panel

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
- [ ] Exposé template system (multiple designs)
- [ ] PDF exposé generator with property data
- [ ] Image gallery integration in exposés
- [ ] Landing page builder for individual properties
- [ ] Landing page templates (modern, classic, luxury)
- [ ] SEO metadata for landing pages
- [ ] Public URL generation for property landing pages
- [ ] Preview function for exposés and landing pages
