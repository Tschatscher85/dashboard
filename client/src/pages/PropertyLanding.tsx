import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  MapPin,
  Ruler,
  Bed,
  Bath,
  Calendar,
  Mail,
  Phone,
  Euro,
  Home,
  Car,
  Leaf,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

  const handleSubmitLead = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto h-full flex flex-col justify-center px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              {getPropertyTypeLabel(property.propertyType)} • {getMarketingTypeLabel(property.marketingType)}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">
                {[property.street, property.houseNumber, property.zipCode, property.city]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            </div>
            <div className="text-4xl font-bold text-primary">
              {property.price !== null ? formatPrice(property.price) : "Preis auf Anfrage"}
            </div>
          </div>
        </div>
      </div>

      {/* Key Facts */}
      <div className="container mx-auto -mt-16 px-4 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {property.livingArea && (
            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Ruler className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{property.livingArea}</div>
                    <div className="text-sm text-muted-foreground">m² Wohnfläche</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {property.rooms && (
            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{property.rooms}</div>
                    <div className="text-sm text-muted-foreground">Zimmer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {property.bedrooms && (
            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bed className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{property.bedrooms}</div>
                    <div className="text-sm text-muted-foreground">Schlafzimmer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {property.bathrooms && (
            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bath className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{property.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">Badezimmer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            {property.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Objektbeschreibung</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Ausstattung</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.hasBalcony && (
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-primary" />
                      <span>Balkon</span>
                    </div>
                  )}
                  {property.hasTerrace && (
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-primary" />
                      <span>Terrasse</span>
                    </div>
                  )}
                  {property.hasGarden && (
                    <div className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-primary" />
                      <span>Garten</span>
                    </div>
                  )}
                  {property.hasElevator && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>Aufzug</span>
                    </div>
                  )}
                  {property.hasParking && (
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      <span>Parkplatz</span>
                    </div>
                  )}
                  {property.hasBasement && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>Keller</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Objektdetails</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.plotArea && (
                    <div>
                      <div className="text-sm text-muted-foreground">Grundstücksfläche</div>
                      <div className="font-semibold">{property.plotArea} m²</div>
                    </div>
                  )}
                  {property.floor !== null && property.floor !== undefined && (
                    <div>
                      <div className="text-sm text-muted-foreground">Etage</div>
                      <div className="font-semibold">{property.floor}</div>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div>
                      <div className="text-sm text-muted-foreground">Baujahr</div>
                      <div className="font-semibold">{property.yearBuilt}</div>
                    </div>
                  )}
                  {property.availableFrom && (
                    <div>
                      <div className="text-sm text-muted-foreground">Verfügbar ab</div>
                      <div className="font-semibold">
                        {new Date(property.availableFrom).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Energy */}
            {(property.energyClass || property.energyConsumption) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Energieausweis</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.energyClass && (
                      <div>
                        <div className="text-sm text-muted-foreground">Energieeffizienzklasse</div>
                        <div className="font-semibold text-2xl">{property.energyClass}</div>
                      </div>
                    )}
                    {property.energyConsumption && (
                      <div>
                        <div className="text-sm text-muted-foreground">Energieverbrauch</div>
                        <div className="font-semibold">{property.energyConsumption} kWh/(m²*a)</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact */}
          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Interesse?</h2>
                <p className="text-muted-foreground mb-6">
                  Kontaktieren Sie uns für weitere Informationen oder eine Besichtigung.
                </p>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mb-4" size="lg">
                      <Mail className="mr-2 h-5 w-5" />
                      Anfrage senden
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Anfrage senden</DialogTitle>
                      <DialogDescription>
                        Senden Sie uns eine Nachricht zu dieser Immobilie. Wir melden uns
                        schnellstmöglich bei Ihnen.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Vorname *</Label>
                          <Input
                            id="firstName"
                            value={leadData.firstName}
                            onChange={(e) =>
                              setLeadData({ ...leadData, firstName: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Nachname *</Label>
                          <Input
                            id="lastName"
                            value={leadData.lastName}
                            onChange={(e) =>
                              setLeadData({ ...leadData, lastName: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={leadData.email}
                          onChange={(e) =>
                            setLeadData({ ...leadData, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
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
                      <div className="space-y-2">
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
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSubmitLead} className="w-full">
                        Anfrage absenden
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Telefonisch erreichbar</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Besichtigung nach Vereinbarung</span>
                  </div>
                </div>

                {/* Costs */}
                {(property.additionalCosts || property.heatingCosts || property.deposit) && (
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <h3 className="font-semibold mb-3">Kosten</h3>
                    {property.additionalCosts && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Nebenkosten</span>
                        <span className="font-semibold">
                          {formatPrice(property.additionalCosts)}
                        </span>
                      </div>
                    )}
                    {property.heatingCosts && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Heizkosten</span>
                        <span className="font-semibold">
                          {formatPrice(property.heatingCosts)}
                        </span>
                      </div>
                    )}
                    {property.deposit && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kaution</span>
                        <span className="font-semibold">
                          {formatPrice(property.deposit)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
