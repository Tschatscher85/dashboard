import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    google: any;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

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

      try {
        const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places`;
        
        console.log('[PlaceAutocomplete] Loading Google Maps from:', scriptUrl);
        
        const response = await fetch(scriptUrl, {
          method: 'GET',
          headers: { 
            'Origin': window.location.origin,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Google Maps script: ${response.status}`);
        }
        
        const scriptContent = await response.text();
        const script = document.createElement('script');
        script.textContent = scriptContent;
        document.head.appendChild(script);
        
        console.log('[PlaceAutocomplete] Script injected, waiting for Google Maps...');
        
        // Poll for Google Maps availability
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds
        
        const checkInterval = setInterval(() => {
          attempts++;
          
          if (window.google?.maps?.places) {
            clearInterval(checkInterval);
            console.log('[PlaceAutocomplete] Google Maps loaded successfully');
            if (mounted) {
              setIsLoading(false);
              initAutocomplete();
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            const errorMsg = 'Google Maps failed to load after 10 seconds';
            console.error('[PlaceAutocomplete]', errorMsg);
            if (mounted) {
              setError(errorMsg);
              setIsLoading(false);
            }
          }
        }, 100);
        
      } catch (err) {
        console.error('[PlaceAutocomplete] Failed to load Google Maps:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
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
          setError('Failed to initialize autocomplete');
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
