
"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex w-full items-center gap-2">
            {value ? (
              <div
                className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
                style={{ background: value }}
              />
            ) : null}
            <div className="flex-1 truncate font-mono text-sm uppercase">
              {value || "Pick a color"}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <HexColorPicker color={value} onChange={onChange} />
        <div className="p-2 border-t border-input">
            <Input
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                className="w-full h-8 font-mono text-sm"
            />
        </div>
      </PopoverContent>
    </Popover>
  )
}
