export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans text-black">
      <div className="flex items-center gap-5 h-12">
        <h1 className="text-2xl font-medium border-r border-black/30 pr-5 tracking-wider">
          404
        </h1>
        <div className="text-sm font-normal leading-12">
          This page could not be found.
        </div>
      </div>
    </div>
  );
}
