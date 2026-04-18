type AdminTab = "upload" | "record" | "edit";

type AdminPageChromeProps = {
  activeTab: AdminTab;
  currentTime: string;
  isSigningOut: boolean;
  onLogout: () => void;
  onTabChange: (tab: AdminTab) => void;
};

export function AdminPageChrome({
  activeTab,
  currentTime,
  isSigningOut,
  onLogout,
  onTabChange,
}: AdminPageChromeProps) {
  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            ADMIN :: DEPLOY CONFIGURATION
          </h1>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-gray-500">
              {currentTime || "--:--:--"}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-not-allowed disabled:text-gray-600"
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onTabChange("upload")}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "upload"
                ? "text-gray-300 border-b-2 border-gray-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Upload New
          </button>
          <button
            type="button"
            onClick={() => onTabChange("record")}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "record"
                ? "text-gray-300 border-b-2 border-gray-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Record Audio
          </button>
          <button
            type="button"
            onClick={() => onTabChange("edit")}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "edit"
                ? "text-gray-300 border-b-2 border-gray-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            Edit Playlist
          </button>
        </div>
      </div>
    </>
  );
}
