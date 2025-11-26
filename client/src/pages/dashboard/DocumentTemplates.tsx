import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

export default function DocumentTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // toast from sonner
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading } = trpc.documentTemplates.list.useQuery({});

  // Create/Update mutation
  const createMutation = trpc.documentTemplates.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTemplates"] });
      toast.success("Vorlage erstellt");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.documentTemplates.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTemplates"] });
      toast.success("Vorlage aktualisiert");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.documentTemplates.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTemplates"] });
      toast.success("Vorlage gelöscht");
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "contract" as "contract" | "invoice" | "letter" | "other",
    templateContent: "",
    templateType: "html" as "html" | "markdown" | "docx",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "contract",
      templateContent: "",
      templateType: "html",
    });
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const placeholders = [
      "{{kunde_name}}",
      "{{kunde_email}}",
      "{{kunde_telefon}}",
      "{{strasse}}",
      "{{hausnummer}}",
      "{{plz}}",
      "{{stadt}}",
      "{{preis}}",
      "{{titel}}",
    ].join(", ");

    const data: any = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      templateContent: formData.templateContent,
      templateType: formData.templateType,
      availablePlaceholders: placeholders,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category || "contract",
      templateContent: template.templateContent || "",
      templateType: template.templateType || "html",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Vorlage wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handlePreview = (template: any) => {
    setPreviewHtml(template.templateContent);
    setIsPreviewOpen(true);
  };

  const placeholderHelp = [
    { name: "{{kunde_name}}", description: "Name des Kunden" },
    { name: "{{kunde_email}}", description: "E-Mail des Kunden" },
    { name: "{{kunde_telefon}}", description: "Telefon des Kunden" },
    { name: "{{strasse}}", description: "Straße der Immobilie" },
    { name: "{{hausnummer}}", description: "Hausnummer" },
    { name: "{{plz}}", description: "Postleitzahl" },
    { name: "{{stadt}}", description: "Stadt" },
    { name: "{{preis}}", description: "Preis der Immobilie" },
    { name: "{{titel}}", description: "Titel der Immobilie" },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dokument-Vorlagen
              </CardTitle>
              <CardDescription>
                Erstellen Sie Vorlagen für Verträge, Rechnungen und Briefe
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Neue Vorlage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Vorlage bearbeiten" : "Neue Vorlage"}
                  </DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine HTML-Vorlage mit Platzhaltern
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="z.B. Maklervertrag"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Kategorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Vertrag</SelectItem>
                          <SelectItem value="invoice">Rechnung</SelectItem>
                          <SelectItem value="letter">Brief</SelectItem>
                          <SelectItem value="other">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Kurze Beschreibung der Vorlage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateContent">HTML-Inhalt *</Label>
                    <Textarea
                      id="templateContent"
                      value={formData.templateContent}
                      onChange={(e) => setFormData({ ...formData, templateContent: e.target.value })}
                      rows={15}
                      className="font-mono text-sm"
                      placeholder="<html>...</html>"
                      required
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Verfügbare Platzhalter:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {placeholderHelp.map((ph) => (
                        <div key={ph.name}>
                          <code className="bg-background px-2 py-1 rounded">{ph.name}</code>
                          <span className="text-muted-foreground ml-2">{ph.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? "Aktualisieren" : "Erstellen"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Lädt...</div>
          ) : !templates || templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Vorlagen vorhanden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          template.category === "contract"
                            ? "bg-blue-100 text-blue-800"
                            : template.category === "invoice"
                            ? "bg-green-100 text-green-800"
                            : template.category === "letter"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.category === "contract"
                          ? "Vertrag"
                          : template.category === "invoice"
                          ? "Rechnung"
                          : template.category === "letter"
                          ? "Brief"
                          : "Sonstiges"}
                      </span>
                    </TableCell>
                    <TableCell>{template.description || "-"}</TableCell>
                    <TableCell className="uppercase text-xs">{template.templateType}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vorschau</DialogTitle>
            <DialogDescription>HTML-Vorschau der Vorlage</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
