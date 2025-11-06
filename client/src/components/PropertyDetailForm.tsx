import { useState } from "react";
import type { Property } from "../../../drizzle/schema";

export type { Property };
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
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

interface PropertyDetailFormProps {
  property: Property;
  onSave: (data: Partial<Property>) => void;
  isEditing: boolean;
}

export function PropertyDetailForm({ property, onSave, isEditing }: PropertyDetailFormProps) {
  const [formData, setFormData] = useState<Partial<Property>>(property);

  const handleChange = (field: keyof Property, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Stammdaten */}
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select
              value={formData.category || ""}
              onValueChange={(value) => handleChange("category", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kauf">Kauf</SelectItem>
                <SelectItem value="Miete">Miete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Objektart</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value: any) => handleChange("propertyType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Wohnung</SelectItem>
                <SelectItem value="house">Haus</SelectItem>
                <SelectItem value="commercial">Gewerbe</SelectItem>
                <SelectItem value="land">Grundstück</SelectItem>
                <SelectItem value="parking">Stellplatz</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unterart</Label>
            <Input
              value={formData.subType || ""}
              onChange={(e) => handleChange("subType", e.target.value)}
              disabled={!isEditing}
              placeholder="z.B. Etagenwohnung"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => handleChange("status", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acquisition">Akquise</SelectItem>
                <SelectItem value="preparation">Vorbereitung</SelectItem>
                <SelectItem value="marketing">Vermarktung</SelectItem>
                <SelectItem value="reserved">Reserviert</SelectItem>
                <SelectItem value="sold">Verkauft</SelectItem>
                <SelectItem value="rented">Vermietet</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Einheitennummer</Label>
            <Input
              value={formData.unitNumber || ""}
              onChange={(e) => handleChange("unitNumber", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Wohnungsnummer</Label>
            <Input
              value={formData.apartmentNumber || ""}
              onChange={(e) => handleChange("apartmentNumber", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Stellplatz Nr.</Label>
            <Input
              value={formData.parkingNumber || ""}
              onChange={(e) => handleChange("parkingNumber", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Überschrift</Label>
            <div className="flex gap-2">
              <Input
                value={formData.headline || ""}
                onChange={(e) => handleChange("headline", e.target.value)}
                disabled={!isEditing}
                placeholder="Attraktive Überschrift für die Immobilie"
                className="flex-1"
              />
              {formData.headlineScore && (
                <div className="flex items-center px-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">{formData.headlineScore}/100</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Projekt</Label>
            <Input
              value={formData.project || ""}
              onChange={(e) => handleChange("project", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Merkmale</Label>
            <Input
              value={formData.features || ""}
              onChange={(e) => handleChange("features", e.target.value)}
              disabled={!isEditing}
              placeholder="Komma-getrennt"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.autoExpose !== false}
                onCheckedChange={(checked) => handleChange("autoExpose", checked)}
                disabled={!isEditing}
              />
              <Label>Automatischer Exposéversand</Label>
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Warnhinweis</Label>
            <Textarea
              value={formData.warning || ""}
              onChange={(e) => handleChange("warning", e.target.value)}
              disabled={!isEditing}
              rows={2}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.archived || false}
                onCheckedChange={(checked) => handleChange("archived", checked)}
                disabled={!isEditing}
              />
              <Label>Archiviert</Label>
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Interne Notiz</Label>
            <Textarea
              value={formData.internalNotes || ""}
              onChange={(e) => handleChange("internalNotes", e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Straße</Label>
            <Input
              value={formData.street || ""}
              onChange={(e) => handleChange("street", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Hausnummer</Label>
            <Input
              value={formData.houseNumber || ""}
              onChange={(e) => handleChange("houseNumber", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>PLZ</Label>
            <Input
              value={formData.zipCode || ""}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Ort</Label>
            <Input
              value={formData.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Region / Land</Label>
            <Input
              value={formData.region || ""}
              onChange={(e) => handleChange("region", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Land</Label>
            <Input
              value={formData.country || "Deutschland"}
              onChange={(e) => handleChange("country", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Breitengrad</Label>
            <Input
              value={formData.latitude || ""}
              onChange={(e) => handleChange("latitude", e.target.value)}
              disabled={!isEditing}
              placeholder="48.6231700"
            />
          </div>

          <div className="space-y-2">
            <Label>Längengrad</Label>
            <Input
              value={formData.longitude || ""}
              onChange={(e) => handleChange("longitude", e.target.value)}
              disabled={!isEditing}
              placeholder="9.8281900"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.hideStreetOnPortals || false}
                onCheckedChange={(checked) => handleChange("hideStreetOnPortals", checked)}
                disabled={!isEditing}
              />
              <Label>Straße auf Portalen nicht anzeigen</Label>
            </div>
          </div>

          <Separator className="col-span-2" />

          <div className="space-y-2">
            <Label>Amtsgericht</Label>
            <Input
              value={formData.districtCourt || ""}
              onChange={(e) => handleChange("districtCourt", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Grundbuchblatt</Label>
            <Input
              value={formData.landRegisterSheet || ""}
              onChange={(e) => handleChange("landRegisterSheet", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Grundbuch von</Label>
            <Input
              value={formData.landRegisterOf || ""}
              onChange={(e) => handleChange("landRegisterOf", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Gemarkung</Label>
            <Input
              value={formData.cadastralDistrict || ""}
              onChange={(e) => handleChange("cadastralDistrict", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Flur</Label>
            <Input
              value={formData.corridor || ""}
              onChange={(e) => handleChange("corridor", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Flurstück</Label>
            <Input
              value={formData.parcel || ""}
              onChange={(e) => handleChange("parcel", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preise */}
      <Card>
        <CardHeader>
          <CardTitle>Preise</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kaufpreis (€)</Label>
            <Input
              type="number"
              value={formData.price ? formData.price / 100 : ""}
              onChange={(e) => handleChange("price", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="col-span-2 flex gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.priceOnRequest || false}
                onCheckedChange={(checked) => handleChange("priceOnRequest", checked)}
                disabled={!isEditing}
              />
              <Label>Preis auf Anfrage</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.priceByNegotiation || false}
                onCheckedChange={(checked) => handleChange("priceByNegotiation", checked)}
                disabled={!isEditing}
              />
              <Label>Preis gegen Gebot</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kaltmiete (€)</Label>
            <Input
              type="number"
              value={formData.coldRent ? formData.coldRent / 100 : ""}
              onChange={(e) => handleChange("coldRent", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Warmmiete (€)</Label>
            <Input
              type="number"
              value={formData.warmRent ? formData.warmRent / 100 : ""}
              onChange={(e) => handleChange("warmRent", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Heizkosten (€)</Label>
            <Input
              type="number"
              value={formData.heatingCosts ? formData.heatingCosts / 100 : ""}
              onChange={(e) => handleChange("heatingCosts", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Nebenkosten (€)</Label>
            <Input
              type="number"
              value={formData.additionalCosts ? formData.additionalCosts / 100 : ""}
              onChange={(e) => handleChange("additionalCosts", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.heatingIncludedInAdditional || false}
                onCheckedChange={(checked) => handleChange("heatingIncludedInAdditional", checked)}
                disabled={!isEditing}
              />
              <Label>Heizkosten in NK</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nicht umlegbare Kosten (€)</Label>
            <Input
              type="number"
              value={formData.nonRecoverableCosts ? formData.nonRecoverableCosts / 100 : ""}
              onChange={(e) => handleChange("nonRecoverableCosts", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Hausgeld/Monat (€)</Label>
            <Input
              type="number"
              value={formData.houseMoney ? formData.houseMoney / 100 : ""}
              onChange={(e) => handleChange("houseMoney", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Instandhaltungsrücklage (€)</Label>
            <Input
              type="number"
              value={formData.maintenanceReserve ? formData.maintenanceReserve / 100 : ""}
              onChange={(e) => handleChange("maintenanceReserve", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Stellplatz-Preis (€)</Label>
            <Input
              type="number"
              value={formData.parkingPrice ? formData.parkingPrice / 100 : ""}
              onChange={(e) => handleChange("parkingPrice", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Mtl. Mieteinnahmen (€)</Label>
            <Input
              type="number"
              value={formData.monthlyRentalIncome ? formData.monthlyRentalIncome / 100 : ""}
              onChange={(e) => handleChange("monthlyRentalIncome", Math.round(parseFloat(e.target.value || "0") * 100))}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flächen */}
      <Card>
        <CardHeader>
          <CardTitle>Flächen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Wohnfläche (m²)</Label>
            <Input
              type="number"
              value={formData.livingArea || ""}
              onChange={(e) => handleChange("livingArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Grundstücksfläche (m²)</Label>
            <Input
              type="number"
              value={formData.plotArea || ""}
              onChange={(e) => handleChange("plotArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Nutzfläche (Wohnen) (m²)</Label>
            <Input
              type="number"
              value={formData.usableArea || ""}
              onChange={(e) => handleChange("usableArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Balkon/Terrasse Fläche (m²)</Label>
            <Input
              type="number"
              value={formData.balconyArea || ""}
              onChange={(e) => handleChange("balconyArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Gartenfläche (m²)</Label>
            <Input
              type="number"
              value={formData.gardenArea || ""}
              onChange={(e) => handleChange("gardenArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Zimmer</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.rooms || ""}
              onChange={(e) => handleChange("rooms", parseFloat(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Schlafzimmer</Label>
            <Input
              type="number"
              value={formData.bedrooms || ""}
              onChange={(e) => handleChange("bedrooms", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Badezimmer</Label>
            <Input
              type="number"
              value={formData.bathrooms || ""}
              onChange={(e) => handleChange("bathrooms", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Etage</Label>
            <Input
              type="number"
              value={formData.floor || ""}
              onChange={(e) => handleChange("floor", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Etagenlage</Label>
            <Input
              value={formData.floorLevel || ""}
              onChange={(e) => handleChange("floorLevel", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Etagenzahl</Label>
            <Input
              type="number"
              value={formData.totalFloors || ""}
              onChange={(e) => handleChange("totalFloors", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Zusatzinformationen */}
      <Card>
        <CardHeader>
          <CardTitle>Zusatzinformationen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isRented || false}
                onCheckedChange={(checked) => handleChange("isRented", checked)}
                disabled={!isEditing}
              />
              <Label>Vermietet</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Verfügbar ab</Label>
            <Input
              type="date"
              value={formData.availableFrom ? new Date(formData.availableFrom).toISOString().split('T')[0] : ""}
              onChange={(e) => handleChange("availableFrom", e.target.value ? new Date(e.target.value) : null)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Objektzustand</Label>
            <Select
              value={formData.condition || ""}
              onValueChange={(value: any) => handleChange("condition", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Zustand wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Neubau</SelectItem>
                <SelectItem value="renovated">Saniert</SelectItem>
                <SelectItem value="good">Gut</SelectItem>
                <SelectItem value="needs_renovation">Renovierungsbedürftig</SelectItem>
                <SelectItem value="demolished">Abgerissen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Letzte Modernisierung (Jahr)</Label>
            <Input
              type="number"
              value={formData.lastModernization || ""}
              onChange={(e) => handleChange("lastModernization", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Qualität der Ausstattung</Label>
            <Select
              value={formData.equipmentQuality || ""}
              onValueChange={(value) => handleChange("equipmentQuality", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualität wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einfach">Einfach</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="gehoben">Gehoben</SelectItem>
                <SelectItem value="luxus">Luxus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Anzahl Parkplätze</Label>
            <Input
              type="number"
              value={formData.parkingCount || ""}
              onChange={(e) => handleChange("parkingCount", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Stellplatztyp</Label>
            <Select
              value={formData.parkingType || ""}
              onValueChange={(value) => handleChange("parkingType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Typ wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Garage">Garage</SelectItem>
                <SelectItem value="Tiefgarage">Tiefgarage</SelectItem>
                <SelectItem value="Carport">Carport</SelectItem>
                <SelectItem value="Stellplatz">Stellplatz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bauphase</Label>
            <Input
              value={formData.buildingPhase || ""}
              onChange={(e) => handleChange("buildingPhase", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ausstattung */}
      <Card>
        <CardHeader>
          <CardTitle>Ausstattung</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[
            { key: "hasElevator", label: "Aufzug" },
            { key: "isBarrierFree", label: "Barrierefrei" },
            { key: "hasBasement", label: "Keller" },
            { key: "hasGuestToilet", label: "Gäste-WC" },
            { key: "hasBuiltInKitchen", label: "Einbauküche" },
            { key: "hasBalcony", label: "Balkon" },
            { key: "hasTerrace", label: "Terrasse" },
            { key: "hasLoggia", label: "Loggia" },
            { key: "hasGarden", label: "Garten" },
            { key: "isMonument", label: "Denkmalschutz" },
            { key: "suitableAsHoliday", label: "Als Ferienwohnung geeignet" },
            { key: "hasStorageRoom", label: "Abstellraum" },
            { key: "hasFireplace", label: "Kamin" },
            { key: "hasPool", label: "Pool" },
            { key: "hasSauna", label: "Sauna" },
            { key: "hasAlarm", label: "Alarmanlage" },
            { key: "hasWinterGarden", label: "Wintergarten" },
            { key: "hasAirConditioning", label: "Klimaanlage" },
          ].map((feature) => (
            <div key={feature.key} className="flex items-center gap-2">
              <Switch
                checked={(formData as any)[feature.key] || false}
                onCheckedChange={(checked) => handleChange(feature.key as keyof Property, checked)}
                disabled={!isEditing}
              />
              <Label>{feature.label}</Label>
            </div>
          ))}

          <Separator className="col-span-2 my-2" />

          <div className="col-span-2">
            <Label className="mb-2 block">Bad</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.bathShower || false}
                  onCheckedChange={(checked) => handleChange("bathShower", checked)}
                  disabled={!isEditing}
                />
                <Label>Dusche</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.bathTub || false}
                  onCheckedChange={(checked) => handleChange("bathTub", checked)}
                  disabled={!isEditing}
                />
                <Label>Wanne</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.bathWindow || false}
                  onCheckedChange={(checked) => handleChange("bathWindow", checked)}
                  disabled={!isEditing}
                />
                <Label>Fenster</Label>
              </div>
            </div>
          </div>

          <Separator className="col-span-2 my-2" />

          <div className="col-span-2">
            <Label className="mb-2 block">Bodenbelag</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.flooringTiles || false}
                  onCheckedChange={(checked) => handleChange("flooringTiles", checked)}
                  disabled={!isEditing}
                />
                <Label>Fliesen</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.flooringLaminate || false}
                  onCheckedChange={(checked) => handleChange("flooringLaminate", checked)}
                  disabled={!isEditing}
                />
                <Label>Laminat</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.flooringPVC || false}
                  onCheckedChange={(checked) => handleChange("flooringPVC", checked)}
                  disabled={!isEditing}
                />
                <Label>PVC</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.flooringParquet || false}
                  onCheckedChange={(checked) => handleChange("flooringParquet", checked)}
                  disabled={!isEditing}
                />
                <Label>Parkett</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.flooringVinyl || false}
                  onCheckedChange={(checked) => handleChange("flooringVinyl", checked)}
                  disabled={!isEditing}
                />
                <Label>Vinylboden</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beschreibung */}
      <Card>
        <CardHeader>
          <CardTitle>Beschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Objektbeschreibung</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!isEditing}
              rows={6}
              placeholder="Detaillierte Beschreibung der Immobilie..."
            />
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave}>Änderungen speichern</Button>
        </div>
      )}
    </div>
  );
}
