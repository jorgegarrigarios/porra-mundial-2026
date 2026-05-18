type TeamFlagProps = {
  code?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-5 w-7",
  md: "h-7 w-10",
  lg: "h-9 w-12",
};

export default function TeamFlag({
  code,
  name,
  size = "md",
}: TeamFlagProps) {
  const normalizedCode = code?.trim().toLowerCase();

  if (!normalizedCode) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-sm border border-white/10 bg-white/10 text-[10px] text-slate-400`}
        title={name ?? "Selección pendiente"}
      >
        —
      </div>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${normalizedCode}.png`}
      alt={name ? `Bandera de ${name}` : "Bandera"}
      title={name ?? undefined}
      className={`${sizeClasses[size]} rounded-sm object-cover shadow-sm ring-1 ring-white/10`}
      loading="lazy"
    />
  );
}