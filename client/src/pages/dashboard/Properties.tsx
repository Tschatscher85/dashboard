import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, Building2, FileText, ExternalLink, Search, Filter, ArrowUpDown, ChevronDown, RefreshCw } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Properties() {
  // Convert NAS URLs to proxy URLs to avoid authentication popup
  const convertToProxyUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    // If URL is from NAS (contains ugreen.tschatscher.eu), convert to proxy URL
    if (url.includes('ugreen.tschatscher.eu')) {
      // Extract path after domain (with or without port)
      // Example: https://ugreen.tschatscher.eu:2002/Daten/... -> /Daten/...
      // Example: https://ugreen.tschatscher.eu/Daten/... -> /Daten/...
      const match = url.match(/ugreen\.tschatscher\.eu(?::\d+)?(\/.*)/i);
      if (match && match[1]) {
        const nasPath = match[1];
        // Remove leading slash for proxy endpoint
        const proxyUrl = `/api/nas${nasPath}`;
        return proxyUrl;
      }
    }
    
    // For S3/Cloud URLs or other sources, return as-is
    return url;
  };
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [homepageUrl, setHomepageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [statusChangePropertyId, setStatusChangePropertyId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [addressSearchValue, setAddressSearchValue] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "apartment" as const,
    marketingType: "sale" as const,
    street: "",
    houseNumber: "",
    zipCode: "",
    city: "",
    livingArea: "",
    rooms: "",
    price: "",
  });

  // Auto-generate title from address
  useEffect(() => {
    const { street, houseNumber, zipCode, city } = formData;
    if (street && houseNumber && zipCode && city) {
      const autoTitle = `${street} ${houseNumber}, ${zipCode} ${city}`;
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.street, formData.houseNumber, formData.zipCode, formData.city]);

  // Handle Google Places autocomplete
  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    console.log('[PlaceAutocomplete] Place selected:', place);
    
    let street = '';
    let houseNumber = '';
    let zipCode = '';
    let city = '';
    
    if (place.address_components) {
      place.address_components.forEach((component) => {
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
      });
    }
    
    setFormData(prev => ({
      ...prev,
      street,
      houseNumber,
      zipCode,
      city,
    }));
    
    toast.success('Adresse automatisch ausgefüllt');
  };

  const { data: properties, isLoading, refetch } = trpc.properties.list.useQuery();
  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success("Immobilie erfolgreich erstellt");
      setIsCreateOpen(false);
      refetch();
      setFormData({
        title: "",
        description: "",
        propertyType: "apartment",
        marketingType: "sale",
        street: "",
        houseNumber: "",
        zipCode: "",
        city: "",
        livingArea: "",
        rooms: "",
        price: "",
      });
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen: " + error.message);
    },
  });

  const deleteMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Immobilie gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Status erfolgreich geändert");
      refetch();
      setStatusChangePropertyId(null);
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  const generateExposeMutation = trpc.properties.generateExpose.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expose-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exposé erfolgreich generiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Generieren: " + error.message);
    },
  });

  const [, setLocation] = useLocation();

  const handleGenerateExpose = (propertyId: number) => {
    generateExposeMutation.mutate({ propertyId });
  };

  const handleViewLanding = (propertyId: number) => {
    window.open(`/property/${propertyId}`, '_blank');
  };

  const handleCreate = () => {
    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      propertyType: formData.propertyType,
      marketingType: formData.marketingType,
      street: formData.street || undefined,
      houseNumber: formData.houseNumber || undefined,
      zipCode: formData.zipCode || undefined,
      city: formData.city || undefined,
      livingArea: formData.livingArea ? parseInt(formData.livingArea) : undefined,
      rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
      price: formData.price ? parseInt(formData.price) * 100 : undefined, // Convert to cents
    });
  };

  const formatPrice = (cents?: number | null) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      acquisition: "secondary",
      preparation: "secondary",
      marketing: "default",
      reserved: "secondary",
      notary: "default",
      sold: "outline",
      completed: "outline",
    };
    const labels: Record<string, string> = {
      acquisition: "Akquise",
      preparation: "Vorbereitung",
      marketing: "Vermarktung",
      reserved: "Reserviert",
      notary: "Notartermin",
      sold: "Verkauft",
      completed: "Abgeschlossen",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
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

  // Filter and search logic
  const filteredProperties = properties?.filter((property) => {
    const matchesSearch = property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const togglePropertySelection = (id: number) => {
    setSelectedProperties(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAllProperties = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  };

  const handleSync = async () => {
    if (!homepageUrl) {
      toast.error("Bitte geben Sie eine Homepage-URL ein");
      return;
    }

    try {
      // Get properties to sync (selected or all active)
      const propertiesToSync = selectedProperties.length > 0
        ? properties?.filter(p => selectedProperties.includes(p.id))
        : properties; // Sync all properties if none selected

      if (!propertiesToSync || propertiesToSync.length === 0) {
        toast.error("Keine Immobilien zum Synchronisieren gefunden");
        return;
      }

      // Format properties for export
      const exportData = {
        properties: propertiesToSync.map(p => ({
          id: p.id.toString(),
          title: p.title || '',
          type: p.subType || p.propertyType || 'apartment',
          price: p.price ? p.price / 100 : 0,
          livingSpace: p.livingArea || 0,
          plotSize: p.plotArea || 0,
          rooms: p.rooms || 0,
          bedrooms: p.bedrooms || 0,
          bathrooms: p.bathrooms || 0,
          buildYear: p.yearBuilt || null,
          address: {
            street: p.street || '',
            houseNumber: p.houseNumber || '',
            postalCode: p.zipCode || '',
            city: p.city || ''
          },
          description: p.description || '',
          features: [],
          images: [],
          status: p.status || 'available'
        }))
      };

      // Send to homepage
      const response = await fetch(homepageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(`${propertiesToSync.length} Immobilie(n) erfolgreich synchronisiert`);
      setIsSyncDialogOpen(false);
      setSelectedProperties([]);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Fehler beim Synchronisieren: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Immobilien</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Immobilien und erstellen Sie Exposés
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Zur Homepage synchronisieren
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Immobilien synchronisieren</DialogTitle>
                <DialogDescription>
                  Synchronisieren Sie {selectedProperties.length > 0 ? `${selectedProperties.length} ausgewählte` : 'alle aktiven'} Immobilien mit Ihrer Homepage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="homepage-url">Homepage API-URL</Label>
                  <Input
                    id="homepage-url"
                    placeholder="https://ihre-homepage.de/api/properties"
                    value={homepageUrl}
                    onChange={(e) => setHomepageUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Geben Sie die URL ein, an die die Immobiliendaten gesendet werden sollen.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSync}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Jetzt synchronisieren
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Immobilie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Immobilie anlegen</DialogTitle>
              <DialogDescription>
                Geben Sie die grundlegenden Informationen ein. Details können später ergänzt werden.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Moderne 3-Zimmer-Wohnung in Zentrumsnähe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="propertyType">Immobilientyp *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value: any) => setFormData({ ...formData, propertyType: value })}
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

                <div className="grid gap-2">
                  <Label htmlFor="marketingType">Vermarktungsart *</Label>
                  <Select
                    value={formData.marketingType}
                    onValueChange={(value: any) => setFormData({ ...formData, marketingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Kauf</SelectItem>
                      <SelectItem value="rent">Miete</SelectItem>
                      <SelectItem value="lease">Pacht</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Objektbeschreibung..."
                  rows={3}
                />
              </div>

              {/* Google Address Autocomplete */}
              <div className="grid gap-2">
                <Label>Adresse suchen (Google Maps)</Label>
                <AddressAutocomplete
                  value={addressSearchValue}
                  onChange={setAddressSearchValue}
                  onPlaceSelect={handlePlaceSelected}
                  placeholder="Adresse eingeben..."
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="street">Straße</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="houseNumber">Nr.</Label>
                  <Input
                    id="houseNumber"
                    value={formData.houseNumber}
                    onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zipCode">PLZ</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="livingArea">Wohnfläche (m²)</Label>
                  <Input
                    id="livingArea"
                    type="number"
                    value={formData.livingArea}
                    onChange={(e) => setFormData({ ...formData, livingArea: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rooms">Zimmer</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Preis (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={!formData.title || createMutation.isPending}>
                {createMutation.isPending ? "Erstelle..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Objekt suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="acquisition">Akquise</SelectItem>
            <SelectItem value="preparation">Vorbereitung</SelectItem>
            <SelectItem value="marketing">Vermarktung</SelectItem>
            <SelectItem value="reserved">Reserviert</SelectItem>
            <SelectItem value="notary">Notartermin</SelectItem>
            <SelectItem value="sold">Verkauft</SelectItem>
            <SelectItem value="completed">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {properties && properties.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Keine Immobilien vorhanden</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Legen Sie Ihre erste Immobilie an, um zu starten.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onChange={toggleAllProperties}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead className="w-20">Bild</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Vermarktung</TableHead>
                <TableHead>Zimmer</TableHead>
                <TableHead>Fläche</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.id)}
                      onChange={() => togglePropertySelection(property.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={convertToProxyUrl(property.images.find(img => img.isFeatured)?.imageUrl || property.images[0]?.imageUrl)} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => setLocation(`/dashboard/properties/${property.id}`)}
                      className="text-left hover:underline hover:text-primary transition-colors"
                    >
                      {property.title}
                    </button>
                  </TableCell>
                  <TableCell>{getPropertyTypeLabel(property.propertyType)}</TableCell>
                  <TableCell>{getMarketingTypeLabel(property.marketingType)}</TableCell>
                  <TableCell>{property.rooms || "-"}</TableCell>
                  <TableCell>{property.livingArea ? `${property.livingArea} m²` : "-"}</TableCell>
                  <TableCell>{formatPrice(property.price)}</TableCell>
                  <TableCell>
                    <Select
                      value={property.status}
                      onValueChange={(value) => {
                        updateMutation.mutate({
                          id: property.id,
                          data: {
                            status: value as any,
                          },
                        });
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue>
                          {getStatusBadge(property.status)}
                        </SelectValue>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewLanding(property.id)}
                        title="Landing Page öffnen"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleGenerateExpose(property.id)}
                        title="Exposé generieren"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/dashboard/properties/${property.id}`)}
                        title="Details anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info("Bearbeiten kommt bald")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
