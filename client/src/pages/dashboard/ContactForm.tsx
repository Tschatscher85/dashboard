import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function ContactForm() {
  const [, params] = useRoute("/dashboard/contacts/:id/edit");
  const [, setLocation] = useLocation();
  const contactId = params?.id ? parseInt(params.id) : null;
  const isEdit = contactId !== null;

  // Form state
  const [formData, setFormData] = useState({
    // Module assignment
    moduleImmobilienmakler: false,
    moduleVersicherungen: false,
    moduleHausverwaltung: false,
    // Type & Category
    contactType: "kunde" as "kunde" | "partner" | "dienstleister" | "sonstiges",
    contactCategory: "",
    type: "person" as "person" | "company",
    // Stammdaten
    salutation: "herr" as "herr" | "frau" | "divers",
    title: "",
    firstName: "",
    lastName: "",
    language: "",
    age: undefined as number | undefined,
    birthDate: "",
    birthPlace: "",
    birthCountry: "",
    idType: "",
    idNumber: "",
    issuingAuthority: "",
    taxId: "",
    nationality: "",
    // Contact details
    email: "",
    alternativeEmail: "",
    phone: "",
    mobile: "",
    fax: "",
    website: "",
    // Address
    street: "",
    houseNumber: "",
    zipCode: "",
    city: "",
    country: "Deutschland",
    // Company
    companyName: "",
    position: "",
    companyStreet: "",
    companyHouseNumber: "",
    companyZipCode: "",
    companyCity: "",
    companyCountry: "",
    companyWebsite: "",
    companyPhone: "",
    companyMobile: "",
    companyFax: "",
    isBusinessContact: false,
    // Merkmale
    advisor: "",
    coAdvisor: "",
    followUpDate: "",
    source: "",
    status: "",
    tags: "",
    archived: false,
    notes: "",
    availability: "",
    // Verrechnung
    blockContact: false,
    sharedWithTeams: "",
    sharedWithUsers: "",
    // DSGVO
    dsgvoStatus: "",
    dsgvoConsentGranted: false,
    dsgvoDeleteBy: "",
    dsgvoDeleteReason: "",
    newsletterConsent: false,
    propertyMailingConsent: false,
  });

  // Load contact data if editing
  const { data: contact, isLoading } = trpc.contacts.getById.useQuery(
    { id: contactId! },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (contact) {
      setFormData({
        moduleImmobilienmakler: contact.moduleImmobilienmakler || false,
        moduleVersicherungen: contact.moduleVersicherungen || false,
        moduleHausverwaltung: contact.moduleHausverwaltung || false,
        contactType: contact.contactType || "kunde",
        contactCategory: contact.contactCategory || "",
        type: contact.type || "person",
        salutation: contact.salutation || "herr",
        title: contact.title || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        language: contact.language || "",
        age: contact.age || undefined,
        birthDate: contact.birthDate || "",
        birthPlace: contact.birthPlace || "",
        birthCountry: contact.birthCountry || "",
        idType: contact.idType || "",
        idNumber: contact.idNumber || "",
        issuingAuthority: contact.issuingAuthority || "",
        taxId: contact.taxId || "",
        nationality: contact.nationality || "",
        email: contact.email || "",
        alternativeEmail: contact.alternativeEmail || "",
        phone: contact.phone || "",
        mobile: contact.mobile || "",
        fax: contact.fax || "",
        website: contact.website || "",
        street: contact.street || "",
        houseNumber: contact.houseNumber || "",
        zipCode: contact.zipCode || "",
        city: contact.city || "",
        country: contact.country || "Deutschland",
        companyName: contact.companyName || "",
        position: contact.position || "",
        companyStreet: contact.companyStreet || "",
        companyHouseNumber: contact.companyHouseNumber || "",
        companyZipCode: contact.companyZipCode || "",
        companyCity: contact.companyCity || "",
        companyCountry: contact.companyCountry || "",
        companyWebsite: contact.companyWebsite || "",
        companyPhone: contact.companyPhone || "",
        companyMobile: contact.companyMobile || "",
        companyFax: contact.companyFax || "",
        isBusinessContact: contact.isBusinessContact || false,
        advisor: contact.advisor || "",
        coAdvisor: contact.coAdvisor || "",
        followUpDate: contact.followUpDate || "",
        source: contact.source || "",
        status: contact.status || "",
        tags: contact.tags || "",
        archived: contact.archived || false,
        notes: contact.notes || "",
        availability: contact.availability || "",
        blockContact: contact.blockContact || false,
        sharedWithTeams: contact.sharedWithTeams || "",
        sharedWithUsers: contact.sharedWithUsers || "",
        dsgvoStatus: contact.dsgvoStatus || "",
        dsgvoConsentGranted: contact.dsgvoConsentGranted || false,
        dsgvoDeleteBy: contact.dsgvoDeleteBy || "",
        dsgvoDeleteReason: contact.dsgvoDeleteReason || "",
        newsletterConsent: contact.newsletterConsent || false,
        propertyMailingConsent: contact.propertyMailingConsent || false,
      });
    }
  }, [contact]);

  // Get categories based on contact type
  const { data: categories } = trpc.contacts.getCategories.useQuery({
    contactType: formData.contactType,
  });

  // Mutations
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Kontakt erfolgreich erstellt");
      setLocation("/dashboard/contacts");
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen: " + error.message);
    },
  });

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Kontakt erfolgreich aktualisiert");
      setLocation("/dashboard/contacts");
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit) {
      updateMutation.mutate({
        id: contactId!,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Laden...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => setLocation("/dashboard/contacts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? "Kontakt bearbeiten" : "Neuer Kontakt"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="stammdaten" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
            <TabsTrigger value="firma">Firma</TabsTrigger>
            <TabsTrigger value="merkmale">Merkmale & Co.</TabsTrigger>
            <TabsTrigger value="verrechnung">Verrechnung</TabsTrigger>
            <TabsTrigger value="dsgvo">DSGVO</TabsTrigger>
            <TabsTrigger value="gwg">GwG-Angaben</TabsTrigger>
          </TabsList>

          {/* Module Assignment - Always visible at top */}
          <Card>
            <CardHeader>
              <CardTitle>Modul-Zuordnung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="moduleImmobilienmakler"
                    checked={formData.moduleImmobilienmakler}
                    onCheckedChange={(checked) =>
                      handleChange("moduleImmobilienmakler", checked)
                    }
                  />
                  <label htmlFor="moduleImmobilienmakler" className="text-sm font-medium">
                    🏠 Immobilienmakler
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="moduleVersicherungen"
                    checked={formData.moduleVersicherungen}
                    onCheckedChange={(checked) =>
                      handleChange("moduleVersicherungen", checked)
                    }
                  />
                  <label htmlFor="moduleVersicherungen" className="text-sm font-medium">
                    🛡️ Versicherungen
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="moduleHausverwaltung"
                    checked={formData.moduleHausverwaltung}
                    onCheckedChange={(checked) =>
                      handleChange("moduleHausverwaltung", checked)
                    }
                  />
                  <label htmlFor="moduleHausverwaltung" className="text-sm font-medium">
                    🏛️ Hausverwaltung
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactType">Kontakt-Typ *</Label>
                  <Select
                    value={formData.contactType}
                    onValueChange={(value) => handleChange("contactType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kunde">Kunde</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="dienstleister">Dienstleister</SelectItem>
                      <SelectItem value="sonstiges">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contactCategory">Kategorie</Label>
                  <Select
                    value={formData.contactCategory}
                    onValueChange={(value) => handleChange("contactCategory", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Person / Firma *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">Person</SelectItem>
                      <SelectItem value="company">Firma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stammdaten Tab */}
          <TabsContent value="stammdaten">
            <Card>
              <CardHeader>
                <CardTitle>Stammdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="salutation">Anrede</Label>
                    <Select
                      value={formData.salutation}
                      onValueChange={(value) => handleChange("salutation", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="herr">Herr</SelectItem>
                        <SelectItem value="frau">Frau</SelectItem>
                        <SelectItem value="divers">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="z.B. Dr., Prof."
                    />
                  </div>

                  <div>
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="language">Sprache</Label>
                    <Input
                      id="language"
                      value={formData.language}
                      onChange={(e) => handleChange("language", e.target.value)}
                      placeholder="z.B. Deutsch, Englisch"
                    />
                  </div>

                  <div>
                    <Label htmlFor="age">Alter</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ""}
                      onChange={(e) => handleChange("age", e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nationality">Nationalität</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleChange("nationality", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="alternativeEmail">Alternative E-Mail</Label>
                    <Input
                      id="alternativeEmail"
                      type="email"
                      value={formData.alternativeEmail}
                      onChange={(e) => handleChange("alternativeEmail", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobil</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fax">Fax</Label>
                    <Input
                      id="fax"
                      value={formData.fax}
                      onChange={(e) => handleChange("fax", e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Adresse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <Label htmlFor="street">Straße</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleChange("street", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="houseNumber">Nr.</Label>
                      <Input
                        id="houseNumber"
                        value={formData.houseNumber}
                        onChange={(e) => handleChange("houseNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="zipCode">PLZ</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleChange("zipCode", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Ort</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Land</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Firma Tab */}
          <TabsContent value="firma">
            <Card>
              <CardHeader>
                <CardTitle>Firma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Firmenname</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleChange("position", e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Firmenadresse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <Label htmlFor="companyStreet">Straße</Label>
                      <Input
                        id="companyStreet"
                        value={formData.companyStreet}
                        onChange={(e) => handleChange("companyStreet", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyHouseNumber">Nr.</Label>
                      <Input
                        id="companyHouseNumber"
                        value={formData.companyHouseNumber}
                        onChange={(e) => handleChange("companyHouseNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="companyZipCode">PLZ</Label>
                      <Input
                        id="companyZipCode"
                        value={formData.companyZipCode}
                        onChange={(e) => handleChange("companyZipCode", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyCity">Ort</Label>
                      <Input
                        id="companyCity"
                        value={formData.companyCity}
                        onChange={(e) => handleChange("companyCity", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyCountry">Land</Label>
                      <Input
                        id="companyCountry"
                        value={formData.companyCountry}
                        onChange={(e) => handleChange("companyCountry", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Firmenkontakte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="companyPhone">Büro Telefon</Label>
                      <Input
                        id="companyPhone"
                        value={formData.companyPhone}
                        onChange={(e) => handleChange("companyPhone", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyMobile">Büro Mobil</Label>
                      <Input
                        id="companyMobile"
                        value={formData.companyMobile}
                        onChange={(e) => handleChange("companyMobile", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyFax">Büro Fax</Label>
                      <Input
                        id="companyFax"
                        value={formData.companyFax}
                        onChange={(e) => handleChange("companyFax", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="companyWebsite">Website 2</Label>
                    <Input
                      id="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={(e) => handleChange("companyWebsite", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="isBusinessContact"
                    checked={formData.isBusinessContact}
                    onCheckedChange={(checked) =>
                      handleChange("isBusinessContact", checked)
                    }
                  />
                  <label htmlFor="isBusinessContact" className="text-sm font-medium">
                    Gewerblicher Kontakt
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Merkmale & Co. Tab */}
          <TabsContent value="merkmale">
            <Card>
              <CardHeader>
                <CardTitle>Merkmale & Co.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="advisor">Betreuer</Label>
                    <Input
                      id="advisor"
                      value={formData.advisor}
                      onChange={(e) => handleChange("advisor", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="coAdvisor">Co-Betreuer</Label>
                    <Input
                      id="coAdvisor"
                      value={formData.coAdvisor}
                      onChange={(e) => handleChange("coAdvisor", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="followUpDate">Followup-Datum</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => handleChange("followUpDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="source">Quelle</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => handleChange("source", e.target.value)}
                      placeholder="z.B. Immobilienscout 24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      placeholder="z.B. Kunde"
                    />
                  </div>

                  <div>
                    <Label htmlFor="availability">Erreichbarkeit</Label>
                    <Input
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => handleChange("availability", e.target.value)}
                      placeholder="z.B. 09:00-20:00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Bemerkung</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="archived"
                    checked={formData.archived}
                    onCheckedChange={(checked) => handleChange("archived", checked)}
                  />
                  <label htmlFor="archived" className="text-sm font-medium">
                    Archiviert
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verrechnung Tab */}
          <TabsContent value="verrechnung">
            <Card>
              <CardHeader>
                <CardTitle>Verrechnung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="blockContact"
                    checked={formData.blockContact}
                    onCheckedChange={(checked) => handleChange("blockContact", checked)}
                  />
                  <label htmlFor="blockContact" className="text-sm font-medium">
                    Kontakt sperren
                  </label>
                </div>

                <div>
                  <Label htmlFor="sharedWithTeams">Teams freigeben</Label>
                  <Input
                    id="sharedWithTeams"
                    value={formData.sharedWithTeams}
                    onChange={(e) => handleChange("sharedWithTeams", e.target.value)}
                    placeholder="Team-IDs (kommagetrennt)"
                  />
                </div>

                <div>
                  <Label htmlFor="sharedWithUsers">Nutzer freigeben</Label>
                  <Input
                    id="sharedWithUsers"
                    value={formData.sharedWithUsers}
                    onChange={(e) => handleChange("sharedWithUsers", e.target.value)}
                    placeholder="Nutzer-IDs (kommagetrennt)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DSGVO Tab */}
          <TabsContent value="dsgvo">
            <Card>
              <CardHeader>
                <CardTitle>DSGVO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dsgvoStatus">DSGVO-Status</Label>
                    <Input
                      id="dsgvoStatus"
                      value={formData.dsgvoStatus}
                      onChange={(e) => handleChange("dsgvoStatus", e.target.value)}
                      placeholder="z.B. Speicherung zugestimmt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dsgvoDeleteBy">Speichern-bis-Datum</Label>
                    <Input
                      id="dsgvoDeleteBy"
                      type="date"
                      value={formData.dsgvoDeleteBy}
                      onChange={(e) => handleChange("dsgvoDeleteBy", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dsgvoDeleteReason">Speichern-bis-Grund</Label>
                  <Input
                    id="dsgvoDeleteReason"
                    value={formData.dsgvoDeleteReason}
                    onChange={(e) => handleChange("dsgvoDeleteReason", e.target.value)}
                    placeholder="z.B. Vorvertragliches Abhängigkeitsverhältnis 1 Jahr"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dsgvoConsentGranted"
                      checked={formData.dsgvoConsentGranted}
                      onCheckedChange={(checked) =>
                        handleChange("dsgvoConsentGranted", checked)
                      }
                    />
                    <label htmlFor="dsgvoConsentGranted" className="text-sm font-medium">
                      Kontakterlaubnis erteilt
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletterConsent"
                      checked={formData.newsletterConsent}
                      onCheckedChange={(checked) =>
                        handleChange("newsletterConsent", checked)
                      }
                    />
                    <label htmlFor="newsletterConsent" className="text-sm font-medium">
                      Newsletter gewünscht
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="propertyMailingConsent"
                      checked={formData.propertyMailingConsent}
                      onCheckedChange={(checked) =>
                        handleChange("propertyMailingConsent", checked)
                      }
                    />
                    <label htmlFor="propertyMailingConsent" className="text-sm font-medium">
                      Immobilienmailing gewünscht
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GwG-Angaben Tab */}
          <TabsContent value="gwg">
            <Card>
              <CardHeader>
                <CardTitle>GwG-Angaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthDate">Geburtsdatum</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleChange("birthDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthPlace">Geburtsort</Label>
                    <Input
                      id="birthPlace"
                      value={formData.birthPlace}
                      onChange={(e) => handleChange("birthPlace", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="birthCountry">Geburtsland</Label>
                  <Input
                    id="birthCountry"
                    value={formData.birthCountry}
                    onChange={(e) => handleChange("birthCountry", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="idType">Ausweis</Label>
                    <Input
                      id="idType"
                      value={formData.idType}
                      onChange={(e) => handleChange("idType", e.target.value)}
                      placeholder="z.B. Personalausweis, Reisepass"
                    />
                  </div>

                  <div>
                    <Label htmlFor="idNumber">Ausweisnummer</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => handleChange("idNumber", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="issuingAuthority">Ausstellende Behörde</Label>
                  <Input
                    id="issuingAuthority"
                    value={formData.issuingAuthority}
                    onChange={(e) => handleChange("issuingAuthority", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="taxId">Steuer-ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleChange("taxId", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/dashboard/contacts")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Speichern" : "Erstellen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
