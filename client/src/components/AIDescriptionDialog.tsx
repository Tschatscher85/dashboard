import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Property } from "../../../drizzle/schema";

interface AIDescriptionDialogProps {
  property: Partial<Property>;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

export function AIDescriptionDialog({ property, onGenerated, disabled }: AIDescriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [creativity, setCreativity] = useState([0.7]);
  const [generatedText, setGeneratedText] = useState("");

  const generateMutation = trpc.properties.generateDescription.useMutation({
    onSuccess: (data: { description: string }) => {
      setGeneratedText(data.description);
    },
    onError: (error: any) => {
      toast.error("Fehler beim Generieren", {
        description: error.message,
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      propertyData: property,
      creativity: creativity[0],
    });
  };

  const handleUseText = () => {
    onGenerated(generatedText);
    setOpen(false);
    toast.success("Beschreibung übernommen!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Sparkles className="mr-2 h-4 w-4" />
          Objektbeschreibung erzeugen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Objektbeschreibung erzeugen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>KI Kreativität</Label>
            <Slider
              value={creativity}
              onValueChange={setCreativity}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sachlich</span>
              <span>Kreativ</span>
            </div>
          </div>

          {generatedText && (
            <div className="space-y-2">
              <Label>Generierte Beschreibung</Label>
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                className="min-h-[200px]"
                placeholder="Die generierte Beschreibung erscheint hier..."
              />
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex-1"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                "Text generieren"
              )}
            </Button>
            
            {generatedText && (
              <Button onClick={handleUseText} variant="default" className="flex-1">
                Text übernehmen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
