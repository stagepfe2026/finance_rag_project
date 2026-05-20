import { Bell } from "lucide-react";
import { useAdminNotificationsBellViewModel } from "../../viewmodels/useAdminNotificationsBellViewModel";
import Snackbar from "../Snackbar";
import AdminNotificationsPanel from "./AdminNotificationsPanel";

type Props = {
  tooltipPosition?: string;
};

export default function AdminNotificationsBell({ tooltipPosition = "bottom-full left-1/2 mb-2 -translate-x-1/2" }: Props) {
  const vm = useAdminNotificationsBellViewModel();

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          onClick={vm.togglePanel}
          aria-label="Notifications"
          className={[
            "relative flex h-9 w-9 items-center justify-center rounded-md cursor-pointer transition-all duration-200",
            "text-[#5f6680] hover:bg-[#f7f9fc] hover:text-[#071f3d]",
          ].join(" ")}
        >
          <Bell size={14} />
          {vm.unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9d0208] px-0.5 text-[9px] font-bold leading-none text-white">
              {vm.unreadCount > 9 ? "9+" : vm.unreadCount}
            </span>
          )}
        </button>
        <span className={`pointer-events-none absolute z-50 whitespace-nowrap rounded border border-[#e5eaf2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#071f3d] opacity-0 shadow-lg transition group-hover:opacity-100 ${tooltipPosition}`}>
          Notifications
        </span>
      </div>

      <AdminNotificationsPanel
        open={vm.panelOpen}
        items={vm.items}
        isLoading={vm.isLoading}
        error={vm.error}
        onClose={vm.closePanel}
        onMarkAsRead={(item) => void vm.handleMarkAsRead(item)}
        onDismiss={vm.handleDismiss}
      />

      <Snackbar
        open={vm.snackbar.open}
        message={vm.snackbar.message}
        tone="info"
        duration={5000}
        onClose={vm.closeSnackbar}
      />
    </>
  );
}
