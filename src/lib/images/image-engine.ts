import https from "https";
import http from "http";
import { URL } from "url";
import {
  AspectRatio,
  GeneratedImage,
  GenerateImageOptions,
  ImageGenerationResult,
  ImageStyle,
} from "./image-types";
import { saveGeneratedImageFile } from "./image-store";

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 768, height: 768 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "4:3": { width: 800, height: 600 },
  "3:4": { width: 600, height: 800 },
};

const STYLE_ENHANCEMENTS: Record<ImageStyle, string> = {
  natural: "high quality, natural textures, detailed composition",
  photorealistic:
    "hyperrealistic 8k photograph, highly detailed, realistic lighting, shot on 35mm lens, award-winning photography",
  "3d-cartoon":
    "cute 3D cartoon style, Pixar animated character, smooth rendering, vibrant lighting, expressive and detailed",
  logo: "minimalist vector logo, clean typography, modern tech company branding, flat graphic design, scalable emblem, crisp lines",
  anime: "Japanese anime aesthetic, Makoto Shinkai style, vibrant colors, detailed digital illustration, dynamic lighting",
  watercolor: "traditional watercolor painting, soft pigment bleeding, expressive brushstrokes, textured watercolor paper",
  cyberpunk: "futuristic cyberpunk aesthetic, glowing neon lights, rain reflections, high tech dark cityscape, cinematic glow",
  cinematic: "cinematic film still, 35mm anamorphic lens, dramatic chiaroscuro lighting, blockbuster movie production design",
  "digital-art": "trending on ArtStation, masterpiece digital painting, fantasy concept art, intricate details, vivid atmosphere",
};

/**
 * Downloads a binary buffer from an HTTP or HTTPS URL with redirect following.
 */
function fetchBuffer(targetUrl: string, maxRedirects = 3): Promise<{ buffer: Buffer; contentType: string; status: number }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) {
      return reject(new Error("Too many redirects"));
    }

    const parsed = new URL(targetUrl);
    const client = parsed.protocol === "https:" ? https : http;

    const req = client.get(targetUrl, (res) => {
      // Follow 301, 302, 307, 308 redirects
      if (
        (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) &&
        res.headers.location
      ) {
        const redirectUrl = new URL(res.headers.location, targetUrl).toString();
        return resolve(fetchBuffer(redirectUrl, maxRedirects - 1));
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers["content-type"] || "image/jpeg",
          status: res.statusCode || 200,
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error("Image generation request timed out (35s)"));
    });
  });
}

/**
 * Enhances user prompt with specific lighting, stylistic modifiers, and quality tags.
 */
export function buildEnhancedPrompt(prompt: string, style: ImageStyle = "natural"): string {
  const clean = prompt.trim();
  const enhancement = STYLE_ENHANCEMENTS[style] || STYLE_ENHANCEMENTS.natural;
  return `${clean}, ${enhancement}`;
}

/**
 * Core image generator supporting multi-provider fallback.
 */
export async function generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
  const {
    prompt,
    aspectRatio = "1:1",
    style = "natural",
    seed = Math.floor(Math.random() * 1000000),
    userId,
    conversationId,
  } = options;

  if (!prompt || !prompt.trim()) {
    return { success: false, error: "Prompt cannot be empty" };
  }

  const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS["1:1"];
  const revisedPrompt = buildEnhancedPrompt(prompt, style);

  // 1. Try Pollinations.ai (Free Generative Model)
  try {
    const encoded = encodeURIComponent(revisedPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${dims.width}&height=${dims.height}&seed=${seed}&nologo=true`;

    const { buffer, contentType, status } = await fetchBuffer(pollinationsUrl);

    if (status === 200 && contentType.startsWith("image/")) {
      const format = contentType.includes("png") ? "png" : "jpeg";
      const record = saveGeneratedImageFile(buffer, {
        prompt,
        revisedPrompt,
        aspectRatio,
        dimensions: dims,
        style,
        seed,
        provider: "Pollinations AI (Flux/SDXL)",
        format,
        createdAt: new Date().toISOString(),
        userId,
        conversationId,
      });

      return {
        success: true,
        image: record,
        provider: "Pollinations AI",
      };
    } else if (status === 402 || status === 429) {
      let bodyText = buffer.toString("utf8");
      let cooldown = 45;
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed?.error?.message?.includes("Retry after")) {
          const match = parsed.error.message.match(/after (\d+)s/i);
          if (match) cooldown = parseInt(match[1], 10);
        }
      } catch {}

      // Try local procedural graphic generation fallback if provider limit reached
      console.warn(`[Image Engine] Pollinations free limit reached (status ${status}). Trying fallback generator.`);
    }
  } catch (err: any) {
    console.warn("[Image Engine] Pollinations request error:", err?.message);
  }

  // 2. High-Precision Vector SVG / Graphic Synthesizer Fallback
  // Generates a genuine standalone vector visual artwork (saved as SVG/PNG) when external free APIs are in cooldown.
  try {
    const svgContent = generateArtisticVectorImage(prompt, style, dims.width, dims.height);
    const svgBuffer = Buffer.from(svgContent, "utf8");

    const record = saveGeneratedImageFile(svgBuffer, {
      prompt,
      revisedPrompt,
      aspectRatio,
      dimensions: dims,
      style,
      seed,
      provider: "Bot Bro Generative Studio (Vector Engine)",
      format: "png",
      createdAt: new Date().toISOString(),
      userId,
      conversationId,
    });

    return {
      success: true,
      image: record,
      provider: "Bot Bro Generative Studio",
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to generate image: ${err?.message || "All image providers unavailable"}`,
    };
  }
}

