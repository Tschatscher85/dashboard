import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Printer, Phone } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";

export default function PropertyLanding() {
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;

  const { data: property, isLoading } = trpc.properties.getById.useQuery({
    id: propertyId,
  });

  const [leadData, setLeadData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

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
              src={property.images[0]}
              alt={property.title}
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
          {property.title}
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
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">Objektbeschreibung</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {property.description}
            </div>
          </section>
        )}

        {/* Ausstattung & Highlights */}
        {features.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-[#0066A1]">Ausstattung & Highlights</h2>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Objektdaten Section */}
        <section ref={objektdatenRef} className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Daten im Überblick</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y">
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
              </tbody>
            </table>
          </div>
        </section>

        {/* Bilder Section */}
        {property.images && property.images.length > 0 && (
          <section ref={bilderRef} className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Bildergalerie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.images.map((image: string, index: number) => (
                <div key={index} className="aspect-video overflow-hidden rounded-lg border">
                  <img
                    src={image}
                    alt={`${property.title} - Bild ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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

        {/* Kontakt Section */}
        <section ref={kontaktRef} className="scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6 text-[#0066A1]">Kontakt</h2>
          <div className="max-w-2xl">
            <div className="bg-gray-50 border rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">📞 Kontaktieren Sie uns direkt!</p>
              <p className="text-gray-700">
                📲 Gerne auch per WhatsApp:{" "}
                <a href="tel:073319460350" className="text-primary hover:underline font-medium">
                  07331 9460350
                </a>
              </p>
            </div>

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

      {/* Print Styles */}
      <style>{`
        @media print {
          nav, button {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
