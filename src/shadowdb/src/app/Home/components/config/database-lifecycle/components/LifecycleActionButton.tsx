import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LifecycleActionButtonProps {
  action: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
  isProcessing: string | null;
}

export function LifecycleActionButton({
  action,
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  isProcessing,
}: LifecycleActionButtonProps) {
  const isLoading = isProcessing === action;
  
  return (
    <Button
      variant={variant}
      size="sm"
      className={`${
        variant === "destructive"
          ? "bg-red-600 hover:bg-red-700"
          : variant === "outline"
          ? "border-gray-700 hover:bg-gray-800"
          : "bg-purple-600 hover:bg-purple-700"
      }`}
      onClick={onClick}
      disabled={isLoading || disabled}
    >
      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : icon}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
