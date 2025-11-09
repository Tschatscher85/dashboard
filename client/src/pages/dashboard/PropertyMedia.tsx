import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, FileText, Link as LinkIcon, X, Loader2, ArrowLeft, Pencil, TestTube2, CheckCircle2, XCircle, LayoutGrid, Grid3x3, Grid2x2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageLightbox } from "@/components/ImageLightbox";
import DraggableImageGallery from "@/components/DraggableImageGallery";

export default function PropertyMedia() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0");
  
  const [renamingImage, setRenamingImage] = useState<{ id?: number; nasPath?: string; currentName: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [showNASTest, setShowNASTest] = useState(false);
  const [nasTestResults, setNasTestResults] = useState<any>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  
  // Multi-select state
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const { data: property, isLoading } = trpc.properties.getById.useQuery({ id: propertyId });
  
  // Fetch NAS files for each category
  const { data: nasImages, refetch: refetchImages } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: "Bilder" },
    { enabled: !!propertyId }
  );
  const { data: nasObjektunterlagen, refetch: refetchObjektunterlagen } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: "Objektunterlagen" },
    { enabled: !!propertyId }
  );
  const { data: nasSensibleDaten, refetch: refetchSensibleDaten } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: "Sensible Daten" },
    { enabled: !!propertyId }
  );
  const { data: nasVertragsunterlagen, refetch: refetchVertragsunterlagen } = trpc.properties.listNASFiles.useQuery(
    { propertyId, category: "Vertragsunterlagen" },
    { enabled: !!propertyId }
  );
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  // Image category selection
  const [selectedImageCategory, setSelectedImageCategory] = useState("hausansicht");
  
  // View size control
  const [viewSize, setViewSize] = useState<"small" | "medium" | "large">("medium");
  
  // Category filter for gallery
  const [activeCategory, setActiveCategory] = useState<string>("alle");
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  
  // Drag and drop state
  const [isDragDropEnabled, setIsDragDropEnabled] = useState(false);
  
  // Reorder images mutation
  const reorderImagesMutation = trpc.properties.reorderImages.useMutation({
    onSuccess: () => {
      toast.success("Bildersortierung gespeichert");
    },
    onError: (error) => {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });
  
  // Links state
  const [virtualTourLink, setVirtualTourLink] = useState("");
  const [businessCardLink, setBusinessCardLink] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, category: "images" | "documents", docCategory?: string) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files, category, docCategory);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, category: "images" | "documents", docCategory?: string) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files, category, docCategory);
  };

  const uploadMutation = trpc.properties.uploadToNAS.useMutation({
    onSuccess: (data, variables) => {
      // Show appropriate message based on whether fallback was used
      if (data.usedFallback) {
        toast.warning(data.message || "Datei in Cloud gespeichert (NAS nicht erreichbar)");
      } else {
        toast.success(data.message || "Datei erfolgreich hochgeladen");
      }
      
      // Refetch the appropriate category
      if (variables.category === "Bilder") refetchImages();
      else if (variables.category === "Objektunterlagen") refetchObjektunterlagen();
      else if (variables.category === "Sensible Daten") refetchSensibleDaten();
      else if (variables.category === "Vertragsunterlagen") refetchVertragsunterlagen();
    },
    onError: (error) => {
      toast.error(`Fehler beim Hochladen: ${error.message}`);
    },
  });

  const deleteMutation = trpc.properties.deleteFromNAS.useMutation({
    onSuccess: () => {
      toast.success("Datei gelöscht");
      // Refetch all categories to be safe
      refetchImages();
      refetchObjektunterlagen();
      refetchSensibleDaten();
      refetchVertragsunterlagen();
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  const deleteImageMutation = trpc.properties.deleteImage.useMutation({
    onSuccess: () => {
      toast.success("Bild gelöscht");
      // Refetch both property data and NAS files
      refetchImages();
      window.location.reload(); // Full refresh to update property.images
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  const uploadFiles = async (files: File[], category: "images" | "documents", docCategory?: string) => {
    if (files.length === 0) return;
    
    if (category === "images") {
      setUploadingImages(true);
    } else {
      setUploadingDocs(true);
    }

    try {
      // Determine NAS category
      let nasCategory: "Bilder" | "Objektunterlagen" | "Sensible Daten" | "Vertragsunterlagen" = "Bilder";
      if (category === "documents") {
        if (docCategory === "objektunterlagen") nasCategory = "Objektunterlagen";
        else if (docCategory === "sensible") nasCategory = "Sensible Daten";
        else if (docCategory === "vertragsunterlagen") nasCategory = "Vertragsunterlagen";
        else nasCategory = "Objektunterlagen"; // Default for "upload" category
      }

      // Upload each file
      for (const file of files) {
        // Convert file to base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to NAS
        await uploadMutation.mutateAsync({
          propertyId,
          category: nasCategory,
          fileName: file.name,
          fileData,
          mimeType: file.type,
          imageType: category === "images" ? (selectedImageCategory as "hausansicht" | "kueche" | "bad" | "wohnzimmer" | "schlafzimmer" | "garten" | "balkon" | "keller" | "dachboden" | "garage" | "grundrisse" | "sonstiges") : undefined,
        });
      }
      
      toast.success(`${files.length} Datei(en) erfolgreich hochgeladen`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Fehler beim Hochladen der Dateien");
    } finally {
      if (category === "images") {
        setUploadingImages(false);
      } else {
        setUploadingDocs(false);
      }
    }
  };

  const saveLinks = () => {
    // TODO: Save links to database
    toast.success("Links gespeichert");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return <div>Immobilie nicht gefunden</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.location.href = `/dashboard/properties/${propertyId}#media`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{property.title}</h1>
              <p className="text-muted-foreground">
                {property.street} {property.houseNumber}, {property.zipCode} {property.city}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showNASTest} onOpenChange={setShowNASTest}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TestTube2 className="w-4 h-4 mr-2" />
                  WebDAV testen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>WebDAV-Verbindungstest</DialogTitle>
                </DialogHeader>
                <WebDAVTestDialog
                  propertyId={propertyId}
                  results={nasTestResults}
                  setResults={setNasTestResults}
                  isRunning={isTestRunning}
                  setIsRunning={setIsTestRunning}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TestTube2 className="w-4 h-4 mr-2" />
                  FTP testen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>FTP-Verbindungstest</DialogTitle>
                </DialogHeader>
                <FTPTestDialog propertyId={propertyId} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="medien" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medien">
            <ImageIcon className="w-4 h-4 mr-2" />
            Medien
          </TabsTrigger>
          <TabsTrigger value="dokumente">
            <FileText className="w-4 h-4 mr-2" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="w-4 h-4 mr-2" />
            Links
          </TabsTrigger>
        </TabsList>

        {/* Medien Tab */}
        <TabsContent value="medien" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bilder hochladen</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Kategorie für neue Bilder auswählen:
                </label>
                <select
                  value={selectedImageCategory}
                  onChange={(e) => setSelectedImageCategory(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background"
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
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "images")}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Bilder werden hochgeladen...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      Bilder hier ablegen oder klicken zum Auswählen
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unterstützte Formate: JPG, PNG, WebP
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, "images")}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button asChild>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        Bilder auswählen
                      </label>
                    </Button>
                  </>
                )}
              </div>

              {/* Image Gallery */}
              <div className="mt-6">
                {(() => {
                  // Combine database images and NAS images
                  const dbImages = property.images || [];
                  
                  // Define image categories
                  const imageCategories = [
                    { value: "alle", label: "Alle Bilder" },
                    { value: "hausansicht", label: "Hausansicht" },
                    { value: "kueche", label: "Küche" },
                    { value: "bad", label: "Bad" },
                    { value: "wohnzimmer", label: "Wohnzimmer" },
                    { value: "schlafzimmer", label: "Schlafzimmer" },
                    { value: "garten", label: "Garten" },
                    { value: "balkon_terrasse", label: "Balkon/Terrasse" },
                    { value: "keller", label: "Keller" },
                    { value: "dachboden", label: "Dachboden" },
                    { value: "garage", label: "Garage" },
                    { value: "grundrisse", label: "Grundrisse" },
                    { value: "sonstiges", label: "Sonstiges" },
                  ];
                  
                  // Filter images by category
                  const filteredDbImages = activeCategory === "alle" 
                    ? dbImages 
                    : dbImages.filter((img: any) => img.imageType === activeCategory);
                  
                  const totalImages = filteredDbImages.length + (nasImages?.length || 0);
                  
                  return (
                    <>
                      {/* Category Tabs */}
                      <div className="mb-4 overflow-x-auto">
                        <div className="flex gap-2 pb-2">
                          {imageCategories.map((cat) => {
                            const catCount = cat.value === "alle" 
                              ? dbImages.length 
                              : dbImages.filter((img: any) => img.imageType === cat.value).length;
                            return (
                              <Button
                                key={cat.value}
                                variant={activeCategory === cat.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveCategory(cat.value)}
                                className="whitespace-nowrap"
                              >
                                {cat.label}
                                {catCount > 0 && (
                                  <span className="ml-1.5 text-xs opacity-70">({catCount})</span>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold">
                            Bildergalerie
                            {totalImages > 0 && (
                              <span className="ml-2 text-sm text-muted-foreground">({totalImages} Bilder)</span>
                            )}
                          </h3>
                          {totalImages > 0 && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectAll(checked);
                                  if (checked) {
                                    const allIds = new Set<string>();
                                    filteredDbImages.forEach((img: any, idx: number) => allIds.add(`db-${img.id || idx}`));
                                    nasImages?.forEach((file: any, idx: number) => allIds.add(`nas-${file.filename}`));
                                    setSelectedImages(allIds);
                                  } else {
                                    setSelectedImages(new Set());
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              Alle auswählen
                            </label>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {totalImages > 0 && (
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
                          )}
                        </div>
                        {selectedImages.size > 0 && (
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`${selectedImages.size} ausgewählte Bilder wirklich löschen?`)) {
                                // Delete selected images
                                selectedImages.forEach(id => {
                                  if (id.startsWith('db-')) {
                                    const dbId = parseInt(id.replace('db-', ''));
                                    if (!isNaN(dbId)) {
                                      deleteImageMutation.mutate({ id: dbId });
                                    }
                                  } else if (id.startsWith('nas-')) {
                                    const nasPath = id.replace('nas-', '');
                                    deleteMutation.mutate({ nasPath });
                                  }
                                });
                                setSelectedImages(new Set());
                                setSelectAll(false);
                              }
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Ausgewählte löschen ({selectedImages.size})
                          </Button>
                        )}
                      </div>
                      <div className={`grid gap-4 ${
                        viewSize === "small" ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" :
                        viewSize === "medium" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" :
                        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      }`}>
                        {/* Database images (S3) */}
                        {filteredDbImages.map((image: any, index: number) => {
                          const imageId = `db-${image.id || index}`;
                          const isSelected = selectedImages.has(imageId);
                          return (
                          <div 
                            key={imageId} 
                            className="relative group cursor-pointer"
                            onClick={() => {
                              const allImages = [...filteredDbImages, ...(nasImages || [])];
                              setLightboxImages(allImages);
                              setLightboxIndex(index);
                              setLightboxOpen(true);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedImages);
                                if (e.target.checked) {
                                  newSelected.add(imageId);
                                } else {
                                  newSelected.delete(imageId);
                                  setSelectAll(false);
                                }
                                setSelectedImages(newSelected);
                              }}
                              className="absolute top-2 left-2 w-5 h-5 z-10 cursor-pointer"
                            />
                            <img
                              src={image.imageUrl}
                              alt={image.title || `Bild ${index + 1}`}
                              className={`w-full object-cover rounded-lg pointer-events-none ${
                                viewSize === "small" ? "h-32" :
                                viewSize === "medium" ? "h-48" :
                                "h-64"
                              }`}
                              onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className={`hidden w-full bg-muted rounded-lg flex items-center justify-center ${
                              viewSize === "small" ? "h-32" :
                              viewSize === "medium" ? "h-48" :
                              "h-64"
                            }`}>
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 z-30">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-lg z-30 pointer-events-auto bg-white/90 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setRenamingImage({
                                    id: image.id,
                                    currentName: image.title || `Bild ${index + 1}`,
                                    category: image.category || image.imageType || "sonstiges",
                                  });
                                  setNewName(image.displayName || image.title || "");
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 shadow-lg z-30 pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  
                                  if (!image.id) {
                                    alert('Fehler: Bild hat keine ID!');
                                    return;
                                  }
                                  
                                  if (confirm(`Bild "${image.title || 'Unbenannt'}" wirklich löschen?`)) {
                                    deleteImageMutation.mutate({ id: image.id });
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="mt-2 text-sm text-center truncate" title={image.title}>
                              {image.title || `Bild ${index + 1}`}
                            </p>
                            <p className="text-xs text-center text-muted-foreground">
                              Cloud
                            </p>
                          </div>
                        );
                        })}
                        
                        {/* NAS images */}
                        {nasImages && nasImages.map((file: any, index: number) => {
                          const imageId = `nas-${file.filename}`;
                          const isSelected = selectedImages.has(imageId);
                          return (
                          <div 
                            key={imageId} 
                            className="relative group cursor-pointer"
                            onClick={() => {
                              const allImages = [...filteredDbImages, ...(nasImages || [])];
                              setLightboxImages(allImages);
                              setLightboxIndex(index);
                              setLightboxOpen(true);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedImages);
                                if (e.target.checked) {
                                  newSelected.add(imageId);
                                } else {
                                  newSelected.delete(imageId);
                                  setSelectAll(false);
                                }
                                setSelectedImages(newSelected);
                              }}
                              className="absolute top-2 left-2 w-5 h-5 z-10 cursor-pointer"
                            />
                            <div className={`w-full bg-muted rounded-lg flex items-center justify-center ${
                              viewSize === "small" ? "h-32" :
                              viewSize === "medium" ? "h-48" :
                              "h-64"
                            }`}>
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 z-30">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 shadow-lg z-30 pointer-events-auto"
                                onClick={() => {
                                  if (confirm(`Bild "${file.basename}" wirklich löschen?`)) {
                                    deleteMutation.mutate({ nasPath: file.filename });
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="mt-2 text-sm text-center truncate" title={file.basename}>
                              {file.basename}
                            </p>
                            <p className="text-xs text-center text-muted-foreground">
                              NAS • {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        );
                        })}
                        
                        {totalImages === 0 && (
                          <p className="col-span-full text-center text-muted-foreground py-8">
                            Noch keine Bilder hochgeladen
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokumente Tab */}
        <TabsContent value="dokumente" className="space-y-4">
          {[
            { label: "Objektunterlagen", key: "objektunterlagen" },
            { label: "Sensible Daten", key: "sensible" },
            { label: "Vertragsunterlagen", key: "vertragsunterlagen" },
            { label: "Unterlagen Upload Haus", key: "upload" }
          ].map(({ label, key }) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "documents", key)}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {uploadingDocs ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Dokumente werden hochgeladen...</p>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium mb-2">
                        Dokumente hier ablegen oder klicken
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileSelect(e, "documents", key)}
                        className="hidden"
                        id={`doc-upload-${key}`}
                      />
                      <Button asChild variant="outline" size="sm">
                        <label htmlFor={`doc-upload-${key}`} className="cursor-pointer">
                          Dokumente auswählen
                        </label>
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Document List */}
                <div className="mt-4 space-y-2">
                  {(() => {
                    let files: any[] = [];
                    if (key === "objektunterlagen") files = nasObjektunterlagen || [];
                    else if (key === "sensible") files = nasSensibleDaten || [];
                    else if (key === "vertragsunterlagen") files = nasVertragsunterlagen || [];
                    else files = nasObjektunterlagen || []; // Default for "upload"

                    return files.length > 0 ? (
                      <>
                        <p className="text-sm font-medium mb-2">{files.length} Dokument(e)</p>
                        {files.map((file: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" title={file.basename}>
                                  {file.basename}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0"
                              onClick={() => {
                                if (confirm(`Dokument "${file.basename}" wirklich löschen?`)) {
                                  deleteMutation.mutate({ nasPath: file.filename });
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Noch keine Dokumente hochgeladen</p>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Virtueller Rundgang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="virtual-tour">URL zum virtuellen Rundgang</Label>
                <Input
                  id="virtual-tour"
                  placeholder="https://..."
                  value={virtualTourLink}
                  onChange={(e) => setVirtualTourLink(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitenkarte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business-card">URL zur digitalen Visitenkarte</Label>
                <Input
                  id="business-card"
                  placeholder="https://..."
                  value={businessCardLink}
                  onChange={(e) => setBusinessCardLink(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveLinks}>Links speichern</Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}

// WebDAV Test Dialog Component
function WebDAVTestDialog({
  propertyId,
  results,
  setResults,
  isRunning,
  setIsRunning,
}: {
  propertyId: number;
  results: any;
  setResults: (results: any) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
}) {
  const testQuery = trpc.properties.testWebDAVConnection.useQuery(
    { propertyId },
    { enabled: false }
  );

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);
    try {
      const result = await testQuery.refetch();
      setResults(result.data);
    } catch (error: any) {
      setResults({
        error: true,
        message: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runTest}
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Test läuft...
          </>
        ) : (
          <>
            <TestTube2 className="w-4 h-4 mr-2" />
            WebDAV-Test starten
          </>
        )}
      </Button>

      {results && (
        <>
          {results.error ? (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Fehler:</strong> {results.message}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.passed}
                  </div>
                  <div className="text-sm text-muted-foreground">Bestanden</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {results.summary.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Gesamt</div>
                </div>
              </div>

              {results.summary.allPassed ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Alle Tests bestanden!</strong> WebDAV-Verbindung funktioniert einwandfrei.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Einige Tests fehlgeschlagen.</strong> Bitte prüfen Sie die Details unten.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {results.tests.map((test: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      test.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {test.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium">{test.name}</span>
                        </div>
                        {test.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {test.message}
                          </p>
                        )}
                        {test.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {test.error}
                          </p>
                        )}
                        {test.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Dauer: {test.duration}
                          </p>
                        )}
                        {test.folderName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ordner: {test.folderName}
                          </p>
                        )}
                        {test.path && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pfad: {test.path}
                          </p>
                        )}
                        {test.fileUrl && (
                          <p className="text-xs text-muted-foreground mt-1">
                            URL: {test.fileUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// FTP Test Dialog Component
function FTPTestDialog({ propertyId }: { propertyId: number }) {
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const testQuery = trpc.properties.testFTPConnection.useQuery(
    { propertyId },
    { enabled: false }
  );

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);
    try {
      const result = await testQuery.refetch();
      setResults(result.data);
    } catch (error: any) {
      setResults({
        error: true,
        message: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runTest}
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Test läuft...
          </>
        ) : (
          <>
            <TestTube2 className="w-4 h-4 mr-2" />
            FTP-Test starten
          </>
        )}
      </Button>

      {results && (
        <>
          {results.error ? (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Fehler:</strong> {results.message}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.passed}
                  </div>
                  <div className="text-sm text-muted-foreground">Bestanden</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {results.summary.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Gesamt</div>
                </div>
              </div>

              {results.summary.allPassed ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Alle Tests bestanden!</strong> FTP-Verbindung funktioniert einwandfrei.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Einige Tests fehlgeschlagen.</strong> Bitte prüfen Sie die Details unten.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {results.tests.map((test: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      test.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {test.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium">{test.name}</span>
                        </div>
                        {test.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {test.message}
                          </p>
                        )}
                        {test.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {test.error}
                          </p>
                        )}
                        {test.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Dauer: {test.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// NAS Test Dialog Component (kept for backward compatibility)
function NASTestDialog({
  propertyId,
  results,
  setResults,
  isRunning,
  setIsRunning,
}: {
  propertyId: number;
  results: any;
  setResults: (results: any) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
}) {
  const testQuery = trpc.properties.testNASConnection.useQuery(
    { propertyId },
    { enabled: false }
  );

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);
    try {
      const result = await testQuery.refetch();
      setResults(result.data);
    } catch (error: any) {
      setResults({
        error: true,
        message: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runTest}
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Test läuft...
          </>
        ) : (
          <>
            <TestTube2 className="w-4 h-4 mr-2" />
            Test starten
          </>
        )}
      </Button>

      {results && (
        <>
          {results.error ? (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Fehler:</strong> {results.message}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.passed}
                  </div>
                  <div className="text-sm text-muted-foreground">Bestanden</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {results.summary.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Gesamt</div>
                </div>
              </div>

              {results.summary.allPassed ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Alle Tests bestanden!</strong> Die NAS-Verbindung funktioniert einwandfrei.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Einige Tests sind fehlgeschlagen.</strong> Bitte prüfen Sie die Details unten.
                  </AlertDescription>
                </Alert>
              )}

              {results.propertyFolderName && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="font-medium">Property-Informationen</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ordnername:</span>{" "}
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      {results.propertyFolderName}
                    </code>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="font-medium">Test-Details</div>
                {results.tests.map((test: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      test.success
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {test.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{test.name}</div>
                        {test.message && (
                          <div className="text-muted-foreground mt-1">
                            {test.message}
                          </div>
                        )}
                        {test.error && (
                          <div className="text-red-600 mt-1">
                            <strong>Fehler:</strong> {test.error}
                          </div>
                        )}
                        {test.duration && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Dauer: {test.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Rename & Category Change Dialog */}
      <Dialog open={!!renamingImage} onOpenChange={(open) => !open && setRenamingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bild bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aktueller Name</Label>
              <Input value={renamingImage?.currentName || ""} disabled />
            </div>
            <div>
              <Label>Neuer Anzeigename</Label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Neuer Name für das Bild"
              />
            </div>
            <div>
              <Label>Kategorie</Label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={renamingImage?.category || "sonstiges"}
                onChange={(e) => {
                  if (renamingImage) {
                    setRenamingImage({ ...renamingImage, category: e.target.value });
                  }
                }}
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
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRenamingImage(null)}>
                Abbrechen
              </Button>
              <Button onClick={async () => {
                if (!renamingImage) return;
                
                try {
                  if (renamingImage.id) {
                    // Update database image
                    await trpc.properties.updateImage.mutate({
                      id: renamingImage.id,
                      displayName: newName || renamingImage.currentName,
                      category: renamingImage.category,
                    });
                    toast.success("Bild aktualisiert");
                    refetchImages();
                    window.location.reload();
                  } else {
                    toast.error("Umbenennen von NAS-Dateien noch nicht unterstützt");
                  }
                } catch (error: any) {
                  toast.error(`Fehler: ${error.message}`);
                }
                
                setRenamingImage(null);
                setNewName("");
              }}>
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
