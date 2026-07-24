"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface DatePickerProps {
  date?: Date;
  setDate?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
}

export function DatePicker({
  date: controlledDate,
  setDate: setControlledDate,
  placeholder = "Pick a date",
  className,
  id,
  disabled,
  value,
  onChange,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parseValue = React.useCallback((val?: string | Date): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
    if (typeof val === "string") {
      const parts = val.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day);
        }
      }
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, []);

  const [internalDate, setInternalDate] = React.useState<Date | undefined>(() => {
    if (controlledDate) return controlledDate;
    return parseValue(value);
  });

  React.useEffect(() => {
    if (controlledDate !== undefined) {
      setInternalDate(controlledDate);
    } else if (value !== undefined) {
      setInternalDate(parseValue(value));
    }
  }, [value, controlledDate, parseValue]);

  const date = controlledDate !== undefined ? controlledDate : internalDate;

  const handleSelect = (selectedDate?: Date) => {
    setInternalDate(selectedDate);
    if (setControlledDate) {
      setControlledDate(selectedDate);
    }
    if (onChange) {
      const formatted = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
      onChange({ target: { value: formatted } });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-background border-input",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999] bg-popover shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
