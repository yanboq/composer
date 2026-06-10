"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { BrandProfile } from "@/lib/schemas";

type BrandContextValue = {
  brand: BrandProfile | null;
  brandEmpty: boolean;
  refreshBrand: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue>({
  brand: null,
  brandEmpty: true,
  refreshBrand: async () => {},
});

export function useBrand() {
  return useContext(BrandContext);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [brandEmpty, setBrandEmpty] = useState(true);

  const refreshBrand = useCallback(async () => {
    try {
      const res = await fetch("/api/brand");
      const data = await res.json();
      setBrand(data.brand ?? null);
      const b = data.brand;
      setBrandEmpty(
        !b || (b.name === "Commerce Studio" && !b.websiteUrl && !b.logoUrl),
      );
    } catch {
      setBrand(null);
      setBrandEmpty(true);
    }
  }, []);

  useEffect(() => {
    refreshBrand();
  }, [refreshBrand]);

  return (
    <BrandContext value={{ brand, brandEmpty, refreshBrand }}>
      {children}
    </BrandContext>
  );
}
