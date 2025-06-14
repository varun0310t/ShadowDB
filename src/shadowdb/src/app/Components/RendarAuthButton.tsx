import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
  // Auth button content and redirect logic
 export const renderAuthButton = (isClient: boolean, status: string) => {
    // Only render content once we're on client-side
    if (!isClient) return <Button variant="outline" className="text-black">Loading...</Button>;

    if (status === "authenticated") {
      return (
        <Button variant="outline" className="hidden md:inline-flex text-black">
          <Link href="/Home">Dashboard</Link>
        </Button>
      );
    } else {
      return (
        <Button variant="outline" className="hidden md:inline-flex text-black">
          <Link href="/Users/login">Sign In</Link>
        </Button>
      );
    }
  };
