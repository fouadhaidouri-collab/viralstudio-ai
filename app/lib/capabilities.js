export const videoAspectRatios = [
  { label: "16:9", icon: "crop_16_9" },
  { label: "9:16", icon: "crop_portrait" },
  { label: "1:1", icon: "crop_square" },
  { label: "4:5", icon: "crop_7_5" },
  { label: "5:4", icon: "crop_7_5" },
  { label: "3:2", icon: "crop_7_5" },
  { label: "2:3", icon: "crop_7_5" },
  { label: "4:3", icon: "crop_7_5" },
  { label: "3:4", icon: "crop_7_5" },
  { label: "21:9", icon: "crop_16_9" },
];

export const videoResolutions = ["480p", "720p", "768p", "1080p", "2K", "4k"];

const seconds = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${from + i} seconds`);

export const videoModels = [
  {
    id: "kling_30",
    label: "Kling 3.0",
    family: "Kling",
    provider: "Kling",
    icon: "smart_display",
    color: "#ef4444",
    desc: "Kling 3.0 image-to-video with native speech/audio. Upload a photo, describe the scene, and let the character speak.",
    genTime: 180,
    model_id: "kling-v3",
    payload: "kling-v3",
    unitPrice: 0.63,
    markup: 2.0,
    requiresImage: true,
    supportsAudio: true,
    options: {
      aspect_ratio: [],
      resolution: ["720p", "1080p", "4k"],
      duration: seconds(3, 15),
    },
  },
  {
    id: "wan_30",
    label: "WAN 3.0",
    family: "Alibaba",
    provider: "Alibaba",
    icon: "emoji_nature",
    color: "#14b8a6",
    desc: "WAN 3.0 image-to-video with an optional audio track. Great for expressive talking scenes up to 30 seconds.",
    genTime: 210,
    model_id: "wan-3.0-i2v",
    payload: "wan-3.0",
    unitPrice: 0.5,
    markup: 2.0,
    requiresImage: true,
    supportsAudio: true,
    options: {
      aspect_ratio: [],
      resolution: ["480p", "720p", "1080p"],
      duration: seconds(4, 30),
    },
  },
  {
    id: "seedance_20",
    label: "Seedance 2.0",
    family: "Seedance",
    provider: "ByteDance",
    icon: "directions_run",
    color: "#f97316",
    desc: "Seedance 2.0 image-to-video with synchronized AI audio. Best for cinematic motion and speaking characters.",
    genTime: 245,
    model_id: "seedance-2.0-i2v",
    payload: "seedance-2.0",
    unitPrice: 1.025,
    markup: 2.0,
    requiresImage: true,
    supportsAudio: true,
    options: {
      aspect_ratio: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
      resolution: ["480p", "720p", "1080p", "4k"],
      duration: seconds(4, 15),
    },
  },
  {
    id: "seedance_20_mini",
    label: "Seedance 2.0 Mini",
    family: "Seedance",
    provider: "ByteDance",
    icon: "directions_run",
    color: "#fb923c",
    desc: "Lower-cost Seedance 2.0 image-to-video with native audio. A fast option for talking clips.",
    genTime: 150,
    model_id: "seedance-2.0-mini-i2v",
    payload: "seedance-2.0-mini",
    unitPrice: 0.5125,
    markup: 2.0,
    requiresImage: true,
    supportsAudio: true,
    options: {
      aspect_ratio: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
      resolution: ["480p", "720p"],
      duration: seconds(4, 15),
    },
  },
  {
    id: "hailuo_03",
    label: "Hailuo 03",
    family: "Hailuo",
    provider: "Hailuo",
    icon: "waves",
    color: "#3b82f6",
    desc: "Hailuo 03 image-to-video with native audio. Upload a portrait and create a speaking scene with natural motion.",
    genTime: 210,
    model_id: "hailuo-03-i2v",
    payload: "hailuo-03",
    unitPrice: 0.6,
    markup: 2.0,
    requiresImage: true,
    supportsAudio: true,
    options: {
      aspect_ratio: [],
      resolution: ["768p", "2K"],
      duration: seconds(4, 15),
    },
  },
];

export const aiModels = videoModels.map(({ label, icon, color, family, desc, genTime }) => ({
  label,
  icon,
  color,
  family,
  desc,
  genTime,
}));

export const RENDERFUL_MODEL_IDS = Object.fromEntries(
  videoModels.map((m) => [m.label, m.model_id])
);
export const MODEL_BY_ID = Object.fromEntries(videoModels.map((m) => [m.id, m]));

export const videoModelCapabilities = Object.fromEntries(
  videoModels.map((m) => [
    m.label,
    {
      aspectRatios: m.options.aspect_ratio || [],
      resolutions: m.options.resolution || [],
      durations: m.options.duration || [],
      styles: [],
    },
  ])
);

export const imageAspectRatios = [
  { label: "Square 1:1", api: "1:1", icon: "crop_square" },
  { label: "Portrait 4:5", api: "4:5", icon: "crop_7_5" },
  { label: "Landscape 16:9", api: "16:9", icon: "crop_16_9" },
  { label: "Portrait 9:16", api: "9:16", icon: "crop_portrait" },
  { label: "Landscape 4:3", api: "4:3", icon: "crop_7_5" },
  { label: "Portrait 3:4", api: "3:4", icon: "crop_7_5" },
  { label: "Landscape 3:2", api: "3:2", icon: "crop_7_5" },
  { label: "Portrait 2:3", api: "2:3", icon: "crop_7_5" },
  { label: "Ultrawide 21:9", api: "21:9", icon: "crop_16_9" },
];

export const imageResolutions = ["1k", "2k", "4k"];

const ALL_IMAGE_ARS = imageAspectRatios.map((ar) => ar.label);

export const imageModels = [
  {
    label: "GPT Image 2",
    provider: "OpenAI",
    icon: "psychology",
    color: "#10b981",
    model_id: "gpt-image-2",
    unitPrice: 0.03,
    markup: 2.0,
    credits: 6,
    options: {
      aspect_ratio: ["Square 1:1", "Portrait 9:16", "Landscape 16:9", "Landscape 4:3", "Portrait 3:4"],
      resolution: ["1k", "2k", "4k"],
    },
  },
  {
    label: "Nano Banana 2",
    provider: "Google",
    icon: "auto_awesome",
    color: "#f59e0b",
    model_id: "nano-banana-2",
    unitPrice: 0.05,
    markup: 2.0,
    credits: 10,
    options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["1k", "2k", "4k"] },
  },
  {
    label: "Nano Banana Pro",
    provider: "Google",
    icon: "auto_awesome",
    color: "#8b5cf6",
    model_id: "nano-banana-pro",
    unitPrice: 0.135,
    markup: 2.0,
    credits: 27,
    options: {
      aspect_ratio: ["Square 1:1", "Landscape 16:9", "Portrait 9:16", "Landscape 4:3", "Portrait 3:4", "Landscape 3:2", "Portrait 2:3"],
      resolution: ["1k", "2k", "4k"],
    },
  },
  {
    label: "Seedream 5.0 Pro",
    provider: "ByteDance",
    icon: "auto_awesome",
    color: "#ec4899",
    model_id: "seedream-5.0-pro",
    unitPrice: 0.045,
    markup: 2.0,
    credits: 9,
    options: {
      aspect_ratio: ["Square 1:1", "Landscape 16:9", "Portrait 9:16", "Landscape 4:3", "Portrait 3:4", "Landscape 3:2", "Portrait 2:3", "Ultrawide 21:9"],
      resolution: ["1k", "2k"],
    },
  },
  {
    label: "Flux 2 Pro",
    provider: "Black Forest Labs",
    icon: "auto_awesome",
    color: "#22d3ee",
    model_id: "flux-2-pro",
    unitPrice: 0.054,
    markup: 2.0,
    credits: 11,
    options: {
      aspect_ratio: ["Landscape 16:9", "Landscape 4:3", "Landscape 3:2", "Square 1:1", "Portrait 2:3", "Portrait 3:4", "Portrait 9:16"],
      resolution: ["1k", "2k"],
    },
  },
  {
    label: "Grok Imagine",
    provider: "xAI",
    icon: "psychology",
    color: "#06b6d4",
    model_id: "grok-imagine-image",
    unitPrice: 0.022,
    markup: 2.0,
    credits: 5,
    options: {
      aspect_ratio: ["Square 1:1", "Landscape 16:9", "Portrait 9:16"],
      resolution: ["1k", "2k"],
    },
  },
];

export const imageModelCapabilities = Object.fromEntries(
  imageModels.map((m) => [
    m.label,
    { aspectRatios: m.options.aspect_ratio || [], resolutions: m.options.resolution || [] },
  ])
);

// Option label map for dynamic rendering
export const OPTION_LABELS = {
  resolution: "Resolution",
  duration: "Duration",
};
