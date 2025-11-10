import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileIcon, ImageIcon, Download, Edit, X, LayoutGrid, Grid3x3, Grid2x2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EnhancedMediaTabProps {
  propertyId: number;
}

interface MediaItem {
  id: number;
  type: "image" | "document";
  url: string;
  title: string;
  category?: string;
  displayName?: string;
  showOnLandingPage?: number;
  isFloorPlan?: number;
  useInExpose?: number;
  nasPath?: string;
}

export function EnhancedMediaTab({ propertyId }: EnhancedMediaTabProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewSize, setViewSize] = useState<"small" | "medium" | "large">("medium");
  
  // Form state for editing
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [showOnLandingPage, setShowOnLandingPage] = useState(false);
  const [isFloorPlan, setIsFloorPlan] = useState(false);
  const [useInExpose, setUseInExpose] = useState(false);

  const { data: property } = trpc.properties.getById.useQuery({ id: propertyId });
  const { data: documents } = trpc.documents.listByProperty.useQuery({ propertyId });
  
  // Load NAS files for all categories
  const { data: nasImages } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: 'Bilder' },
    { enabled: !!propertyId }
  );
  const { data: nasObjektunterlagen } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: 'Objektunterlagen' },
    { enabled: !!propertyId }
  );
  const { data: nasSensibleDaten } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: 'Sensible Daten' },
    { enabled: !!propertyId }
  );
  const { data: nasVertragsunterlagen } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: 'Vertragsunterlagen' },
    { enabled: !!propertyId }
  );
  
  const utils = trpc.useUtils();

  const updateImageMutation = trpc.properties.updateImage.useMutation({
    onSuccess: () => {
      toast.success("Bild aktualisiert");
      utils.properties.getById.invalidate({ id: propertyId });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateDocumentMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("Dokument aktualisiert");
      utils.documents.listByProperty.invalidate({ propertyId });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Combine images and documents into media items
  const mediaItems: MediaItem[] = [
    // Database images
    ...(property?.images || []).map((img: any) => ({
      id: img.id,
      type: "image" as const,
      url: img.imageUrl,
      title: img.title || "Unbenannt",
      category: img.category || img.imageType,
      displayName: img.displayName,
      showOnLandingPage: img.showOnLandingPage,
      nasPath: img.nasPath,
    })),
    // NAS images - REMOVED: All images are now in database
    // Database documents
    ...(documents || []).map((doc: any) => ({
      id: doc.id,
      type: "document" as const,
      url: doc.fileUrl || doc.nasPath,
      title: doc.title,
      category: doc.category || doc.documentType,
      displayName: doc.title,
      showOnLandingPage: doc.showOnLandingPage,
      isFloorPlan: doc.isFloorPlan,
      useInExpose: doc.useInExpose,
      nasPath: doc.nasPath,
    })),
    // NAS documents - REMOVED: All documents are now in database
  ];

  // Group media by category
  const groupedMedia = mediaItems.reduce((acc, item) => {
    const category = item.category || "Sonstiges";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || "");
    setEditDisplayName(item.displayName || item.title);
    setShowOnLandingPage(!!item.showOnLandingPage);
    setIsFloorPlan(!!item.isFloorPlan);
    setUseInExpose(!!item.useInExpose);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedItem) return;

    if (selectedItem.type === "image") {
      updateImageMutation.mutate({
        id: selectedItem.id,
        title: editTitle,
        category: editCategory,
        displayName: editDisplayName,
        showOnLandingPage: showOnLandingPage ? 1 : 0,
      });
    } else {
      updateDocumentMutation.mutate({
        id: selectedItem.id,
        title: editTitle,
        category: editCategory,
        showOnLandingPage: showOnLandingPage ? 1 : 0,
        isFloorPlan: isFloorPlan ? 1 : 0,
        useInExpose: useInExpose ? 1 : 0,
      });
    }
  };

  if (mediaItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Medien hochgeladen</p>
            <p className="text-sm mt-2">
              Klicken Sie auf "Medien verwalten", um Bilder und Dokumente hochzuladen
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedMedia).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category}</CardTitle>
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={viewSize === "small" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewSize("small")}
                    className="h-8 px-2"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewSize === "medium" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewSize("medium")}
                    className="h-8 px-2"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewSize === "large" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewSize("large")}
                    className="h-8 px-2"
                  >
                    <Grid2x2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${
                viewSize === "small" ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" :
                viewSize === "medium" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" :
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}>
                {items.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="relative aspect-square overflow-hidden rounded-lg border group hover:border-primary transition-colors text-left"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.displayName || item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EBild%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                        <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground px-2 text-center line-clamp-2">
                          {item.title}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 line-clamp-1">
                      {item.displayName || item.title}
                    </div>
                    {item.showOnLandingPage === 1 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Landing Page
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === "image" ? "Bild bearbeiten" : "Dokument bearbeiten"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {selectedItem && (
              <div className="flex justify-center">
                {selectedItem.type === "image" ? (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    className="max-h-64 rounded-lg border"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
                    <FileIcon className="h-16 w-16 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">{selectedItem.title}</span>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titel eingeben"
              />
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="edit-display-name">Anzeigename</Label>
              <Input
                id="edit-display-name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Anzeigename für Benutzer"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="edit-category">Kategorie</Label>
              <select
                id="edit-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="hausansicht">Hausansicht</option>
                <option value="kueche">Küche</option>
                <option value="bad">Bad</option>
                <option value="wohnzimmer">Wohnzimmer</option>
                <option value="schlafzimmer">Schlafzimmer</option>
                <option value="garten">Garten</option>
                <option value="balkon">Balkon/Terrasse</option>
                <option value="keller">Keller</option>
                <option value="dachboden">Dachboden</option>
                <option value="garage">Garage</option>
                <option value="grundrisse">Grundrisse</option>
                <option value="sonstiges">Sonstiges</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-landing">Auf Landing Page anzeigen</Label>
                <Switch
                  id="show-landing"
                  checked={showOnLandingPage}
                  onCheckedChange={setShowOnLandingPage}
                />
              </div>

              {selectedItem?.type === "document" && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-floorplan">Als Grundriss markieren</Label>
                    <Switch
                      id="is-floorplan"
                      checked={isFloorPlan}
                      onCheckedChange={setIsFloorPlan}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="use-expose">Als Exposé verwenden</Label>
                    <Switch
                      id="use-expose"
                      checked={useInExpose}
                      onCheckedChange={setUseInExpose}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                <Edit className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
