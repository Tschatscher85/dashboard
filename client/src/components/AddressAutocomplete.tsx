import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  apiKey: string;
}

export function AddressAutocomplete({
  onPlaceSelect,
  value,
  onChange,
  placeholder = "Adresse eingeben...",
  className = "",
  apiKey,
}: AddressAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      console.error('[AddressAutocomplete] No API key provided');
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('[AddressAutocomplete] Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=de`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('[AddressAutocomplete] Google Maps script loaded successfully');
      setIsLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('[AddressAutocomplete] Failed to load Google Maps script:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      // Note: We don't actually remove it because other components might use it
    };
  }, [apiKey]);

  // Initialize Autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocomplete) return;

    console.log('[AddressAutocomplete] Initializing autocomplete');

    try {
      const options: google.maps.places.AutocompleteOptions = {
        componentRestrictions: { country: "de" }, // Nur Deutschland
        fields: ["address_components", "formatted_address", "geometry"],
      };

      const newAutocomplete = new google.maps.places.Autocomplete(inputRef.current, options);
      
      newAutocomplete.addListener("place_changed", () => {
        const place = newAutocomplete.getPlace();
        console.log('[AddressAutocomplete] Place selected:', place);
        onPlaceSelect(place);
      });

      setAutocomplete(newAutocomplete);
      console.log('[AddressAutocomplete] Autocomplete initialized successfully');
    } catch (error) {
      console.error('[AddressAutocomplete] Failed to initialize autocomplete:', error);
    }
  }, [isLoaded, onPlaceSelect, autocomplete]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={!isLoaded}
    />
  );
}
