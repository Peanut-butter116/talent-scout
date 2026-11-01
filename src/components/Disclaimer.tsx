export const DISCLAIMER =
  "Unofficial concept demo — not a Glot product. Roles are based on Glot's public job ads; all candidates and activity are fictional.";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-4 pb-6 text-xs text-slate-500">
      {DISCLAIMER} Your edits are saved only in this browser.
    </footer>
  );
}
