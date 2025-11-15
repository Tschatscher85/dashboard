import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from "react";
import type { Property } from "../../../drizzle/schema";
import { Save } from "lucide-react";

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
import { MultiSelect } from "./ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AIDescriptionDialog } from "./AIDescriptionDialog";
import { Separator } from "./ui/separator";
import { PropertyDetailFormLayout } from "./PropertyDetailFormLayout";
import { PropertyRightColumn } from "./PropertyRightColumn";
import { PlaceAutocompleteElement } from "./PlaceAutocompleteElement";

// Helper function to format price with thousand separators and € symbol
const formatPrice = (cents: number | null | undefined): string => {
  if (!cents && cents !== 0) return "";
  const euros = cents / 100;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros);
};

interface PropertyDetailFormProps {
  property: Property;
  onSave: (data: Partial<Property>) => void;
  isEditing: boolean;
}

export interface PropertyDetailFormHandle {
  save: () => void;
}

export const PropertyDetailForm = forwardRef<PropertyDetailFormHandle, PropertyDetailFormProps>(
  ({ property, onSave, isEditing }, ref) => {
  // Initialize formData without title (title is managed separately in header)
  // Also convert Date objects to ISO strings for date input fields
  const propertyWithoutTitle: any = { ...property };
  delete propertyWithoutTitle.title;
  if (propertyWithoutTitle.availableFrom instanceof Date) {
    propertyWithoutTitle.availableFrom = propertyWithoutTitle.availableFrom.toISOString().split('T')[0];
  }
  const [formData, setFormData] = useState<Partial<Property>>(propertyWithoutTitle);
  // Handle Google Places autocomplete
  const handlePlaceSelected = (place: any) => {
    if (!place.address_components) return;

    let street = '';
    let houseNumber = '';
    let zipCode = '';
    let city = '';
    let country = 'Deutschland';

    place.address_components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('route')) {
        street = component.long_name;
      }
      if (types.includes('street_number')) {
        houseNumber = component.long_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
    });

    // Update form data with parsed address
    setFormData((prev) => ({
      ...prev,
      street: street || prev.street,
      houseNumber: houseNumber || prev.houseNumber,
      zipCode: zipCode || prev.zipCode,
      city: city || prev.city,
      country: country || prev.country,
      latitude: place.geometry?.location?.lat()?.toString() || prev.latitude,
      longitude: place.geometry?.location?.lng()?.toString() || prev.longitude,
    }));
  };

  const handleChange = (field: keyof Property, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate title from address when address fields change
      if (['street', 'houseNumber', 'zipCode', 'city'].includes(field)) {
        const street = field === 'street' ? value : (updated.street || '');
        const houseNumber = field === 'houseNumber' ? value : (updated.houseNumber || '');
        const zipCode = field === 'zipCode' ? value : (updated.zipCode || '');
        const city = field === 'city' ? value : (updated.city || '');
        
        // Generate title: "Straße Hausnummer, PLZ Ort"
        if (street && houseNumber && zipCode && city) {
          updated.title = `${street} ${houseNumber}, ${zipCode} ${city}`;
        }
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    // Filter out null/undefined/empty string values to avoid validation errors
    const cleanedData: any = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Convert latitude/longitude strings to numbers
        if ((key === 'latitude' || key === 'longitude') && typeof value === 'string') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            cleanedData[key] = numValue;
          }
        } else {
          cleanedData[key] = value;
        }
      }
    });
    onSave(cleanedData);
  };

  // Expose save function to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  return (
    <PropertyDetailFormLayout
      leftColumn={
        <>
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
                <SelectItem value="parking">Garage</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unterart</Label>
            <Select
              value={formData.subType || ""}
              onValueChange={(value: any) => handleChange("subType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bitte wählen" />
              </SelectTrigger>
              <SelectContent>
                {formData.propertyType === "apartment" && (
                  <>
                    <SelectItem value="dachgeschoss">Dachgeschoss</SelectItem>
                    <SelectItem value="loft">Loft</SelectItem>
                    <SelectItem value="maisonette">Maisonette</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="terrassenwohnung">Terrassenwohnung</SelectItem>
                    <SelectItem value="erdgeschosswohnung">Erdgeschosswohnung</SelectItem>
                    <SelectItem value="etagenwohnung">Etagenwohnung</SelectItem>
                    <SelectItem value="hochparterre">Hochparterre</SelectItem>
                    <SelectItem value="souterrain">Souterrain</SelectItem>
                    <SelectItem value="attikawohnung">Attikawohnung</SelectItem>
                    <SelectItem value="sonstige">Sonstige</SelectItem>
                  </>
                )}
                {formData.propertyType === "house" && (
                  <>
                    <SelectItem value="einfamilienhaus">Einfamilienhaus</SelectItem>
                    <SelectItem value="zweifamilienhaus">Zweifamilienhaus</SelectItem>
                    <SelectItem value="reihenhaus">Reihenhaus</SelectItem>
                    <SelectItem value="reihenmittelhaus">Reihenmittelhaus</SelectItem>
                    <SelectItem value="reihenendhaus">Reihenendhaus</SelectItem>
                    <SelectItem value="reiheneckhaus">Reiheneckhaus</SelectItem>
                    <SelectItem value="mehrfamilienhaus">Mehrfamilienhaus</SelectItem>
                    <SelectItem value="stadthaus">Stadthaus</SelectItem>
                    <SelectItem value="finca">Finca</SelectItem>
                    <SelectItem value="bungalow">Bungalow</SelectItem>
                    <SelectItem value="bauernhaus">Bauernhaus</SelectItem>
                    <SelectItem value="doppelhaushaelfte">Doppelhaushälfte</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="burg_schloss">Burg/Schloss</SelectItem>
                    <SelectItem value="besondere_immobilie">Besondere Immobilie</SelectItem>
                    <SelectItem value="doppeleinfamilienhaus">Doppeleinfamilienhaus</SelectItem>
                    <SelectItem value="ferienhaus">Ferienhaus</SelectItem>
                  </>
                )}
                {formData.propertyType === "parking" && (
                  <>
                    <SelectItem value="garage">Garage</SelectItem>
                    <SelectItem value="aussenstellplatz">Außenstellplatz</SelectItem>
                    <SelectItem value="carport">Carport</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="parkhaus">Parkhaus</SelectItem>
                    <SelectItem value="tiefgarage">Tiefgarage</SelectItem>
                    <SelectItem value="doppelgarage">Doppelgarage</SelectItem>
                  </>
                )}
                {formData.propertyType !== "apartment" && formData.propertyType !== "house" && formData.propertyType !== "parking" && (
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                )}
              </SelectContent>
            </Select>
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
                <SelectItem value="notary">Notartermin</SelectItem>
                <SelectItem value="sold">Verkauft</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.propertyType === "apartment" && (
            <div className="space-y-2">
              <Label>Einheitennummer</Label>
              <Input
                value={formData.unitNumber || ""}
                onChange={(e) => handleChange("unitNumber", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          )}

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
            <Label>Überschrift (für Landing Page)</Label>
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

          {/* Sync Information */}
          {(formData.externalId || formData.syncSource) && (
            <>
              <div className="col-span-2">
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground mb-3">Synchronisierung</p>
              </div>
              
              {formData.externalId && (
                <div className="space-y-2">
                  <Label>Externe ID</Label>
                  <Input
                    value={formData.externalId || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}

              {formData.syncSource && (
                <div className="space-y-2">
                  <Label>Sync-Quelle</Label>
                  <Input
                    value={formData.syncSource || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}

              {formData.lastSyncedAt && (
                <div className="space-y-2">
                  <Label>Letzte Synchronisierung</Label>
                  <Input
                    value={new Date(formData.lastSyncedAt).toLocaleString('de-DE')}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
            </>
          )}

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
          {/* Google Address Autocomplete */}
          <div className="col-span-2 space-y-2">
            <Label>Adresse suchen (Google Maps)</Label>
            <PlaceAutocompleteElement
              onPlaceSelect={handlePlaceSelected}
              placeholder="Adresse eingeben..."
            />
          </div>

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
            <Label>Kaufpreis</Label>
            {isEditing ? (
              <div className="relative">
                <Input
                  type="number"
                  value={formData.price ? formData.price / 100 : ""}
                  onChange={(e) => handleChange("price", Math.round(parseFloat(e.target.value || "0") * 100))}
                  className="pr-8 bg-muted"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.price) || "-"}
              </div>
            )}
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
            <Label>Kaltmiete</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.coldRent ? formData.coldRent / 100 : ""}
                onChange={(e) => handleChange("coldRent", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.coldRent) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Warmmiete</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.warmRent ? formData.warmRent / 100 : ""}
                onChange={(e) => handleChange("warmRent", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.warmRent) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Heizkosten</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.heatingCosts ? formData.heatingCosts / 100 : ""}
                onChange={(e) => handleChange("heatingCosts", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.heatingCosts) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nebenkosten</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.additionalCosts ? formData.additionalCosts / 100 : ""}
                onChange={(e) => handleChange("additionalCosts", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.additionalCosts) || "-"}
              </div>
            )}
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
            <Label>Nicht umlegbare Kosten</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.nonRecoverableCosts ? formData.nonRecoverableCosts / 100 : ""}
                onChange={(e) => handleChange("nonRecoverableCosts", Math.round(parseFloat(e.target.value || "0") * 100))}
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.nonRecoverableCosts) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Hausgeld/Monat</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.houseMoney ? formData.houseMoney / 100 : ""}
                onChange={(e) => handleChange("houseMoney", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.houseMoney) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Instandhaltungsrücklage</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.maintenanceReserve ? formData.maintenanceReserve / 100 : ""}
                onChange={(e) => handleChange("maintenanceReserve", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.maintenanceReserve) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Stellplatz-Preis</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.parkingPrice ? formData.parkingPrice / 100 : ""}
                onChange={(e) => handleChange("parkingPrice", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-muted"
              />
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.parkingPrice) || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mtl. Mieteinnahmen</Label>
            {isEditing ? (
              <div className="relative">
                <Input
                  type="number"
                  value={formData.monthlyRentalIncome ? formData.monthlyRentalIncome / 100 : ""}
                  onChange={(e) => handleChange("monthlyRentalIncome", Math.round(parseFloat(e.target.value || "0") * 100))}
                  className="pr-8 bg-muted"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            ) : (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                {formatPrice(formData.monthlyRentalIncome) || "-"}
              </div>
            )}
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
            <Label>Wohnfläche</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.livingArea || ""}
                onChange={(e) => handleChange("livingArea", parseFloat(e.target.value) || null)}
                disabled={!isEditing}
                className="pr-10 bg-muted"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">m²</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grundstückfläche</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.plotArea || ""}
                onChange={(e) => handleChange("plotArea", parseFloat(e.target.value) || null)}
                disabled={!isEditing}
                className="pr-10 bg-muted"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">m²</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nutzfläche (Wohnen) (m²)</Label>
            <Input
              type="number"
              value={formData.usableArea || ""}
              onChange={(e) => handleChange("usableArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Balkon/Terrasse Fläche (m²)</Label>
            <Input
              type="number"
              value={formData.balconyArea || ""}
              onChange={(e) => handleChange("balconyArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Gartenfläche (m²)</Label>
            <Input
              type="number"
              value={formData.gardenArea || ""}
              onChange={(e) => handleChange("gardenArea", parseInt(e.target.value || "0"))}
              disabled={!isEditing}
              className="bg-muted"
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
              value={
                formData.availableFrom instanceof Date
                  ? formData.availableFrom.toISOString().split('T')[0]
                  : (typeof formData.availableFrom === 'string' && /^\d{4}-\d{2}-\d{2}/.test(formData.availableFrom as string)
                      ? (formData.availableFrom as string).split('T')[0]
                      : "")
              }
              onChange={(e) => {
                // Store as ISO date string (YYYY-MM-DD) if value exists, otherwise null
                handleChange("availableFrom", e.target.value || null);
              }}
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
                <SelectItem value="erstbezug">Erstbezug</SelectItem>
                <SelectItem value="erstbezug_nach_sanierung">Erstbezug nach Sanierung</SelectItem>
                <SelectItem value="neuwertig">neuwertig</SelectItem>
                <SelectItem value="saniert">saniert</SelectItem>
                <SelectItem value="teilsaniert">teilsaniert</SelectItem>
                <SelectItem value="sanierungsbedürftig">sanierungsbedürftig</SelectItem>
                <SelectItem value="baufällig">baufällig</SelectItem>
                <SelectItem value="modernisiert">modernisiert</SelectItem>
                <SelectItem value="vollständig_renoviert">vollständig renoviert</SelectItem>
                <SelectItem value="teilweise_renoviert">teilweise renoviert</SelectItem>
                <SelectItem value="gepflegt">gepflegt</SelectItem>
                <SelectItem value="renovierungsbedürftig">renovierungsbedürftig</SelectItem>
                <SelectItem value="nach_vereinbarung">nach Vereinbarung</SelectItem>
                <SelectItem value="abbruchreif">abbruchreif</SelectItem>
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
                <SelectItem value="luxuriös">luxuriös</SelectItem>
                <SelectItem value="gehoben">gehoben</SelectItem>
                <SelectItem value="normal">normal</SelectItem>
                <SelectItem value="einfach">einfach</SelectItem>
              </SelectContent>
            </Select>
          </div>


        </CardContent>
      </Card>

      {/* Auftrag and Energieausweis sections removed - now only in right sidebar */}

      {/* ImmoScout24 Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ImmoScout24 Integration
            <span className="text-xs font-normal text-muted-foreground">(Vorbereitet für API-Integration)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>IS24 Externe ID</Label>
            <Input
              value={formData.is24ExternalId || ""}
              disabled
              placeholder="Wird nach Veröffentlichung vergeben"
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Automatisch von ImmoScout24 nach Veröffentlichung
            </p>
          </div>

          <div className="space-y-2">
            <Label>IS24 Status</Label>
            <Input
              value={
                formData.is24PublishStatus === "published" ? "Veröffentlicht" :
                formData.is24PublishStatus === "unpublished" ? "Deaktiviert" :
                formData.is24PublishStatus === "error" ? "Fehler" :
                "Entwurf"
              }
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>IS24 Kontakt-ID</Label>
            <Input
              value={formData.is24ContactId || ""}
              onChange={(e) => handleChange("is24ContactId", e.target.value)}
              disabled={!isEditing}
              placeholder="Kontakt-ID in IS24"
            />
          </div>

          <div className="space-y-2">
            <Label>IS24 Ansprechpartner</Label>
            <Input
              value={formData.is24ContactPerson || ""}
              onChange={(e) => handleChange("is24ContactPerson", e.target.value)}
              disabled={!isEditing}
              placeholder="Name des Ansprechpartners"
            />
          </div>

          <div className="space-y-2">
            <Label>IS24 Gruppen-Nr.</Label>
            <Input
              value={formData.is24GroupNumber || ""}
              onChange={(e) => handleChange("is24GroupNumber", e.target.value)}
              disabled={!isEditing}
              placeholder="Gruppennummer"
            />
          </div>

          <div className="space-y-2">
            <Label>Letzte Synchronisierung</Label>
            <Input
              value={
                formData.is24LastSyncedAt
                  ? new Date(formData.is24LastSyncedAt).toLocaleString("de-DE")
                  : "Noch nie synchronisiert"
              }
              disabled
              className="bg-muted"
            />
          </div>

          {formData.is24ErrorMessage && (
            <div className="col-span-2 space-y-2">
              <Label className="text-red-600">Letzter Fehler</Label>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {formData.is24ErrorMessage}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ausstattung */}
      <Card>
        <CardHeader>
          <CardTitle>Ausstattung</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">

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
            <MultiSelect
              options={[
                { label: "Garage", value: "Garage" },
                { label: "Außenstellplatz", value: "Außenstellplatz" },
                { label: "Carport", value: "Carport" },
                { label: "Duplex", value: "Duplex" },
                { label: "Parkhaus", value: "Parkhaus" },
                { label: "Tiefgarage", value: "Tiefgarage" },
                { label: "Doppelgarage", value: "Doppelgarage" },
              ]}
              selected={formData.parkingType ? formData.parkingType.split(",").filter(Boolean) : []}
              onChange={(values) => handleChange("parkingType", values.join(","))}
              placeholder="Stellplatztyp wählen..."
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Bauphase</Label>
            <Select
              value={formData.buildingPhase || ""}
              onValueChange={(value) => handleChange("buildingPhase", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bauphase wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_planung_projektiert">Haus in Planung (projektiert)</SelectItem>
                <SelectItem value="in_planung_bewilligt">Haus in Planung (bewilligt)</SelectItem>
                <SelectItem value="im_bau">Haus im Bau</SelectItem>
                <SelectItem value="fertig_gestellt">Haus fertig gestellt</SelectItem>
              </SelectContent>
            </Select>
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
            <MultiSelect
              options={[
                { label: "Dusche", value: "Dusche" },
                { label: "Wanne", value: "Wanne" },
                { label: "Fenster", value: "Fenster" },
                { label: "Bidet", value: "Bidet" },
                { label: "Urinal", value: "Urinal" },
              ]}
              selected={formData.bathroomFeatures ? formData.bathroomFeatures.split(",").filter(Boolean) : []}
              onChange={(values) => handleChange("bathroomFeatures", values.join(","))}
              placeholder="Badausstattung wählen..."
              disabled={!isEditing}
            />
          </div>

          <Separator className="col-span-2 my-2" />

          <div className="col-span-2">
            <Label className="mb-2 block">Bodenbelag</Label>
            <MultiSelect
              options={[
                { label: "Beton", value: "Beton" },
                { label: "Epoxidharz", value: "Epoxidharz" },
                { label: "Fliesen", value: "Fliesen" },
                { label: "Dielen", value: "Dielen" },
                { label: "Laminat", value: "Laminat" },
                { label: "Parkett", value: "Parkett" },
                { label: "PVC", value: "PVC" },
                { label: "Teppichboden", value: "Teppichboden" },
                { label: "Antistatischer Teppichboden", value: "Antistatischer Teppichboden" },
                { label: "Stuhlrollenfeste Teppichfliesen", value: "Stuhlrollenfeste Teppichfliesen" },
                { label: "Stein", value: "Stein" },
                { label: "Linoleum", value: "Linoleum" },
                { label: "Marmor", value: "Marmor" },
                { label: "Terrakotta", value: "Terrakotta" },
                { label: "Granit", value: "Granit" },
                { label: "Vinylboden", value: "Vinylboden" },
                { label: "Nach Wunsch", value: "Nach Wunsch" },
                { label: "Ohne Bodenbelag", value: "Ohne Bodenbelag" },
              ]}
              selected={formData.flooringTypes ? formData.flooringTypes.split(",").filter(Boolean) : []}
              onChange={(values) => handleChange("flooringTypes", values.join(","))}
              placeholder="Bodenbelag wählen..."
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>



      {/* Beschreibung */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Beschreibung</CardTitle>
          <AIDescriptionDialog
            property={formData}
            onGenerated={(description) => handleChange("description", description)}
            disabled={!isEditing}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>📝 Objektbeschreibung</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!isEditing}
              rows={6}
              placeholder="Willkommen in Ihrem neuen Zuhause! Diese gepflegte und 2023 modernisierte Doppelhaushälfte bietet..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>⭐ Ausstattung & Highlights</Label>
            <Textarea
              value={formData.descriptionHighlights || ""}
              onChange={(e) => handleChange("descriptionHighlights", e.target.value)}
              disabled={!isEditing}
              rows={8}
              placeholder="Diese Immobilie wurde 2023 umfassend modernisiert und befindet sich in einem sehr gepflegten Zustand...\n\n✅ Letzte Modernisierung 2023: Elektrik, Malerarbeiten, Bodenbeläge & Badaufbereitung\n✅ Helle, freundliche Räume mit flexiblem Grundriss\n✅ Offener Wohn-/Essbereich mit Kamin für gemütliche Abende"
            />
          </div>
          
          <div className="space-y-2">
            <Label>📍 Lage</Label>
            <Textarea
              value={formData.descriptionLocation || ""}
              onChange={(e) => handleChange("descriptionLocation", e.target.value)}
              disabled={!isEditing}
              rows={4}
              placeholder="Diese Doppelhaushälfte liegt in einer ruhigen und familienfreundlichen Wohngegend von Geislingen. Einkaufsmöglichkeiten, Schulen, Kindergärten sowie der Anschluss an den ÖPNV sind in wenigen Minuten erreichbar."
            />
          </div>
          
          <div className="space-y-2">
            <Label>💚 Fazit</Label>
            <Textarea
              value={formData.descriptionFazit || ""}
              onChange={(e) => handleChange("descriptionFazit", e.target.value)}
              disabled={!isEditing}
              rows={2}
              placeholder="Dieses Haus ist ideal für Familien, die Wert auf eine moderne, gepflegte Immobilie mit Garten in ruhiger Lage legen und sich den Traum vom Eigenheim erfüllen möchten."
            />
          </div>
          
          <div className="space-y-2">
            <Label>📞 Kontaktieren Sie uns direkt!</Label>
            <Textarea
              value={formData.descriptionCTA || ""}
              onChange={(e) => handleChange("descriptionCTA", e.target.value)}
              disabled={!isEditing}
              rows={3}
              placeholder="Überzeugen Sie sich selbst von der Qualität und dem Potenzial dieser Doppelhaushälfte und vereinbaren Sie noch heute einen Besichtigungstermin.\n\n📱 Gerne auch per WhatsApp: 07331 9460350\n\nWir freuen uns auf Ihre Anfrage und begleiten Sie zuverlässig auf dem Weg in Ihr neues Zuhause!"
            />
          </div>
        </CardContent>
      </Card>
        </>
      }
      rightColumn={
        <PropertyRightColumn
          property={property}
          formData={formData}
          isEditing={isEditing}
          handleChange={handleChange}
        />
      }
    >
      {/* Sticky Save Button - only visible in edit mode */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t">
          <div className="container py-4">
            <Button 
              onClick={handleSave}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-2"
              size="lg"
            >
              <Save className="h-5 w-5" />
              Jetzt speichern
            </Button>
          </div>
        </div>
      )}
    </PropertyDetailFormLayout>
  );
});

PropertyDetailForm.displayName = "PropertyDetailForm";
