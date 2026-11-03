import VideoLab from "../../components/VideoLab";

export const metadata = {
  title: "Image to Video | ViralStudio AI",
  description:
    "Animate a photo into a cinematic AI video with premium models from Kling, Seedance, MiniMax, Wan, and Veo.",
};

export default function ImageToVideoPage() {
  return <VideoLab mode="image" />;
}
