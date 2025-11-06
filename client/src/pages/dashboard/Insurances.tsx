import { Button } from "@/components/ui/button";
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
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Insurances() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: insurances, isLoading } = trpc.insurances.list.useQuery({
    type: filterType === "all" ? undefined : filterType,
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  const utils = trpc.useUtils();
  const deleteMutation = trpc.insurances.delete.useMutation({
    onSuccess: () => {
      utils.insurances.list.invalidate();
      toast.success("Versicherung gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diese Versicherung wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const insuranceTypes = [
    { value: "all", label: "Alle Typen" },
    { value: "Gebäudeversicherung", label: "Gebäudeversicherung" },
    { value: "Haftpflichtversicherung", label: "Haftpflichtversicherung" },
    { value: "Rechtsschutzversicherung", label: "Rechtsschutzversicherung" },
    { value: "Hausratversicherung", label: "Hausratversicherung" },
    { value: "Elementarschadenversicherung", label: "Elementarschadenversicherung" },
    { value: "Glasversicherung", label: "Glasversicherung" },
    { value: "Sonstige", label: "Sonstige" },
  ];

  const statusOptions = [
    { value: "all", label: "Alle Status" },
    { value: "active", label: "Aktiv" },
    { value: "expired", label: "Abgelaufen" },
    { value: "cancelled", label: "Gekündigt" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Versicherungen</h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie alle Versicherungspolicen für Immobilien und Kontakte
          </p>
        </div>
        <Button onClick={() => setLocation("/dashboard/insurances/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Versicherung
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Versicherungstyp" />
          </SelectTrigger>
          <SelectContent>
            {insuranceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Versicherungen...</p>
        </div>
      ) : !insurances || insurances.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Keine Versicherungen gefunden</p>
          <Button onClick={() => setLocation("/dashboard/insurances/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Erste Versicherung anlegen
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policennummer</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Anbieter</TableHead>
                <TableHead>Prämie</TableHead>
                <TableHead>Laufzeit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insurances.map((insurance) => (
                <TableRow key={insurance.id}>
                  <TableCell className="font-medium">{insurance.policyNumber}</TableCell>
                  <TableCell>{insurance.insuranceType}</TableCell>
                  <TableCell>{insurance.provider}</TableCell>
                  <TableCell>
                    {insurance.premium} € / {insurance.paymentInterval}
                  </TableCell>
                  <TableCell>
                    {new Date(insurance.startDate).toLocaleDateString("de-DE")} -{" "}
                    {insurance.endDate
                      ? new Date(insurance.endDate).toLocaleDateString("de-DE")
                      : "unbefristet"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        insurance.status === "active"
                          ? "bg-green-100 text-green-800"
                          : insurance.status === "expired"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {insurance.status === "active"
                        ? "Aktiv"
                        : insurance.status === "expired"
                        ? "Abgelaufen"
                        : "Gekündigt"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/dashboard/insurances/${insurance.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(insurance.id)}
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
