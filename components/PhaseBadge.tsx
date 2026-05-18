type PhaseBadgeProps = {
  fase?: string | null;
};

const phaseStyles: Record<string, string> = {
  "Fase de grupos":
    "border-slate-500/30 bg-slate-500/10 text-slate-200",
  Dieciseisavos:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  Octavos:
    "border-blue-500/30 bg-blue-500/10 text-blue-200",
  Cuartos:
    "border-violet-500/30 bg-violet-500/10 text-violet-200",
  Semifinales:
    "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200",
  "Tercer puesto":
    "border-amber-500/30 bg-amber-500/10 text-amber-200",
  Final:
    "border-yellow-400/40 bg-yellow-400/15 text-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.16)]",
};

export default function PhaseBadge({ fase }: PhaseBadgeProps) {
  const label = fase?.trim() || "Fase pendiente";
  const style =
    phaseStyles[label] ??
    "border-white/10 bg-white/10 text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${style}`}
    >
      {label}
    </span>
  );
}