const ROWS = [
  { pages: "1–6", status: "Inked" },
  { pages: "7–12", status: "Inking" },
  { pages: "13–18", status: "Pencils" },
];

/**
 * The "before" of the swap: the same status card as `HeroProduct`, drawn the way a stock
 * shadcn project draws it, with flat borders and a rounded button. Deliberately plain markup,
 * not a registry item: it exists only to be swapped away.
 */
export function StockCard() {
  return (
    <div
      data-slot="stock-card"
      className="w-full rounded-xl border border-tone-2 bg-paper p-5 text-xs shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Chapter 12 · Rooftop</p>
          <p className="text-tone-3">Inks due Friday</p>
        </div>
        <span className="rounded-full border border-tone-2 px-2 py-0.5 font-medium">Due Fri</span>
      </div>
      <table className="mt-4 w-full text-left">
        <thead>
          <tr className="border-b border-tone-2 text-tone-3">
            <th className="py-1.5 font-medium">Pages</th>
            <th className="py-1.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.pages} className="border-b border-tone-1 last:border-0">
              <td className="py-1.5">{row.pages}</td>
              <td className="py-1.5">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <div className="flex justify-between">
          <span>Inked</span>
          <span>64%</span>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-tone-1">
          <div className="h-2 w-[64%] rounded-full bg-ink" />
        </div>
      </div>
      <button
        type="button"
        className="mt-4 rounded-md bg-ink px-3 py-1.5 font-medium text-paper hover:bg-ink/90"
      >
        Send to editor
      </button>
    </div>
  );
}
