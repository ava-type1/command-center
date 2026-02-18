export function KodaVoice() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <iframe
        src="https://ai.gentlytold.com/client/"
        className="w-full h-full border-0"
        allow="microphone; autoplay"
        title="Koda Voice"
      />
    </div>
  );
}
