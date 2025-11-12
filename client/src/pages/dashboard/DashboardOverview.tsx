import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Helper function for status colors
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Akquisition': '#ef4444',
    'Vorbereitung': '#f97316', 
    'Vermarktung': '#22c55e',
    'Verhandlung': '#3b82f6',
    'Reserviert': '#a855f7',
    'Verkauft': '#10b981',
    'Vermietet': '#06b6d4',
    'Inaktiv': '#6b7280',
  };
  return colors[status] || '#6b7280';
}

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Property Status Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Objekte nach Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.propertyStatusDistribution && stats.propertyStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.propertyStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.propertyStatusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Anstehende Termine (nächste 7 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.upcomingAppointmentsList && stats.upcomingAppointmentsList.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingAppointmentsList.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.startTime), "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                      </p>
                      {appointment.location && (
                        <p className="text-xs text-muted-foreground">📍 {appointment.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Keine anstehenden Termine
              </div>
            )}
          </CardContent>
        </Card>
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
