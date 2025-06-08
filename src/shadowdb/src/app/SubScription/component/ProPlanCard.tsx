import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, Shield, Zap, HeadphonesIcon, HardDrive, Settings, Check, Sparkles } from 'lucide-react';
import axios from "axios";

interface ProPlanProps {
  isSubscribed?: boolean;
}

export function ProPlanCard({ isSubscribed = false }: ProPlanProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();

  const planDetails = {
    monthly: {
      price: 999,
      label: "₹999",
      period: "month",
    },
    yearly: {
      price: 9990,
      label: "₹9,990",
      period: "year",
      monthlyEquivalent: "₹832.50",
    },
  };

  const features = [
    { icon: <Database className="h-4 w-4" />, title: "Multiple databases" },
    { icon: <HardDrive className="h-4 w-4" />, title: "Extended storage" },
    { icon: <Zap className="h-4 w-4" />, title: " monitoring" },
    { icon: <HeadphonesIcon className="h-4 w-4" />, title: "Priority support" },
    { icon: <Shield className="h-4 w-4" />, title: "Automatic backups" },
    { icon: <Sparkles className="h-4 w-4" />, title: "Future Exclusive features" },
  
  ];

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/subsscription/create", {
        duration: selectedDuration,
        amount: planDetails[selectedDuration].price,
      });

      if (response.data.redirectUrl) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.data.redirectUrl;
        
        for (const key in response.data.formData) {
          if (response.data.formData.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = response.data.formData[key];
            form.appendChild(hiddenField);
          }
        }
        
        document.body.appendChild(form);
        form.submit();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment process. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <Card className="bg-[#151923] border-gray-800 relative  group hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
        {/* Gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-75 blur-sm"></div>
        <div className="absolute inset-[1px] bg-[#151923] rounded-lg"></div>
        
        {/* Popular badge */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>

        <div className="relative z-10">
          <CardHeader className="text-center pt-6 pb-3">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-3">
              <Database className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              ShadowDB Pro
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Enhanced features for developers
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6">
            {/* Duration Toggle */}
            <div className="bg-[#0B0F17] p-1 rounded-lg flex relative">
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 relative z-10 text-xs ${
                  selectedDuration === "monthly" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setSelectedDuration("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 relative z-10 text-xs ${
                  selectedDuration === "yearly" ? "text-white" : "text-gray-400"
                }`}
                onClick={() => setSelectedDuration("yearly")}
              >
                Yearly
                <Badge className="ml-1 bg-green-600 text-xs px-1">20%</Badge>
              </Button>
              
              <div 
                className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md transition-transform duration-200 ${
                  selectedDuration === "yearly" ? "translate-x-full" : "translate-x-0"
                }`}
              />
            </div>

            {/* Pricing */}
            <div className="text-center py-2">
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-3xl font-bold text-white">
                  {planDetails[selectedDuration].label}
                </span>
                <span className="text-gray-400 text-sm">/{planDetails[selectedDuration].period}</span>
              </div>
              
              {selectedDuration === "yearly" && (
                <div className="mt-1">
                  <span className="text-green-400 text-xs">
                    {planDetails.yearly.monthlyEquivalent}/month • Save ₹1,998
                  </span>
                </div>
              )}
            </div>

            {/* Features - Compact Grid */}
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-6 h-6 bg-purple-600/20 rounded flex items-center justify-center flex-shrink-0">
                    <div className="text-purple-400">
                      {feature.icon}
                    </div>
                  </div>
                  <span className="text-gray-300 text-xs leading-tight">{feature.title}</span>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center space-x-3 text-xs text-gray-400 py-2">
              <div className="flex items-center">
                <Shield className="h-3 w-3 text-green-500 mr-1" />
                Secure
              </div>
              <div className="w-px h-3 bg-gray-700"></div>
              <div className="flex items-center">
                <Zap className="h-3 w-3 text-blue-500 mr-1" />
                Instant
              </div>
              <div className="w-px h-3 bg-gray-700"></div>
              <div>30-day refund</div>
            </div>
          </CardContent>

          <CardFooter className="px-6 pb-6 pt-2">
            {isSubscribed ? (
              <Button 
                className="w-full bg-gray-700 hover:bg-gray-600 cursor-not-allowed" 
                disabled
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Subscribed
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                onClick={handleSubscribe}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </div>
                )}
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}