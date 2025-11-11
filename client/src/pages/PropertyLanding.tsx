import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Printer, Phone, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";

export default function PropertyLanding() {
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;

  const { data: property, isLoading } = trpc.properties.getById.useQuery({
    id: propertyId,
  });

  // Fetch company branding settings
  const { data: settings } = trpc.settings.getCompanyBranding.useQuery();

  // Fetch documents for landing page
  const { data: documents } = trpc.documents.getByProperty.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

  // Convert NAS URLs to proxy URLs (server-side authentication)
  const convertToProxyUrl = (url: string | undefined): string => {
    if (!url) {
      console.log('[convertToProxyUrl] Empty URL');
      return '';
    }
    
    console.log('[convertToProxyUrl] Input URL:', url);
    
    // If URL is from NAS (contains ugreen.tschatscher.eu), convert to proxy URL
    if (url.includes('ugreen.tschatscher.eu')) {
      // Extract path after domain
      // Example: https://ugreen.tschatscher.eu/Daten/... -> /Daten/...
      const match = url.match(/ugreen\.tschatscher\.eu(\/.*)/i);
      if (match && match[1]) {
        const nasPath = match[1];
        // Remove leading slash for proxy endpoint
        const proxyUrl = `/api/nas${nasPath}`;
        console.log('[convertToProxyUrl] Converted to proxy URL:', proxyUrl);
        return proxyUrl;
      }
    }
    
    // For S3/Cloud URLs or other sources, return as-is
    console.log('[convertToProxyUrl] Not a NAS URL, returning original');
    return url;
  };

  const [leadData, setLeadData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({ isOpen: false, title: "", content: "" });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load Superchat widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.superchat.de/snippet.js?applicationKey=WCyQKxJ081w98a8oE25VqAzXpn';
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Ihre Anfrage wurde erfolgreich gesendet!");
      setLeadData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
    },
    onError: (error) => {
      toast.error("Fehler beim Senden: " + error.message);
    },
  });

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.firstName || !leadData.lastName || !leadData.email) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createLeadMutation.mutate({
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone || undefined,
      message: leadData.message || undefined,
      source: `Property Landing Page - ${property?.title}`,
      propertyId: propertyId,
    });
  };

  const objektdatenRef = useRef<HTMLDivElement>(null);
  const bilderRef = useRef<HTMLDivElement>(null);
  const lageRef = useRef<HTMLDivElement>(null);
  const dokumenteRef = useRef<HTMLDivElement>(null);
  const kontaktRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Immobilie nicht gefunden</h1>
          <p className="text-muted-foreground mt-2">
            Die gesuchte Immobilie existiert nicht oder wurde entfernt.
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "Wohnung",
      house: "Haus",
      commercial: "Gewerbe",
      land: "Grundstück",
      parking: "Stellplatz",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const getMarketingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: "Kauf",
      rent: "Miete",
      lease: "Pacht",
    };
    return labels[type] || type;
  };

  const getConditionLabel = (condition: string | null) => {
    if (!condition) return null;
    const labels: Record<string, string> = {
      first_time_use: "Erstbezug",
      mint_condition: "Neuwertig",
      refurbished: "Saniert",
      modernized: "Modernisiert",
      fully_renovated: "Vollständig renoviert",
      well_kept: "Gepflegt",
      negotiable: "Verhandlungsbasis",
      in_need_of_renovation: "Renovierungsbedürftig",
      demolished: "Abbruchreif",
    };
    return labels[condition] || condition;
  };

  // Build features list with checkmarks
  const features: string[] = [];
  
  if (property.hasBalcony) features.push("Balkon");
  if (property.hasTerrace) features.push("Terrasse");
  if (property.hasGarden) features.push("Garten / -mitbenutzung");
  if (property.hasElevator) features.push("Aufzug");
  if (property.hasParking) features.push("Parkplatz");
  if (property.hasBasement) features.push("Keller");
  if (property.hasGuestToilet) features.push("Gäste-WC");
  if (property.hasBuiltInKitchen) features.push("Einbauküche vorhanden");

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {APP_LOGO && (
                <img src={APP_LOGO} alt="Logo" className="h-8 w-auto" />
              )}
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection(objektdatenRef)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Objektdaten
              </button>
              <button
                onClick={() => scrollToSection(bilderRef)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Bilder
              </button>
              <button
                onClick={() => scrollToSection(lageRef)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Lage
              </button>
              {documents && documents.filter((doc: any) => doc.showOnLandingPage === 1).length > 0 && (
                <button
                  onClick={() => scrollToSection(dokumenteRef)}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dokumente
                </button>
              )}
              <button
                onClick={() => scrollToSection(kontaktRef)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Kontakt
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Exposé drucken
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Property Image */}
      <div className="relative">
        {property.images && property.images.length > 0 ? (
          <div className="w-full h-[500px] overflow-hidden">
            <img
              src={convertToProxyUrl((typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.imageUrl) || '')}
              alt={property.headline || property.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <p className="text-gray-400 text-lg">Kein Bild verfügbar</p>
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#0066A1]">
          {property.headline || property.title}
        </h1>
        <p className="text-gray-600">
          {[property.street, property.houseNumber, property.zipCode, property.city]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        {/* Objektbeschreibung Section */}
        {property.description && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">📝 Objektbeschreibung</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {property.description}
            </div>
          </section>
        )}

        {/* Ausstattung & Highlights */}
        {property.descriptionHighlights && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">⭐ Ausstattung & Highlights</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {property.descriptionHighlights}
            </div>
          </section>
        )}
        
        {/* Lage */}
        {property.descriptionLocation && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">📍 Lage</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {property.descriptionLocation}
            </div>
          </section>
        )}
        
        {/* Fazit */}
        {property.descriptionFazit && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">💚 Fazit</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {property.descriptionFazit}
            </div>
          </section>
        )}
        
        {/* Call-to-Action */}
        {property.descriptionCTA && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">📞 Kontaktieren Sie uns direkt!</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {property.descriptionCTA}
            </div>
          </section>
        )}

        {/* Objektdaten Section */}
        <section ref={objektdatenRef} className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Daten im Überblick</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y">
                {property.unit && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Einheit</td>
                    <td className="px-4 py-3">{property.unit}</td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 font-medium">Kategorie</td>
                  <td className="px-4 py-3">
                    {getMarketingTypeLabel(property.marketingType)} – {getPropertyTypeLabel(property.propertyType)}
                  </td>
                </tr>
                {property.price !== null && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Preis</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(property.price)}</td>
                  </tr>
                )}
                {property.buyerCommission && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Käuferprovision</td>
                    <td className="px-4 py-3">{property.buyerCommission}</td>
                  </tr>
                )}
                {property.rooms && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Zimmer</td>
                    <td className="px-4 py-3">{property.rooms}</td>
                  </tr>
                )}
                {property.livingArea && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Wohnfläche ca.</td>
                    <td className="px-4 py-3">{property.livingArea} m²</td>
                  </tr>
                )}
                {property.plotArea && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Grundstücksfläche ca.</td>
                    <td className="px-4 py-3">{property.plotArea} m²</td>
                  </tr>
                )}
                {property.bedrooms && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Anzahl Schlafzimmer</td>
                    <td className="px-4 py-3">{property.bedrooms}</td>
                  </tr>
                )}
                {property.bathrooms && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Anzahl Badezimmer</td>
                    <td className="px-4 py-3">{property.bathrooms}</td>
                  </tr>
                )}
                {property.condition && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Objektzustand</td>
                    <td className="px-4 py-3">{getConditionLabel(property.condition)}</td>
                  </tr>
                )}
                {property.yearBuilt && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Baujahr ca.</td>
                    <td className="px-4 py-3">{property.yearBuilt}</td>
                  </tr>
                )}
                {property.availableFrom && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Verfügbar ab</td>
                    <td className="px-4 py-3">
                      {new Date(property.availableFrom).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "long",
                      })}
                    </td>
                  </tr>
                )}
                {property.hasBalcony && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Balkon / Terrasse</td>
                    <td className="px-4 py-3">Ja</td>
                  </tr>
                )}
                {property.hasGarden && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Garten / -mitbenutzung</td>
                    <td className="px-4 py-3">Ja</td>
                  </tr>
                )}
                {property.hasBasement && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Keller</td>
                    <td className="px-4 py-3">Ja</td>
                  </tr>
                )}
                {property.hasGuestToilet && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Gäste-WC</td>
                    <td className="px-4 py-3">Ja</td>
                  </tr>
                )}
                {property.hasBuiltInKitchen && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Einbauküche</td>
                    <td className="px-4 py-3">Ja</td>
                  </tr>
                )}
                {property.hasParking && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Stellplatztyp</td>
                    <td className="px-4 py-3">Garage</td>
                  </tr>
                )}

                {property.floor && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Etagenzahl</td>
                    <td className="px-4 py-3">{property.floor}</td>
                  </tr>
                )}
                {property.lastModernization && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Letzte Modernisierung</td>
                    <td className="px-4 py-3">{property.lastModernization}</td>
                  </tr>
                )}


                {property.balconyArea && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Balkon/Terrasse Fläche ca.</td>
                    <td className="px-4 py-3">{property.balconyArea} m²</td>
                  </tr>
                )}


                {property.hasFireplace && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Kamin</td>
                    <td className="px-4 py-3">Ja</td>
                  </tr>
                )}

                {property.distanceToPublicTransport && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Fußweg zu öffentl. Verkehrsmitteln</td>
                    <td className="px-4 py-3">{property.distanceToPublicTransport} Min.</td>
                  </tr>
                )}
                {property.distanceToHighway && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Entfernung zur Autobahn</td>
                    <td className="px-4 py-3">{property.distanceToHighway} km</td>
                  </tr>
                )}
                {property.yearBuilt && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Baujahr Anlagentechnik</td>
                    <td className="px-4 py-3">{property.yearBuilt}</td>
                  </tr>
                )}
                {property.heatingType && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Heizungsart</td>
                    <td className="px-4 py-3">{property.heatingType}</td>
                  </tr>
                )}
                {property.mainEnergySource && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Wesentlicher Energieträger</td>
                    <td className="px-4 py-3">{property.mainEnergySource}</td>
                  </tr>
                )}
                {property.energyCertificateType && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Energieausweistyp</td>
                    <td className="px-4 py-3">{property.energyCertificateType}</td>
                  </tr>
                )}
                {property.energyConsumption && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Endenergiebedarf</td>
                    <td className="px-4 py-3">{property.energyConsumption} kWh/(m²*a)</td>
                  </tr>
                )}
                {property.energyClass && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Energieeffizienzklasse</td>
                    <td className="px-4 py-3">{property.energyClass}</td>
                  </tr>
                )}
                {property.energyCertificateIssueDate && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Energieausweis: Ausstellungsdatum</td>
                    <td className="px-4 py-3">{new Date(property.energyCertificateIssueDate).toLocaleDateString('de-DE')}</td>
                  </tr>
                )}
                {property.energyCertificateValidUntil && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Energieausweis: gültig bis</td>
                    <td className="px-4 py-3">{new Date(property.energyCertificateValidUntil).toLocaleDateString('de-DE')}</td>
                  </tr>
                )}

                {/* Additional fields from Propstack */}
                {property.unitNumber && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Einheit</td>
                    <td className="px-4 py-3">{property.unitNumber}</td>
                  </tr>
                )}
                {property.buyerCommission && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Käuferprovision</td>
                    <td className="px-4 py-3">{property.buyerCommission}</td>
                  </tr>
                )}
                {property.floors && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Etagenzahl</td>
                    <td className="px-4 py-3">{property.floors}</td>
                  </tr>
                )}
                {property.parkingSpaces && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Anzahl Parkplätze</td>
                    <td className="px-4 py-3">{property.parkingSpaces}</td>
                  </tr>
                )}
                {property.parkingPrice && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Stellplatz-Preis</td>
                    <td className="px-4 py-3">{(property.parkingPrice / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                )}
                {property.parkingType && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Stellplatztyp</td>
                    <td className="px-4 py-3">{property.parkingType}</td>
                  </tr>
                )}
                {property.usableArea && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Nutzfläche ca.</td>
                    <td className="px-4 py-3">{property.usableArea} m²</td>
                  </tr>
                )}
                {property.coldRent && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Kaltmiete</td>
                    <td className="px-4 py-3">{(property.coldRent / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                )}
                {property.warmRent && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Warmmiete</td>
                    <td className="px-4 py-3">{(property.warmRent / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                )}
                {property.additionalCosts && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Nebenkosten</td>
                    <td className="px-4 py-3">{(property.additionalCosts / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                )}
                {property.heatingCostsIncluded !== null && property.heatingCostsIncluded !== undefined && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Heizkosten in Nebenkosten enthalten</td>
                    <td className="px-4 py-3">{property.heatingCostsIncluded ? 'Ja' : 'Nein'}</td>
                  </tr>
                )}
                {property.equipmentQuality && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Qualität der Ausstattung</td>
                    <td className="px-4 py-3">{property.equipmentQuality}</td>
                  </tr>
                )}
                {property.constructionPhase && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Bauphase</td>
                    <td className="px-4 py-3">{property.constructionPhase}</td>
                  </tr>
                )}
                {property.monthlyRentalIncome && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Mtl. Mieteinnahmen</td>
                    <td className="px-4 py-3">{(property.monthlyRentalIncome / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                )}
                {property.isRented !== null && property.isRented !== undefined && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Vermietet</td>
                    <td className="px-4 py-3">{property.isRented ? 'Ja' : 'Nein'}</td>
                  </tr>
                )}
                {property.flooringTypes && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Bodenbelag</td>
                    <td className="px-4 py-3">{property.flooringTypes}</td>
                  </tr>
                )}
                {property.bathroomEquipment && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Bad</td>
                    <td className="px-4 py-3">{property.bathroomEquipment}</td>
                  </tr>
                )}
                {property.suitableForVacation !== null && property.suitableForVacation !== undefined && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Als Ferienwohnung geeignet</td>
                    <td className="px-4 py-3">{property.suitableForVacation ? 'Ja' : 'Nein'}</td>
                  </tr>
                )}
                {property.hasStorageRoom !== null && property.hasStorageRoom !== undefined && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Abstellraum</td>
                    <td className="px-4 py-3">{property.hasStorageRoom ? 'Ja' : 'Nein'}</td>
                  </tr>
                )}
                {property.distanceToMainStation && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Fahrzeit nächster Hauptbahnhof</td>
                    <td className="px-4 py-3">{property.distanceToMainStation} Min.</td>
                  </tr>
                )}
                {property.distanceToAirport && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Fahrzeit nächster Flughafen</td>
                    <td className="px-4 py-3">{property.distanceToAirport} Min.</td>
                  </tr>
                )}
                {property.distanceToPublicTransportKm && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Entfernung zu öffentl. Verkehrsmitteln</td>
                    <td className="px-4 py-3">{property.distanceToPublicTransportKm} km</td>
                  </tr>
                )}
                {property.distanceToMainStationKm && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Entfernung nächster Hauptbahnhof</td>
                    <td className="px-4 py-3">{property.distanceToMainStationKm} km</td>
                  </tr>
                )}
                {property.distanceToAirportKm && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Entfernung nächster Flughafen</td>
                    <td className="px-4 py-3">{property.distanceToAirportKm} km</td>
                  </tr>
                )}
                {property.heatingSystemYear && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">Baujahr Anlagentechnik</td>
                    <td className="px-4 py-3">{property.heatingSystemYear}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bilder Section */}
        {property.images && property.images.length > 0 && (
          <section ref={bilderRef} className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Bildergalerie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.images.map((image: any, index: number) => (
                <div 
                  key={index} 
                  className="aspect-video overflow-hidden rounded-lg border cursor-pointer"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={convertToProxyUrl(image.imageUrl || image)}
                    alt={`${property.headline || property.title} - Bild ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Floorplans Section */}
        {property.floorPlans && property.floorPlans.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Grundrisse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.floorPlans.map((plan: any, index: number) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={convertToProxyUrl(plan.imageUrl || plan)}
                    alt={`Grundriss ${index + 1}`}
                    className="w-full h-auto object-contain bg-white"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lage Section */}
        <section ref={lageRef} className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Lage</h2>
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700">
              Entdecken Sie die ideale Lage dieser Immobilie in{" "}
              {[property.city, property.zipCode].filter(Boolean).join(" ")}.
            </p>
          </div>
          {property.latitude && property.longitude && (
            <div className="w-full h-[400px] bg-gray-100 rounded-lg border overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude) - 0.01},${Number(property.latitude) - 0.01},${Number(property.longitude) + 0.01},${Number(property.latitude) + 0.01}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                allowFullScreen
              ></iframe>
            </div>
          )}
        </section>

        {/* Other Section - Contact Info */}
        {settings?.companyPhone && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Kontaktinformationen</h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                <span className="font-semibold">📞 Jetzt Besichtigungstermin vereinbaren!</span>
              </p>
              <p className="text-gray-700">
                📲 Telefon:{" "}
                <a href={`tel:${settings.companyPhone}`} className="text-primary hover:underline font-medium">
                  {settings.companyPhone}
                </a>
              </p>
              {settings.companyEmail && (
                <p className="text-gray-700">
                  📧 E-Mail:{" "}
                  <a href={`mailto:${settings.companyEmail}`} className="text-primary hover:underline font-medium">
                    {settings.companyEmail}
                  </a>
                </p>
              )}
              <p className="text-gray-700">
                💬 Oder einfach per WhatsApp:{" "}
                <a href={`https://wa.me/${settings.companyPhone?.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  {settings.companyPhone}
                </a>
              </p>
            </div>
          </section>
        )}

        {/* Dokumente Section */}
        {documents && documents.filter((doc: any) => doc.showOnLandingPage === 1).length > 0 && (
          <section ref={dokumenteRef} className="scroll-mt-20 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Dokumente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents
                .filter((doc: any) => doc.showOnLandingPage === 1)
                .map((doc: any) => (
                  <a
                    key={doc.id}
                    href={convertToProxyUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:border-[#0066A1] hover:shadow-md transition-all group"
                  >
                    <div className="p-3 bg-[#0066A1]/10 rounded-lg group-hover:bg-[#0066A1]/20 transition-colors">
                      <svg className="w-6 h-6 text-[#0066A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                      <p className="text-sm text-gray-500">{doc.category}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0066A1] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
            </div>
          </section>
        )}

        {/* Kontakt Section */}
        <section ref={kontaktRef} className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Kontaktformular</h2>
          <div className="max-w-2xl">

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={leadData.firstName}
                    onChange={(e) =>
                      setLeadData({ ...leadData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={leadData.lastName}
                    onChange={(e) =>
                      setLeadData({ ...leadData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadData.email}
                  onChange={(e) =>
                    setLeadData({ ...leadData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={leadData.phone}
                  onChange={(e) =>
                    setLeadData({ ...leadData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="message">Nachricht</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={leadData.message}
                  onChange={(e) =>
                    setLeadData({ ...leadData, message: e.target.value })
                  }
                  placeholder="Ihre Nachricht an uns..."
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? "Wird gesendet..." : "Anfrage senden"}
              </Button>
            </form>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Kontakt</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {settings?.companyName && <p className="font-medium text-gray-900">{settings.companyName}</p>}
                {settings?.companyAddress && <p>{settings.companyAddress}</p>}
                {settings?.companyPhone && (
                  <p>
                    Tel: <a href={`tel:${settings.companyPhone}`} className="hover:text-primary">{settings.companyPhone}</a>
                  </p>
                )}
                {settings?.companyEmail && (
                  <p>
                    E-Mail: <a href={`mailto:${settings.companyEmail}`} className="hover:text-primary">{settings.companyEmail}</a>
                  </p>
                )}
                {settings?.companyWebsite && (
                  <p>
                    Web: <a href={settings.companyWebsite} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{settings.companyWebsite}</a>
                  </p>
                )}
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Rechtliches</h3>
              <div className="space-y-2 text-sm">
                {settings?.impressum && (
                  <button
                    onClick={() => setLegalModal({ isOpen: true, title: "Impressum", content: settings.impressum || "" })}
                    className="block text-gray-600 hover:text-primary text-left"
                  >
                    Impressum
                  </button>
                )}
                {settings?.agb && (
                  <button
                    onClick={() => setLegalModal({ isOpen: true, title: "AGB", content: settings.agb || "" })}
                    className="block text-gray-600 hover:text-primary text-left"
                  >
                    AGB
                  </button>
                )}
                {settings?.datenschutz && (
                  <button
                    onClick={() => setLegalModal({ isOpen: true, title: "Datenschutzerklärung", content: settings.datenschutz || "" })}
                    className="block text-gray-600 hover:text-primary text-left"
                  >
                    Datenschutzerklärung
                  </button>
                )}
              </div>
            </div>

            {/* Company Logo */}
            <div className="flex items-center justify-center md:justify-end">
              {settings?.companyLogo && (
                <img src={settings.companyLogo} alt="Company Logo" className="max-h-20 max-w-full object-contain" />
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} {settings?.companyName || 'Immobilienverwaltung'}. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      <Dialog open={legalModal.isOpen} onOpenChange={(open) => setLegalModal({ ...legalModal, isOpen: open })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{legalModal.title}</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700">{legalModal.content}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          nav, button, footer {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {property?.images && property.images.length > 0 && (
              <>
                <img
                  src={convertToProxyUrl(property.images[lightboxIndex]?.imageUrl || property.images[lightboxIndex])}
                  alt={`${property.headline || property.title} - Bild ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : property.images.length - 1));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex((prev) => (prev < property.images.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                      {lightboxIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
