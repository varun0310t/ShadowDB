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
      price: 999, // ₹999 in paise
      label: "₹999/month",
    },
    yearly: {
      price: 9990, // ₹9,990 in paise (save 2 months)
      label: "₹9,990/year",
    },
  };

  const features = [
    "Multiple database instances",
    "Extended storage",
    "Advanced monitoring",
    "Priority support",
    "Automatic backups",
    "Custom deployments",
  ];

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Initiate PayU payment process
      const response = await axios.post("/api/subsscription/create", {
        duration: selectedDuration,
        amount: planDetails[selectedDuration].price,
      });

      if (response.data.redirectUrl) {
        // Create a form to submit to PayU
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.data.redirectUrl;
        
        // Add form fields for PayU
        for (const key in response.data.formData) {
          if (response.data.formData.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = response.data.formData[key];
            form.appendChild(hiddenField);
          }
        }
        
        // Add form to body and submit
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
    <Card className="bg-[#151923] border-gray-800 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
      <CardHeader>
        <CardTitle className="text-gray-200 flex items-center justify-between">
          <span>ShadowDB Pro</span>
          <Badge className="bg-purple-600">Recommended</Badge>
        </CardTitle>
        <CardDescription>Enhanced features for serious users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#0B0F17] p-1 rounded-lg flex mb-4">
          <Button
            variant={selectedDuration === "monthly" ? "default" : "ghost"}
            className={selectedDuration === "monthly" ? "bg-purple-600" : "text-gray-400"}
            onClick={() => setSelectedDuration("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={selectedDuration === "yearly" ? "default" : "ghost"}
            className={selectedDuration === "yearly" ? "bg-purple-600" : "text-gray-400"}
            onClick={() => setSelectedDuration("yearly")}
          >
            Yearly <Badge className="ml-2 bg-green-600">Save 20%</Badge>
          </Button>
        </div>

        <div className="text-center">
          <span className="text-4xl font-bold text-gray-100">
            {planDetails[selectedDuration].label}
          </span>
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isSubscribed ? (
          <Button 
            className="w-full bg-gray-700 hover:bg-gray-600 cursor-not-allowed" 
            disabled
          >
            Currently Subscribed
          </Button>
        ) : (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Subscribe Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}