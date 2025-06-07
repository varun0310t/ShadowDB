import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function PaymentFailedPage({
  searchParams,
}: {
  searchParams: { reason: string };
}) {
  const { reason } = searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F17] p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <AlertCircle className="h-24 w-24 text-red-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-100">Payment Failed</h1>
        <p className="mb-6 text-gray-400">
          We couldn't process your payment. Please try again.
        </p>
        {reason && (
          <p className="mb-6 rounded-md bg-red-900/30 p-3 text-sm text-red-300">
            Reason: {decodeURIComponent(reason)}
          </p>
        )}
        <div className="flex flex-col gap-4">
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/subscription">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}