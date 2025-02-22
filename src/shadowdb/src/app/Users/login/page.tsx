"use client";
import Link from "next/link";
import { Database, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to sign in with Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true);
      await signIn("github", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to sign in with GitHub");
    } finally {
      setIsGithubLoading(false);
    }
  };

  const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Logged in successfully");
        router.push("/"); // Redirect to home page or dashboard
      }
    } catch (error) {
      toast.error("An error occurred during login");
      console.error(error);
    }
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
            Testimonials
          </Link>
        </nav>
      </header>

      {/* Login Form */}
      <main className=" flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md mx-4 bg-[#151923] border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-stone-50">
              Welcome back
            </CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to your ShadowDB account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="bg-[#0B0F17] border-gray-800 hover:bg-[#151923] text-stone-50 hover:text-gray-500"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  type="button"
                >
                  {isGoogleLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#0B0F17] border-gray-800 hover:bg-[#151923] text-stone-50 hover:text-gray-500"
                  onClick={handleGithubSignIn}
                  disabled={isGithubLoading}
                  type="button"
                >
                  {isGithubLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  GitHub
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#151923] px-2 text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2  text-purple-100">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    className="bg-[#0B0F17] border-gray-800"
                    {...register("email")}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between  text-purple-100">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-purple-500 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    className="bg-[#0B0F17] border-gray-800"
                    {...register("password")}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    className="border-gray-800 data-[state=checked]:bg-purple-600"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70  text-purple-100"
                  >
                    Remember me
                  </label>
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  Sign In
                </Button>
              </form>
              <div className="text-center text-sm text-gray-400">
                Don't have an account?{" "}
                <Link href="/signup" className="text-purple-500 hover:underline">
                  Sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
