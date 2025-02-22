"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "AccessDenied":
        return "Access denied. Please check your credentials and try again.";
      case "CredentialsSignin":
        return "Invalid email or password.";
      case "OAuthSignin":
        return "Error signing in with OAuth provider.";
      case "OAuthCallback":
        return "Error during OAuth callback.";
      case "OAuthCreateAccount":
        return "Error creating OAuth account.";
      case "EmailSignin":
        return "The email link is invalid or has expired.";
      case "Configuration":
        return "There is a problem with the server configuration.";
      default:
        return "An error occurred during authentication.";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">ShadowDB</span>
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold text-purple-500">
            Authentication Error
          </h1>
          <p className="text-gray-400">
            {error ? getErrorMessage(error) : "An unknown error occurred."}
          </p>
          <div className="space-y-4">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              asChild
            >
              <Link href="/Users/login">Back to Login</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full bg-[#151923] border-gray-800 hover:bg-[#0B0F17] text-stone-50"
              asChild
            >
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}