import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import Properties from "./pages/dashboard/Properties";
import Contacts from "./pages/dashboard/Contacts";
import Leads from "./pages/dashboard/Leads";
import PropertyLanding from "./pages/PropertyLanding";
import { Building2, Users, Mail, Calendar, FileText, Settings } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/property/:id" component={PropertyLanding} />
      
      {/* Dashboard Routes */}
      <Route path={"/dashboard"}>
        {() => (
          <DashboardLayout
            navItems={[
              {
                title: "Übersicht",
                href: "/dashboard",
                icon: Building2,
              },
              {
                title: "Immobilien",
                href: "/dashboard/properties",
                icon: Building2,
              },
              {
                title: "Kontakte",
                href: "/dashboard/contacts",
                icon: Users,
              },
              {
                title: "Leads",
                href: "/dashboard/leads",
                icon: Mail,
              },
              {
                title: "Termine",
                href: "/dashboard/appointments",
                icon: Calendar,
              },
              {
                title: "Dokumente",
                href: "/dashboard/documents",
                icon: FileText,
              },
              {
                title: "Einstellungen",
                href: "/dashboard/settings",
                icon: Settings,
              },
            ]}
          >
            <Switch>
              <Route path="/dashboard" component={DashboardOverview} />
              <Route path="/dashboard/properties" component={Properties} />
              <Route path="/dashboard/contacts" component={Contacts} />
              <Route path="/dashboard/leads" component={Leads} />
              <Route path="/dashboard/appointments">
                {() => (
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Termine</h1>
                    <p className="text-muted-foreground">Terminverwaltung kommt bald...</p>
                  </div>
                )}
              </Route>
              <Route path="/dashboard/documents">
                {() => (
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Dokumente</h1>
                    <p className="text-muted-foreground">Dokumentenverwaltung kommt bald...</p>
                  </div>
                )}
              </Route>
              <Route path="/dashboard/settings">
                {() => (
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Einstellungen</h1>
                    <p className="text-muted-foreground">Einstellungen kommen bald...</p>
                  </div>
                )}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
