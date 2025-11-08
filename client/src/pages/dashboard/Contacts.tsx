import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, User, Upload, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CONTACT_TAG_OPTIONS, CONTACT_TAG_CATEGORIES } from "@/components/ContactTagsInput";

export default function Contacts() {
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    contactType: "interested" as const,
    salutation: "mr" as const,
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    mobile: "",
    notes: "",
  });

  const { data: contacts, isLoading, refetch } = trpc.contacts.list.useQuery();
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Kontakt erfolgreich erstellt");
      setIsCreateOpen(false);
      refetch();
      setFormData({
        contactType: "interested",
        salutation: "mr",
        firstName: "",
        lastName: "",
        company: "",
        email: "",
        phone: "",
        mobile: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen: " + error.message);
    },
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Kontakt gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  // Brevo sync with inquiry type
  const [brevoSyncDialogOpen, setBrevoSyncDialogOpen] = useState(false);
  const [selectedContactForSync, setSelectedContactForSync] = useState<number | null>(null);
  const [inquiryType, setInquiryType] = useState<"property_inquiry" | "owner_inquiry">("property_inquiry");

  const syncBrevoMutation = trpc.brevo.syncContactWithInquiry.useMutation({
    onSuccess: () => {
      toast.success("Kontakt erfolgreich zu Brevo synchronisiert");
      setBrevoSyncDialogOpen(false);
      setSelectedContactForSync(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Brevo-Sync fehlgeschlagen: " + error.message);
    },
  });

  const handleBrevoSyncClick = (contactId: number) => {
    setSelectedContactForSync(contactId);
    setBrevoSyncDialogOpen(true);
  };

  const handleBrevoSync = () => {
    if (selectedContactForSync) {
      syncBrevoMutation.mutate({
        contactId: selectedContactForSync,
        inquiryType,
      });
    }
  };

  const handleCreate = () => {
    createMutation.mutate({
      contactType: formData.contactType,
      salutation: formData.salutation || undefined,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName,
      company: formData.company || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      mobile: formData.mobile || undefined,
      notes: formData.notes || undefined,
    });
  };

  const getContactTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      buyer: "default",
      seller: "secondary",
      tenant: "default",
      landlord: "secondary",
      interested: "outline",
      other: "outline",
    };
    const labels: Record<string, string> = {
      buyer: "Käufer",
      seller: "Verkäufer",
      tenant: "Mieter",
      landlord: "Vermieter",
      interested: "Interessent",
      other: "Sonstiges",
    };
    return <Badge variant={variants[type] || "default"}>{labels[type] || type}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Filter contacts by selected tag
  const filteredContacts = selectedTagFilter === "all" 
    ? contacts 
    : contacts?.filter(contact => {
        if (!contact.tags) return false;
        try {
          const tags = JSON.parse(contact.tags);
          return tags.includes(selectedTagFilter);
        } catch {
          return false;
        }
      });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontakte</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kunden und Interessenten
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter nach Tag" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="all">Alle Kontakte</SelectItem>
              {Object.entries(CONTACT_TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {tags.map((tag) => {
                    const fullTag = `${category}: ${tag}`;
                    return (
                      <SelectItem key={fullTag} value={fullTag}>
                        {tag}
                      </SelectItem>
                    );
                  })}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Kontakt
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Kontakt anlegen</DialogTitle>
              <DialogDescription>
                Erfassen Sie die Kontaktdaten eines Kunden oder Interessenten.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="contactType">Kontakttyp *</Label>
                <Select
                  value={formData.contactType}
                  onValueChange={(value: any) => setFormData({ ...formData, contactType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Käufer</SelectItem>
                    <SelectItem value="seller">Verkäufer</SelectItem>
                    <SelectItem value="tenant">Mieter</SelectItem>
                    <SelectItem value="landlord">Vermieter</SelectItem>
                    <SelectItem value="interested">Interessent</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="salutation">Anrede</Label>
                  <Select
                    value={formData.salutation}
                    onValueChange={(value: any) => setFormData({ ...formData, salutation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Herr</SelectItem>
                      <SelectItem value="ms">Frau</SelectItem>
                      <SelectItem value="diverse">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company">Firma</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobil</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Zusätzliche Informationen..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={!formData.lastName || createMutation.isPending}>
                {createMutation.isPending ? "Erstelle..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {!filteredContacts || filteredContacts.length === 0 ? (        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Keine Kontakte vorhanden</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Legen Sie Ihren ersten Kontakt an, um zu starten.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts?.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => setLocation(`/dashboard/contacts/${contact.id}`)}
                      className="text-left hover:underline hover:text-primary transition-colors"
                    >
                      {contact.firstName} {contact.lastName}
                    </button>
                  </TableCell>
                  <TableCell>{getContactTypeBadge(contact.contactType)}</TableCell>
                  <TableCell>{contact.company || "-"}</TableCell>
                  <TableCell>{contact.email || "-"}</TableCell>
                  <TableCell>{contact.phone || contact.mobile || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/dashboard/contacts/${contact.id}`)}
                        title="Details anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBrevoSyncClick(contact.id)}
                        title="Zu Brevo synchronisieren"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info("Bearbeiten kommt bald")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Möchten Sie diesen Kontakt wirklich löschen?")) {
                            deleteMutation.mutate({ id: contact.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Brevo Sync Dialog */}
      <Dialog open={brevoSyncDialogOpen} onOpenChange={setBrevoSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zu Brevo synchronisieren</DialogTitle>
            <DialogDescription>
              Wählen Sie den Anfragetyp für die Synchronisierung zu Brevo CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inquiryType">Anfragetyp</Label>
              <Select
                value={inquiryType}
                onValueChange={(value) => setInquiryType(value as "property_inquiry" | "owner_inquiry")}
              >
                <SelectTrigger id="inquiryType">
                  <SelectValue placeholder="Anfragetyp wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_inquiry">
                    <div className="flex flex-col">
                      <span className="font-medium">Immobilienanfrage</span>
                      <span className="text-xs text-muted-foreground">Lead interessiert sich für Immobilie</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="owner_inquiry">
                    <div className="flex flex-col">
                      <span className="font-medium">Eigentümeranfrage</span>
                      <span className="text-xs text-muted-foreground">Eigentümer möchte verkaufen</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {inquiryType === "property_inquiry" 
                  ? "Kontakt wird zu Liste #18 (Immobilienanfragen) hinzugefügt"
                  : "Kontakt wird zu Liste #19 (Eigentümeranfragen) hinzugefügt"
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrevoSyncDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleBrevoSync} disabled={syncBrevoMutation.isPending}>
              {syncBrevoMutation.isPending ? "Synchronisiere..." : "Synchronisieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
