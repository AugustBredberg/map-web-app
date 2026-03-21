"use client";

interface PersonChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const SIZE = {
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
} as const;

export default function PersonChip({ name, selected, onClick, size = "md" }: PersonChipProps) {
  const colorClasses = selected ? "bg-primary text-white" : "bg-selected text-foreground";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-medium transition-colors 
        ${SIZE[size]} ${colorClasses} 
        ${onClick ? "cursor-pointer select-none" : ""}`}
    >
      {name}
    </button>
  );
}
