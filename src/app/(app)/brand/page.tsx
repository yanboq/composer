"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrand } from "@/components/brand-provider";
import type { BrandProfile } from "@/lib/schemas";

function Textarea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export default function BrandPage() {
  const { brand: contextBrand, brandEmpty, refreshBrand } = useBrand();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (contextBrand) {
      setBrand(contextBrand);
    } else if (brandEmpty) {
      setBrand({
        id: "",
        name: "Commerce Studio",
        websiteUrl: null,
        logoUrl: null,
        primaryColor: "#0f766e",
        accentColor: "#111827",
        fontPreset: "Inter",
        voiceNotes: "Clear, polished, and conversion-focused.",
        defaultFooter: "You are receiving this because you signed up for updates.",
        senderName: "Commerce Team",
        senderEmail: null,
      });
    }
  }, [contextBrand, brandEmpty]);

  function update<K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) {
    setBrand((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!brand) return;
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      if (response.ok) {
        setStatus("Brand saved.");
        refreshBrand();
        setShowSyncPrompt(true);
      } else {
        setStatus("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!brand) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Brand</h1>
        <p className="text-sm text-muted-foreground">Loading brand settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Brand</h1>
        <p className="text-sm text-muted-foreground">
          Configure your brand identity, colors, and sender details.
          {brandEmpty && " Or use the chat assistant to scan your website automatically."}
        </p>
      </div>

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Brand name, website, and logo</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="brand-name">Brand name</Label>
              <Input
                id="brand-name"
                value={brand.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={brand.websiteUrl ?? ""}
                onChange={(e) => update("websiteUrl", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={brand.logoUrl ?? ""}
                onChange={(e) => update("logoUrl", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Colors and typography</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primary-color">Primary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primary-color"
                    type="color"
                    value={brand.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="size-10 cursor-pointer rounded border border-input"
                  />
                  <Input
                    value={brand.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accent-color">Accent color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="accent-color"
                    type="color"
                    value={brand.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="size-10 cursor-pointer rounded border border-input"
                  />
                  <Input
                    value={brand.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="font">Font preset</Label>
              <Select
                value={brand.fontPreset}
                onValueChange={(v) => { if (v) update("fontPreset", v); }}
              >
                <SelectTrigger id="font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice &amp; Content</CardTitle>
            <CardDescription>Tone guidance and default footer</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="voice">Voice notes</Label>
              <Textarea
                id="voice"
                value={brand.voiceNotes}
                onChange={(e) => update("voiceNotes", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="footer">Default footer</Label>
              <Textarea
                id="footer"
                value={brand.defaultFooter}
                onChange={(e) => update("defaultFooter", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sender</CardTitle>
            <CardDescription>From name and email address</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sender-name">Sender name</Label>
                <Input
                  id="sender-name"
                  value={brand.senderName}
                  onChange={(e) => update("senderName", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sender-email">Sender email</Label>
                <Input
                  id="sender-email"
                  value={brand.senderEmail ?? ""}
                  onChange={(e) => update("senderEmail", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <div className="flex w-full items-center justify-between">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save brand"}
              </Button>
              {status && (
                <p className="text-sm text-muted-foreground">{status}</p>
              )}
            </div>
            {showSyncPrompt && (
              <div className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">
                <span className="flex-1">Apply brand changes to existing projects?</span>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={syncing}
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await fetch("/api/brand/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({}),
                      });
                      setStatus("Brand synced to all projects.");
                    } catch {}
                    setSyncing(false);
                    setShowSyncPrompt(false);
                  }}
                >
                  {syncing ? "Syncing..." : "Sync all"}
                </Button>
                <Button size="xs" variant="ghost" onClick={() => setShowSyncPrompt(false)}>
                  Skip
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
