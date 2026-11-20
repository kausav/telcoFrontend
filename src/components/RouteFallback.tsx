/** Shown while the code for a page is downloaded. `inline` fills one grid cell of the canvas instead of the whole window. */
export function RouteFallback({ inline = false }: { inline?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${inline ? 'col-span-12 h-full' : 'h-screen w-screen'} flex items-center justify-center bg-[#F1F0EC] text-[#0B0B0C]/60`}
    >
      <span className="wb-cap">Loading...</span>
    </div>
  );
}
