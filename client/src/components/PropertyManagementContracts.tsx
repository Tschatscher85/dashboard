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

export default function PropertyManagementContracts() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    contractNumber: "",
    propertyId: "",
    managerId: "",
    startDate: "",
    endDate: "",
    monthlyFee: "",
    services: "",
    status: "active",
  });

  const { data: contracts, isLoading } = trpc.propertyManagement.listContracts.useQuery({});
  const { data: properties } = trpc.properties.list.useQuery({});
  const { data: contacts } = trpc.contacts.list.useQuery({});

  const utils = trpc.useUtils();

  const createMutation = trpc.propertyManagement.createContract.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listContracts.invalidate();
      toast.success("Vertrag erstellt");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.propertyManagement.updateContract.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listContracts.invalidate();
      toast.success("Vertrag aktualisiert");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.propertyManagement.deleteContract.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listContracts.invalidate();
      toast.success("Vertrag gelöscht");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      contractNumber: "",
      propertyId: "",
      managerId: "",
      startDate: "",
      endDate: "",
      monthlyFee: "",
      services: "",
      status: "active",
    });
    setEditingId(null);
  };

  const handleEdit = (contract: any) => {
    setEditingId(contract.id);
    setFormData({
      contractNumber: contract.contractNumber || "",
      propertyId: contract.propertyId?.toString() || "",
      managerId: contract.managerId?.toString() || "",
      startDate: contract.startDate
        ? new Date(contract.startDate).toISOString().split("T")[0]
        : "",
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split("T")[0] : "",
      monthlyFee: contract.monthlyFee?.toString() || "",
      services: contract.services || "",
      status: contract.status || "active",
    });
    setOpen(true);
  };

  const handleSave = () => {
    const data: any = {
      contractNumber: formData.contractNumber,
      propertyId: formData.propertyId ? parseInt(formData.propertyId) : null,
      managerId: formData.managerId ? parseInt(formData.managerId) : null,
      startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      monthlyFee: formData.monthlyFee ? parseFloat(formData.monthlyFee) : 0,
      services: formData.services,
      status: formData.status as "active" | "expired" | "cancelled",
    };

    if (formData.endDate) {
      data.endDate = new Date(formData.endDate);
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Vertrag wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Verwalten Sie alle Hausverwaltungsverträge
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Vertrag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Vertrag bearbeiten" : "Neuer Vertrag"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Vertragsnummer</Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, contractNumber: e.target.value })
                    }
                    placeholder="z.B. HV-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyId">Immobilie</Label>
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
                  <Label htmlFor="managerId">Verwalter</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Verwalter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">Monatliche Gebühr (€)</Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    step="0.01"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Vertragsbeginn</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Vertragsende</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="expired">Abgelaufen</SelectItem>
                      <SelectItem value="cancelled">Gekündigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">Leistungen</Label>
                <Textarea
                  id="services"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="Beschreibung der Verwaltungsleistungen..."
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
          <p className="text-muted-foreground">Lade Verträge...</p>
        </div>
      ) : !contracts || contracts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Keine Verträge gefunden</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vertragsnummer</TableHead>
                <TableHead>Immobilie</TableHead>
                <TableHead>Verwalter</TableHead>
                <TableHead>Monatliche Gebühr</TableHead>
                <TableHead>Laufzeit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract: any) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                  <TableCell>
                    {contract.propertyId ? `Immobilie #${contract.propertyId}` : "-"}
                  </TableCell>
                  <TableCell>
                    {contract.managerId ? `Kontakt #${contract.managerId}` : "-"}
                  </TableCell>
                  <TableCell>{contract.monthlyFee} €</TableCell>
                  <TableCell>
                    {new Date(contract.startDate).toLocaleDateString("de-DE")} -{" "}
                    {contract.endDate
                      ? new Date(contract.endDate).toLocaleDateString("de-DE")
                      : "unbefristet"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.status === "active"
                          ? "bg-green-100 text-green-800"
                          : contract.status === "expired"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {contract.status === "active"
                        ? "Aktiv"
                        : contract.status === "expired"
                        ? "Abgelaufen"
                        : "Gekündigt"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(contract)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contract.id)}
                      >
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