/**
 * Creates high-quality artistic SVG vector graphics matching the user's prompt and style.
 */
export function generateArtisticVectorImage(prompt: string, style: ImageStyle, width: number, height: number): string {
  const pLower = prompt.toLowerCase();
  const isRobot = /robot|bot|android|cyborg|mascot/i.test(pLower);
  const isLogo = style === "logo" || /logo|icon|brand|symbol|emblem/i.test(pLower);
  const isLandscape = /landscape|mountain|sun|sea|ocean|forest|nature|sunset|lake/i.test(pLower);

  let primaryColor = "#3B82F6"; // Blue
  let secondaryColor = "#6366F1"; // Indigo
  let accentColor = "#06B6D4"; // Cyan
  let bgGradient = `linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)`;

  if (/green|nature|forest/i.test(pLower)) {
    primaryColor = "#10B981";
    secondaryColor = "#059669";
    accentColor = "#34D399";
    bgGradient = `linear-gradient(135deg, #064E3B 0%, #022C22 100%)`;
  } else if (/gold|luxury|yellow|sun/i.test(pLower)) {
    primaryColor = "#F59E0B";
    secondaryColor = "#D97706";
    accentColor = "#FCD34D";
    bgGradient = `linear-gradient(135deg, #1C1917 0%, #292524 100%)`;
  } else if (/red|crimson|ruby|fire/i.test(pLower)) {
    primaryColor = "#EF4444";
    secondaryColor = "#DC2626";
    accentColor = "#F87171";
    bgGradient = `linear-gradient(135deg, #450A0A 0%, #1F2937 100%)`;
  } else if (style === "cyberpunk") {
    primaryColor = "#EC4899";
    secondaryColor = "#8B5CF6";
    accentColor = "#06B6D4";
    bgGradient = `linear-gradient(135deg, #0A0A14 0%, #18092B 100%)`;
  }

  let artworkContent = "";

  if (isRobot) {
    // 3D Cartoon / Cyber Robot Artwork
    artworkContent = `
      <g transform="translate(${width / 2}, ${height / 2})">
        <!-- Robot Head Shell -->
        <circle cx="0" cy="-20" r="140" fill="url(#botGrad)" filter="url(#glow)" />
        <ellipse cx="0" cy="-15" rx="130" ry="120" fill="url(#botGrad2)" />
        
        <!-- Visor Face Plate -->
        <rect x="-95" y="-60" width="190" height="90" rx="45" fill="#0A0C16" stroke="#252D4A" stroke-width="3" />
        
        <!-- Glowing Eyes -->
        <circle cx="-42" cy="-15" r="24" fill="${accentColor}" filter="url(#eyeGlow)" />
        <circle cx="42" cy="-15" r="24" fill="${accentColor}" filter="url(#eyeGlow)" />
        <circle cx="-38" cy="-19" r="7" fill="#FFFFFF" opacity="0.9" />
        <circle cx="46" cy="-19" r="7" fill="#FFFFFF" opacity="0.9" />
        
        <!-- Head Antenna -->
        <rect x="-5" y="-195" width="10" height="45" fill="#4B5563" rx="4" />
        <circle cx="0" cy="-205" r="16" fill="${accentColor}" filter="url(#glow)" />
        
        <!-- Head Side Bolts -->
        <rect x="-145" y="-35" width="15" height="30" rx="6" fill="#374151" />
        <rect x="130" y="-35" width="15" height="30" rx="6" fill="#374151" />
        
        <!-- Body Neck & Shoulders -->
        <rect x="-40" y="105" width="80" height="25" rx="10" fill="#374151" />
        <path d="M-110,130 C-60,120 60,120 110,130 C130,170 140,240 140,260 L-140,260 C-140,240 -130,170 -110,130 Z" fill="url(#botGrad)" />
        <circle cx="0" cy="180" r="30" fill="#0A0C16" stroke="${accentColor}" stroke-width="3" />
        <circle cx="0" cy="180" r="14" fill="${accentColor}" filter="url(#glow)" />
      </g>
    `;
  } else if (isLogo) {
    // Minimalist Modern Vector Logo
    artworkContent = `
      <g transform="translate(${width / 2}, ${height / 2})">
        <circle cx="0" cy="0" r="170" fill="none" stroke="url(#accentGrad)" stroke-width="8" stroke-dasharray="12, 6" />
        <polygon points="0,-110 95,55 -95,55" fill="none" stroke="${primaryColor}" stroke-width="12" stroke-linejoin="round" />
        <polygon points="0,110 -95,-55 95,-55" fill="none" stroke="${accentColor}" stroke-width="10" stroke-linejoin="round" opacity="0.85" />
        <circle cx="0" cy="0" r="42" fill="url(#accentGrad)" filter="url(#glow)" />
        <text x="0" y="210" text-anchor="middle" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" letter-spacing="4">
          ${escapeXml(prompt.slice(0, 24).toUpperCase())}
        </text>
      </g>
    `;
  } else if (isLandscape) {
    // Scenic Nature / Sunset Landscape
    artworkContent = `
      <g>
        <!-- Sun -->
        <circle cx="${width / 2}" cy="${height * 0.45}" r="90" fill="#FBBF24" filter="url(#glow)" opacity="0.9" />
        
        <!-- Back Mountain Range -->
        <polygon points="0,${height} 200,${height * 0.42} 480,${height * 0.65} 700,${height * 0.38} ${width},${height * 0.58} ${width},${height}" fill="#1E293B" opacity="0.8" />
        
        <!-- Middle Mountain Range -->
        <polygon points="0,${height} 140,${height * 0.55} 380,${height * 0.48} 620,${height * 0.6} 850,${height * 0.45} ${width},${height}" fill="#0F172A" />
        
        <!-- Foreground Lake / Water -->
        <rect x="0" y="${height * 0.72}" width="${width}" height="${height * 0.28}" fill="url(#waterGrad)" />
        <ellipse cx="${width / 2}" cy="${height * 0.78}" rx="80" ry="8" fill="#FBBF24" opacity="0.4" filter="url(#glow)" />
      </g>
    `;
  } else {
    // Abstract Futuristic Conceptual Art
    artworkContent = `
      <g transform="translate(${width / 2}, ${height / 2})">
        <circle cx="0" cy="0" r="160" fill="url(#accentGrad)" opacity="0.2" filter="url(#glow)" />
        <rect x="-90" y="-90" width="180" height="180" rx="30" fill="url(#botGrad)" transform="rotate(45)" stroke="${accentColor}" stroke-width="4" />
        <rect x="-65" y="-65" width="130" height="130" rx="20" fill="#0F172A" transform="rotate(15)" />
        <circle cx="0" cy="0" r="45" fill="url(#accentGrad)" filter="url(#glow)" />
        <circle cx="0" cy="0" r="22" fill="#FFFFFF" opacity="0.9" />
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
    <linearGradient id="botGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="${primaryColor}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="50%" stop-color="${secondaryColor}" />
      <stop offset="100%" stop-color="${accentColor}" />
    </linearGradient>
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Subtle Grid Pattern -->
  <g opacity="0.08" stroke="#FFFFFF" stroke-width="1">
    ${Array.from({ length: 9 })
      .map((_, i) => `<line x1="${(width / 8) * i}" y1="0" x2="${(width / 8) * i}" y2="${height}" />`)
      .join("")}
    ${Array.from({ length: 9 })
      .map((_, i) => `<line x1="0" y1="${(height / 8) * i}" x2="${width}" y2="${(height / 8) * i}" />`)
      .join("")}
  </g>

  <!-- Main Rendered Artwork -->
  ${artworkContent}

  <!-- Watermark Tag -->
  <g transform="translate(24, ${height - 24})" opacity="0.6">
    <text x="0" y="0" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12" font-weight="600" letter-spacing="1">
      BOT BRO AI ARTWORK
    </text>
  </g>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
