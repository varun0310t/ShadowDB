"use client";

import React, { ReactNode } from "react";

interface FixedHeightContainerProps {
  children: ReactNode;
}

export function FixedHeightContainer({ children }: FixedHeightContainerProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
