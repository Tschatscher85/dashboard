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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function Leads() {
  const { data: leads, isLoading, refetch } = trpc.leads.list.useQuery();
  
  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead-Status aktualisiert");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  const syncBrevoMutation = trpc.brevo.syncLead.useMutation({
    onSuccess: () => {
      toast.success("Lead erfolgreich zu Brevo synchronisiert");
    },
    onError: (error) => {
      toast.error("Brevo-Sync fehlgeschlagen: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "default",
      contacted: "secondary",
      qualified: "secondary",
      converted: "outline",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      new: "Neu",
      contacted: "Kontaktiert",
      qualified: "Qualifiziert",
      converted: "Konvertiert",
      rejected: "Abgelehnt",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const handleStatusChange = (leadId: number, newStatus: string) => {
    updateMutation.mutate({
      id: leadId,
      data: { status: newStatus as any },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Verwalten Sie eingehende Anfragen von Interessenten
        </p>
      </div>

      {leads && leads.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Keine Leads vorhanden</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Neue Anfragen erscheinen hier automatisch.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Nachricht</TableHead>
                <TableHead>Quelle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eingegangen</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    {lead.firstName} {lead.lastName}
                  </TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {lead.message || "-"}
                  </TableCell>
                  <TableCell>{lead.source || "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status || "new"}
                      onValueChange={(value) => handleStatusChange(lead.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Neu</SelectItem>
                        <SelectItem value="contacted">Kontaktiert</SelectItem>
                        <SelectItem value="qualified">Qualifiziert</SelectItem>
                        <SelectItem value="converted">Konvertiert</SelectItem>
                        <SelectItem value="rejected">Abgelehnt</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(lead.createdAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => syncBrevoMutation.mutate({ leadId: lead.id })}
                        title="Zu Brevo synchronisieren"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Möchten Sie diesen Lead wirklich löschen?")) {
                            deleteMutation.mutate({ id: lead.id });
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
    </div>
  );
}
