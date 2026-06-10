export type ScrapedBrand = {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  fontHint?: string;
  description?: string;
};

function extractMeta(html: string, property: string): string | undefined {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(pattern);
  if (match) return match[1];

  const reversed = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  const reverseMatch = html.match(reversed);
  return reverseMatch?.[1];
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

function extractThemeColor(html: string): string | undefined {
  return extractMeta(html, "theme-color");
}

function extractLogoUrl(html: string, baseUrl: string): string | undefined {
  const ogImage = extractMeta(html, "og:image");
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  const appleTouchIcon = html.match(
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
  );
  if (appleTouchIcon) return resolveUrl(appleTouchIcon[1], baseUrl);

  const icon = html.match(
    /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i,
  );
  if (icon) return resolveUrl(icon[1], baseUrl);

  return undefined;
}

function extractCssColors(html: string): { primary?: string; accent?: string } {
  const result: { primary?: string; accent?: string } = {};

  const primaryPatterns = [
    /--primary(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/,
    /--brand(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/,
    /--color-primary:\s*(#[0-9a-fA-F]{3,8})/,
  ];
  for (const pattern of primaryPatterns) {
    const match = html.match(pattern);
    if (match) {
      result.primary = match[1];
      break;
    }
  }

  const accentPatterns = [
    /--accent(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/,
    /--secondary(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/,
    /--color-accent:\s*(#[0-9a-fA-F]{3,8})/,
  ];
  for (const pattern of accentPatterns) {
    const match = html.match(pattern);
    if (match) {
      result.accent = match[1];
      break;
    }
  }

  return result;
}

function extractFontHint(html: string): string | undefined {
  const googleFonts = html.match(/fonts\.googleapis\.com\/css2?\?family=([^&"']+)/i);
  if (googleFonts) {
    return decodeURIComponent(googleFonts[1]).split(":")[0].replace(/\+/g, " ");
  }

  const fontFace = html.match(/font-family:\s*["']?([^"';,}]+)/i);
  if (fontFace) {
    const font = fontFace[1].trim();
    if (!["inherit", "initial", "system-ui", "-apple-system"].includes(font.toLowerCase())) {
      return font;
    }
  }

  return undefined;
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

export async function scrapeBrandFromUrl(url: string): Promise<ScrapedBrand> {
  const normalizedUrl = normalizeUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return { name: undefined, description: `Failed to fetch: HTTP ${response.status}` };
    }

    const html = await response.text();
    const cssColors = extractCssColors(html);

    return {
      name: extractMeta(html, "og:title") ?? extractMeta(html, "og:site_name") ?? extractTitle(html),
      logoUrl: extractLogoUrl(html, normalizedUrl),
      primaryColor: extractThemeColor(html) ?? cssColors.primary,
      accentColor: cssColors.accent,
      fontHint: extractFontHint(html),
      description: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { name: undefined, description: `Scrape failed: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}
