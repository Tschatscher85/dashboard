import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, Key, Trash2, Edit, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    superchat: false,
    brevo: false,
    propertySync: false,
    openai: false,
    nasUrl: false,
    nasUsername: false,
    nasPassword: false,
  });

  // User form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user" as "user" | "admin",
  });

  // API keys state
  const [apiKeys, setApiKeys] = useState({
    superchat: "",
    brevo: "",
    propertySync: "",
    openai: "",
    nasUrl: "",
    nasUsername: "",
    nasPassword: "",
    nasBasePath: "",
  });

  // Queries
  const { data: users, refetch: refetchUsers } = trpc.users.list.useQuery();
  const { data: currentApiKeys } = trpc.settings.getApiKeys.useQuery();

  // Mutations
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Benutzer erfolgreich erstellt");
      setIsAddUserOpen(false);
      setNewUser({ name: "", email: "", role: "user" });
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Benutzer gelöscht");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const saveApiKeysMutation = trpc.settings.saveApiKeys.useMutation({
    onSuccess: () => {
      toast.success("API-Konfiguration gespeichert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Load current API keys when data is available
  React.useEffect(() => {
    if (currentApiKeys) {
      setApiKeys({
        superchat: currentApiKeys.superchat || "",
        brevo: currentApiKeys.brevo || "",
        propertySync: currentApiKeys.propertySync || "",
        openai: currentApiKeys.openai || "",
        nasUrl: currentApiKeys.nasUrl || "",
        nasUsername: currentApiKeys.nasUsername || "",
        nasPassword: currentApiKeys.nasPassword || "",
        nasBasePath: currentApiKeys.nasBasePath || "/volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf",
      });
    }
  }, [currentApiKeys]);

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Bitte Name und E-Mail eingeben");
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Möchten Sie diesen Benutzer wirklich löschen?")) {
      deleteUserMutation.mutate({ id: userId });
    }
  };

  const handleSaveApiKeys = () => {
    saveApiKeysMutation.mutate(apiKeys);
  };

  const toggleShowApiKey = (key: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "•".repeat(key.length);
    return key.substring(0, 4) + "•".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Einstellungen</h1>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
            <TabsTrigger value="api">API-Konfiguration</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Benutzerverwaltung</CardTitle>
                    <CardDescription>
                      Verwalten Sie Benutzerkonten und Zugriffsrechte
                    </CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Neuer Benutzer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
                        <DialogDescription>
                          Erstellen Sie einen neuen Benutzer mit Zugang zum System
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder="Max Mustermann"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-Mail</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="max@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Rolle</Label>
                          <Select
                            value={newUser.role}
                            onValueChange={(value: "user" | "admin") => setNewUser({ ...newUser, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Benutzer</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? "Erstelle..." : "Erstellen"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Erstellt am</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || "-"}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {user.role === "admin" ? "Administrator" : "Benutzer"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("de-DE") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!users || users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Keine Benutzer vorhanden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Configuration Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API-Konfiguration</CardTitle>
                <CardDescription>
                  Hinterlegen Sie API-Keys für externe Dienste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Superchat API Key */}
                <div className="space-y-2">
                  <Label htmlFor="superchat">Superchat API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="superchat"
                      type={showApiKeys.superchat ? "text" : "password"}
                      value={apiKeys.superchat}
                      onChange={(e) => setApiKeys({ ...apiKeys, superchat: e.target.value })}
                      placeholder="Superchat API Key eingeben"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowApiKey("superchat")}
                    >
                      {showApiKeys.superchat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Für Multi-Channel-Messaging (WhatsApp, Facebook, Instagram)
                  </p>
                </div>

                {/* Brevo API Key */}
                <div className="space-y-2">
                  <Label htmlFor="brevo">Brevo API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brevo"
                      type={showApiKeys.brevo ? "text" : "password"}
                      value={apiKeys.brevo}
                      onChange={(e) => setApiKeys({ ...apiKeys, brevo: e.target.value })}
                      placeholder="Brevo API Key eingeben"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowApiKey("brevo")}
                    >
                      {showApiKeys.brevo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Für E-Mail-Marketing und Transaktions-E-Mails
                  </p>
                </div>

                {/* Property-Sync API Key */}
                <div className="space-y-2">
                  <Label htmlFor="propertySync">Property-Sync API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="propertySync"
                      type={showApiKeys.propertySync ? "text" : "password"}
                      value={apiKeys.propertySync}
                      onChange={(e) => setApiKeys({ ...apiKeys, propertySync: e.target.value })}
                      placeholder="Property-Sync API Key eingeben"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowApiKey("propertySync")}
                    >
                      {showApiKeys.propertySync ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Für Synchronisierung mit Homepage und externen Systemen
                  </p>
                </div>

                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <Label htmlFor="openai">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai"
                      type={showApiKeys.openai ? "text" : "password"}
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                      placeholder="OpenAI API Key eingeben"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowApiKey("openai")}
                    >
                      {showApiKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Für KI-gestützte Immobilienbeschreibungen
                  </p>
                </div>

                {/* NAS Configuration */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">NAS-Speicher (Synology WebDAV)</h3>
                  
                  <div className="space-y-4">
                    {/* NAS WebDAV URL */}
                    <div className="space-y-2">
                      <Label htmlFor="nasUrl">WebDAV URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="nasUrl"
                          type={showApiKeys.nasUrl ? "text" : "password"}
                          value={apiKeys.nasUrl}
                          onChange={(e) => setApiKeys({ ...apiKeys, nasUrl: e.target.value })}
                          placeholder="http://192.168.0.189:2001"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleShowApiKey("nasUrl")}
                        >
                          {showApiKeys.nasUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        WebDAV-URL Ihres Synology NAS (z.B. http://IP:PORT)
                      </p>
                    </div>

                    {/* NAS Username */}
                    <div className="space-y-2">
                      <Label htmlFor="nasUsername">Benutzername</Label>
                      <div className="flex gap-2">
                        <Input
                          id="nasUsername"
                          type={showApiKeys.nasUsername ? "text" : "password"}
                          value={apiKeys.nasUsername}
                          onChange={(e) => setApiKeys({ ...apiKeys, nasUsername: e.target.value })}
                          placeholder="NAS-Benutzername"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleShowApiKey("nasUsername")}
                        >
                          {showApiKeys.nasUsername ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* NAS Password */}
                    <div className="space-y-2">
                      <Label htmlFor="nasPassword">Passwort</Label>
                      <div className="flex gap-2">
                        <Input
                          id="nasPassword"
                          type={showApiKeys.nasPassword ? "text" : "password"}
                          value={apiKeys.nasPassword}
                          onChange={(e) => setApiKeys({ ...apiKeys, nasPassword: e.target.value })}
                          placeholder="NAS-Passwort"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleShowApiKey("nasPassword")}
                        >
                          {showApiKeys.nasPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* NAS Base Path */}
                    <div className="space-y-2">
                      <Label htmlFor="nasBasePath">Basis-Pfad</Label>
                      <Input
                        id="nasBasePath"
                        type="text"
                        value={apiKeys.nasBasePath}
                        onChange={(e) => setApiKeys({ ...apiKeys, nasBasePath: e.target.value })}
                        placeholder="/volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf"
                      />
                      <p className="text-sm text-muted-foreground">
                        Basis-Ordner für Immobilien-Dateien auf dem NAS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveApiKeys} disabled={saveApiKeysMutation.isPending}>
                    <Key className="mr-2 h-4 w-4" />
                    {saveApiKeysMutation.isPending ? "Speichere..." : "API-Konfiguration speichern"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
