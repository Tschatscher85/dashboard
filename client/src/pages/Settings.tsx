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
    is24ConsumerKey: false,
    is24ConsumerSecret: false,
    is24AccessToken: false,
    is24AccessTokenSecret: false,
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
    brevoPropertyInquiryListId: "",
    brevoOwnerInquiryListId: "",
    propertySync: "",
    openai: "",
    // ImmoScout24 API
    is24ConsumerKey: "",
    is24ConsumerSecret: "",
    is24AccessToken: "",
    is24AccessTokenSecret: "",
    is24UseSandbox: false,
    // WebDAV configuration (primary)
    webdavUrl: "",
    webdavPort: "2002",
    webdavUsername: "",
    webdavPassword: "",
    // FTP configuration (fallback)
    ftpHost: "",
    ftpPort: "21",
    ftpUsername: "",
    ftpPassword: "",
    ftpSecure: false,
    // Shared
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
        brevoPropertyInquiryListId: currentApiKeys.brevoPropertyInquiryListId || "",
        brevoOwnerInquiryListId: currentApiKeys.brevoOwnerInquiryListId || "",
        propertySync: currentApiKeys.propertySync || "",
        openai: currentApiKeys.openai || "",
        // ImmoScout24 API
        is24ConsumerKey: currentApiKeys.is24ConsumerKey || "",
        is24ConsumerSecret: currentApiKeys.is24ConsumerSecret || "",
        is24AccessToken: currentApiKeys.is24AccessToken || "",
        is24AccessTokenSecret: currentApiKeys.is24AccessTokenSecret || "",
        is24UseSandbox: currentApiKeys.is24UseSandbox || false,
        // WebDAV (primary)
        webdavUrl: currentApiKeys.webdavUrl || currentApiKeys.nasUrl || "",
        webdavPort: currentApiKeys.webdavPort || "2002",
        webdavUsername: currentApiKeys.webdavUsername || currentApiKeys.nasUsername || "",
        webdavPassword: currentApiKeys.webdavPassword || currentApiKeys.nasPassword || "",
        // FTP (fallback)
        ftpHost: currentApiKeys.ftpHost || "",
        ftpPort: currentApiKeys.ftpPort || "21",
        ftpUsername: currentApiKeys.ftpUsername || currentApiKeys.nasUsername || "",
        ftpPassword: currentApiKeys.ftpPassword || currentApiKeys.nasPassword || "",
        ftpSecure: currentApiKeys.ftpSecure || false,
        // Shared
        nasBasePath: currentApiKeys.nasBasePath || "/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf",
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

                {/* Brevo List IDs */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50/50">
                  <div className="col-span-2">
                    <h4 className="font-semibold text-blue-900 mb-2">Brevo Listen-Konfiguration</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Kontakte werden automatisch den entsprechenden Listen zugeordnet
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brevoPropertyInquiryListId">Immobilienanfragen List ID</Label>
                    <Input
                      id="brevoPropertyInquiryListId"
                      type="number"
                      value={apiKeys.brevoPropertyInquiryListId || ''}
                      onChange={(e) => setApiKeys({ ...apiKeys, brevoPropertyInquiryListId: e.target.value })}
                      placeholder="18"
                    />
                    <p className="text-xs text-muted-foreground">
                      Standard: #18 (Immobilienanfragen)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brevoOwnerInquiryListId">Eigentümeranfragen List ID</Label>
                    <Input
                      id="brevoOwnerInquiryListId"
                      type="number"
                      value={apiKeys.brevoOwnerInquiryListId || ''}
                      onChange={(e) => setApiKeys({ ...apiKeys, brevoOwnerInquiryListId: e.target.value })}
                      placeholder="19"
                    />
                    <p className="text-xs text-muted-foreground">
                      Standard: #19 (Eigentümeranfragen)
                    </p>
                  </div>
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

                {/* ImmoScout24 API Configuration */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">ImmoScout24 API</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    OAuth 1.0a Credentials für ImmoScout24 Integration. Erhalten Sie diese in Ihrem <a href="https://api.immobilienscout24.de" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">IS24 Developer Account</a>.
                  </p>
                  
                  <div className="space-y-4 mb-6 p-4 border rounded-lg bg-green-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-green-900">OAuth Credentials</h4>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">OAuth 1.0a</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="is24ConsumerKey">Consumer Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="is24ConsumerKey"
                            type={showApiKeys.is24ConsumerKey ? "text" : "password"}
                            value={apiKeys.is24ConsumerKey}
                            onChange={(e) => setApiKeys({ ...apiKeys, is24ConsumerKey: e.target.value })}
                            placeholder="IS24 Consumer Key"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleShowApiKey("is24ConsumerKey")}
                          >
                            {showApiKeys.is24ConsumerKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="is24ConsumerSecret">Consumer Secret</Label>
                        <div className="flex gap-2">
                          <Input
                            id="is24ConsumerSecret"
                            type={showApiKeys.is24ConsumerSecret ? "text" : "password"}
                            value={apiKeys.is24ConsumerSecret}
                            onChange={(e) => setApiKeys({ ...apiKeys, is24ConsumerSecret: e.target.value })}
                            placeholder="IS24 Consumer Secret"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleShowApiKey("is24ConsumerSecret")}
                          >
                            {showApiKeys.is24ConsumerSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="is24AccessToken">Access Token</Label>
                        <div className="flex gap-2">
                          <Input
                            id="is24AccessToken"
                            type={showApiKeys.is24AccessToken ? "text" : "password"}
                            value={apiKeys.is24AccessToken}
                            onChange={(e) => setApiKeys({ ...apiKeys, is24AccessToken: e.target.value })}
                            placeholder="IS24 Access Token"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleShowApiKey("is24AccessToken")}
                          >
                            {showApiKeys.is24AccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="is24AccessTokenSecret">Access Token Secret</Label>
                        <div className="flex gap-2">
                          <Input
                            id="is24AccessTokenSecret"
                            type={showApiKeys.is24AccessTokenSecret ? "text" : "password"}
                            value={apiKeys.is24AccessTokenSecret}
                            onChange={(e) => setApiKeys({ ...apiKeys, is24AccessTokenSecret: e.target.value })}
                            placeholder="IS24 Access Token Secret"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleShowApiKey("is24AccessTokenSecret")}
                          >
                            {showApiKeys.is24AccessTokenSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is24UseSandbox"
                        checked={apiKeys.is24UseSandbox}
                        onChange={(e) => setApiKeys({ ...apiKeys, is24UseSandbox: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is24UseSandbox" className="cursor-pointer">Sandbox-Modus verwenden (für Tests)</Label>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled>
                        Mit IS24 verbinden (OAuth)
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Verbindung testen
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ OAuth-Flow und Verbindungstest werden in der finalen Integration aktiviert.
                    </p>
                  </div>
                </div>

                {/* NAS Configuration */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">NAS-Speicher (UGREEN)</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Konfigurieren Sie WebDAV (primär) und FTP (Fallback). Das System versucht automatisch WebDAV → FTP → S3 Cloud.
                  </p>
                  
                  {/* WebDAV Configuration (Primary) */}
                  <div className="space-y-4 mb-6 p-4 border rounded-lg bg-blue-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-blue-900">WebDAV (Primär)</h4>
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">HTTPS verschlüsselt</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="webdavUrl">WebDAV URL</Label>
                        <Input
                          id="webdavUrl"
                          type="text"
                          value={apiKeys.webdavUrl}
                          onChange={(e) => setApiKeys({ ...apiKeys, webdavUrl: e.target.value })}
                          placeholder="https://ugreen.tschatscher.eu"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webdavPort">Port</Label>
                        <Input
                          id="webdavPort"
                          type="text"
                          value={apiKeys.webdavPort}
                          onChange={(e) => setApiKeys({ ...apiKeys, webdavPort: e.target.value })}
                          placeholder="2002"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="webdavUsername">Benutzername</Label>
                        <Input
                          id="webdavUsername"
                          type="text"
                          value={apiKeys.webdavUsername}
                          onChange={(e) => setApiKeys({ ...apiKeys, webdavUsername: e.target.value })}
                          placeholder="tschatscher"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webdavPassword">Passwort</Label>
                        <Input
                          id="webdavPassword"
                          type="password"
                          value={apiKeys.webdavPassword}
                          onChange={(e) => setApiKeys({ ...apiKeys, webdavPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FTP Configuration (Fallback) */}
                  <div className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">FTP (Fallback)</h4>
                      <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded">Nur wenn WebDAV fehlschlägt</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ftpHost">FTP Host</Label>
                        <Input
                          id="ftpHost"
                          type="text"
                          value={apiKeys.ftpHost}
                          onChange={(e) => setApiKeys({ ...apiKeys, ftpHost: e.target.value })}
                          placeholder="ftp.tschatscher.eu"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftpPort">Port</Label>
                        <Input
                          id="ftpPort"
                          type="text"
                          value={apiKeys.ftpPort}
                          onChange={(e) => setApiKeys({ ...apiKeys, ftpPort: e.target.value })}
                          placeholder="21"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ftpUsername">Benutzername</Label>
                        <Input
                          id="ftpUsername"
                          type="text"
                          value={apiKeys.ftpUsername}
                          onChange={(e) => setApiKeys({ ...apiKeys, ftpUsername: e.target.value })}
                          placeholder="tschatscher"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftpPassword">Passwort</Label>
                        <Input
                          id="ftpPassword"
                          type="password"
                          value={apiKeys.ftpPassword}
                          onChange={(e) => setApiKeys({ ...apiKeys, ftpPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="ftpSecure"
                        checked={apiKeys.ftpSecure}
                        onChange={(e) => setApiKeys({ ...apiKeys, ftpSecure: e.target.checked, ftpPort: e.target.checked ? "990" : "21" })}
                        className="rounded"
                      />
                      <Label htmlFor="ftpSecure" className="cursor-pointer">FTPS verwenden (verschlüsselt, Port 990)</Label>
                    </div>
                  </div>

                  {/* Shared Base Path */}
                  <div className="space-y-2">
                    <Label htmlFor="nasBasePath">Basis-Pfad (für beide Protokolle)</Label>
                    <Input
                      id="nasBasePath"
                      type="text"
                      value={apiKeys.nasBasePath}
                      onChange={(e) => setApiKeys({ ...apiKeys, nasBasePath: e.target.value })}
                      placeholder="/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf"
                    />
                    <p className="text-sm text-muted-foreground">
                      Basis-Ordner für Immobilien-Dateien auf dem NAS
                    </p>
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
