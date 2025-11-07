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

  const handleDrop = async (e: React.DragEvent, category: "images" | "documents") => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files, category);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, category: "images" | "documents") => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files, category);
  };

  const uploadFiles = async (files: File[], category: "images" | "documents") => {
    if (files.length === 0) return;
    
    if (category === "images") {
      setUploadingImages(true);
    } else {
      setUploadingDocs(true);
    }

    try {
      // TODO: Implement actual NAS upload
      // For now, just simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
                <h3 className="text-lg font-semibold mb-4">Bildergalerie</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {property.images && property.images.length > 0 ? (
                    property.images.map((image: any, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.title || `Bild ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              // TODO: Delete image
                              toast.success("Bild gelöscht");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="mt-2 text-sm text-center truncate">
                          {image.title || `Bild ${index + 1}`}
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
          {["Objektunterlagen", "Sensible Daten", "Vertragsunterlagen", "Unterlagen Upload Haus"].map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "documents")}
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
                        onChange={(e) => handleFileSelect(e, "documents")}
                        className="hidden"
                        id={`doc-upload-${category}`}
                      />
                      <Button asChild variant="outline" size="sm">
                        <label htmlFor={`doc-upload-${category}`} className="cursor-pointer">
                          Dokumente auswählen
                        </label>
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Document List */}
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Noch keine Dokumente hochgeladen</p>
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
