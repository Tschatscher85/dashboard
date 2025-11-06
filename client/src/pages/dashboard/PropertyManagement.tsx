import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import PropertyManagementContracts from "@/components/PropertyManagementContracts";
import MaintenanceRecords from "@/components/MaintenanceRecords";
import UtilityBills from "@/components/UtilityBills";

export default function PropertyManagement() {
  const [activeTab, setActiveTab] = useState("contracts");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hausverwaltung</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Hausverwaltungsverträge, Instandhaltung und Nebenkostenabrechnungen
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="maintenance">Instandhaltung</TabsTrigger>
          <TabsTrigger value="utility">Nebenkosten</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-6">
          <PropertyManagementContracts />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceRecords />
        </TabsContent>

        <TabsContent value="utility" className="mt-6">
          <UtilityBills />
        </TabsContent>
      </Tabs>
    </div>
  );
}
