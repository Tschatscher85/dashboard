import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function InsuranceDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = id === "new";

  const [formData, setFormData] = useState({
    policyNumber: "",
    insuranceType: "",
    provider: "",
    contactId: null as number | null,
    propertyId: null as number | null,
    startDate: "",
    endDate: "",
    premium: "",
    paymentInterval: "jährlich",
    status: "active",
    notes: "",
  });

  const { data: insurance, isLoading } = trpc.insurances.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !isNew }
  );

  const { data: contacts } = trpc.contacts.list.useQuery({});
  const { data: properties } = trpc.properties.list.useQuery({});

  useEffect(() => {
    if (insurance) {
      setFormData({
        policyNumber: insurance.policyNumber || "",
        insuranceType: insurance.insuranceType || "",
        provider: insurance.provider || "",
        contactId: insurance.contactId,
        propertyId: insurance.propertyId,
        startDate: insurance.startDate
          ? new Date(insurance.startDate).toISOString().split("T")[0]
          : "",
        endDate: insurance.endDate
          ? new Date(insurance.endDate).toISOString().split("T")[0]
          : "",
        premium: insurance.premium?.toString() || "",
        paymentInterval: insurance.paymentInterval || "jährlich",
        status: insurance.status || "active",
        notes: insurance.notes || "",
      });
    }
  }, [insurance]);

  const utils = trpc.useUtils();
  const createMutation = trpc.insurances.create.useMutation({
    onSuccess: () => {
      utils.insurances.list.invalidate();
      toast.success("Versicherung erstellt");
      setLocation("/dashboard/insurances");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.insurances.update.useMutation({
    onSuccess: () => {
      utils.insurances.list.invalidate();
      toast.success("Versicherung aktualisiert");
      setLocation("/dashboard/insurances");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSave = () => {
    const data: any = {
      policyNumber: formData.policyNumber,
      insuranceType: formData.insuranceType,
      provider: formData.provider,
      contactId: formData.contactId,
      propertyId: formData.propertyId,
      startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      premium: formData.premium ? parseFloat(formData.premium) : 0,
      paymentInterval: formData.paymentInterval,
      status: formData.status as "active" | "expired" | "cancelled",
      notes: formData.notes,
    };
    
    if (formData.endDate) {
      data.endDate = new Date(formData.endDate);
    }

    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: parseInt(id!), ...data });
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Lade Versicherung...</p>
      </div>
    );
  }

  const insuranceTypes = [
    "Gebäudeversicherung",
    "Haftpflichtversicherung",
    "Rechtsschutzversicherung",
    "Hausratversicherung",
    "Elementarschadenversicherung",
    "Glasversicherung",
    "Sonstige",
  ];

  const paymentIntervals = ["monatlich", "vierteljährlich", "halbjährlich", "jährlich"];
  const statusOptions = [
    { value: "active", label: "Aktiv" },
    { value: "expired", label: "Abgelaufen" },
    { value: "cancelled", label: "Gekündigt" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/insurances")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">
          {isNew ? "Neue Versicherung" : "Versicherung bearbeiten"}
        </h1>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="policyNumber">Policennummer *</Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              placeholder="z.B. POL-2024-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insuranceType">Versicherungstyp *</Label>
            <Select
              value={formData.insuranceType}
              onValueChange={(value) => setFormData({ ...formData, insuranceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Typ auswählen" />
              </SelectTrigger>
              <SelectContent>
                {insuranceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Versicherungsanbieter *</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="z.B. Allianz"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactId">Versicherungsnehmer</Label>
            <Select
              value={formData.contactId?.toString() || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, contactId: value ? parseInt(value) : null })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Kontakt auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Kein Kontakt</SelectItem>
                {contacts?.map((contact: any) => (
                  <SelectItem key={contact.id} value={contact.id.toString()}>
                    {contact.firstName} {contact.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyId">Immobilie</Label>
            <Select
              value={formData.propertyId?.toString() || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, propertyId: value ? parseInt(value) : null })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Immobilie auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keine Immobilie</SelectItem>
                {properties?.map((property: any) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.street} {property.houseNumber}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Vertragsbeginn *</Label>
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
            <Label htmlFor="premium">Prämie (€) *</Label>
            <Input
              id="premium"
              type="number"
              step="0.01"
              value={formData.premium}
              onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentInterval">Zahlungsintervall</Label>
            <Select
              value={formData.paymentInterval}
              onValueChange={(value) => setFormData({ ...formData, paymentInterval: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentIntervals.map((interval) => (
                  <SelectItem key={interval} value={interval}>
                    {interval}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notizen</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Zusätzliche Informationen zur Versicherung..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setLocation("/dashboard/insurances")}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
