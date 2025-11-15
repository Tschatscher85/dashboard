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
                    
                    // Extract numeric values from text (e.g., "5 Min" -> 5, "2,3 km" -> 2.3)
                    const durationValue = element.duration.value / 60; // Convert seconds to minutes
                    const distanceValue = element.distance.value / 1000; // Convert meters to kilometers

                    // Update form data based on type
                    if (destType === "transit") {
                      handleChange("walkingTimeToPublicTransport", Math.round(durationValue));
                      handleChange("distanceToPublicTransport", parseFloat(distanceValue.toFixed(1)));
                    } else if (destType === "highway") {
                      handleChange("drivingTimeToHighway", Math.round(durationValue));
                      handleChange("distanceToHighway", parseFloat(distanceValue.toFixed(1)));
                    } else if (destType === "train") {
                      handleChange("drivingTimeToMainStation", Math.round(durationValue));
                      handleChange("distanceToMainStation", parseFloat(distanceValue.toFixed(1)));
                    } else if (destType === "airport") {
                      handleChange("drivingTimeToAirport", Math.round(durationValue));
                      handleChange("distanceToAirport", parseFloat(distanceValue.toFixed(1)));
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
            <Select 
              value={formData.caregiverId?.toString() || ""}
              onValueChange={(value) => handleChange("caregiverId", value ? parseInt(value) : null)}
              disabled={!isEditing}
            >
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
              value={formData.ownerId?.toString() || ""}
              onChange={(e) => handleChange("ownerId", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Typ (optional)</Label>
            <Input
              value={formData.ownerType || ""}
              onChange={(e) => handleChange("ownerType", e.target.value)}
              placeholder="Typ"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Käufer</Label>
            <Input
              value={formData.buyerId?.toString() || ""}
              onChange={(e) => handleChange("buyerId", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Notar</Label>
            <Input
              value={formData.notaryId?.toString() || ""}
              onChange={(e) => handleChange("notaryId", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Hausverwaltung</Label>
            <Input
              value={formData.propertyManagementId?.toString() || ""}
              onChange={(e) => handleChange("propertyManagementId", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Mieter</Label>
            <Input
              value={formData.tenantId?.toString() || ""}
              onChange={(e) => handleChange("tenantId", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Verknüpfte Kontakte</Label>
            <Input
              value={formData.linkedContactIds || ""}
              onChange={(e) => handleChange("linkedContactIds", e.target.value)}
              placeholder="Kontakt suchen"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Typ (optional)</Label>
            <Input
              value={formData.linkedContactType || ""}
              onChange={(e) => handleChange("linkedContactType", e.target.value)}
              placeholder="Typ"
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>
