"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import PayPalCheckoutModal from "../../components/payment/PayPalCheckoutModal";

// Credit packs: $10 = 1,000 credits. Bonus % is added on top of the base credits.
const packs = [
  { id: "beginner", name: "Starter", price: 10, base: 1000, bonusPct: 0 },
  { id: "builder", name: "Basic", price: 25, base: 2500, bonusPct: 5 },
  { id: "creator", name: "Pro", price: 50, base: 5000, bonusPct: 10 },
  { id: "pro", name: "Business", price: 100, base: 10000, bonusPct: 15, badge: "Most Popular" },
  { id: "elite", name: "Premium", price: 200, base: 20000, bonusPct: 20, badge: "Best Value" },
  { id: "ultimate", name: "Elite", price: 500, base: 50000, bonusPct: 20 },
];

const CSS = `
.recharge-page {
  --brand: oklch(0.623 0.214 259.815);
  --brand-dark: oklch(0.55 0.2 259.815);
  --bg: oklch(1 0 0);
  --surface: oklch(0.985 0.002 90);
  --border: oklch(0.92 0.005 90);
  --text: oklch(0.2 0.01 90);
  --muted: oklch(0.5 0.01 90);
  --success: oklch(0.65 0.17 150);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
.recharge-page * { margin: 0; padding: 0; box-sizing: border-box; }
.recharge-page .topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 14px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.recharge-page .brand { font-weight: 700; font-size: 18px; color: var(--brand); }
.recharge-page .balance { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--success); }
.recharge-page .balance-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; }
.recharge-page .container { max-width: 1100px; margin: 0 auto; padding: 48px 32px; }
.recharge-page .page-header { margin-bottom: 36px; }
.recharge-page .page-header h1 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
.recharge-page .page-header p { color: var(--muted); font-size: 15px; }
.recharge-page .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 40px; }
.recharge-page .plan-card {
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 28px 22px;
  cursor: pointer;
  transition: all .18s ease;
  position: relative;
  background: #fff;
}
.recharge-page .plan-card:hover { border-color: var(--brand); transform: translateY(-3px); box-shadow: 0 12px 28px -10px rgba(99,102,241,.25); }
.recharge-page .plan-card.selected { border-color: var(--brand); background: color-mix(in srgb, var(--brand) 5%, #fff); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 15%, transparent); }
.recharge-page .plan-badge {
  position: absolute; top: -10px; right: 16px;
  background: var(--success); color: #fff;
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; text-transform: uppercase; letter-spacing: .5px;
}
.recharge-page .plan-name { font-weight: 600; font-size: 14px; color: var(--muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: .5px; }
.recharge-page .plan-price { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
.recharge-page .plan-price span { font-size: 14px; font-weight: 500; color: var(--muted); }
.recharge-page .plan-credits { font-size: 15px; font-weight: 600; color: var(--brand); margin-bottom: 6px; }
.recharge-page .plan-bonus { font-size: 12px; color: var(--success); font-weight: 600; }
.recharge-page .divider { height: 1px; background: var(--border); margin-bottom: 40px; }
.recharge-page .section-title { font-size: 18px; font-weight: 700; margin-bottom: 18px; }
.recharge-page .summary-box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 22px 26px; margin-bottom: 26px; }
.recharge-page .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.recharge-page .summary-row:last-child { border-bottom: none; }
.recharge-page .summary-row .label { color: var(--muted); }
.recharge-page .summary-row .value { font-weight: 700; }
.recharge-page .summary-row.total .value { color: var(--brand); font-size: 16px; }
.recharge-page .pay-methods { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.recharge-page .pay-btn {
  flex: 1; min-width: 140px; padding: 14px 18px;
  border: 1.5px solid var(--border); border-radius: 12px; background: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  color: var(--text);
}
.recharge-page .pay-btn:hover { border-color: var(--brand); }
.recharge-page .pay-btn.active { border-color: var(--brand); background: color-mix(in srgb, var(--brand) 6%, #fff); }
.recharge-page .pay-btn svg { height: 20px; width: auto; }
.recharge-page .cta-btn {
  width: 100%; padding: 16px; background: var(--brand); color: #fff;
  border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
  cursor: pointer; transition: all .15s;
}
.recharge-page .cta-btn:hover { background: var(--brand-dark); transform: translateY(-1px); }
.recharge-page .secure-note { text-align: center; margin-top: 14px; font-size: 12px; color: var(--muted); }
.recharge-page .history-section { margin-top: 48px; }
.recharge-page .history-list { display: flex; flex-direction: column; gap: 10px; }
.recharge-page .history-item {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 14px 20px; font-size: 14px;
}
.recharge-page .history-item .method { display: flex; align-items: center; gap: 8px; color: var(--muted); }
.recharge-page .history-item .amount { font-weight: 700; }
.recharge-page .history-item .status-ok { color: var(--success); font-weight: 600; font-size: 12px; text-transform: uppercase; }
`;

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [credits, setCredits] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(3); // Business ($100) selected by default
  const [payMethod, setPayMethod] = useState("Credit Card");
  const [history, setHistory] = useState([]);
  const [modalPlan, setModalPlan] = useState(null);

  const loadCredits = () => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.balance != null) setCredits(d.balance); }).catch(() => {});
  };
  const loadHistory = () => {
    fetch("/api/payments/history").then(r => r.json()).then(d => { if (Array.isArray(d.payments)) setHistory(d.payments); }).catch(() => {});
  };

  useEffect(() => { loadCredits(); loadHistory(); }, []);

  const sel = packs[selectedIdx];
  const bonus = Math.round(sel.base * sel.bonusPct / 100);
  const total = sel.base + bonus;

  const payNow = () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setModalPlan(sel.id);
  };

  return (
    <div className="recharge-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="topbar">
        <div className="brand">Viral Studio</div>
        <div className="balance">
          <span className="balance-dot"></span>
          {(credits ?? 0).toLocaleString()} credits available
        </div>
      </div>

      <div className="container">
        <div className="page-header">
          <h1>Recharge Credits</h1>
          <p>Top up your balance — credits never expire. One-time purchase, no subscription.</p>
        </div>

        <div className="plans-grid">
          {packs.map((p, i) => (
            <div
              key={p.id}
              className={"plan-card" + (i === selectedIdx ? " selected" : "")}
              onClick={() => setSelectedIdx(i)}
            >
              <div className="plan-name">{p.name}</div>
              {p.badge && <div className="plan-badge">{p.badge}</div>}
              <div className="plan-price">${p.price} <span>USD</span></div>
              <div className="plan-credits">{p.base.toLocaleString()} credits</div>
              <div className="plan-bonus">{p.bonusPct > 0 ? `+${p.bonusPct}% bonus` : "\u00A0"}</div>
            </div>
          ))}
        </div>

        <div className="divider"></div>

        <div className="section-title">Payment Method</div>
        <div className="pay-methods">
          <button className={"pay-btn" + (payMethod === "Credit Card" ? " active" : "")} onClick={() => setPayMethod("Credit Card")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            Credit Card
          </button>
          <button className={"pay-btn" + (payMethod === "PayPal" ? " active" : "")} onClick={() => setPayMethod("PayPal")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
            PayPal
          </button>
          <button className={"pay-btn" + (payMethod === "Crypto" ? " active" : "")} onClick={() => setPayMethod("Crypto")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            Crypto
          </button>
        </div>

        <div className="section-title">Order Summary</div>
        <div className="summary-box">
          <div className="summary-row">
            <span className="label">Selected plan</span>
            <span className="value">{sel.name} — ${sel.price}</span>
          </div>
          <div className="summary-row">
            <span className="label">Base credits</span>
            <span className="value">{sel.base.toLocaleString()} credits</span>
          </div>
          <div className="summary-row">
            <span className="label">Bonus</span>
            <span className="value">+{bonus.toLocaleString()} credits</span>
          </div>
          <div className="summary-row total">
            <span className="label">Total credits you receive</span>
            <span className="value">{total.toLocaleString()} credits</span>
          </div>
        </div>

        <button className="cta-btn" onClick={payNow}>Pay ${sel.price} &amp; Get {total.toLocaleString()} Credits</button>
        <div className="secure-note">🔒 Secure one-time payment — no recurring charges</div>

        <div className="history-section">
          <div className="section-title">Purchase History</div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-item">
                <span className="method">No purchases yet</span>
                <span className="amount">—</span>
                <span className="status-ok">—</span>
              </div>
            ) : (
              history.map((h) => (
                <div className="history-item" key={h.id}>
                  <span className="method">
                    {h.provider === "paypal" ? "🅿️ PayPal" : `💳 ${h.provider || "Payment"}`}
                    {" — "}
                    {h.created_at ? new Date(h.created_at).toLocaleDateString() : ""}
                  </span>
                  <span className="amount">${Number(h.amount || 0).toFixed(2)}</span>
                  <span className="status-ok">{h.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PayPalCheckoutModal
        isOpen={modalPlan !== null}
        onClose={() => { setModalPlan(null); loadCredits(); loadHistory(); }}
        planId={modalPlan || "pro"}
        billingCycle="one_time"
      />
    </div>
  );
}
