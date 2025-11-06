import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  Euro,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function PropertyDetail() {
  const [, params] = useRoute("/dashboard/properties/:id");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : 0;

  const { data: property, isLoading, refetch } = trpc.properties.getById.useQuery({
    id: propertyId,
  });

  const deleteMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Immobilie gelöscht");
      setLocation("/dashboard/properties");
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Immobilie nicht gefunden</h2>
          <Button className="mt-4" onClick={() => setLocation("/dashboard/properties")}>
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number | null) => {
    if (cents === null) return "Preis auf Anfrage";
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      available: { label: "Verfügbar", variant: "default" },
      reserved: { label: "Reserviert", variant: "secondary" },
      sold: { label: "Verkauft", variant: "outline" },
      rented: { label: "Vermietet", variant: "outline" },
      inactive: { label: "Inaktiv", variant: "destructive" },
    };
    const { label, variant } = config[status] || { label: status, variant: "default" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard/properties")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>
                {[property.street, property.houseNumber, property.zipCode, property.city]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm("Möchten Sie diese Immobilie wirklich löschen?")) {
                deleteMutation.mutate({ id: property.id });
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Preis</div>
                <div className="text-xl font-bold">{formatPrice(property.price)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Typ</div>
                <div className="text-xl font-bold">
                  {getPropertyTypeLabel(property.propertyType)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fläche</div>
                <div className="text-xl font-bold">
                  {property.livingArea ? `${property.livingArea} m²` : "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="mt-1">{getStatusBadge(property.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
          <TabsTrigger value="contacts">Kontakte</TabsTrigger>
          <TabsTrigger value="media">Medien</TabsTrigger>
          <TabsTrigger value="history">Historie</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {/* Stammdaten */}
          <Card>
            <CardHeader>
              <CardTitle>Stammdaten</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Kategorie</div>
                <div className="font-semibold">{getMarketingTypeLabel(property.marketingType)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Objektart</div>
                <div className="font-semibold">{getPropertyTypeLabel(property.propertyType)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div>{getStatusBadge(property.status)}</div>
              </div>

            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardHeader>
              <CardTitle>Adresse</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Straße + Nr.</div>
                <div className="font-semibold">
                  {[property.street, property.houseNumber].filter(Boolean).join(" ") || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">PLZ / Ort</div>
                <div className="font-semibold">
                  {[property.zipCode, property.city].filter(Boolean).join(" ") || "-"}
                </div>
              </div>
              {property.country && (
                <div>
                  <div className="text-sm text-muted-foreground">Land</div>
                  <div className="font-semibold">{property.country}</div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Preise */}
          <Card>
            <CardHeader>
              <CardTitle>Preise</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {property.marketingType === "sale" ? "Kaufpreis" : "Kaltmiete"}
                </div>
                <div className="text-2xl font-bold">{formatPrice(property.price)}</div>
              </div>
              {property.additionalCosts && (
                <div>
                  <div className="text-sm text-muted-foreground">Nebenkosten</div>
                  <div className="font-semibold">{formatPrice(property.additionalCosts)}</div>
                </div>
              )}
              {property.heatingCosts && (
                <div>
                  <div className="text-sm text-muted-foreground">Heizkosten</div>
                  <div className="font-semibold">{formatPrice(property.heatingCosts)}</div>
                </div>
              )}
              {property.deposit && (
                <div>
                  <div className="text-sm text-muted-foreground">Kaution</div>
                  <div className="font-semibold">{formatPrice(property.deposit)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flächen */}
          <Card>
            <CardHeader>
              <CardTitle>Flächen</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {property.livingArea && (
                <div>
                  <div className="text-sm text-muted-foreground">Wohnfläche</div>
                  <div className="font-semibold">{property.livingArea} m²</div>
                </div>
              )}
              {property.plotArea && (
                <div>
                  <div className="text-sm text-muted-foreground">Grundstücksfläche</div>
                  <div className="font-semibold">{property.plotArea} m²</div>
                </div>
              )}
              {property.rooms && (
                <div>
                  <div className="text-sm text-muted-foreground">Zimmer</div>
                  <div className="font-semibold">{property.rooms}</div>
                </div>
              )}
              {property.bedrooms && (
                <div>
                  <div className="text-sm text-muted-foreground">Schlafzimmer</div>
                  <div className="font-semibold">{property.bedrooms}</div>
                </div>
              )}
              {property.bathrooms && (
                <div>
                  <div className="text-sm text-muted-foreground">Badezimmer</div>
                  <div className="font-semibold">{property.bathrooms}</div>
                </div>
              )}
              {property.floor !== null && property.floor !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Etage</div>
                  <div className="font-semibold">{property.floor}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ausstattung */}
          <Card>
            <CardHeader>
              <CardTitle>Ausstattung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {property.hasBalcony && <div className="flex items-center gap-2">✓ Balkon</div>}
                {property.hasTerrace && <div className="flex items-center gap-2">✓ Terrasse</div>}
                {property.hasGarden && <div className="flex items-center gap-2">✓ Garten</div>}
                {property.hasElevator && <div className="flex items-center gap-2">✓ Aufzug</div>}
                {property.hasParking && <div className="flex items-center gap-2">✓ Parkplatz</div>}
                {property.hasBasement && <div className="flex items-center gap-2">✓ Keller</div>}
              </div>
            </CardContent>
          </Card>

          {/* Beschreibung */}
          {property.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{property.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Aktivitäten vorhanden</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Verknüpfte Kontakte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Kontakte verknüpft</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Medien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Medien hochgeladen</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Immobilie erstellt</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(property.createdAt), "PPP 'um' HH:mm 'Uhr'", { locale: de })}
                    </div>
                  </div>
                </div>
                {property.updatedAt && property.updatedAt !== property.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Edit className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Zuletzt bearbeitet</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(property.updatedAt), "PPP 'um' HH:mm 'Uhr'", { locale: de })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
