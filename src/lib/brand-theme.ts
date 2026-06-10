import type { CSSProperties } from "react";
import type { BrandProfile } from "./schemas";

export type EditorThemeBase = "basic" | "minimal";

export type BrandThemeStyles = Partial<
  Record<
    "body" | "container" | "h1" | "h2" | "h3" | "link" | "image" | "button" | "codeBlock" | "inlineCode",
    CSSProperties & { align?: "center" | "left" | "right" }
  >
>;

export function createBrandThemeStyles(brand: BrandProfile): BrandThemeStyles {
  const fontFamily = `${brand.fontPreset}, Arial, sans-serif`;

  return {
    body: {
      fontFamily,
      color: "#17202a",
      backgroundColor: "#eef2f5",
    },
    container: {
      backgroundColor: "#ffffff",
      borderRadius: 8,
    },
    h1: {
      color: brand.accentColor,
      fontFamily,
      fontWeight: 800,
      lineHeight: 1.12,
    },
    h2: {
      color: brand.accentColor,
      fontFamily,
      fontWeight: 750,
    },
    h3: {
      color: brand.accentColor,
      fontFamily,
      fontWeight: 700,
    },
    link: {
      color: brand.primaryColor,
      fontWeight: 700,
      textDecoration: "none",
    },
    button: {
      backgroundColor: brand.primaryColor,
      color: "#ffffff",
      borderRadius: 6,
      fontWeight: 700,
      padding: "13px 18px",
      textDecoration: "none",
    },
    inlineCode: {
      color: brand.accentColor,
      backgroundColor: "#f1f5f9",
    },
  };
}

export function brandThemeKey(brand: BrandProfile, baseTheme: EditorThemeBase) {
  return [
    baseTheme,
    brand.name,
    brand.primaryColor,
    brand.accentColor,
    brand.fontPreset,
    brand.defaultFooter,
  ].join("|");
}
