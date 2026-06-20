"use client";
import { useState, useMemo } from "react";
import { mockSupportTickets } from "../data/mockSupportTickets";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import Icon from "../../components/Icon";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "resolved", label: "Resolved" },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState(mockSupportTickets);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTarget, setNoteTarget] = useState(null);
  const [confirmClose, setConfirmClose] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    let result = [...tickets];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.subject.toLowerCase().includes(q) || t.user_name.toLowerCase().includes(q));
    }
    if (priorityFilter) result = result.filter((t) => t.priority === priorityFilter);
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    return result;
  }, [tickets, search, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const high = tickets.filter((t) => t.priority === "high").length;
    const today = new Date().toISOString().slice(0, 10);
    const resolvedToday = tickets.filter((t) => t.status === "resolved" && t.created_at.startsWith(today)).length;
    return { total, open, high, resolvedToday };
  }, [tickets]);

  const handleCloseTicket = (ticket) => {
    setTickets(tickets.map((t) => t.id === ticket.id ? { ...t, status: "closed" } : t));
    showToast(`Ticket "${ticket.subject}" closed`);
    setConfirmClose(null);
  };

  const handleMarkHighPriority = (ticket) => {
    setTickets(tickets.map((t) => t.id === ticket.id ? { ...t, priority: "high" } : t));
    showToast(`Ticket "${ticket.subject}" marked as high priority`);
  };

  const handleAddNote = () => {
    if (!noteTarget || !noteText.trim()) return;
    setTickets(tickets.map((t) => t.id === noteTarget.id ? { ...t, admin_note: noteText } : t));
    showToast(`Admin note added to "${noteTarget.subject}"`);
    setShowNoteModal(false);
    setNoteText("");
    setNoteTarget(null);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    showToast(`Reply sent to ${selectedTicket.user_name}`);
    setReplyText("");
    setShowReply(false);
  };

  const getActionItems = (ticket) => [
    { icon: "visibility", label: "View Ticket", onClick: () => { setSelectedTicket(ticket); setShowReply(false); } },
    { icon: "chat", label: "Reply", onClick: () => { setSelectedTicket(ticket); setShowReply(true); } },
    { icon: "flash_on", label: "Mark High Priority", onClick: () => handleMarkHighPriority(ticket) },
    { icon: "check_circle", label: "Close Ticket", variant: "danger", onClick: () => setConfirmClose(ticket) },
    { icon: "edit", label: "Add Admin Note", onClick: () => { setNoteTarget(ticket); setNoteText(ticket.admin_note || ""); setShowNoteModal(true); } },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Support"
        subtitle="Manage customer support tickets"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Support" }]}
      />

      {toast && (
        <div className="px-4 py-2.5 bg-surface-container border border-surface-border/80 rounded-xl text-xs text-white flex items-center gap-2 animate-dropdown-open">
          <Icon name="check_circle" className="text-primary shrink-0" size={14} />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Tickets" value={stats.total} icon="inbox" color="primary" />
        <StatCard title="Open Tickets" value={stats.open} icon="chat_bubble" color="secondary" />
        <StatCard title="High Priority" value={stats.high} icon="error" color="error" />
        <StatCard title="Resolved Today" value={stats.resolvedToday} icon="check_circle" color="green" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by subject or user..." className="w-64" />
        <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_OPTIONS} placeholder="All Priorities" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All Statuses" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon="inbox" title="No tickets found" description="No support tickets match your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-container-higher/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Message</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {ticket.user_name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-white">{ticket.user_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-xs text-white truncate" title={ticket.subject}>{ticket.subject}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-on-surface-variant truncate" title={ticket.message}>{ticket.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu items={getActionItems(ticket)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedTicket(null); setShowReply(false); }}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Ticket Details</h2>
                <button onClick={() => { setSelectedTicket(null); setShowReply(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                  <Icon name="close" className="text-on-surface-variant" size={16} />
                </button>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-xs text-on-surface-variant mb-1">Subject</p>
                <p className="text-sm text-white font-medium">{selectedTicket.subject}</p>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-xs text-on-surface-variant mb-1">Message</p>
                <p className="text-sm text-white leading-relaxed">{selectedTicket.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">User</p>
                  <p className="text-white font-medium mt-0.5">{selectedTicket.user_name}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Priority</p>
                  <div className="mt-0.5"><StatusBadge status={selectedTicket.priority} /></div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Status</p>
                  <div className="mt-0.5"><StatusBadge status={selectedTicket.status} /></div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Created</p>
                  <p className="text-white mt-0.5">{formatDate(selectedTicket.created_at)}</p>
                </div>
              </div>

              {selectedTicket.admin_note && (
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Admin Note</p>
                  <p className="text-sm text-white">{selectedTicket.admin_note}</p>
                </div>
              )}

              {showReply && (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows="3"
                    className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleReply} disabled={!replyText.trim()} className="px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50">
                      Send Reply
                    </button>
                    <button onClick={() => setShowReply(false)} className="px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:text-white transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showReply && (
                <button onClick={() => setShowReply(true)} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-white hover:bg-surface-container-higher transition-all">
                  <Icon name="chat" size={14} />
                  Reply to Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowNoteModal(false); setNoteText(""); setNoteTarget(null); }}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="edit" className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Admin Note</h3>
                  <p className="text-xs text-on-surface-variant">{noteTarget?.subject}</p>
                </div>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter admin note..."
                rows="4"
                className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => { setShowNoteModal(false); setNoteText(""); setNoteTarget(null); }} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
                Cancel
              </button>
              <button onClick={handleAddNote} disabled={!noteText.trim()} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => handleCloseTicket(confirmClose)}
        title="Close Ticket"
        message={`Are you sure you want to close the ticket "${confirmClose?.subject}"?`}
        confirmLabel="Close Ticket"
        confirmVariant="danger"
      />
    </div>
  );
}
