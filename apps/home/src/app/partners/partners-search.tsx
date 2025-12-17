"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@staysafeos/ui";

interface PartnersSearchProps {
  initialSearch?: string;
}

export function PartnersSearch({ initialSearch }: PartnersSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch || "");

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value.trim()) {
        params.set("search", value.trim());
      }
      const query = params.toString();
      router.push(`/partners${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="relative max-w-md mx-auto">
      <Input
        type="search"
        placeholder="Search organizations..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
        className="w-full h-12 text-lg pl-4 pr-10"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
