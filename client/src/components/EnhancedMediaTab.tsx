import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileIcon, ImageIcon, Download, Edit, X, LayoutGrid, Grid3x3, Grid2x2, Pencil, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ImageLightbox";

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

// Helper function to capitalize category names
const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    "alle bilder": "Alle Bilder",
    hausansicht: "Hausansicht",
    kueche: "Küche",
    bad: "Bad",
    wohnzimmer: "Wohnzimmer",
    schlafzimmer: "Schlafzimmer",
    balkon: "Balkon/Terrasse",
    keller: "Keller",
    dachboden: "Dachboden",
    garage: "Garage",
    grundrisse: "Grundrisse",
    sonstiges: "Sonstiges",
    garten: "Garten",
  };
  return categoryMap[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
};

export function EnhancedMediaTab({ propertyId }: EnhancedMediaTabProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewSize, setViewSize] = useState<"small" | "medium" | "large">("small");
  const [activeCategory, setActiveCategory] = useState<string>("Alle Bilder");
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<MediaItem[]>([]);
  
  // PDF preview state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  
  // Selected documents for bulk download
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  
  // Form state for editing
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [showOnLandingPage, setShowOnLandingPage] = useState(false);
  const [isFloorPlan, setIsFloorPlan] = useState(false);
  const [useInExpose, setUseInExpose] = useState(false);

  const { data: property } = trpc.properties.getById.useQuery({ id: propertyId });
  const { data: documents } = trpc.documents.listByProperty.useQuery({ propertyId });
  
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

  const syncFromNASMutation = trpc.properties.syncFromNAS.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      if (data.errors && data.errors.length > 0) {
        toast.error(`Fehler: ${data.errors.join(', ')}`);
      }
      utils.properties.getById.invalidate({ id: propertyId });
    },
    onError: (error) => {
      toast.error(`Sync fehlgeschlagen: ${error.message}`);
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

  const deleteImageMutation = trpc.properties.deleteImage.useMutation({
    onSuccess: () => {
      toast.success("Bild gelöscht");
      utils.properties.getById.invalidate({ id: propertyId });
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteDocumentMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Dokument gelöscht");
      utils.documents.listByProperty.invalidate({ propertyId });
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
  ];

  // Separate images and documents
  const imageItems = mediaItems.filter(item => item.type === "image");
  const documentItems = mediaItems.filter(item => item.type === "document");
  
  // Group images by category
  const groupedImages = imageItems.reduce((acc, item) => {
    const category = item.category || "Sonstiges";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);
  
  // Group documents by category (folder)
  const groupedDocuments = documentItems.reduce((acc, item) => {
    const category = item.category || "Sonstiges";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  // Get all categories for filter tabs
  const imageCategories = ["Alle Bilder", ...Object.keys(groupedImages).sort()];
  
  // Filter images based on active category
  const filteredImages = activeCategory === "Alle Bilder" 
    ? imageItems 
    : imageItems.filter(item => item.category === activeCategory);

  const handleItemClick = (item: MediaItem, index: number) => {
    if (item.type === "image") {
      // Open lightbox for images
      setLightboxImages(filteredImages);
      setLightboxIndex(index);
      setLightboxOpen(true);
    } else {
      // Open edit dialog for documents
      setSelectedItem(item);
      setEditTitle(item.title);
      setEditCategory(item.category || "");
      setEditDisplayName(item.displayName || item.title);
      setShowOnLandingPage(!!item.showOnLandingPage);
      setIsFloorPlan(!!item.isFloorPlan);
      setUseInExpose(!!item.useInExpose);
      setEditDialogOpen(true);
    }
  };
  
  const handleEditClick = (item: MediaItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || "");
    setEditDisplayName(item.displayName || item.title);
    setShowOnLandingPage(!!item.showOnLandingPage);
    setIsFloorPlan(!!item.isFloorPlan);
    setUseInExpose(!!item.useInExpose);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (item: MediaItem) => {
    if (!confirm(`${item.type === "image" ? "Bild" : "Dokument"} "${item.title}" wirklich löschen?`)) {
      return;
    }
    
    if (item.type === "image") {
      deleteImageMutation.mutate({ id: item.id });
    } else {
      deleteDocumentMutation.mutate({ id: item.id });
    }
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
        {/* Sync Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => syncFromNASMutation.mutate({ propertyId })}
            disabled={syncFromNASMutation.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncFromNASMutation.isPending ? 'animate-spin' : ''}`} />
            {syncFromNASMutation.isPending ? 'Synchronisiere...' : 'Vom NAS synchronisieren'}
          </Button>
        </div>
        
        {/* Unified Images Gallery with Filter Tabs */}
        {imageItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Bildergalerie ({imageItems.length})</CardTitle>
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
              
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-2 mt-4">
                {imageCategories.map((cat) => {
                  const count = cat === "Alle Bilder" ? imageItems.length : (groupedImages[cat]?.length || 0);
                  return (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className="h-9"
                    >
                      {formatCategoryName(cat)} ({count})
                    </Button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              {filteredImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Bilder in dieser Kategorie</p>
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  viewSize === "small" ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" :
                  viewSize === "medium" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" :
                  "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}>
                  {filteredImages.map((item, index) => (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => handleItemClick(item, index)}
                        className="relative aspect-square overflow-hidden rounded-lg border hover:border-primary transition-colors text-left w-full"
                      >
                        <img
                          src={item.url}
                          alt={item.displayName || item.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EBild%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {item.showOnLandingPage === 1 && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Landing Page
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-sm truncate">{item.title}</p>
                        </div>
                      </button>

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Documents Section - Propstack Style */}
        {Object.keys(groupedDocuments).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dokumente ({documentItems.length})</CardTitle>
                {selectedDocuments.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Download selected documents as ZIP
                      const selectedDocs = documentItems.filter(doc => selectedDocuments.includes(doc.id));
                      selectedDocs.forEach(doc => {
                        window.open(doc.url, '_blank');
                      });
                      toast.success(`${selectedDocuments.length} Dokument(e) werden heruntergeladen`);
                      setSelectedDocuments([]);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {selectedDocuments.length} Dokument(e) herunterladen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(groupedDocuments).map(([category, docs]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{formatCategoryName(category)} ({docs.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedDocuments([...selectedDocuments, doc.id]);
                                } else {
                                  setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <FileIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.title}</p>
                              {doc.showOnLandingPage === 1 && (
                                <span className="text-xs text-green-600">Auf Landing Page</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPdfPreviewUrl(doc.url);
                                setPdfPreviewOpen(true);
                              }}
                              title="Vorschau"
                            >
                              <FileIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(doc);
                              }}
                              title="Bearbeiten"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.url, '_blank');
                              }}
                              title="Herunterladen"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.type === "image" ? "Bild bearbeiten" : "Dokument bearbeiten"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label>Anzeigename</Label>
              <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>Kategorie</Label>
              {selectedItem?.type === "document" ? (
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="objektunterlagen">Objektunterlagen</option>
                  <option value="sensible">Sensible Daten</option>
                  <option value="vertragsunterlagen">Vertragsunterlagen</option>
                  <option value="upload">Upload-Bereich</option>
                </select>
              ) : (
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  <option value="garage">Garage/Stellplatz</option>
                  <option value="grundrisse">Grundrisse</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showOnLandingPage} onCheckedChange={setShowOnLandingPage} />
              <Label>Auf Landing Page anzeigen</Label>
            </div>
            {selectedItem?.type === "document" && (
              <>
                <div className="flex items-center gap-2">
                  <Switch checked={isFloorPlan} onCheckedChange={setIsFloorPlan} />
                  <Label>Ist Grundriss</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={useInExpose} onCheckedChange={setUseInExpose} />
                  <Label>Im Exposé verwenden</Label>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages.map(img => ({ url: img.url, title: img.title }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
      
      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="max-w-6xl w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Dokument-Vorschau</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <iframe
              src={pdfPreviewUrl}
              className="w-full h-full border rounded"
              title="PDF Vorschau"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
