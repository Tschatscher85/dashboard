import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MaintenanceRecords() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    propertyId: "",
    date: "",
    description: "",
    cost: "",
    category: "",
    vendor: "",
    status: "planned",
  });

  const { data: records, isLoading } = trpc.propertyManagement.listMaintenance.useQuery({});
  const { data: properties } = trpc.properties.list.useQuery({});

  const utils = trpc.useUtils();

  const createMutation = trpc.propertyManagement.createMaintenance.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listMaintenance.invalidate();
      toast.success("Instandhaltung erstellt");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.propertyManagement.updateMaintenance.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listMaintenance.invalidate();
      toast.success("Instandhaltung aktualisiert");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.propertyManagement.deleteMaintenance.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listMaintenance.invalidate();
      toast.success("Instandhaltung gelöscht");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      propertyId: "",
      date: "",
      description: "",
      cost: "",
      category: "",
      vendor: "",
      status: "planned",
    });
    setEditingId(null);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setFormData({
      propertyId: record.propertyId?.toString() || "",
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
      description: record.description || "",
      cost: record.cost?.toString() || "",
      category: record.category || "",
      vendor: record.vendor || "",
      status: record.status || "planned",
    });
    setOpen(true);
  };

  const handleSave = () => {
    const data = {
      propertyId: parseInt(formData.propertyId),
      date: formData.date ? new Date(formData.date) : new Date(),
      description: formData.description,
      cost: formData.cost ? parseFloat(formData.cost) : 0,
      category: formData.category,
      vendor: formData.vendor,
      status: formData.status as "planned" | "in_progress" | "completed" | "cancelled",
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Verwalten Sie alle Instandhaltungsmaßnahmen
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Instandhaltung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Instandhaltung bearbeiten" : "Neue Instandhaltung"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Immobilie *</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Immobilie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.map((property: any) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.street} {property.houseNumber}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Datum</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="repair">Reparatur</SelectItem>
                      <SelectItem value="maintenance">Wartung</SelectItem>
                      <SelectItem value="renovation">Renovierung</SelectItem>
                      <SelectItem value="inspection">Inspektion</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Kosten (€)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Dienstleister</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="z.B. Handwerker GmbH"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Geplant</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="cancelled">Abgebrochen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibung der Maßnahme..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>Speichern</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Instandhaltungen...</p>
        </div>
      ) : !records || records.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Keine Instandhaltungen gefunden</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Immobilie</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Dienstleister</TableHead>
                <TableHead>Kosten</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString("de-DE")}</TableCell>
                  <TableCell>
                    {record.propertyId ? `Immobilie #${record.propertyId}` : "-"}
                  </TableCell>
                  <TableCell className="capitalize">{record.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                  <TableCell>{record.vendor || "-"}</TableCell>
                  <TableCell>{record.cost} €</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : record.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : record.status === "planned"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {record.status === "planned"
                        ? "Geplant"
                        : record.status === "in_progress"
                        ? "In Bearbeitung"
                        : record.status === "completed"
                        ? "Abgeschlossen"
                        : "Abgebrochen"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4" />
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
