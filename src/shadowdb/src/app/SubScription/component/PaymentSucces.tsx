import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F17] p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-24 w-24 text-green-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-100">Payment Successful!</h1>
        <p className="mb-6 text-gray-400">
          Your Pro subscription has been activated successfully. Thank you for choosing ShadowDB!
        </p>
        <div className="flex flex-col gap-4">
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}