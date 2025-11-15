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
  Save,
  X,
  FileDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { PropertyDetailForm, type Property, type PropertyDetailFormHandle } from "@/components/PropertyDetailForm";
import { EnhancedMediaTab } from "@/components/EnhancedMediaTab";
import { useState, useRef, useEffect } from "react";

export default function PropertyDetail() {
  const [, params] = useRoute("/dashboard/properties/:id");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  // Convert NAS URLs to proxy URLs to avoid authentication popup
  const convertToProxyUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    // If URL is from NAS (contains ugreen.tschatscher.eu), convert to proxy URL
    if (url.includes('ugreen.tschatscher.eu')) {
      // Extract path after domain
      // Example: https://ugreen.tschatscher.eu/Daten/... -> /Daten/...
      const match = url.match(/ugreen\.tschatscher\.eu(\/.*)/i);
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const formRef = useRef<PropertyDetailFormHandle>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Check URL hash on mount and when hash changes
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove #
    if (hash === 'media') {
      setActiveTab('media');
    }
  }, []);

  const { data: property, isLoading, refetch } = trpc.properties.getById.useQuery({
    id: propertyId,
  });
  
  // Auto-generate title from address if title is empty or default
  useEffect(() => {
    if (property && (!property.title || property.title === 'Immobilientitel')) {
      const parts = [];
      if (property.street) parts.push(property.street);
      if (property.houseNumber) parts.push(property.houseNumber);
      
      const addressPart1 = parts.join(' ');
      const addressPart2 = [];
      if (property.zipCode) addressPart2.push(property.zipCode);
      if (property.city) addressPart2.push(property.city);
      
      const fullAddress = [addressPart1, addressPart2.join(' ')].filter(Boolean).join(', ');
      
      if (fullAddress && fullAddress !== property.title) {
        // Update the title in the database
        updateMutation.mutate({
          id: propertyId,
          data: { title: fullAddress } as any,
        });
      }
    }
  }, [property?.street, property?.houseNumber, property?.zipCode, property?.city, property?.title]);

  // Initialize editedTitle when entering edit mode
  const handleEditClick = () => {
    setEditedTitle(property?.title || "");
    setIsEditing(true);
  };

  // Reset editedTitle when canceling
  const handleCancelClick = () => {
    setEditedTitle("");
    setIsEditing(false);
  };

  // Load NAS images (Bilder category)
  const { data: nasImages } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: 'Bilder' },
    { enabled: !!propertyId }
  );

  // Combine Cloud images (from database) and NAS images
  const allImages = [
    ...(property?.images || []),
    ...(nasImages || []).map(nasFile => ({
      imageUrl: `/api/nas/${nasFile.filename}`, // Proxy endpoint to fetch from NAS
      title: nasFile.basename,
      nasPath: nasFile.filename,
      isNAS: true,
    }))
  ];

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Immobilie aktualisiert");
      refetch();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
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

  const handleSave = (data: Partial<Property>) => {
    // Remove title from form data to avoid duplication
    const dataWithoutTitle: any = { ...data };
    delete dataWithoutTitle.title;
    
    // Always use editedTitle if it exists (user is in edit mode)
    const newTitle = editedTitle || property?.title;
    const finalData = {
      ...dataWithoutTitle,
      title: newTitle,
      // headline is independent and comes from formData
    };
    
    updateMutation.mutate({
      id: propertyId,
      data: finalData as any,
    });
    
    // Reset editedTitle after successful save
    setEditedTitle("");
  };

  const handleSaveClick = () => {
    if (formRef.current) {
      formRef.current.save();
    }
  };

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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      acquisition: { label: "Akquise", variant: "secondary" },
      preparation: { label: "Vorbereitung", variant: "secondary" },
      marketing: { label: "Vermarktung", variant: "default" },
      reserved: { label: "Reserviert", variant: "secondary" },
      notary: { label: "Notartermin", variant: "default" },
      sold: { label: "Verkauft", variant: "outline" },
      completed: { label: "Abgeschlossen", variant: "outline" },
    };
    const { label, variant } = config[status] || { label: status, variant: "default" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* New Header with Image */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex gap-6">
          {/* Property Image */}
          <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
            {(() => {
              // Try to find featured image first, fallback to first image
              const featuredImage = property.images?.find((img: any) => img.isFeatured === 1);
              const firstImage = property.images?.[0];
              const displayImage = featuredImage || firstImage;
              
              if (displayImage?.imageUrl) {
                return (
                  <img
                    src={convertToProxyUrl(displayImage.imageUrl)}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                );
              }
              return <Building2 className="h-12 w-12 text-muted-foreground" />;
            })()}
          </div>
          
          {/* Property Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-2xl font-bold border-b-2 border-primary bg-transparent focus:outline-none w-auto min-w-[300px]"
                      placeholder="Immobilientitel"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold">{property.title}</h1>
                  )}
                  {getStatusBadge(property.status)}
                  {/* Info Badges */}
                  <div className="flex gap-2">
                    <Badge variant="outline" className="rounded-full">29</Badge>
                    <Badge variant="outline" className="rounded-full bg-pink-100 text-pink-700 border-pink-200">6</Badge>
                    <Badge variant="outline" className="rounded-full bg-purple-100 text-purple-700 border-purple-200">1</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[property.street, property.houseNumber, property.zipCode, property.city]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="font-semibold">{formatPrice(property.price)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{property.marketingType === 'sale' ? 'Kauf' : property.marketingType === 'rent' ? 'Miete' : 'Pacht'}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{getPropertyTypeLabel(property.propertyType)}</span>
                  {property.subType && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span>{property.subType}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Open landing page in new tab
                        window.open(`/property/${propertyId}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Landing Page öffnen
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Open landing page in print mode
                        window.open(`/property/${propertyId}?print=true`, '_blank');
                      }}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exposé erstellen
                    </Button>
                    <Button variant="outline" onClick={() => setLocation(`/dashboard/properties/${propertyId}/media`)}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Medien verwalten
                    </Button>
                    <Button variant="outline" onClick={handleEditClick}>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
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
                  </>
                ) : (
                  <>
                    <Button 
                      variant="default" 
                      onClick={handleSaveClick}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                    <Button variant="outline" onClick={handleCancelClick}>
                      <X className="h-4 w-4 mr-2" />
                      Abbrechen
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
          <TabsTrigger value="contacts">Kontakte</TabsTrigger>
          <TabsTrigger value="media">Medien</TabsTrigger>
          <TabsTrigger value="history">Historie</TabsTrigger>
        </TabsList>

        {/* Details Tab - Now uses PropertyDetailForm */}
        <TabsContent value="details" className="space-y-6">
          <PropertyDetailForm
            ref={formRef}
            property={property ? {
              ...property,
              // Convert Date to ISO string for date input fields
              availableFrom: property.availableFrom instanceof Date
                ? property.availableFrom.toISOString().split('T')[0] as any
                : property.availableFrom
            } as Property : property}
            onSave={handleSave}
            isEditing={isEditing}
          />
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

        {/* Media Tab - Enhanced with images and documents */}
        <TabsContent value="media">
          <EnhancedMediaTab propertyId={propertyId} />
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
                      <div className="font-semibold">Zuletzt aktualisiert</div>
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
