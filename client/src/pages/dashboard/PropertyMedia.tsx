import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, FileText, Link as LinkIcon, X, Loader2, ArrowLeft, Pencil, TestTube2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      // Refetch property to update images list
      window.location.reload(); // Simple refresh for now
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
              onClick={() => window.history.back()}
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
          <Dialog open={showNASTest} onOpenChange={setShowNASTest}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TestTube2 className="w-4 h-4 mr-2" />
                NAS-Verbindung testen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>NAS-Verbindungstest</DialogTitle>
              </DialogHeader>
              <NASTestDialog
                propertyId={propertyId}
                results={nasTestResults}
                setResults={setNasTestResults}
                isRunning={isTestRunning}
                setIsRunning={setIsTestRunning}
              />
            </DialogContent>
          </Dialog>
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
                  const totalImages = dbImages.length + (nasImages?.length || 0);
                  
                  return (
                    <>
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
                                    dbImages.forEach((img: any, idx: number) => allIds.add(`db-${img.id || idx}`));
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
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Database images (S3) */}
                        {dbImages.map((image: any, index: number) => {
                          const imageId = `db-${image.id || index}`;
                          const isSelected = selectedImages.has(imageId);
                          return (
                          <div key={imageId} className="relative group">
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
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 shadow-lg"
                                onClick={() => {
                                  if (confirm(`Bild "${image.title || 'Unbenannt'}" wirklich löschen?`)) {
                                    // Delete from database
                                    if (image.id) {
                                      deleteImageMutation.mutate({ id: image.id });
                                    }
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
                          <div key={imageId} className="relative group">
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
                            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 shadow-lg"
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
    </div>
  );
}

// NAS Test Dialog Component
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
    </div>
  );
}
