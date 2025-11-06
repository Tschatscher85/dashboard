import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ContactTagsInput } from "@/components/ContactTagsInput";

export default function ContactDetail() {
  const [, params] = useRoute("/dashboard/contacts/:id");
  const [, setLocation] = useLocation();
  const contactId = params?.id ? parseInt(params.id) : 0;

  const { data: contact, isLoading, refetch } = trpc.contacts.getById.useQuery({
    id: contactId,
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Kontakt gelöscht");
      setLocation("/dashboard/contacts");
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  const syncToBrevoMutation = trpc.brevo.syncContact.useMutation({
    onSuccess: () => {
      toast.success("Kontakt erfolgreich zu Brevo synchronisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Synchronisieren: " + error.message);
    },
  });

  const updateTagsMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Tags aktualisiert");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Kontakt nicht gefunden</h2>
          <Button className="mt-4" onClick={() => setLocation("/dashboard/contacts")}>
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  const getContactTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      buyer: "Käufer",
      seller: "Verkäufer",
      tenant: "Mieter",
      landlord: "Vermieter",
      agent: "Makler",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const getContactStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      sonstiges: "Sonstiges",
      partner: "Partner",
      dienstleister: "Dienstleister",
      kunde: "Kunde",
      versicherung: "Versicherung",
      hausverwaltung: "Hausverwaltung",
      objekteigentuemer: "Objekteigentümer",
    };
    return labels[status] || status;
  };

  const getContactTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      buyer: "default",
      seller: "secondary",
      tenant: "outline",
      landlord: "outline",
      agent: "destructive",
      other: "secondary",
    };
    return (
      <Badge variant={variants[type] || "default"}>
        {getContactTypeLabel(type)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard/contacts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unbenannter Kontakt"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getContactTypeBadge(contact.contactType)}
              {contact.company && (
                <span className="text-muted-foreground">• {contact.company}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncToBrevoMutation.mutate({ contactId: contact.id })}
            disabled={syncToBrevoMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            {syncToBrevoMutation.isPending ? "Synchronisiere..." : "Zu Brevo"}
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
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
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground">E-Mail</div>
                <div className="font-semibold truncate">
                  {contact.email || "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground">Telefon</div>
                <div className="font-semibold truncate">
                  {contact.phone || "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground">Typ</div>
                <div className="mt-1">{getContactTypeBadge(contact.contactType)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="properties">Immobilien</TabsTrigger>
          <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="history">Historie</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {/* Stammdaten */}
          <Card>
            <CardHeader>
              <CardTitle>Stammdaten</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Vorname</div>
                <div className="font-semibold">{contact.firstName || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nachname</div>
                <div className="font-semibold">{contact.lastName || "-"}</div>
              </div>
              {contact.company && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Firma</div>
                  <div className="font-semibold">{contact.company}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Kontakttyp</div>
                <div>{getContactTypeBadge(contact.contactType)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-semibold">{getContactStatusLabel(contact.status || "sonstiges")}</div>
              </div>
              {contact.source && (
                <div>
                  <div className="text-sm text-muted-foreground">Quelle</div>
                  <div className="font-semibold">{contact.source}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kontaktinformationen */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformationen</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">E-Mail</div>
                <div className="font-semibold">
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Telefon</div>
                <div className="font-semibold">
                  {contact.phone ? (
                    <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                      {contact.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              {contact.mobile && (
                <div>
                  <div className="text-sm text-muted-foreground">Mobil</div>
                  <div className="font-semibold">
                    <a href={`tel:${contact.mobile}`} className="text-primary hover:underline">
                      {contact.mobile}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactTagsInput
                tags={contact.tags ? JSON.parse(contact.tags) : []}
                onChange={(newTags) => {
                  // Update contact tags via mutation
                  updateTagsMutation.mutate({
                    id: contact.id,
                    data: {
                      tags: JSON.stringify(newTags),
                    },
                  });
                }}
              />
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardHeader>
              <CardTitle>Adresse</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Straße + Nr.</div>
                <div className="font-semibold">
                  {[contact.street, contact.houseNumber].filter(Boolean).join(" ") || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">PLZ / Ort</div>
                <div className="font-semibold">
                  {[contact.zipCode, contact.city].filter(Boolean).join(" ") || "-"}
                </div>
              </div>
              {contact.country && (
                <div>
                  <div className="text-sm text-muted-foreground">Land</div>
                  <div className="font-semibold">{contact.country}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notizen */}
          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Verknüpfte Immobilien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Immobilien verknüpft</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Aktivitäten vorhanden</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Dokumente hochgeladen</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Kontakt erstellt</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(contact.createdAt), "PPP 'um' HH:mm 'Uhr'", { locale: de })}
                    </div>
                  </div>
                </div>
                {contact.updatedAt && contact.updatedAt !== contact.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Edit className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Zuletzt bearbeitet</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(contact.updatedAt), "PPP 'um' HH:mm 'Uhr'", { locale: de })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
