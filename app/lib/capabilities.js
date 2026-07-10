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
];

export const videoResolutions = ["720p", "1080p"];
export const videoDurations = ["5 seconds", "8 seconds", "10 seconds", "15 seconds"];

export const videoModels = [
  { id: "veo_31_fast", label: "Veo 3.1 Fast", family: "Veo", icon: "videocam", color: "#7c3aed", desc: "Google's fastest video model with stunning quality and 4K support.", fal_model: "fal-ai/veo3.1/fast/image-to-video", options: { aspect_ratio: ["9:16", "16:9"], resolution: ["720p", "1080p", "4k"], duration: ["4 seconds", "6 seconds", "8 seconds"] } },
  { id: "grok_imagine_video", label: "Grok Imagine Video", family: "Grok", icon: "psychology", color: "#06b6d4", desc: "xAI's creative video generation with rich imagination.", fal_model: "xai/grok-imagine-video/image-to-video", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["4 seconds", "6 seconds", "8 seconds"] } },
  { id: "seedance_15", label: "SeeDance 1.5", family: "Seedance", icon: "directions_run", color: "#f59e0b", desc: "ByteDance's reliable video generation with smooth motion.", fal_model: "fal-ai/bytedance/seedance/v1.5/pro/image-to-video", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["5 seconds", "10 seconds"] } },
  { id: "seedance_20", label: "SeeDance 2.0", family: "Seedance", icon: "directions_run", color: "#f97316", desc: "Next-gen video quality with extended 15s duration support.", fal_model: "bytedance/seedance-2.0/image-to-video", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["5 seconds", "10 seconds", "15 seconds"] } },
  { id: "kling_30", label: "Kling 3.0", family: "Kling", icon: "smart_display", color: "#ef4444", desc: "Kuaishou's premium video model with cinematic quality.", fal_model: "fal-ai/kling-video/v3/standard/image-to-video", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["5 seconds", "10 seconds"] } },
  { id: "runway_gen_45", label: "Runway Gen 4.5", family: "Runway", icon: "run_circle", color: "#10b981", desc: "Runway's most advanced creative video generation tool.", fal_model: "runway/gen4.5", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["5 seconds", "10 seconds"] } },
  { id: "luma_ray_2", label: "Luma Ray 2", family: "Luma", icon: "flare", color: "#8b5cf6", desc: "Photorealistic video generation with dream-like quality.", fal_model: "fal-ai/luma-dream-machine/ray-2", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["5 seconds", "9 seconds"] } },
  { id: "pika_21", label: "Pika 2.1", family: "Pika", icon: "pets", color: "#ec4899", desc: "Versatile video creation with the widest aspect ratio support.", fal_model: "fal-ai/pika/v2.1/image-to-video", options: { aspect_ratio: ["16:9", "9:16", "1:1", "4:5", "5:4", "3:2", "2:3"], resolution: ["720p", "1080p"], duration: ["5 seconds"] } },
  { id: "happy_horse", label: "Happy Horse", family: "Happy Horse", icon: "emoji_nature", color: "#14b8a6", desc: "Alibaba's efficient and affordable video generation.", fal_model: "alibaba/happy-horse/image-to-video", options: { aspect_ratio: ["16:9", "9:16", "1:1", "4:3", "3:4"], resolution: ["720p", "1080p"], duration: ["5 seconds", "10 seconds"] } },
  { id: "hailuo_video", label: "Hailuo Video", family: "Hailuo", icon: "waves", color: "#3b82f6", desc: "Advanced video generation with natural motion dynamics.", fal_model: "fal-ai/hailuo-video", options: { aspect_ratio: ["9:16", "16:9", "1:1"], resolution: ["720p", "1080p"], duration: ["5 seconds", "10 seconds"] } },
];

export const aiModels = videoModels.map(({ label, icon, color, family, desc }) => ({ label, icon, color, family, desc }));

export const FAL_MODEL_IDS = Object.fromEntries(videoModels.map(m => [m.label, m.fal_model]));
export const MODEL_BY_ID = Object.fromEntries(videoModels.map(m => [m.id, m]));

export const videoModelCapabilities = Object.fromEntries(videoModels.map(m => [
  m.label,
  {
    aspectRatios: m.options.aspect_ratio || [],
    resolutions: m.options.resolution || [],
    durations: m.options.duration || [],
    styles: [],
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
  { label: "GPT Image 2", provider: "OpenAI", icon: "🧠", color: "#10b981", fal_model: "fal-ai/flux-pro", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "NanoBanana 2", provider: "Recraft", icon: "🍌", color: "#f59e0b", fal_model: "fal-ai/recraft-20b", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "NanoBanana Pro", provider: "Recraft", icon: "👔", color: "#8b5cf6", fal_model: "fal-ai/ideogram/v2", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "NanoBanana", provider: "Recraft", icon: "☀️", color: "#ec4899", fal_model: "fal-ai/stable-diffusion-v3", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "Imagen 4", provider: "Google", icon: "✨", color: "#06b6d4", fal_model: "fal-ai/imagen-3", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
  { label: "Grok", provider: "xAI", icon: "🔥", color: "#ef4444", fal_model: "fal-ai/flux-dev", options: { aspect_ratio: ALL_IMAGE_ARS, resolution: ["720p", "1080p"] } },
];

export const imageModelCapabilities = Object.fromEntries(imageModels.map(m => [
  m.label,
  { aspectRatios: m.options.aspect_ratio || [], resolutions: m.options.resolution || [] },
]));

// Option label map for dynamic rendering
export const OPTION_LABELS = {
  resolution: "Resolution",
  duration: "Duration",
};
