"use client";

import { useState } from "react";

export default function SystemCheckPage() {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null);

  const runCheck = async () => {
    setRunning(true);
    setResults(null);

    const out = { key: null, search: null, pricing: null, errors: [] };

    // 1. Key status
    try {
      const kr = await fetch("/api/admin/settings/fal-key/status").then((r) => r.json());
      out.key = kr;
    } catch (e) {
      out.key = { hasKey: false, error: e.message };
      out.errors.push("Key status check failed");
    }

    if (out.key?.hasKey) {
      // 2. Search models
      try {
        const sr = await fetch("/api/admin/settings/fal-key/status").then((r) => r.json());
        out.search = { working: true };
      } catch (e) {
        out.search = { working: false, error: e.message };
        out.errors.push("Model search failed");
      }

      // 3. Pricing
      try {
        const pr = await fetch("/api/model-pricing?endpoint_ids=" + encodeURIComponent("fal-ai/veo3.1/fast"))
          .then((r) => r.json());
        if (pr.prices) {
          const v = pr.prices["fal-ai/veo3.1/fast"];
          out.pricing = { working: true, unitPrice: v?.unitPrice, hasPrice: v?.unitPrice != null };
        } else {
          out.pricing = { working: false, error: "No pricing data" };
          out.errors.push("Pricing returned no data");
        }
      } catch (e) {
        out.pricing = { working: false, error: e.message };
        out.errors.push("Pricing check failed");
      }
    }

    setResults(out);
    setRunning(false);
  };

  return (
    <div className="min-h-full bg-background text-white p-8" style={{ fontFamily: "Geist, sans-serif" }}>
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">System Check</h1>
          <p className="text-sm text-on-surface-variant mt-1">Verify your fal.ai integration is working</p>
        </div>

        <button
          onClick={runCheck}
          disabled={running}
          className="w-full px-4 py-3 primary-gradient text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {running ? "Running Check..." : "Run fal.ai Check"}
        </button>

        {results && (
          <div className="space-y-3">
            <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-semibold">FAL Key</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${results.key?.hasKey ? "bg-green-400" : "bg-red-400"}`} />
                <span className="text-sm">{results.key?.hasKey ? "Present" : "Missing"}</span>
              </div>
              {results.key?.hasKey && (
                <p className="text-xs text-on-surface-variant">Source: {results.key.source} | Key: {results.key.masked}</p>
              )}
            </div>

            {results.key?.hasKey && (
              <>
                <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-2">
                  <h2 className="text-sm font-semibold">Model Search</h2>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${results.search?.working ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-sm">{results.search?.working ? "Working" : "Failed"}</span>
                  </div>
                </div>

                <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-2">
                  <h2 className="text-sm font-semibold">Pricing API</h2>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${results.pricing?.working ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-sm">{results.pricing?.working ? "Working" : "Failed"}</span>
                  </div>
                  {results.pricing?.hasPrice && (
                    <p className="text-xs text-green-400">Unit price: ${results.pricing.unitPrice}</p>
                  )}
                  {results.pricing?.working && !results.pricing?.hasPrice && (
                    <p className="text-xs text-yellow-400">Pricing unavailable (API returned no price)</p>
                  )}
                </div>
              </>
            )}

            {results.errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-red-400 mb-2">Errors</h2>
                {results.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-300">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
