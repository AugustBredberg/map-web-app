"use client";

import { Input } from "@heroui/react";
import type { ZonedDateTime } from "@internationalized/date";

type Props = {
  label: string;
  value: ZonedDateTime;
  onChange: (next: ZonedDateTime) => void;
  isDisabled?: boolean;
};

function toTimeInputString(z: ZonedDateTime): string {
  const h = String(z.hour).padStart(2, "0");
  const m = String(z.minute).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Native time input — shows only clock time (no date/timezone string) to avoid overflow in narrow layouts.
 */
export default function AppointmentTimeInput({ label, value, onChange, isDisabled }: Props) {
  return (
    <Input
      type="time"
      step={60}
      label={label}
      value={toTimeInputString(value)}
      onValueChange={(raw) => {
        if (!raw) return;
        const [hs, ms] = raw.split(":");
        const hour = Number.parseInt(hs ?? "", 10);
        const minute = Number.parseInt(ms ?? "", 10);
        if (Number.isNaN(hour) || Number.isNaN(minute)) return;
        onChange(value.set({ hour, minute, second: 0, millisecond: 0 }));
      }}
      isDisabled={isDisabled}
      variant="bordered"
      classNames={{
        base: "w-full min-w-0 max-w-[7.25rem] shrink-0",
        input: "font-mono text-sm tabular-nums min-w-0",
        inputWrapper: "min-h-10",
      }}
    />
  );
}
