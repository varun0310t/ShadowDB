"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { getSession } from "next-auth/react";

export default  function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
 // This will be a promise, so you might want to handle it accordingly
  return (
    <SessionProvider  refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}
