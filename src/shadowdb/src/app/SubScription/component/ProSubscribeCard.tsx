import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { CheckCircle2, Rocket,Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProCardProps {
  variant?: "full" | "compact";
  className?: string;
  onSubscribe?: () => void;
  isSubscribed?: boolean;
}

export function ProSubscribeCard({ 
  variant = "full", 
  className = "", 
  onSubscribe,
  isSubscribed = false 
}: ProCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      router.push("/subscription");
    }
  };

  // Features to display
  const features = [
    "Multiple database instances",
    "Extended storage capacity",
    "Advanced monitoring tools",
    "Priority support queue",
    "Automated daily backups"
  ];

  // Compact mode only shows limited features
  const displayFeatures = variant === "compact" ? features.slice(0, 3) : features;

  return (
    <div className={`bg-gradient-to-br from-[#1A1E2A] to-[#10131C] border border-[#2A2F42] rounded-xl overflow-hidden shadow-lg ${className}`}>
      {/* Animated gradient accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-[length:200%_auto] animate-gradient" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-lg text-gray-100">ShadowDB Pro</h3>
          </div>
          <Badge className="bg-purple-600 hover:bg-purple-700">
            {variant === "compact" ? "Pro" : "Recommended"}
          </Badge>
        </div>
        
        {/* Price */}
        <div className="mb-4 flex items-baseline">
          <span className="text-3xl font-bold text-white">₹999</span>
          <span className="text-gray-400 ml-1">/month</span>
          {variant !== "compact" && (
            <span className="ml-2 text-sm text-green-400">Save 20% yearly</span>
          )}
        </div>
        
        {/* Description */}
        {variant !== "compact" && (
          <p className="text-gray-400 mb-4 text-sm">
            Unlock premium features and boost your database performance with our Pro plan.
          </p>
        )}
        
        {/* Features list */}
        <ul className="space-y-2 mb-5">
          {displayFeatures.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* CTA button */}
        {isSubscribed ? (
          <div className="bg-gray-700/30 text-gray-300 py-2 px-4 rounded-md text-center text-sm">
            <CheckCircle2 className="h-4 w-4 inline-block mr-1" />
            Currently Subscribed
          </div>
        ) : (
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            {variant === "compact" ? "Upgrade Now" : "Upgrade to Pro"}
          </Button>
        )}
        
        {/* Extra incentive for full variant */}
        {variant !== "compact" && !isSubscribed && (
          <p className="text-center text-xs text-gray-500 mt-3">
            30-day money-back guarantee. No questions asked.
          </p>
        )}
      </div>
    </div>
  );
}