"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Button } from "@/components/ui";

export function PatientSearch({ defaultQuery }: { defaultQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/admin/patients?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
