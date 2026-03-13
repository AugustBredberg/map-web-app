"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@heroui/react";

interface Preset {
  label: string;
  value: number; // hours
}

const PRESETS: Preset[] = [
//   { label: "30m", value: 0.5 },
//   { label: "1h",  value: 1   },
  { label: "2h",  value: 2   },
  { label: "4h",  value: 4   },
  { label: "6h",  value: 6   },
  { label: "All day", value: 8 },
];

function isPreset(val: string): boolean {
  const n = Number(val);
  return PRESETS.some((p) => p.value === n);
}

interface Props {
  value: string; // hours as string (e.g. "2", "0.5", "")
  onChange: (v: string) => void;
  isDisabled?: boolean;
}

export default function ProjectEstimatedTimeSelect({ value, onChange, isDisabled = false }: Props) {
  // true when the user has explicitly opened the custom input
  // We track this separately so the user can toggle custom on/off even when value is empty
  const [customMode, setCustomMode] = useState(() => value !== "" && !isPreset(value));
  const customInputRef = useRef<HTMLInputElement>(null);

  // Derive whether the custom input is shown:
  // - explicitly opened via customMode, OR
  // - value is non-empty and doesn't match any preset (e.g. loaded from DB)
  const showCustom = customMode || (value !== "" && !isPreset(value));

  // Focus input when custom mode activates
  useEffect(() => {
    if (showCustom) customInputRef.current?.focus();
  }, [showCustom]);

  const handlePresetClick = (preset: Preset) => {
    setCustomMode(false);
    onChange(value === String(preset.value) ? "" : String(preset.value));
  };

  const handleCustomClick = () => {
    if (showCustom) {
      setCustomMode(false);
      if (!isPreset(value)) onChange("");
    } else {
      setCustomMode(true);
      if (isPreset(value)) onChange("");
    }
  };

  const activePreset = !showCustom && value !== "" ? Number(value) : null;
  const customActive = showCustom;

  const chipBase =
    "rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors select-none";
  const chipActive =
    "border-blue-400 bg-blue-50 text-blue-700";
  const chipIdle =
    "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50";
  const chipDisabled =
    "cursor-not-allowed opacity-50";

  return (
    <div>
      <p className="mb-1.5 text-sm text-gray-600">Estimated time</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const selected = activePreset === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              disabled={isDisabled}
              onClick={() => handlePresetClick(preset)}
              className={[
                chipBase,
                selected ? chipActive : chipIdle,
                isDisabled ? chipDisabled : "cursor-pointer",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}

        <button
          type="button"
          disabled={isDisabled}
          onClick={handleCustomClick}
          className={[
            chipBase,
            customActive ? chipActive : chipIdle,
            isDisabled ? chipDisabled : "cursor-pointer",
          ].join(" ")}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="mt-2">
          <Input
            ref={customInputRef}
            type="number"
            placeholder="-"
            value={value}
            onValueChange={onChange}
            isDisabled={isDisabled}
            variant="bordered"
            size="sm"
            min="0"
            step="0.5"
            endContent={<span className="text-xs text-gray-400">h</span>}
            classNames={{ inputWrapper: "max-w-36" }}
          />
        </div>
      )}
    </div>
  );
}
