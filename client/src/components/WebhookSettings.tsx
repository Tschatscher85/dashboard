import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Webhook } from "lucide-react";

export default function WebhookSettings() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState({
    contact_created: false,
    contact_updated: false,
    lead_created: false,
    deal_status_changed: true,
    property_created: false,
  });

  // Fetch current settings
  const { data: settings, isLoading } = trpc.webhooks.getSettings.useQuery();

  // Update mutation
  const updateMutation = trpc.webhooks.updateSettings.useMutation({
    onSuccess: () => {
      toast({ title: "Webhook-Einstellungen gespeichert" });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Speichern",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setWebhookUrl(settings.url || "");
      setWebhookEnabled(settings.enabled || false);
      setWebhookEvents(settings.events || webhookEvents);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      url: webhookUrl,
      enabled: webhookEnabled,
      events: webhookEvents,
    });
  };

  const handleToggleEvent = (event: string) => {
    setWebhookEvents((prev) => ({
      ...prev,
      [event]: !prev[event as keyof typeof prev],
    }));
  };

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook-Einstellungen
        </CardTitle>
        <CardDescription>
          Konfigurieren Sie Webhooks für die Integration mit N8N oder anderen Automatisierungstools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Webhook URL</Label>
          <Input
            id="webhookUrl"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/..."
          />
          <p className="text-sm text-muted-foreground">
            Die URL, an die Webhook-Events gesendet werden sollen
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="webhookEnabled">Webhooks aktivieren</Label>
            <p className="text-sm text-muted-foreground">
              Aktivieren oder deaktivieren Sie alle Webhooks
            </p>
          </div>
          <Switch
            id="webhookEnabled"
            checked={webhookEnabled}
            onCheckedChange={setWebhookEnabled}
          />
        </div>

        <div className="space-y-4">
          <Label>Events</Label>
          <p className="text-sm text-muted-foreground">
            Wählen Sie, welche Events Webhooks auslösen sollen
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="contact_created">Kontakt erstellt</Label>
                <p className="text-sm text-muted-foreground">
                  Wird ausgelöst, wenn ein neuer Kontakt erstellt wird
                </p>
              </div>
              <Switch
                id="contact_created"
                checked={webhookEvents.contact_created}
                onCheckedChange={() => handleToggleEvent("contact_created")}
                disabled={!webhookEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="contact_updated">Kontakt aktualisiert</Label>
                <p className="text-sm text-muted-foreground">
                  Wird ausgelöst, wenn ein Kontakt bearbeitet wird
                </p>
              </div>
              <Switch
                id="contact_updated"
                checked={webhookEvents.contact_updated}
                onCheckedChange={() => handleToggleEvent("contact_updated")}
                disabled={!webhookEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lead_created">Lead erstellt</Label>
                <p className="text-sm text-muted-foreground">
                  Wird ausgelöst, wenn ein neuer Lead erstellt wird
                </p>
              </div>
              <Switch
                id="lead_created"
                checked={webhookEvents.lead_created}
                onCheckedChange={() => handleToggleEvent("lead_created")}
                disabled={!webhookEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deal_status_changed">Deal Status geändert</Label>
                <p className="text-sm text-muted-foreground">
                  Wird ausgelöst, wenn eine Kanban-Karte verschoben wird
                </p>
              </div>
              <Switch
                id="deal_status_changed"
                checked={webhookEvents.deal_status_changed}
                onCheckedChange={() => handleToggleEvent("deal_status_changed")}
                disabled={!webhookEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="property_created">Immobilie erstellt</Label>
                <p className="text-sm text-muted-foreground">
                  Wird ausgelöst, wenn eine neue Immobilie erstellt wird
                </p>
              </div>
              <Switch
                id="property_created"
                checked={webhookEvents.property_created}
                onCheckedChange={() => handleToggleEvent("property_created")}
                disabled={!webhookEnabled}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Speichere..." : "Einstellungen speichern"}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Webhook Payload Format</h4>
          <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "event": "deal_status_changed",
  "data": {
    "cardId": 123,
    "boardId": 1,
    "columnId": 2,
    "title": "Max Mustermann",
    "contactId": 456,
    "propertyId": 789
  },
  "timestamp": "2025-11-26T12:00:00.000Z"
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
