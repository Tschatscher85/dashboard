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
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UtilityBills() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    propertyId: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    type: "",
    amount: "",
    paidBy: "",
    status: "pending",
  });

  const { data: bills, isLoading } = trpc.propertyManagement.listUtilityBills.useQuery({});
  const { data: properties } = trpc.properties.list.useQuery({});

  const utils = trpc.useUtils();

  const createMutation = trpc.propertyManagement.createUtilityBill.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listUtilityBills.invalidate();
      toast.success("Nebenkostenabrechnung erstellt");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.propertyManagement.updateUtilityBill.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listUtilityBills.invalidate();
      toast.success("Nebenkostenabrechnung aktualisiert");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.propertyManagement.deleteUtilityBill.useMutation({
    onSuccess: () => {
      utils.propertyManagement.listUtilityBills.invalidate();
      toast.success("Nebenkostenabrechnung gelöscht");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      propertyId: "",
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      type: "",
      amount: "",
      paidBy: "",
      status: "pending",
    });
    setEditingId(null);
  };

  const handleEdit = (bill: any) => {
    setEditingId(bill.id);
    setFormData({
      propertyId: bill.propertyId?.toString() || "",
      year: bill.year?.toString() || "",
      month: bill.month?.toString() || "",
      type: bill.type || "",
      amount: bill.amount?.toString() || "",
      paidBy: bill.paidBy || "",
      status: bill.status || "pending",
    });
    setOpen(true);
  };

  const handleSave = () => {
    const data = {
      propertyId: parseInt(formData.propertyId),
      year: parseInt(formData.year),
      month: parseInt(formData.month),
      type: formData.type,
      amount: formData.amount ? parseFloat(formData.amount) : 0,
      paidBy: formData.paidBy,
      status: formData.status as "pending" | "paid" | "overdue",
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diese Abrechnung wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const months = [
    { value: "1", label: "Januar" },
    { value: "2", label: "Februar" },
    { value: "3", label: "März" },
    { value: "4", label: "April" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Verwalten Sie alle Nebenkostenabrechnungen
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Abrechnung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Abrechnung bearbeiten" : "Neue Abrechnung"}
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
                  <Label htmlFor="type">Typ</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Typ auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heating">Heizung</SelectItem>
                      <SelectItem value="water">Wasser</SelectItem>
                      <SelectItem value="electricity">Strom</SelectItem>
                      <SelectItem value="waste">Müllabfuhr</SelectItem>
                      <SelectItem value="cleaning">Reinigung</SelectItem>
                      <SelectItem value="maintenance">Wartung</SelectItem>
                      <SelectItem value="insurance">Versicherung</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Jahr</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Monat</Label>
                  <Select
                    value={formData.month}
                    onValueChange={(value) => setFormData({ ...formData, month: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Betrag (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paidBy">Bezahlt von</Label>
                  <Input
                    id="paidBy"
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    placeholder="z.B. Mieter, Eigentümer"
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
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="paid">Bezahlt</SelectItem>
                      <SelectItem value="overdue">Überfällig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          <p className="text-muted-foreground">Lade Abrechnungen...</p>
        </div>
      ) : !bills || bills.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Keine Abrechnungen gefunden</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitraum</TableHead>
                <TableHead>Immobilie</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Bezahlt von</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill: any) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    {months.find((m) => m.value === bill.month.toString())?.label} {bill.year}
                  </TableCell>
                  <TableCell>
                    {bill.propertyId ? `Immobilie #${bill.propertyId}` : "-"}
                  </TableCell>
                  <TableCell className="capitalize">{bill.type}</TableCell>
                  <TableCell>{bill.amount} €</TableCell>
                  <TableCell>{bill.paidBy || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : bill.status === "overdue"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {bill.status === "paid"
                        ? "Bezahlt"
                        : bill.status === "overdue"
                        ? "Überfällig"
                        : "Ausstehend"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(bill.id)}>
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
