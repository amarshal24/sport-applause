import TopFiveVideos from "@/components/TopFiveVideos";
export default function Top5Debug() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <TopFiveVideos userId="6d726b8f-74b2-44f1-9b70-fae80cef1b73" isOwnProfile={false} />
    </div>
  );
}
