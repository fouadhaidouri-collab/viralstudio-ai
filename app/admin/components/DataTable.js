"use client";

export default function DataTable({ columns, data, onRowClick, emptyMessage = "No data found" }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-surface-container-higher/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold text-on-surface-variant ${col.align === "right" ? "text-right" : "text-left"} ${col.width ? `w-[${col.width}]` : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.align === "right" ? "text-right" : "text-left"}`}>
                  {col.render ? col.render(row) : <span className="text-xs text-on-surface-variant">{row[col.key] ?? "-"}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
