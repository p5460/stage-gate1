import { VideoTutorials } from "@/components/help/video-tutorials";

export default function TutorialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Tutorials</h1>
          <p className="text-gray-600">
            Learn how to use the CSIR Stage-Gate Platform with our comprehensive
            video tutorials
          </p>
        </div>
      </div>
      <VideoTutorials />
    </div>
  );
}
