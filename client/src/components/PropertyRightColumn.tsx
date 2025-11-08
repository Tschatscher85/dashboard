import { useState } from "react";
import type { Property } from "../../../drizzle/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Globe, RefreshCw, Ban, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PropertyRightColumnProps {
  property: Property;
  formData: Partial<Property>;
  isEditing: boolean;
  handleChange: (field: keyof Property, value: any) => void;
}

export function PropertyRightColumn({
  property,
  formData,
  isEditing,
  handleChange,
}: PropertyRightColumnProps) {
  const [commissionType, setCommissionType] = useState<"percent" | "euro">("percent");
  const [externalCommissionType, setExternalCommissionType] = useState<"percent" | "euro">("percent");

  const [isCalculating, setIsCalculating] = useState(false);
  
  // Homepage sync handlers
  const utils = trpc.useUtils();
  
  const handleHomepageExport = async () => {
    try {
      const result = await utils.client.properties.exportForHomepage.query({ propertyIds: [property.id] });
      toast.success("Objekt erfolgreich für Homepage exportiert!");
      console.log("Export result:", result);
    } catch (error: any) {
      toast.error(`Fehler beim Export: ${error.message}`);
    }
  };
  
  const handleHomepageSync = async () => {
    // Get homepage URL from settings
    const homepageUrl = prompt("Bitte geben Sie die URL Ihrer Homepage ein:");
    if (!homepageUrl) return;
    
    try {
      await utils.client.properties.syncToHomepage.mutate({ 
        homepageUrl,
        propertyIds: [property.id] 
      });
      toast.success("Objekt erfolgreich zur Homepage synchronisiert!");
    } catch (error: any) {
      toast.error(`Fehler beim Synchronisieren: ${error.message}`);
    }
  };

  const calculateDistances = async () => {
    if (!formData.street || !formData.city) {
      toast.error("Bitte geben Sie zuerst eine vollständige Adresse ein");
      return;
    }

    setIsCalculating(true);
    const origin = `${formData.street} ${formData.houseNumber || ""}, ${formData.zipCode || ""} ${formData.city}, ${formData.country || "Deutschland"}`;

    try {
      // Wait for Google Maps to be loaded with timeout
      let attempts = 0;
      while (attempts < 30 && (typeof (window as any).google === 'undefined' || !(window as any).google?.maps)) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (typeof (window as any).google === 'undefined' || !(window as any).google?.maps) {
        toast.error("Google Maps konnte nicht geladen werden. Bitte laden Sie die Seite neu.");
        setIsCalculating(false);
        return;
      }

      const google = (window as any).google;
      
      // Check if Distance Matrix service is available
      if (!google.maps.DistanceMatrixService || !google.maps.Geocoder) {
        toast.error("Google Maps Services sind nicht verfügbar");
        setIsCalculating(false);
        return;
      }

      const service = new google.maps.DistanceMatrixService();
      const geocoder = new google.maps.Geocoder();
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));

      // First, geocode the origin to get coordinates
      const originCoords: any = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: origin }, (results: any, status: any) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results[0].geometry.location);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      // Define known locations for common regions
      const getKnownLocations = (city: string) => {
        const cityLower = city.toLowerCase();
        
        if (cityLower.includes("geislingen")) {
          return {
            transit: "Bahnhofstraße, 73312 Geislingen an der Steige",
            highway: "A8 Anschlussstelle Geislingen",
            trainStation: "Geislingen (Steige) Bahnhof",
            airport: "Flughafen Stuttgart (STR)"
          };
        }
        // Default fallback
        return {
          transit: "Bahnhof " + city,
          highway: "A8 " + city,
          trainStation: city + " Bahnhof",
          airport: "Flughafen Stuttgart"
        };
      };
      
      const city = formData.city || "Geislingen an der Steige";
      const knownLocations = getKnownLocations(city);
      
      // Helper function to calculate distance to known location
      const calculateToKnownLocation = (destType: string, locationQuery: string, mode: string): Promise<void> => {
        return new Promise((resolve) => {
          // Geocode the known location
          geocoder.geocode({ address: locationQuery }, (results: any, status: any) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              const destination = results[0].geometry.location;

              service.getDistanceMatrix(
                {
                  origins: [originCoords],
                  destinations: [destination],
                  travelMode: mode,
                  unitSystem: google.maps.UnitSystem.METRIC,
                },
                (response: any, matrixStatus: any) => {
                  if (matrixStatus === google.maps.DistanceMatrixStatus.OK && 
                      response.rows[0]?.elements[0]?.status === "OK") {
                    const element = response.rows[0].elements[0];
                    const durationText = element.duration.text;
                    const distanceText = element.distance.text;

                    // Update form data based on type
                    if (destType === "transit") {
                      handleChange("walkingTimeToPublicTransport", durationText);
                      handleChange("distanceToPublicTransport", distanceText);
                    } else if (destType === "highway") {
                      handleChange("drivingTimeToHighway", durationText);
                      handleChange("distanceToHighway", distanceText);
                    } else if (destType === "train") {
                      handleChange("drivingTimeToMainStation", durationText);
                      handleChange("distanceToMainStation", distanceText);
                    } else if (destType === "airport") {
                      handleChange("drivingTimeToAirport", durationText);
                      handleChange("distanceToAirport", distanceText);
                    }
                  } else {
                    console.warn(`Could not calculate distance for ${destType}:`, matrixStatus);
                  }
                  resolve();
                }
              );
            } else {
              console.warn(`Geocoding failed for ${locationQuery}:`, status);
              resolve();
            }
          });
        });
      };

      // Calculate all distances using known locations
      await Promise.all([
        calculateToKnownLocation("transit", knownLocations.transit, "WALKING"),
        calculateToKnownLocation("highway", knownLocations.highway, "DRIVING"),
        calculateToKnownLocation("train", knownLocations.trainStation, "DRIVING"),
        calculateToKnownLocation("airport", knownLocations.airport, "DRIVING"),
      ]);
      
      toast.success("Fahrzeiten erfolgreich berechnet");
    } catch (error) {
      console.error("Distance calculation error:", error);
      toast.error("Fehler bei der Distanzberechnung");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <>
      {/* Ansprechpartner */}
      <Card>
        <CardHeader>
          <CardTitle>Ansprechpartner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Betreuer</Label>
            <Select disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Betreuer wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user1">Sven Jaeger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Eigentümer *</Label>
            <Input
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Typ (optional)</Label>
            <Input
              placeholder="Typ"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Käufer</Label>
            <Input
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Notar</Label>
            <Input
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Hausverwaltung</Label>
            <Input
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Mieter</Label>
            <Input
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Verknüpfte Kontakte</Label>
            <Input
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Typ (optional)</Label>
            <Input
              placeholder="Typ"
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Portale */}
      <Card>
        <CardHeader>
          <CardTitle>Portale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Portal-Export (2)</Label>
            <Button size="sm" variant="outline" disabled={!isEditing}>
              <Globe className="h-4 w-4 mr-2" />
              Überall veröffentlichen
            </Button>
          </div>

          {/* Portal List */}
          <div className="space-y-2">
            {/* Homepage Export */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium">Homepage</span>
                  <span className="text-sm text-muted-foreground ml-2">Export zur eigenen Website</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-blue-600" 
                  disabled={!isEditing}
                  onClick={handleHomepageExport}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Veröffentlichen
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-green-600" 
                  disabled={!isEditing}
                  onClick={handleHomepageSync}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Aktualisieren
                </Button>
              </div>
            </div>

            {/* ImmoScout24 */}
            <div className={`p-3 border rounded-lg ${
              formData.is24PublishStatus === "published" ? "bg-green-50 border-green-200" :
              formData.is24PublishStatus === "error" ? "bg-red-50 border-red-200" :
              formData.is24PublishStatus === "unpublished" ? "bg-yellow-50 border-yellow-200" :
              "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium">ImmoScout24</span>
                  <span className={`text-sm ml-2 font-medium ${
                    formData.is24PublishStatus === "published" ? "text-green-700" :
                    formData.is24PublishStatus === "error" ? "text-red-700" :
                    formData.is24PublishStatus === "unpublished" ? "text-yellow-700" :
                    "text-gray-600"
                  }`}>
                    {formData.is24PublishStatus === "published" ? "✓ Veröffentlicht" :
                     formData.is24PublishStatus === "error" ? "⚠️ Fehler" :
                     formData.is24PublishStatus === "unpublished" ? "Deaktiviert" :
                     "Entwurf"}
                  </span>
                </div>
              </div>
              
              {formData.is24ExternalId && (
                <p className="text-xs text-muted-foreground mb-2">
                  ID: {formData.is24ExternalId}
                </p>
              )}
              
              {formData.is24LastSyncedAt && (
                <p className="text-xs text-muted-foreground mb-2">
                  Zuletzt synchronisiert: {new Date(formData.is24LastSyncedAt).toLocaleString("de-DE")}
                </p>
              )}
              
              <div className="flex flex-col gap-2 mt-2">
                {!formData.is24ExternalId ? (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                    disabled
                    onClick={() => toast.info("⚠️ Veröffentlichung wird in der finalen API-Integration aktiviert")}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Veröffentlichen
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 w-full"
                      disabled
                      onClick={() => toast.info("⚠️ Aktualisierung wird in der finalen API-Integration aktiviert")}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Aktualisieren
                    </Button>
                    {formData.is24PublishStatus === "published" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 w-full"
                        disabled
                        onClick={() => toast.info("⚠️ Deaktivierung wird in der finalen API-Integration aktiviert")}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Deaktivieren
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 italic">
                ⚠️ Buttons werden mit API-Integration aktiviert
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">TIPP</p>
            <p className="text-sm text-muted-foreground mb-2">
              Kontaktanfragen erhöhen: Spitzenplatzierung buchen.
            </p>
            <Button size="sm" className="bg-teal-500 hover:bg-teal-600" disabled={!isEditing}>
              Jetzt buchen
            </Button>
          </div>

          <div>
            <Label>IS24-Ansprechpartner</Label>
            <Select disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Sven Jaeger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sven">Sven Jaeger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>IS24-ID</Label>
            <Input
              placeholder="158820057"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>IS24-Gruppen-Nr.</Label>
            <Input disabled={!isEditing} />
          </div>

          <div>
            <Label>Übersetzungen</Label>
            <Input
              placeholder="Übersetzungen"
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auftrag */}
      <Card>
        <CardHeader>
          <CardTitle>Auftrag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Auftragsart</Label>
            <Select disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alleinauftrag">Alleinauftrag</SelectItem>
                <SelectItem value="einfach">Einfacher Auftrag</SelectItem>
                <SelectItem value="qualifiziert">Qualifizierter Alleinauftrag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Laufzeit</Label>
            <Select disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unbefristet">Unbefristet</SelectItem>
                <SelectItem value="befristet">Befristet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Auftrag von bis</Label>
              <Input type="date" disabled={!isEditing} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Input type="date" disabled={!isEditing} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verkauf */}
      <Card>
        <CardHeader>
          <CardTitle>Verkauf</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verkaufsinformationen werden hier angezeigt
          </p>
        </CardContent>
      </Card>

      {/* Provision Intern */}
      <Card>
        <CardHeader>
          <CardTitle>Provision Intern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Innenprovision (intern)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="1"
                step="0.01"
                disabled={!isEditing}
                className="flex-1"
              />
              <div className="flex rounded-md overflow-hidden border">
                <Button
                  type="button"
                  variant={commissionType === "percent" ? "default" : "outline"}
                  className="rounded-none border-0"
                  size="sm"
                  onClick={() => setCommissionType("percent")}
                  disabled={!isEditing}
                >
                  %
                </Button>
                <Button
                  type="button"
                  variant={commissionType === "euro" ? "default" : "outline"}
                  className="rounded-none border-0"
                  size="sm"
                  onClick={() => setCommissionType("euro")}
                  disabled={!isEditing}
                >
                  €
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Außenprovision (intern)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="2,5"
                step="0.01"
                disabled={!isEditing}
                className="flex-1"
              />
              <div className="flex rounded-md overflow-hidden border">
                <Button
                  type="button"
                  variant={commissionType === "percent" ? "default" : "outline"}
                  className="rounded-none border-0"
                  size="sm"
                  onClick={() => setCommissionType("percent")}
                  disabled={!isEditing}
                >
                  %
                </Button>
                <Button
                  type="button"
                  variant={commissionType === "euro" ? "default" : "outline"}
                  className="rounded-none border-0"
                  size="sm"
                  onClick={() => setCommissionType("euro")}
                  disabled={!isEditing}
                >
                  €
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Gesamtprovision</Label>
            <Input
              placeholder="14.000 €"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Provision Extern */}
      <Card>
        <CardHeader>
          <CardTitle>Provision Extern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Außenprovision für Exposé</Label>
            <Input
              placeholder="2,50% inkl. MwSt."
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Provisionshinweis</Label>
            <Textarea
              placeholder="2,50 inkl. 19 % MwSt."
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Energieausweis */}
      <Card>
        <CardHeader>
          <CardTitle>Energieausweis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Energieausweis</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nicht_benoetigt">wird nicht benötigt</SelectItem>
                    <SelectItem value="liegt_vor">liegt vor</SelectItem>
                    <SelectItem value="zur_besichtigung">liegt zur Besichtigung vor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Erstellungsdatum</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ab_2014">ab 1. Mai 2014</SelectItem>
                    <SelectItem value="bis_2014">bis 30. April 2014</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ausstellungsdatum</Label>
                <Input type="date" disabled={!isEditing} className="h-10" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gültig bis</Label>
                <Input type="date" disabled={!isEditing} className="h-10" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Certificate Type & Efficiency */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Energieausweistyp</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bedarfsausweis">Bedarfsausweis</SelectItem>
                    <SelectItem value="verbrauchsausweis">Verbrauchsausweis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Energieeffizienzklasse</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_plus">A+</SelectItem>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                    <SelectItem value="e">E</SelectItem>
                    <SelectItem value="f">F</SelectItem>
                    <SelectItem value="g">G</SelectItem>
                    <SelectItem value="h">H</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Energy Consumption Values */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Energiekennwert</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    disabled={!isEditing}
                    className="h-10 pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    kWh/(m²·a)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Energiekennwert Strom</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    disabled={!isEditing}
                    className="h-10 pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    kWh/(m²·a)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Energiekennwert Wärme</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    disabled={!isEditing}
                    className="h-10 pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    kWh/(m²·a)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">CO2-Emissionen</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  disabled={!isEditing}
                  className="h-10 pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  kg/m²a
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Heating & Energy Source */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
              <Switch disabled={!isEditing} />
              <Label className="text-sm">Energieverbrauch für Warmwasser enthalten</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Heizungsart</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zentralheizung">Zentralheizung</SelectItem>
                    <SelectItem value="etagenheizung">Etagenheizung</SelectItem>
                    <SelectItem value="fernwaerme">Fernwärme</SelectItem>
                    <SelectItem value="fussboden">Fußbodenheizung</SelectItem>
                    <SelectItem value="ofenheizung">Ofenheizung</SelectItem>
                    <SelectItem value="nachtspeicher">Nachtspeicheröfen</SelectItem>
                    <SelectItem value="blockheizkraftwerk">Blockheizkraftwerk</SelectItem>
                    <SelectItem value="waermepumpe">Wärmepumpe</SelectItem>
                    <SelectItem value="pelletheizung">Pelletheizung</SelectItem>
                    <SelectItem value="elektro">Elektro-Heizung</SelectItem>
                    <SelectItem value="solar">Solar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Wesentlicher Energieträger</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oel">Öl</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="strom">Strom</SelectItem>
                    <SelectItem value="alternativ">Alternative Energien</SelectItem>
                    <SelectItem value="solar">Solar</SelectItem>
                    <SelectItem value="erdwaerme">Erdwärme</SelectItem>
                    <SelectItem value="luftwp">Luftwärmepumpe</SelectItem>
                    <SelectItem value="fernwaerme">Fernwärme</SelectItem>
                    <SelectItem value="holz">Holz</SelectItem>
                    <SelectItem value="fluessiggas">Flüssiggas</SelectItem>
                    <SelectItem value="kohle">Kohle</SelectItem>
                    <SelectItem value="pellet">Pellet</SelectItem>
                    <SelectItem value="waermepumpe">Wärmepumpe</SelectItem>
                    <SelectItem value="blockheizkraftwerk">Blockheizkraftwerk</SelectItem>
                    <SelectItem value="bhkw_fossil">BHKW fossil befeuert</SelectItem>
                    <SelectItem value="bhkw_regenerativ">BHKW regenerativ befeuert</SelectItem>
                    <SelectItem value="kwk_fossil">KWK fossil befeuert</SelectItem>
                    <SelectItem value="kwk_regenerativ">KWK regenerativ befeuert</SelectItem>
                    <SelectItem value="nahwaerme">Nahwärme</SelectItem>
                    <SelectItem value="windenergie">Windenergie</SelectItem>
                    <SelectItem value="bioenergie">Bioenergie</SelectItem>
                    <SelectItem value="biogas">Biogas</SelectItem>
                    <SelectItem value="biooele">Bioöle</SelectItem>
                    <SelectItem value="biomasse">Biomasse</SelectItem>
                    <SelectItem value="kamin">Kamin</SelectItem>
                    <SelectItem value="ofen">Ofen</SelectItem>
                    <SelectItem value="wasserstoff">Wasserstoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Building Year */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Baujahr</Label>
                <Input
                  type="number"
                  placeholder="z.B. 1990"
                  disabled={!isEditing}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Baujahr Anlagentechnik</Label>
                <Input
                  type="number"
                  placeholder="z.B. 2010"
                  disabled={!isEditing}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
              <Switch disabled={!isEditing} />
              <Label className="text-sm">Baujahr unbekannt</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verrechnung */}
      <Card>
        <CardHeader>
          <CardTitle>Verrechnung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verrechnungsinformationen werden hier angezeigt
          </p>
        </CardContent>
      </Card>

      {/* Fahrzeiten */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fahrzeiten</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={calculateDistances}
            disabled={!isEditing || isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            Distanzen berechnen
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Fußweg zu ÖPNV</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.walkingTimeToPublicTransport || ""}
                readOnly
                placeholder="z.B. 5 Min"
              />
              <Input
                value={formData.distanceToPublicTransport || ""}
                readOnly
                placeholder="z.B. 0,4 km"
              />
            </div>
          </div>

          <div>
            <Label>Fahrzeit nächste Autobahn</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.drivingTimeToHighway || ""}
                readOnly
                placeholder="z.B. 10 Min"
              />
              <Input
                value={formData.distanceToHighway || ""}
                readOnly
                placeholder="z.B. 8 km"
              />
            </div>
          </div>

          <div>
            <Label>Fahrzeit nächster HBF</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.drivingTimeToMainStation || ""}
                readOnly
                placeholder="z.B. 15 Min"
              />
              <Input
                value={formData.distanceToMainStation || ""}
                readOnly
                placeholder="z.B. 12 km"
              />
            </div>
          </div>

          <div>
            <Label>Fahrzeit nächster Flughafen</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={formData.drivingTimeToAirport || ""}
                readOnly
                placeholder="z.B. 45 Min"
              />
              <Input
                value={formData.distanceToAirport || ""}
                readOnly
                placeholder="z.B. 60 km"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
