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
import { Switch } from "./ui/switch";
import { Globe, RefreshCw, Ban, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

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

  const calculateDistances = async () => {
    if (!formData.street || !formData.city) {
      toast.error("Bitte geben Sie zuerst eine vollständige Adresse ein");
      return;
    }

    setIsCalculating(true);
    const origin = `${formData.street} ${formData.houseNumber || ""}, ${formData.zipCode || ""} ${formData.city}, ${formData.country || "Deutschland"}`;

    try {
      // Define destinations for each travel time type
      const destinations = [
        { type: "transit", query: "public transport station near " + origin, mode: "walking" },
        { type: "highway", query: "highway entrance near " + origin, mode: "driving" },
        { type: "train", query: "hauptbahnhof near " + origin, mode: "driving" },
        { type: "airport", query: "airport near " + origin, mode: "driving" },
      ];

      // Use Google Maps Proxy via makeRequest
      const { makeRequest } = await import("../../../server/_core/map");
      
      for (const dest of destinations) {
        try {
          // First, find the nearest place
          const placesResponse = await fetch(`/api/map/places/textsearch?query=${encodeURIComponent(dest.query)}`);
          const placesData = await placesResponse.json();
          
          if (placesData.results && placesData.results.length > 0) {
            const destination = placesData.results[0].formatted_address;
            
            // Then calculate distance
            const distanceResponse = await fetch(
              `/api/map/distancematrix?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=${dest.mode}`
            );
            const distanceData = await distanceResponse.json();
            
            if (distanceData.rows && distanceData.rows[0].elements[0].status === "OK") {
              const element = distanceData.rows[0].elements[0];
              const durationText = element.duration.text;
              const distanceText = element.distance.text;
              
              // Update form data based on type
              if (dest.type === "transit") {
                handleChange("walkingTimeToPublicTransport", durationText);
                handleChange("distanceToPublicTransport", distanceText);
              } else if (dest.type === "highway") {
                handleChange("drivingTimeToHighway", durationText);
                handleChange("distanceToHighway", distanceText);
              } else if (dest.type === "train") {
                handleChange("drivingTimeToMainStation", durationText);
                handleChange("distanceToMainStation", distanceText);
              } else if (dest.type === "airport") {
                handleChange("drivingTimeToAirport", durationText);
                handleChange("distanceToAirport", distanceText);
              }
            }
          }
        } catch (err) {
          console.error(`Error calculating ${dest.type}:`, err);
        }
      }
      
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
          <div className="space-y-2">
            <Label>Betreuer</Label>
            <Select
              value={formData.supervisorId?.toString() || ""}
              onValueChange={(value) => handleChange("supervisorId", parseInt(value))}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Betreuer wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Sven Jaeger</SelectItem>
                {/* TODO: Load from users table */}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Eigentümer *</Label>
              <Input
                value={formData.ownerId?.toString() || ""}
                onChange={(e) => handleChange("ownerId", e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="Kontakt suchen"
              />
            </div>
            <div className="space-y-2">
              <Label>Typ (optional)</Label>
              <Input
                value={formData.ownerType || ""}
                onChange={(e) => handleChange("ownerType", e.target.value)}
                disabled={!isEditing}
                placeholder="Typ"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Käufer</Label>
            <Input
              value={formData.buyerId?.toString() || ""}
              onChange={(e) => handleChange("buyerId", e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="Kontakt suchen"
            />
          </div>

          <div className="space-y-2">
            <Label>Notar</Label>
            <Input
              value={formData.notaryId?.toString() || ""}
              onChange={(e) => handleChange("notaryId", e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="Kontakt suchen"
            />
          </div>

          <div className="space-y-2">
            <Label>Hausverwaltung</Label>
            <Input
              value={formData.propertyManagementId?.toString() || ""}
              onChange={(e) => handleChange("propertyManagementId", e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="Kontakt suchen"
            />
          </div>

          <div className="space-y-2">
            <Label>Mieter</Label>
            <Input
              value={formData.tenantId?.toString() || ""}
              onChange={(e) => handleChange("tenantId", e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="Kontakt suchen"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Verknüpfte Kontakte</Label>
              <Input
                disabled={!isEditing}
                placeholder="Kontakt suchen"
              />
            </div>
            <div className="space-y-2">
              <Label>Typ (optional)</Label>
              <Input
                disabled={!isEditing}
                placeholder="Typ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portale */}
      <Card>
        <CardHeader>
          <CardTitle>Portale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Portal-Export (3)</Label>
              <Button
                variant="outline"
                size="sm"
                disabled={!isEditing}
                onClick={() => toast.info("Überall veröffentlichen...")}
              >
                <Globe className="h-4 w-4 mr-2" />
                Überall veröffentlichen
              </Button>
            </div>

            {/* Portal List */}
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">allianzjaeger</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isEditing}
                  onClick={() => toast.info("Veröffentlichen...")}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Veröffentlichen
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Allianz Jaeger - Versicherung - Immobilien</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isEditing}
                  onClick={() => toast.info("Veröffentlichen...")}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Veröffentlichen
                </Button>
              </div>

              <div className="space-y-2 border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ImmoScout24</span>
                  <span className="text-xs text-muted-foreground">29.10.2025 15:07</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600"
                    disabled={!isEditing}
                    onClick={() => toast.success("Aktualisiert")}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Aktualisieren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-600 border-yellow-600"
                    disabled={!isEditing}
                    onClick={() => toast.info("Deaktiviert")}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    Deaktivieren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600"
                    disabled={!isEditing}
                    onClick={() => toast.error("Gelöscht")}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Löschen
                  </Button>
                </div>
                <div className="bg-cyan-50 border border-cyan-200 rounded p-2">
                  <span className="text-xs font-medium text-cyan-700">TIPP</span>
                  <p className="text-xs text-cyan-900 mt-1">
                    Kontaktanfragen erhöhen: Spitzenplatzierung buchen.
                  </p>
                  <Button
                    className="w-full mt-2 bg-cyan-500 hover:bg-cyan-600 text-white"
                    size="sm"
                    disabled={!isEditing}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Jetzt buchen
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>IS24-Ansprechpartner</Label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Select
                value={formData.is24ContactPerson || ""}
                onValueChange={(value) => handleChange("is24ContactPerson", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sven Jaeger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sven">Sven Jaeger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>IS24-ID</Label>
            <Input
              value={formData.is24Id || ""}
              onChange={(e) => handleChange("is24Id", e.target.value)}
              disabled={!isEditing}
              placeholder="158820057"
            />
          </div>

          <div className="space-y-2">
            <Label>IS24-Gruppen-Nr.</Label>
            <Input
              value={formData.is24GroupNumber || ""}
              onChange={(e) => handleChange("is24GroupNumber", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Übersetzungen</Label>
            <Input
              disabled={!isEditing}
              placeholder="Übersetzungen"
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
          <div className="space-y-2">
            <Label>Auftragsart</Label>
            <Select
              value={formData.assignmentType || ""}
              onValueChange={(value) => handleChange("assignmentType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alleinauftrag">Alleinauftrag</SelectItem>
                <SelectItem value="Einfacher Auftrag">Einfacher Auftrag</SelectItem>
                <SelectItem value="Qualifizierter Alleinauftrag">Qualifizierter Alleinauftrag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Laufzeit</Label>
            <Select
              value={formData.assignmentDuration || ""}
              onValueChange={(value) => handleChange("assignmentDuration", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unbefristet">Unbefristet</SelectItem>
                <SelectItem value="Befristet">Befristet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Auftrag von bis</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={formData.assignmentFrom ? new Date(formData.assignmentFrom).toISOString().slice(0, 16) : ""}
                onChange={(e) => handleChange("assignmentFrom", e.target.value ? new Date(e.target.value) : null)}
                disabled={!isEditing}
              />
              <Input
                type="datetime-local"
                value={formData.assignmentTo ? new Date(formData.assignmentTo).toISOString().slice(0, 16) : ""}
                onChange={(e) => handleChange("assignmentTo", e.target.value ? new Date(e.target.value) : null)}
                disabled={!isEditing}
              />
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
          <p className="text-sm text-muted-foreground">Verkaufsinformationen werden hier angezeigt</p>
        </CardContent>
      </Card>

      {/* Provision Intern */}
      <Card>
        <CardHeader>
          <CardTitle>Provision Intern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Innenprovision (intern)</Label>
            <div className="flex gap-2">
              <Input
                value={formData.internalCommissionPercent || ""}
                onChange={(e) => handleChange("internalCommissionPercent", e.target.value)}
                disabled={!isEditing}
                placeholder="1"
              />
              <div className="flex border rounded-md">
                <Button
                  variant={commissionType === "percent" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => {
                    setCommissionType("percent");
                    handleChange("internalCommissionType", "percent");
                  }}
                  disabled={!isEditing}
                >
                  %
                </Button>
                <Button
                  variant={commissionType === "euro" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => {
                    setCommissionType("euro");
                    handleChange("internalCommissionType", "euro");
                  }}
                  disabled={!isEditing}
                >
                  €
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Außenprovision (intern)</Label>
            <div className="flex gap-2">
              <Input
                value={formData.externalCommissionInternalPercent || ""}
                onChange={(e) => handleChange("externalCommissionInternalPercent", e.target.value)}
                disabled={!isEditing}
                placeholder="2,5"
              />
              <div className="flex border rounded-md">
                <Button
                  variant={externalCommissionType === "percent" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => {
                    setExternalCommissionType("percent");
                    handleChange("externalCommissionInternalType", "percent");
                  }}
                  disabled={!isEditing}
                >
                  %
                </Button>
                <Button
                  variant={externalCommissionType === "euro" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => {
                    setExternalCommissionType("euro");
                    handleChange("externalCommissionInternalType", "euro");
                  }}
                  disabled={!isEditing}
                >
                  €
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gesamtprovision</Label>
            <Input
              value={formData.totalCommission ? `${(formData.totalCommission / 100).toFixed(2)} €` : ""}
              disabled
              placeholder="14.000 €"
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
          <div className="space-y-2">
            <Label>Außenprovision für Exposé</Label>
            <Input
              value={formData.externalCommissionForExpose || ""}
              onChange={(e) => handleChange("externalCommissionForExpose", e.target.value)}
              disabled={!isEditing}
              placeholder="2,50% inkl. MwSt."
            />
          </div>

          <div className="space-y-2">
            <Label>Provisionshinweis</Label>
            <Textarea
              value={formData.commissionNote || ""}
              onChange={(e) => handleChange("commissionNote", e.target.value)}
              disabled={!isEditing}
              placeholder="2,50 inkl. 19 % MwSt."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Energieausweis */}
      <Card>
        <CardHeader>
          <CardTitle>Energieausweis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Energieausweis</Label>
            <Select
              value={formData.energyCertificateAvailability || ""}
              onValueChange={(value) => handleChange("energyCertificateAvailability", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wird nicht benötigt">wird nicht benötigt</SelectItem>
                <SelectItem value="liegt vor">liegt vor</SelectItem>
                <SelectItem value="liegt zur Besichtigung vor">liegt zur Besichtigung vor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Erstellungsdatum</Label>
            <Select
              value={formData.energyCertificateCreationDate || ""}
              onValueChange={(value) => handleChange("energyCertificateCreationDate", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ab 1. Mai 2014">ab 1. Mai 2014</SelectItem>
                <SelectItem value="bis 30. April 2014">bis 30. April 2014</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ausstellungsdatum</Label>
            <Input
              type="date"
              value={formData.energyCertificateIssueDate || ""}
              onChange={(e) => handleChange("energyCertificateIssueDate", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Gültig bis</Label>
            <Input
              type="date"
              value={formData.energyCertificateValidUntil || ""}
              onChange={(e) => handleChange("energyCertificateValidUntil", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Energieausweistyp</Label>
            <Select
              value={formData.energyCertificateType || ""}
              onValueChange={(value) => handleChange("energyCertificateType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bedarfsausweis">Bedarfsausweis</SelectItem>
                <SelectItem value="Verbrauchsausweis">Verbrauchsausweis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Energieeffizienzklasse</Label>
            <Select
              value={formData.energyClass || ""}
              onValueChange={(value) => handleChange("energyClass", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="E">E</SelectItem>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="G">G</SelectItem>
                <SelectItem value="H">H</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Energiekennwert</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.energyConsumption || ""}
                onChange={(e) => handleChange("energyConsumption", e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
                className="pr-24"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                kWh/(m²·a)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Energiekennwert Strom</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.energyConsumptionElectricity || ""}
                onChange={(e) => handleChange("energyConsumptionElectricity", e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
                className="pr-24"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                kWh/(m²·a)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Energiekennwert Wärme</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.energyConsumptionHeat || ""}
                onChange={(e) => handleChange("energyConsumptionHeat", e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
                className="pr-24"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                kWh/(m²·a)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CO2-Emissionen</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.co2Emissions || ""}
                onChange={(e) => handleChange("co2Emissions", e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="0"
                className="pr-16"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                kg/m²a
              </span>
            </div>
          </div>

          <div className="col-span-2 flex items-center space-x-2">
            <Switch
              checked={formData.includesWarmWater || false}
              onCheckedChange={(checked) => handleChange("includesWarmWater", checked)}
              disabled={!isEditing}
            />
            <Label>Energieverbrauch für Warmwasser enthalten</Label>
          </div>

          <div className="space-y-2">
            <Label>Heizungsart</Label>
            <Select
              value={formData.heatingType || ""}
              onValueChange={(value) => handleChange("heatingType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zentralheizung">Zentralheizung</SelectItem>
                <SelectItem value="Etagenheizung">Etagenheizung</SelectItem>
                <SelectItem value="Ofenheizung">Ofenheizung</SelectItem>
                <SelectItem value="Fußbodenheizung">Fußbodenheizung</SelectItem>
                <SelectItem value="Fernwärme">Fernwärme</SelectItem>
                <SelectItem value="Blockheizkraftwerk">Blockheizkraftwerk</SelectItem>
                <SelectItem value="Wärmepumpe">Wärmepumpe</SelectItem>
                <SelectItem value="Pelletheizung">Pelletheizung</SelectItem>
                <SelectItem value="Nachtspeicher">Nachtspeicher</SelectItem>
                <SelectItem value="Elektroheizung">Elektroheizung</SelectItem>
                <SelectItem value="Solarheizung">Solarheizung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Wesentlicher Energieträger</Label>
            <Select
              value={formData.mainEnergySource || ""}
              onValueChange={(value) => handleChange("mainEnergySource", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Öl">Öl</SelectItem>
                <SelectItem value="Gas">Gas</SelectItem>
                <SelectItem value="Strom">Strom</SelectItem>
                <SelectItem value="Fernwärme">Fernwärme</SelectItem>
                <SelectItem value="Holz">Holz</SelectItem>
                <SelectItem value="Pellets">Pellets</SelectItem>
                <SelectItem value="Kohle">Kohle</SelectItem>
                <SelectItem value="Solar">Solar</SelectItem>
                <SelectItem value="Wärmepumpe Luft/Wasser">Wärmepumpe Luft/Wasser</SelectItem>
                <SelectItem value="Wärmepumpe Sole/Wasser">Wärmepumpe Sole/Wasser</SelectItem>
                <SelectItem value="Wärmepumpe Wasser/Wasser">Wärmepumpe Wasser/Wasser</SelectItem>
                <SelectItem value="Erdwärme">Erdwärme</SelectItem>
                <SelectItem value="Umweltthermie">Umweltthermie</SelectItem>
                <SelectItem value="Flüssiggas">Flüssiggas</SelectItem>
                <SelectItem value="Biogas">Biogas</SelectItem>
                <SelectItem value="Bioenergie">Bioenergie</SelectItem>
                <SelectItem value="KWK fossil">KWK fossil</SelectItem>
                <SelectItem value="KWK erneuerbar">KWK erneuerbar</SelectItem>
                <SelectItem value="Nahwärme">Nahwärme</SelectItem>
                <SelectItem value="Blockheizkraftwerk">Blockheizkraftwerk</SelectItem>
                <SelectItem value="Windkraft">Windkraft</SelectItem>
                <SelectItem value="Wasserkraft">Wasserkraft</SelectItem>
                <SelectItem value="Geothermie">Geothermie</SelectItem>
                <SelectItem value="Photovoltaik">Photovoltaik</SelectItem>
                <SelectItem value="Brennstoffzelle">Brennstoffzelle</SelectItem>
                <SelectItem value="Alternative Energien">Alternative Energien</SelectItem>
                <SelectItem value="Regenerative Energien">Regenerative Energien</SelectItem>
                <SelectItem value="Keine Angabe">Keine Angabe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Baujahr</Label>
            <Input
              type="number"
              value={formData.yearBuilt || ""}
              onChange={(e) => handleChange("yearBuilt", e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing || !!formData.buildingYearUnknown}
              placeholder="z.B. 1990"
            />
          </div>

          <div className="space-y-2">
            <Label>Baujahr Anlagentechnik</Label>
            <Input
              type="number"
              value={formData.heatingSystemYear || ""}
              onChange={(e) => handleChange("heatingSystemYear", e.target.value ? parseInt(e.target.value) : null)}
              disabled={!isEditing}
              placeholder="z.B. 2010"
            />
          </div>

          <div className="col-span-2 flex items-center space-x-2">
            <Switch
              checked={formData.buildingYearUnknown || false}
              onCheckedChange={(checked) => {
                handleChange("buildingYearUnknown", checked);
                if (checked) {
                  handleChange("yearBuilt", null);
                }
              }}
              disabled={!isEditing}
            />
            <Label>Baujahr unbekannt</Label>
          </div>
        </CardContent>
      </Card>

      {/* Verrechnung */}
      <Card>
        <CardHeader>
          <CardTitle>Verrechnung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Verrechnungsinformationen werden hier angezeigt</p>
        </CardContent>
      </Card>

      {/* Fahrzeiten */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fahrzeiten</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={calculateDistances}
            disabled={!isEditing || isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Berechne...' : 'Distanzen berechnen'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fußweg zu ÖPNV</Label>
              <Input
                type="text"
                value={formData.walkingTimeToPublicTransport || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Input
                type="text"
                value={formData.distanceToPublicTransport || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fahrzeit nächste Autobahn</Label>
              <Input
                type="text"
                value={formData.drivingTimeToHighway || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Input
                type="text"
                value={formData.distanceToHighway || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fahrzeit nächster HBF</Label>
              <Input
                type="text"
                value={formData.drivingTimeToMainStation || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Input
                type="text"
                value={formData.distanceToMainStation || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fahrzeit nächster Flughafen</Label>
              <Input
                type="text"
                value={formData.drivingTimeToAirport || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Input
                type="text"
                value={formData.distanceToAirport || ""}
                readOnly
                disabled
                placeholder=""
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
