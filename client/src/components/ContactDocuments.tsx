import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Download, Trash2, FileText, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface ContactDocumentsProps {
  contactId: number;
  modules: {
    immobilienmakler?: boolean;
    versicherungen?: boolean;
    hausverwaltung?: boolean;
  };
}

export default function ContactDocuments({ contactId, modules }: ContactDocumentsProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<"immobilienmakler" | "versicherungen" | "hausverwaltung">("immobilienmakler");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Queries
  const { data: documents, refetch } = trpc.contacts.listDocuments.useQuery({ contactId });

  // Mutations
  const uploadMutation = trpc.contacts.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Dokument hochgeladen");
      setIsUploadOpen(false);
      setSelectedFile(null);
      setCategory("");
      setSubcategory("");
      setDescription("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.contacts.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Dokument gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Bitte wählen Sie eine Datei");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (!base64) {
        toast.error("Fehler beim Lesen der Datei");
        return;
      }

      uploadMutation.mutate({
        contactId,
        module: selectedModule,
        category: category || undefined,
        subcategory: subcategory || undefined,
        fileName: selectedFile.name,
        fileData: base64,
        fileType: selectedFile.type,
        description: description || undefined,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDownload = async (doc: any) => {
    try {
      const result = await trpc.contacts.downloadDocument.query({ documentId: doc.id });
      const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], { type: doc.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download gestartet");
    } catch (error: any) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleDelete = (documentId: number) => {
    if (confirm("Dokument wirklich löschen?")) {
      deleteMutation.mutate({ documentId });
    }
  };

  // Get category options based on module
  const getCategoryOptions = (module: string) => {
    if (module === "immobilienmakler") {
      return [
        "Unterlagen Upload Eigentümer",
        "Unterlagen Upload Kaufinteressent",
        "Unterlagen Upload Mietinteressent",
        "Sonstiges",
      ];
    } else if (module === "versicherungen") {
      return [
        "Versicherungsunterlagen",
        "Verträge",
        "Schaden",
        "Sonstiges",
      ];
    } else if (module === "hausverwaltung") {
      return [
        "Liegenschaftsunterlagen",
        "Verträge",
        "Abrechnungen",
        "Sonstiges",
      ];
    }
    return [];
  };

  // Group documents by module
  const groupedDocs = documents?.reduce((acc: any, doc: any) => {
    if (!acc[doc.module]) acc[doc.module] = [];
    acc[doc.module].push(doc);
    return acc;
  }, {}) || {};

  const moduleLabels: Record<string, string> = {
    immobilienmakler: "🏠 Immobilienmakler",
    versicherungen: "🛡️ Versicherungen",
    hausverwaltung: "🏢 Hausverwaltung",
  };

  return (
    <div className="space-y-6">
      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogTrigger asChild>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Dokument hochladen
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
            <DialogDescription>
              Laden Sie ein Dokument für diesen Kontakt hoch
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module">Modul</Label>
              <Select value={selectedModule} onValueChange={(value: any) => setSelectedModule(value)}>
                <SelectTrigger id="module">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.immobilienmakler && <SelectItem value="immobilienmakler">🏠 Immobilienmakler</SelectItem>}
                  {modules.versicherungen && <SelectItem value="versicherungen">🛡️ Versicherungen</SelectItem>}
                  {modules.hausverwaltung && <SelectItem value="hausverwaltung">🏢 Hausverwaltung</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Kategorie wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions(selectedModule).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Unterkategorie (optional)</Label>
              <Input
                id="subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="z.B. Personalausweis, Grundbuchauszug..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Datei</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Ausgewählt: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
              {uploadMutation.isPending ? "Lädt hoch..." : "Hochladen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents List */}
      {Object.keys(groupedDocs).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Noch keine Dokumente vorhanden</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedDocs).map(([module, docs]: [string, any]) => (
          <Card key={module}>
            <CardHeader>
              <CardTitle>{moduleLabels[module]}</CardTitle>
              <CardDescription>
                {(docs as any[]).length} Dokument(e)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dateiname</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Größe</TableHead>
                    <TableHead>Hochgeladen</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(docs as any[]).map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.fileName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3 text-muted-foreground" />
                          {doc.category || "-"}
                          {doc.subcategory && ` / ${doc.subcategory}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
