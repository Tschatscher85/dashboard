import { useState } from "react";
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
import { Plus, Edit, Trash2, Eye, Building2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Properties() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      available: "default",
      reserved: "secondary",
      sold: "destructive",
      rented: "destructive",
      inactive: "outline",
    };
    const labels: Record<string, string> = {
      available: "Verfügbar",
      reserved: "Reserviert",
      sold: "Verkauft",
      rented: "Vermietet",
      inactive: "Inaktiv",
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
                <TableHead>Titel</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Vermarktung</TableHead>
                <TableHead>Ort</TableHead>
                <TableHead>Fläche</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties?.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.title}</TableCell>
                  <TableCell>{getPropertyTypeLabel(property.propertyType)}</TableCell>
                  <TableCell>{getMarketingTypeLabel(property.marketingType)}</TableCell>
                  <TableCell>{property.city || "-"}</TableCell>
                  <TableCell>{property.livingArea ? `${property.livingArea} m²` : "-"}</TableCell>
                  <TableCell>{formatPrice(property.price)}</TableCell>
                  <TableCell>{getStatusBadge(property.status)}</TableCell>
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
