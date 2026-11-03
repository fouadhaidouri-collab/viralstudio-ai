import VideoLab from "../../components/VideoLab";

export const metadata = {
  title: "Text to Video | ViralStudio AI",
  description:
    "Generate cinematic AI videos from a text prompt with premium models from Kling, Seedance, MiniMax, Wan, and Veo.",
};

export default function TextToVideoPage() {
  return <VideoLab mode="text" />;
}
