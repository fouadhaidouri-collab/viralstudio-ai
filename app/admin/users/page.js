"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { mockUsers } from "../data/mockUsers";
import SearchInput from "../components/SearchInput";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);

  const PER_PAGE = 10;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    let result = [...mockUsers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return result;
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const openConfirm = (action, user) => {
    setConfirmAction(action);
    setActionTarget(user);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!actionTarget) return;
    showToast(`"${actionTarget.name}" ${confirmAction}ed`);
    setConfirmOpen(false);
    setConfirmAction(null);
    setActionTarget(null);
  };

  const handleQuickAction = (action, user) => {
    switch (action) {
      case "add_credits":
        showToast(`Added 1000 credits to "${user.name}"`);
        break;
      case "remove_credits":
        showToast(`Removed 500 credits from "${user.name}"`);
        break;
      case "change_plan":
        showToast(`Changed "${user.name}" plan to Pro`);
        break;
      case "change_role":
        showToast(`Changed "${user.name}" role to user`);
        break;
      case "suspend":
        openConfirm("suspend", user);
        break;
      case "ban":
        openConfirm("ban", user);
        break;
      case "delete":
        openConfirm("delete", user);
        break;
    }
  };

  const getConfirmMessage = () => {
    if (!actionTarget) return "";
    switch (confirmAction) {
      case "suspend": return `Are you sure you want to suspend "${actionTarget.name}"? They will not be able to use the platform.`;
      case "ban": return `Are you sure you want to ban "${actionTarget.name}"? This action cannot be undone.`;
      case "delete": return `Are you sure you want to permanently delete "${actionTarget.name}" and all their data? This cannot be undone.`;
      default: return "";
    }
  };

  const getActionItems = (user) => [
    { icon: "add", label: "Add Credits", onClick: () => handleQuickAction("add_credits", user) },
    { icon: "delete", label: "Remove Credits", onClick: () => handleQuickAction("remove_credits", user) },
    { icon: "edit", label: "Change Plan", onClick: () => handleQuickAction("change_plan", user) },
    { icon: "delete", label: "Delete", variant: "danger", onClick: () => handleQuickAction("delete", user) },
  ];

  return (
    <div className="min-h-full bg-background text-white p-6"><div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Users"
        subtitle={`${mockUsers.length} total users`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        actions={[
          { label: "Add User", icon: "add", variant: "primary", onClick: () => showToast("Add user modal would open here") },
        ]}
      />

      {toast && (
        <div className="px-4 py-2.5 bg-surface-container border border-surface-border/80 rounded-xl text-xs text-white flex items-center gap-2 animate-dropdown-open">
          <Icon name="check_circle" className="text-primary shrink-0" size={14} />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search by name or email..."
          className="w-full sm:w-64"
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="person"
            title="No users found"
            description="Try adjusting your search or filter criteria."
            action={{ label: "Clear Search", onClick: () => setSearch("") }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-container-higher/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Country</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => (
                    <tr key={user.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{user.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{user.email}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{user.country}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{new Date(user.signup_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right">
                        <ActionMenu items={getActionItems(user)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border/50">
                <span className="text-xs text-on-surface-variant">
                  Showing {(currentPage - 1) * PER_PAGE + 1}&ndash;{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 text-xs text-on-surface-variant hover:bg-surface-container-higher hover:text-white transition-all disabled:opacity-30"
                  >
                    <Icon name="chevron_right" className="rotate-180" size={12} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        page === currentPage
                          ? "primary-gradient text-white"
                          : "text-on-surface-variant hover:bg-surface-container-higher hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 text-xs text-on-surface-variant hover:bg-surface-container-higher hover:text-white transition-all disabled:opacity-30"
                  >
                    <Icon name="chevron_right" size={12} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); setActionTarget(null); }}
        onConfirm={handleConfirm}
        title={confirmAction ? `${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} User` : ""}
        message={getConfirmMessage()}
        confirmLabel={confirmAction ? confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1) : "Confirm"}
        confirmVariant="danger"
      />
    </div>
    </div>
  );
}
