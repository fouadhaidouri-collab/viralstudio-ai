export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-4">
        <div className="w-10 h-10 border-2 border-surface-container-high rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs text-on-surface-variant">{text}</p>
    </div>
  );
}
