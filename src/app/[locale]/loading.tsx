export default function LocaleLoading() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background supports-[height:100dvh]:h-[100dvh]">
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="h-4 w-40 animate-pulse rounded bg-white/8" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded border border-border bg-white/6" />
          <div className="h-8 w-8 animate-pulse rounded border border-border bg-white/6" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-[20%] min-w-[16rem] border-r border-border bg-sidebar p-3 lg:block">
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-xl bg-white/5" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/4" />
            <div className="h-48 animate-pulse rounded-2xl bg-white/4" />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="h-10 border-b border-border bg-background px-4 py-2">
            <div className="h-5 w-64 animate-pulse rounded bg-white/6" />
          </div>
          <div className="flex-1 bg-background p-4">
            <div className="h-full animate-pulse rounded-2xl border border-border bg-white/4" />
          </div>
        </div>

        <div className="hidden w-[26%] min-w-[18rem] border-l border-border bg-sidebar p-4 xl:block">
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/4" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
