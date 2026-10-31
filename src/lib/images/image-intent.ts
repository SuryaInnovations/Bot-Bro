import { AspectRatio, ImageStyle } from "./image-types";

export interface ParsedImageIntent {
  isImageRequest: boolean;
  isVariationRequest: boolean;
  isEditRequest: boolean;
  prompt: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  confidence: number;
}

const TRIGGER_PATTERNS = [
  /^(?:generate|create|make|produce|render|paint|draw|design)\s+(?:an?\s+)?(?:image|picture|photo|photograph|illustration|graphic|drawing|artwork|logo|portrait|poster|visual|rendering)\s+(?:of|showing|depicting|with|for)?\s*(.+)/i,
  /^(?:draw|paint|design|illustrate|visualize)\s+(?:me\s+)?(?:an?\s+)?(.+)/i,
  /^(?:can you\s+)?(?:generate|create|draw|make)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|logo)\s+(?:of|showing)?\s*(.+)/i,
  /^(?:show me|give me)\s+(?:a\s+)?(?:picture|image|photo|illustration|drawing|render)\s+of\s+(.+)/i,
  /^(?:i want|i need)\s+(?:an?\s+)?(?:image|picture|photo|illustration|logo)\s+(?:of|for)\s+(.+)/i,
  /^(?:generate|create|make)\s+(?:another|new|different)\s+(?:variation|version|image|picture)(?:\s+of\s+(.+))?/i,
  /^(?:edit|modify|change|update)\s+(?:this|the)\s+(?:image|picture|photo)\s+(?:to|by)?\s*(.+)/i,
];

const NON_IMAGE_PATTERNS = [
  /^(?:what is|how do|how to|why is|explain|define|tell me about|describe)\b/i,
  /^(?:can you explain|how does|what are the steps|how can i draw)\b/i,
  /\b(?:in figma|in photoshop|in css|in python|code for|tutorial)\b/i,
  /^(?:search for|find|look up)\s+(?:images|pictures)\b/i,
];

export function detectImageIntent(text: string): ParsedImageIntent {
  const trimmed = (text || "").trim();

  // 1. Check for negative informational patterns first
  for (const neg of NON_IMAGE_PATTERNS) {
    if (neg.test(trimmed)) {
      return {
        isImageRequest: false,
        isVariationRequest: false,
        isEditRequest: false,
        prompt: "",
        style: "natural",
        aspectRatio: "1:1",
        confidence: 0,
      };
    }
  }

  // 2. Detect variations
  const isVariation = /variation|another version|different version|try again with/i.test(trimmed);
  const isEdit = /(?:edit|change the background|remove the|add a|modify this image)/i.test(trimmed);

  // 3. Match trigger patterns
  let extractedPrompt = "";
  let matched = false;

  for (const pattern of TRIGGER_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      matched = true;
      extractedPrompt = match[1]?.trim() || match[0];
      break;
    }
  }

  if (!matched && !isVariation && !isEdit) {
    return {
      isImageRequest: false,
      isVariationRequest: false,
      isEditRequest: false,
      prompt: "",
      style: "natural",
      aspectRatio: "1:1",
      confidence: 0,
    };
  }

  // Clean prompt of trailing or leading command remnants
  let prompt = extractedPrompt || trimmed;
  prompt = prompt
    .replace(/^(?:please|could you|kindly)\s+/i, "")
    .replace(/\s+(?:please|for me|thank you)$/i, "")
    .trim();

  // 4. Extract Aspect Ratio
  let aspectRatio: AspectRatio = "1:1";
  if (/\b(?:16:9|widescreen|landscape|horizontal|desktop|wallpaper)\b/i.test(trimmed)) {
    aspectRatio = "16:9";
  } else if (/\b(?:9:16|portrait|vertical|story|phone|mobile|reel)\b/i.test(trimmed)) {
    aspectRatio = "9:16";
  } else if (/\b(?:4:3|classic landscape)\b/i.test(trimmed)) {
    aspectRatio = "4:3";
  } else if (/\b(?:3:4|classic portrait)\b/i.test(trimmed)) {
    aspectRatio = "3:4";
  }

  // 5. Extract Style
  let style: ImageStyle = "natural";
  if (/\b(?:photorealistic|realistic|photograph|photo|8k|dslr)\b/i.test(trimmed)) {
    style = "photorealistic";
  } else if (/\b(?:3d|cartoon|pixar|disney|cute mascot|claymation|blender)\b/i.test(trimmed)) {
    style = "3d-cartoon";
  } else if (/\b(?:logo|icon|branding|minimalist logo|vector logo|emblem)\b/i.test(trimmed)) {
    style = "logo";
  } else if (/\b(?:anime|manga|studio ghibli|shonen)\b/i.test(trimmed)) {
    style = "anime";
  } else if (/\b(?:watercolor|watercolour|aquarelle|gouache)\b/i.test(trimmed)) {
    style = "watercolor";
  } else if (/\b(?:cyberpunk|neon|futuristic|sci-fi|dystopian)\b/i.test(trimmed)) {
    style = "cyberpunk";
  } else if (/\b(?:cinematic|movie scene|dramatic lighting|film still)\b/i.test(trimmed)) {
    style = "cinematic";
  } else if (/\b(?:digital art|concept art|illustration|artwork)\b/i.test(trimmed)) {
    style = "digital-art";
  }

  return {
    isImageRequest: true,
    isVariationRequest: isVariation,
    isEditRequest: isEdit,
    prompt: prompt || trimmed,
    style,
    aspectRatio,
    confidence: 0.95,
  };
}
