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
import PropertyDetail from "./pages/dashboard/PropertyDetail";
import Contacts from "./pages/dashboard/Contacts";
import ContactDetail from "./pages/dashboard/ContactDetail";
import Leads from "./pages/dashboard/Leads";
import Insurances from "./pages/dashboard/Insurances";
import InsuranceDetail from "./pages/dashboard/InsuranceDetail";
import PropertyManagement from "./pages/dashboard/PropertyManagement";
import PropertyLanding from "./pages/PropertyLanding";
import PropertyMedia from "./pages/dashboard/PropertyMedia";
import NASTest from "./pages/dashboard/NASTest";
import Settings from "./pages/Settings";
import { Building2, Users, Mail, Calendar, FileText, Settings as SettingsIcon, Shield, Wrench } from "lucide-react";

const dashboardNavItems = [
  {
    title: "Übersicht",
    href: "/dashboard",
    icon: Building2,
  },
  {
    title: "Kontakte",
    href: "/dashboard/contacts",
    icon: Users,
  },
  {
    title: "Objekte",
    href: "/dashboard/properties",
    icon: Building2,
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
    title: "Versicherungen",
    href: "/dashboard/insurances",
    icon: Shield,
  },
  {
    title: "Hausverwaltung",
    href: "/dashboard/property-management",
    icon: Wrench,
  },
  {
    title: "Einstellungen",
    href: "/dashboard/settings",
    icon: SettingsIcon,
  },
];

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/property/:id" component={PropertyLanding} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard/properties/:id/media">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <PropertyMedia />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/properties/:id">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <PropertyDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/properties">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <Properties />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/contacts/:id">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <ContactDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/contacts">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <Contacts />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/leads">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <Leads />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/appointments">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Termine</h1>
              <p className="text-muted-foreground">Terminverwaltung kommt bald...</p>
            </div>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/documents">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Dokumente</h1>
              <p className="text-muted-foreground">Dokumentenverwaltung kommt bald...</p>
            </div>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/insurances/:id">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <InsuranceDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/insurances">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <Insurances />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/property-management">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <PropertyManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/nas-test">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <NASTest />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/settings">
        {() => <Settings />}
      </Route>
      <Route path="/dashboard">
        {() => (
          <DashboardLayout navItems={dashboardNavItems}>
            <DashboardOverview />
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
