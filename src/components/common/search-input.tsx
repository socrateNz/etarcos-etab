"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceTime?: number;
  className?: string;
}

export function SearchInput({
  value = "",
  onChange,
  placeholder = "Rechercher...",
  debounceTime = 300,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceTime);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 bg-muted/30 focus-visible:ring-primary"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 w-7 h-7 hover:bg-transparent"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
