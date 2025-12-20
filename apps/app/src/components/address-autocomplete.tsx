"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input, Button } from "@staysafeos/ui";
import { MapPin, Navigation, Home, Loader2 } from "lucide-react";
import { searchAddress, reverseGeocode, formatAddress, type NominatimResult } from "@/lib/services/nominatim";
import { useGeolocation } from "@/lib/hooks/use-geolocation";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  showCurrentLocation?: boolean;
  showHomeAddress?: boolean;
  homeAddress?: {
    address: string;
    lat?: number;
    lng?: number;
  };
  disabled?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address...",
  showCurrentLocation = false,
  showHomeAddress = false,
  homeAddress,
  disabled = false,
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { location: geoLocation, loading: geoLoading, getCurrentLocation } = useGeolocation();

  // Sync inputValue with value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle geolocation result
  useEffect(() => {
    if (geoLocation) {
      setLoading(true);
      reverseGeocode(geoLocation.lat, geoLocation.lng)
        .then((address) => {
          if (address) {
            setInputValue(address);
            onChange(address, geoLocation.lat, geoLocation.lng);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [geoLocation, onChange]);

  // Debounced search
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newValue.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchAddress(newValue);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 300);
  }, []);

  // Handle suggestion selection
  const handleSelect = useCallback((result: NominatimResult) => {
    const address = formatAddress(result);
    setInputValue(address);
    onChange(address, parseFloat(result.lat), parseFloat(result.lon));
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, suggestions, selectedIndex, handleSelect]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle "Use Home Address" click
  const handleUseHomeAddress = useCallback(() => {
    if (homeAddress?.address) {
      setInputValue(homeAddress.address);
      onChange(homeAddress.address, homeAddress.lat, homeAddress.lng);
    }
  }, [homeAddress, onChange]);

  // Handle "Use Current Location" click
  const handleUseCurrentLocation = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const showButtons = showCurrentLocation || (showHomeAddress && homeAddress?.address);

  return (
    <div className={`relative ${className || ""}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || loading || geoLoading}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {(loading || geoLoading) ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      {showButtons && (
        <div className="flex gap-2 mt-2">
          {showCurrentLocation && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={disabled || loading || geoLoading}
              className="flex-1"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Use Current Location
            </Button>
          )}
          {showHomeAddress && homeAddress?.address && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseHomeAddress}
              disabled={disabled || loading}
              className="flex-1"
            >
              <Home className="h-3 w-3 mr-1" />
              Use Home Address
            </Button>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((result, index) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="line-clamp-2">{result.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
