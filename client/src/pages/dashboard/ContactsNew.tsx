import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContactsNew() {
  const [, setLocation] = useLocation();
  
  // Filters
  const [moduleFilter, setModuleFilter] = useState<"all" | "immobilienmakler" | "versicherungen" | "hausverwaltung">("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<"all" | "kunde" | "partner" | "dienstleister" | "sonstiges">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Build query filters
  const queryFilters = {
    ...(moduleFilter !== "all" && {
      [`module${moduleFilter.charAt(0).toUpperCase() + moduleFilter.slice(1)}`]: true
    }),
    ...(contactTypeFilter !== "all" && { contactType: contactTypeFilter }),
    ...(searchTerm && { searchTerm }),
  };
  
  const { data: contacts, isLoading, refetch } = trpc.contacts.list.useQuery(queryFilters);
  
  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Kontakt gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });
  
  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Kontakt wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };
  
  // Get module badges for a contact
  const getModuleBadges = (contact: any) => {
    const badges = [];
    if (contact.moduleImmobilienmakler) badges.push({ label: "Immobilienmakler", color: "bg-sky-400" }); // Hellblau
    if (contact.moduleVersicherungen) badges.push({ label: "Versicherungen", color: "bg-blue-700" }); // Allianz Blau
    if (contact.moduleHausverwaltung) badges.push({ label: "Hausverwaltung", color: "bg-gray-500" }); // Grau
    return badges;
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kontakte</h1>
        <Button onClick={() => setLocation("/dashboard/contacts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Kontakt
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Module Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Modul</label>
            <Tabs value={moduleFilter} onValueChange={(v) => setModuleFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="immobilienmakler">🏠 Immobilienmakler</TabsTrigger>
                <TabsTrigger value="versicherungen">🛡️ Versicherungen</TabsTrigger>
                <TabsTrigger value="hausverwaltung">🏛️ Hausverwaltung</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Type & Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Kontakt-Typ</label>
              <Select value={contactTypeFilter} onValueChange={(v) => setContactTypeFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="kunde">Kunde</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="dienstleister">Dienstleister</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Suche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Name, E-Mail, Firma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">Keine Kontakte gefunden</p>
              <p className="text-sm">Erstellen Sie Ihren ersten Kontakt</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.type === "company" ? (
                        <div>
                          <div>{contact.companyName}</div>
                          {contact.firstName && contact.lastName && (
                            <div className="text-sm text-gray-500">
                              {contact.firstName} {contact.lastName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div>
                            {contact.salutation === "herr" && "Herr "}
                            {contact.salutation === "frau" && "Frau "}
                            {contact.title && `${contact.title} `}
                            {contact.firstName} {contact.lastName}
                          </div>
                          {contact.companyName && (
                            <div className="text-sm text-gray-500">{contact.companyName}</div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contact.contactType === "kunde" && "Kunde"}
                        {contact.contactType === "partner" && "Partner"}
                        {contact.contactType === "dienstleister" && "Dienstleister"}
                        {contact.contactType === "sonstiges" && "Sonstiges"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.contactCategory && (
                        <Badge variant="secondary">{contact.contactCategory}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {getModuleBadges(contact).map((badge, i) => (
                          <Badge key={i} className={`${badge.color} text-white text-xs`}>
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone || contact.mobile}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/dashboard/contacts/${contact.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/dashboard/contacts/${contact.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Stats */}
      {contacts && contacts.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          {contacts.length} Kontakt{contacts.length !== 1 && "e"} gefunden
        </div>
      )}
    </div>
  );
}
