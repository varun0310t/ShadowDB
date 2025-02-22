"use client";
import Link from "next/link";
import { Database } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpEmail } from "@/client/lib/services/authService";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define the type for the form data
type SignUpData = {
  name: string;
  email: string;
  password: string;
};

const signUpSchema = z.object({
  name: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function SignUpPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  // Update the mutation with proper typing
  const mutation = useMutation<any, Error, SignUpData>({
    mutationFn: (data: SignUpData) => signUpEmail(data),
    onSuccess: () => {
      toast.success("Account created successfully");
      router.push("/Users/login");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  const onSubmit = async (data: SignUpData) => {
    await mutation.mutate(data);
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

      {/* Sign Up Form */}
      <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md mx-4 bg-[#151923] border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-purple-500">
              Create an account
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your information to get started with ShadowDB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2 text-purple-100">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  className="bg-[#0B0F17] border-gray-800"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2 text-purple-100">
                <Label htmlFor="email">Email</Label>
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
              <div className="space-y-2 text-purple-100">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="bg-[#0B0F17] border-gray-800"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Sign Up
              </Button>
              <div className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-500 hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
