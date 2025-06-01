import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HoverMessageProps {
  children: React.ReactNode;
  message?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * A wrapper component that adds a "feature in development" tooltip to any component
 */
export function HoverMessage({
  children,
  message = "",
  side = "right",
  align = "center"
}: HoverMessageProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="cursor-help">{children}</div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className="bg-gray-900 text-white border-gray-800 max-w-[300px] py-2 px-3"
        >
          <p className="text-sm">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}