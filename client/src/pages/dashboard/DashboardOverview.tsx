import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverview() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Immobilien",
      value: stats?.totalProperties || 0,
      icon: Building2,
      description: "Gesamt im System",
    },
    {
      title: "Kontakte",
      value: stats?.totalContacts || 0,
      icon: Users,
      description: "Kunden & Interessenten",
    },
    {
      title: "Termine",
      value: stats?.upcomingAppointments || 0,
      icon: Calendar,
      description: "Anstehende Besichtigungen",
    },
    {
      title: "Neue Leads",
      value: stats?.newLeads || 0,
      icon: Mail,
      description: "Unbearbeitete Anfragen",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht über Ihre Immobilienverwaltung
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Verwenden Sie die Navigation links, um auf alle Funktionen zuzugreifen:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Immobilien verwalten und Exposés erstellen</li>
              <li>Kontakte und Leads bearbeiten</li>
              <li>Termine für Besichtigungen planen</li>
              <li>Dokumente hochladen und organisieren</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nächste Schritte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Empfohlene Aktionen:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Erste Immobilie anlegen</li>
              <li>Brevo CRM-Integration konfigurieren</li>
              <li>NAS-Verbindung für Dokumente einrichten</li>
              <li>Landing Pages für Objekte erstellen</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
