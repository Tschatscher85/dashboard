import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, FileText } from "lucide-react";

export default function CustomerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contactId, setContactId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Login mutation
  const loginMutation = trpc.customerPortal.login.useMutation({
    onSuccess: (data) => {
      setIsLoggedIn(true);
      setContactId(data.contactId);
      toast({ title: "Erfolgreich angemeldet" });
    },
    onError: (error) => {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch documents for logged-in customer
  const { data: documents } = trpc.documents.list.useQuery(
    { contactId: contactId! },
    { enabled: isLoggedIn && !!contactId }
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setContactId(null);
    setEmail("");
    setPassword("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Kunden-Portal</CardTitle>
            <CardDescription className="text-center">
              Melden Sie sich an, um auf Ihre Dokumente zuzugreifen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Anmeldung läuft..." : "Anmelden"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Haben Sie noch keinen Zugang?</p>
              <p>Kontaktieren Sie Ihren Makler.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ihre Dokumente</h1>
            <p className="text-muted-foreground mt-2">
              Hier finden Sie alle für Sie freigegebenen Dokumente
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Abmelden
          </Button>
        </div>

        {!documents || documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Momentan sind keine Dokumente für Sie verfügbar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    {doc.name}
                  </CardTitle>
                  {doc.description && (
                    <CardDescription>{doc.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {doc.category && (
                      <div>
                        <span className="font-medium">Kategorie:</span> {doc.category}
                      </div>
                    )}
                    {doc.uploadDate && (
                      <div>
                        <span className="font-medium">Hochgeladen:</span>{" "}
                        {new Date(doc.uploadDate).toLocaleDateString("de-DE")}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      // Download document
                      if (doc.filePath) {
                        window.open(doc.filePath, "_blank");
                      }
                    }}
                  >
                    Herunterladen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
