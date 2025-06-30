"use client";
import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

// Define the schema for password reset
const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Type for the form data
type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setIsSubmitting(true);
      
    
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send password reset email');
      }
      
      setEmailSent(true);
      toast.success("Password reset link sent to your email");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send password reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/Users/login");
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">ShadowDB</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            FAQ
          </Link>
        </nav>
      </header>

      {/* Forgot Password Form */}
      <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md mx-4 bg-[#151923] border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-stone-50">
              {emailSent ? "Check Your Email" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {emailSent 
                ? "We've sent you a password reset link" 
                : "Enter your email address to receive a password reset link"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2 text-purple-100">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    className="bg-[#0B0F17] border-gray-800"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-purple-600/20 text-purple-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-gray-300">
                  We've sent a password reset link to your email address. 
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <p className="text-sm text-gray-400">
                  If you don't see the email, please check your spam folder.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-400 w-full">
              <Button
                variant="link"
                onClick={handleBackToLogin}
                className="text-purple-500 hover:text-purple-400"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
