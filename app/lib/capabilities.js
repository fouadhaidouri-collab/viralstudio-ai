export const USD_TO_CREDIT = 1000 / 29;

export const videoAspectRatios = [
  { label: "Cinematic 16:9", icon: "crop_16_9" },
  { label: "Instagram 9:16", icon: "crop_portrait" },
  { label: "Square 1:1", icon: "crop_square" },
  { label: "Portrait 4:5", icon: "crop_7_5" },
];

export const videoResolutions = ["720p", "1080p"];
export const videoDurations = ["5 seconds", "8 seconds", "10 seconds", "15 seconds"];

export const videoModels = [
  { label: "Veo 3.1 Fast", icon: "videocam", color: "#7c3aed", fal_model: "fal-ai/veo3.1/fast", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds", "8 seconds"] } },
  { label: "Grok Imagine Video", icon: "psychology", color: "#06b6d4", fal_model: "xai/grok-imagine-video/text-to-video", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { label: "SeeDance 1.5", icon: "directions_run", color: "#f59e0b", fal_model: "bytedance/seedance/v1.5/pro/text-to-video", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { label: "SeeDance 2.0", icon: "directions_run", color: "#f97316", fal_model: "bytedance/seedance-2.0/text-to-video", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { label: "Kling 3.0", icon: "smart_display", color: "#ef4444", fal_model: "kling-video/v3/pro/text-to-video", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { label: "Runway Gen 4.5", icon: "run_circle", color: "#10b981", fal_model: "fal-ai/runway-gen-3", options: { aspect_ratio: [], resolution: ["720p", "1080p"], duration: ["5 seconds", "8 seconds", "10 seconds"] } },
  { label: "Luma Ray 2", icon: "flare", color: "#8b5cf6", fal_model: "fal-ai/luma-dream-machine", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { label: "Pika 2.1", icon: "pets", color: "#ec4899", fal_model: "fal-ai/pika", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { label: "Happy Horse", icon: "emoji_nature", color: "#14b8a6", fal_model: "alibaba/happy-horse/text-to-video", options: { aspect_ratio: ["Cinematic 16:9", "Instagram 9:16", "Square 1:1", "Portrait 4:5"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
];

export const aiModels = videoModels.map(({ label, icon, color }) => ({ label, icon, color }));

export const FAL_MODEL_IDS = Object.fromEntries(videoModels.map(m => [m.label, m.fal_model]));

export const videoModelCapabilities = Object.fromEntries(videoModels.map(m => [
  m.label,
  {
    aspectRatios: m.options.aspect_ratio || [],
    resolutions: m.options.resolution || [],
    durations: m.options.duration || [],
  },
]));

export const imageAspectRatios = [
  { label: "Square 1:1", icon: "crop_square" },
  { label: "Portrait 4:5", icon: "crop_7_5" },
  { label: "Landscape 16:9", icon: "crop_16_9" },
  { label: "Portrait 9:16", icon: "crop_portrait" },
];

export const imageResolutions = ["720p", "1080p"];

const ALL_IMAGE_ARS = ["Square 1:1", "Portrait 4:5", "Landscape 16:9", "Portrait 9:16"];

export const imageModels = [
  { label: "GPT Image 2", icon: "🧠", color: "#10b981", fal_model: "fal-ai/flux-pro", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "NanoBanana 2", icon: "🍌", color: "#f59e0b", fal_model: "fal-ai/recraft-20b", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "NanoBanana Pro", icon: "👔", color: "#8b5cf6", fal_model: "fal-ai/ideogram/v2", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "NanoBanana", icon: "☀️", color: "#ec4899", fal_model: "fal-ai/stable-diffusion-v3", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "Imagen 4", icon: "✨", color: "#06b6d4", fal_model: "fal-ai/imagen-3", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "Grok", icon: "🔥", color: "#ef4444", fal_model: "fal-ai/flux-dev", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
];

export const imageModelCapabilities = Object.fromEntries(imageModels.map(m => [
  m.label,
  { aspectRatios: m.options.aspect_ratio || [], resolutions: m.options.resolution || [] },
]));

// Option label map for dynamic rendering
export const OPTION_LABELS = {
  aspect_ratio: "Aspect Ratio",
  resolution: "Resolution",
  duration: "Duration",
  style: "Style",
};
