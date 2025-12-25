"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input, Label } from "@staysafeos/ui";

interface Member {
  id: string;
  role: string;
  account: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    homeAddress?: string | null;
  };
}

export interface RiderSelection {
  name: string;
  phone: string;
  membershipId?: string;
  accountId?: string;
  homeAddress?: string;
}

interface RiderSearchProps {
  value: string;
  phone: string;
  onSelect: (rider: RiderSelection) => void;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function RiderSearch({
  value,
  phone,
  onSelect,
  onNameChange,
  onPhoneChange,
  placeholder = "Search riders or type name...",
  required = false,
}: RiderSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Member[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Search members with debounce
  const searchMembers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/members?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const members = await response.json();
        setResults(members.slice(0, 5)); // Limit to 5 results
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onNameChange(newValue);
    setSelectedMember(null);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchMembers(newValue);
    }, 300);

    setShowDropdown(true);
  };

  // Handle member selection
  const handleSelect = (member: Member) => {
    const fullName = [member.account.firstName, member.account.lastName]
      .filter(Boolean)
      .join(" ");

    setQuery(fullName);
    setSelectedMember(member);
    setShowDropdown(false);

    onSelect({
      name: fullName,
      phone: member.account.phone || "",
      membershipId: member.id,
      accountId: member.account.id,
      homeAddress: member.account.homeAddress || undefined,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== query && !selectedMember) {
      setQuery(value);
    }
  }, [value, query, selectedMember]);

  return (
    <div className="space-y-4">
      {/* Name Input with Search */}
      <div className="space-y-2">
        <Label htmlFor="riderName">Rider Name *</Label>
        <div className="relative" ref={dropdownRef}>
          <Input
            ref={inputRef}
            id="riderName"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
          />

          {/* Dropdown Results */}
          {showDropdown && (results.length > 0 || loading) && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Searching...
                </div>
              ) : (
                <>
                  {results.map((member) => {
                    const fullName = [member.account.firstName, member.account.lastName]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <button
                        key={member.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent flex flex-col"
                        onClick={() => handleSelect(member)}
                      >
                        <span className="font-medium">{fullName || "Unknown"}</span>
                        <span className="text-sm text-muted-foreground">
                          {member.account.phone || "No phone"} • {member.role}
                        </span>
                      </button>
                    );
                  })}
                  {query.length >= 2 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                      Or continue typing to use as manual entry
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Selected indicator */}
          {selectedMember && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                Linked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Phone Input */}
      <div className="space-y-2">
        <Label htmlFor="riderPhone">Phone *</Label>
        <Input
          id="riderPhone"
          type="tel"
          value={phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPhoneChange(e.target.value)}
          required={required}
          disabled={!!selectedMember}
          placeholder={selectedMember ? "Auto-filled from account" : "Enter phone number"}
        />
        {selectedMember && (
          <p className="text-xs text-muted-foreground">
            Phone auto-filled from linked account
          </p>
        )}
      </div>
    </div>
  );
}
