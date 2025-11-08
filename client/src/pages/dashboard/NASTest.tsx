import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Play } from "lucide-react";

export default function NASTest() {
  const [propertyId, setPropertyId] = useState(2); // Default to property ID 2
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const testMutation = trpc.properties.testNASConnection.useQuery(
    { propertyId },
    { enabled: false }
  );

  const runTest = async () => {
    setIsRunning(true);
    setTestResults(null);
    try {
      const results = await testMutation.refetch();
      setTestResults(results.data);
    } catch (error: any) {
      setTestResults({
        error: true,
        message: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">NAS-Verbindungstest</h1>
          <p className="text-muted-foreground mt-2">
            Testen Sie die Verbindung zum Synology NAS und diagnostizieren Sie Upload-Probleme
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test konfigurieren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Property ID</label>
              <input
                type="number"
                value={propertyId}
                onChange={(e) => setPropertyId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md mt-1"
                placeholder="Property ID eingeben"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID der Immobilie, für die der Test durchgeführt werden soll
              </p>
            </div>

            <Button
              onClick={runTest}
              disabled={isRunning || !propertyId}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test läuft...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test starten
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {testResults && (
          <>
            {testResults.error ? (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Fehler:</strong> {testResults.message}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Test-Zusammenfassung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {testResults.summary.passed}
                        </div>
                        <div className="text-sm text-muted-foreground">Bestanden</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {testResults.summary.failed}
                        </div>
                        <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {testResults.summary.total}
                        </div>
                        <div className="text-sm text-muted-foreground">Gesamt</div>
                      </div>
                    </div>

                    {testResults.summary.allPassed ? (
                      <Alert className="mt-4 border-green-200 bg-green-50">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Alle Tests bestanden!</strong> Die NAS-Verbindung funktioniert einwandfrei.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive" className="mt-4">
                        <XCircle className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Einige Tests sind fehlgeschlagen.</strong> Bitte prüfen Sie die Details unten.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {testResults.propertyFolderName && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Property-Informationen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Ordnername:</span>{" "}
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {testResults.propertyFolderName}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Vollständiger Pfad:</span>{" "}
                          <code className="bg-muted px-2 py-1 rounded text-sm block mt-1">
                            /volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/{testResults.propertyFolderName}/Bilder/
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Test-Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testResults.tests.map((test: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            test.success
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {test.success ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{test.name}</div>
                              {test.message && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {test.message}
                                </div>
                              )}
                              {test.error && (
                                <div className="text-sm text-red-600 mt-1">
                                  <strong>Fehler:</strong> {test.error}
                                </div>
                              )}
                              {test.duration && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Dauer: {test.duration}
                                </div>
                              )}
                              {test.folderName && (
                                <div className="text-sm mt-1">
                                  <code className="bg-white px-2 py-1 rounded text-xs">
                                    {test.folderName}
                                  </code>
                                </div>
                              )}
                              {test.path && (
                                <div className="text-sm mt-1">
                                  <code className="bg-white px-2 py-1 rounded text-xs">
                                    {test.path}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rohdaten (JSON)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
