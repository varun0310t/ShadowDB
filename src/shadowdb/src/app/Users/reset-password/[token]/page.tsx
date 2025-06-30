"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

// Define schema for password reset
const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const token = params.token;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/users/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/users/reset-password/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }
      
      setResetComplete(true);
      toast.success("Password has been reset successfully");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (tokenValid === null) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Verifying your reset link...</p>
        </div>
      );
    }

    if (tokenValid === false) {
      return (
        <div className="text-center p-6">
          <div className="bg-red-500/20 text-red-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Invalid or Expired Link</h3>
          <p className="text-gray-400 mb-6">The password reset link is invalid or has expired. Please request a new password reset link.</p>
          <Button 
            onClick={() => router.push('/Users/forget-password')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Request New Link
          </Button>
        </div>
      );
    }

    if (resetComplete) {
      return (
        <div className="text-center p-6">
          <div className="bg-green-500/20 text-green-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Password Reset Complete</h3>
          <p className="text-gray-400 mb-6">Your password has been successfully reset. You can now log in with your new password.</p>
          <Button 
            onClick={() => router.push('/Users/login')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Go to Login
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 text-purple-100">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className="bg-[#0B0F17] border-gray-800 pr-10"
              {...register("password")}
            />
            <button 
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
          <p className="text-xs text-gray-400">
            Password must have at least 8 characters, including uppercase, lowercase, number, and special character
          </p>
        </div>
        
        <div className="space-y-2 text-purple-100">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            className="bg-[#0B0F17] border-gray-800"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    );
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

      {/* Reset Password Form */}
      <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md mx-4 bg-[#151923] border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-stone-50">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter a new password for your ShadowDB account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          {!resetComplete && tokenValid === true && (
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-gray-400 w-full">
                <Button
                  variant="link"
                  onClick={() => router.push('/Users/login')}
                  className="text-purple-500 hover:text-purple-400"
                >
                  Remember your password? Log in
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
