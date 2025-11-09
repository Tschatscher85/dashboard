import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface BrandingData {
  logo: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  impressum: string;
  agb: string;
  datenschutz: string;
}

interface BrandingSectionProps {
  title: string;
  description: string;
  data: BrandingData;
  onChange: (data: BrandingData) => void;
  logoUploadId: string;
}

export default function BrandingSection({ title, description, data, onChange, logoUploadId }: BrandingSectionProps) {
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei zu groß. Maximal 5MB erlaubt.");
      return;
    }
    
    toast.info("Logo wird hochgeladen...");
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Upload to S3 via backend
        const response = await fetch('/api/trpc/properties.uploadImage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            propertyId: 0, // Special ID for company logos
            filename: file.name,
          }),
        });
        
        if (!response.ok) throw new Error('Upload fehlgeschlagen');
        
        const responseData = await response.json();
        const imageUrl = responseData.result?.data?.url;
        
        if (imageUrl) {
          onChange({ ...data, logo: imageUrl });
          toast.success("Logo erfolgreich hochgeladen!");
        } else {
          throw new Error('Keine URL erhalten');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error("Fehler beim Hochladen des Logos");
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={logoUploadId}>Logo</Label>
            <div className="flex items-center gap-4">
              {data.logo && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img 
                    src={data.logo} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }}
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  id={logoUploadId}
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(logoUploadId)?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Logo hochladen
                </Button>
                <Input
                  placeholder="Oder Logo-URL eingeben"
                  value={data.logo}
                  onChange={(e) => onChange({ ...data, logo: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Firmenname</Label>
            <Input
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder="Firma Mustermann GmbH"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefon</Label>
              <Input
                value={data.phone}
                onChange={(e) => onChange({ ...data, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div>
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={data.email}
                onChange={(e) => onChange({ ...data, email: e.target.value })}
                placeholder="info@example.com"
              />
            </div>
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              value={data.address}
              onChange={(e) => onChange({ ...data, address: e.target.value })}
              placeholder="Musterstraße 123, 12345 Musterstadt"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={data.website}
              onChange={(e) => onChange({ ...data, website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal Pages Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rechtliche Seiten</CardTitle>
          <CardDescription>
            Diese Texte werden im Footer der Landing Page verlinkt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Impressum</Label>
            <textarea
              value={data.impressum}
              onChange={(e) => onChange({ ...data, impressum: e.target.value })}
              placeholder="Angaben gemäß § 5 TMG..."
              className="w-full min-h-[150px] p-2 border rounded-md"
            />
          </div>
          <div>
            <Label>AGB (Allgemeine Geschäftsbedingungen)</Label>
            <textarea
              value={data.agb}
              onChange={(e) => onChange({ ...data, agb: e.target.value })}
              placeholder="§ 1 Geltungsbereich..."
              className="w-full min-h-[150px] p-2 border rounded-md"
            />
          </div>
          <div>
            <Label>Datenschutzerklärung</Label>
            <textarea
              value={data.datenschutz}
              onChange={(e) => onChange({ ...data, datenschutz: e.target.value })}
              placeholder="1. Datenschutz auf einen Blick..."
              className="w-full min-h-[150px] p-2 border rounded-md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
