import { X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState } from "react";

// Comprehensive tag options with categories
export const CONTACT_TAG_CATEGORIES = {
  Dienstleister: [
    "Architekt",
    "Bauträger",
    "Fotograf",
    "Handwerker",
    "Hausverwaltung",
    "IT-Branche",
  ],
  Kunde: [
    "Eigennutzer",
    "Eigentümer",
    "Eigentümer Lead",
    "Kapitalanleger",
    "Kaufinteressent",
    "Käufer",
    "Mieter",
    "Mietinteressent",
    "Verkäufer",
    "Vermieter",
  ],
  Partner: [
    "Finanzierung",
    "Kooperation",
    "Makler",
    "Notar",
    "Rechtsanwalt",
    "Tippgeber",
  ],
} as const;

// Flatten all tags for backwards compatibility
export const CONTACT_TAG_OPTIONS = Object.entries(CONTACT_TAG_CATEGORIES).flatMap(
  ([category, tags]) => tags.map((tag) => `${category}: ${tag}`)
);

export type ContactTag = typeof CONTACT_TAG_OPTIONS[number];

interface ContactTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function ContactTagsInput({ tags, onChange, disabled }: ContactTagsInputProps) {
  const [selectedTag, setSelectedTag] = useState<string>("");

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setSelectedTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const availableTags = CONTACT_TAG_OPTIONS.filter((tag) => !tags.includes(tag));

  return (
    <div className="space-y-2">
      {/* Tag display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-3 pr-1 py-1 text-sm"
            >
              {tag}
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector with categories */}
      {!disabled && availableTags.length > 0 && (
        <Select value={selectedTag} onValueChange={addTag}>
          <SelectTrigger>
            <SelectValue placeholder="Tag hinzufügen..." />
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {Object.entries(CONTACT_TAG_CATEGORIES).map(([category, categoryTags]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  {category}
                </div>
                {categoryTags.map((tag) => {
                  const fullTag = `${category}: ${tag}`;
                  if (!tags.includes(fullTag)) {
                    return (
                      <SelectItem key={fullTag} value={fullTag}>
                        {tag}
                      </SelectItem>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
