import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface PlaceAutocompleteElementProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PlaceAutocompleteElement({
  onPlaceSelect,
  placeholder = "Adresse eingeben...",
  className = "",
  disabled = false,
}: PlaceAutocompleteElementProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGoogleMaps = async () => {
      // Check if already loaded
      if (window.google?.maps?.places) {
        if (mounted) {
          setIsLoading(false);
          initAutocomplete();
        }
        return;
      }

      // Check if API key is available
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('[PlaceAutocomplete] VITE_GOOGLE_MAPS_API_KEY not set');
        if (mounted) {
          setError('Google Maps API Key fehlt');
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log('[PlaceAutocomplete] Loading Google Maps with API key...');
        
        // Load Google Maps script directly
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=de&region=DE`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('[PlaceAutocomplete] Google Maps loaded successfully');
          if (mounted) {
            setIsLoading(false);
            initAutocomplete();
          }
        };
        
        script.onerror = () => {
          console.error('[PlaceAutocomplete] Failed to load Google Maps script');
          if (mounted) {
            setError('Google Maps konnte nicht geladen werden');
            setIsLoading(false);
          }
        };
        
        document.head.appendChild(script);
        
      } catch (err) {
        console.error('[PlaceAutocomplete] Failed to load Google Maps:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden');
          setIsLoading(false);
        }
      }
    };

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) {
        console.warn('[PlaceAutocomplete] Cannot initialize: missing input ref or Google Maps');
        return;
      }

      try {
        console.log('[PlaceAutocomplete] Initializing autocomplete...');
        
        // Create autocomplete instance
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'de' }, // Restrict to Germany
            fields: ['address_components', 'formatted_address', 'geometry', 'name'],
          }
        );

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place && place.address_components) {
            console.log('[PlaceAutocomplete] Place selected:', place);
            onPlaceSelect(place);
          } else {
            console.warn('[PlaceAutocomplete] No place details available');
          }
        });
        
        console.log('[PlaceAutocomplete] Autocomplete initialized successfully');
      } catch (err) {
        console.error('[PlaceAutocomplete] Failed to initialize autocomplete:', err);
        if (mounted) {
          setError('Initialisierung fehlgeschlagen');
        }
      }
    };

    loadGoogleMaps();

    return () => {
      mounted = false;
      // Cleanup
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (err) {
          console.warn('[PlaceAutocomplete] Cleanup error:', err);
        }
      }
    };
  }, [onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={error ? error : isLoading ? "Lädt Google Maps..." : placeholder}
      className={className}
      disabled={disabled || isLoading || !!error}
    />
  );
}
