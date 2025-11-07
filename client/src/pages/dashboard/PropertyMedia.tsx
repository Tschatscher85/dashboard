import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, FileText, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PropertyMedia() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0");
  
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
    onSuccess: (_, variables) => {
      toast.success("Datei erfolgreich hochgeladen");
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
        <h1 className="text-3xl font-bold">{property.title}</h1>
        <p className="text-muted-foreground">
          {property.street} {property.houseNumber}, {property.zipCode} {property.city}
        </p>
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
                <h3 className="text-lg font-semibold mb-4">
                  Bildergalerie
                  {nasImages && nasImages.length > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">({nasImages.length} Bilder)</span>
                  )}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nasImages && nasImages.length > 0 ? (
                    nasImages.map((file: any, index: number) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
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
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      Noch keine Bilder hochgeladen
                    </p>
                  )}
                </div>
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
