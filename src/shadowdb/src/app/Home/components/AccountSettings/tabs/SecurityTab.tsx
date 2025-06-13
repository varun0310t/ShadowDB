import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserAccountService } from "@/client/lib/services/UserAccountService";
import { TabWrapper } from "../TabWrapper";
import axios from "axios";
export function SecurityTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!UserAccountService.validatePassword(formData.newPassword)) {
        console.log(formData.newPassword);
        throw new Error(
          "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
        );
      }

      if (
        !UserAccountService.passwordsMatch(
          formData.newPassword,
          formData.confirmPassword
        )
      ) {
        throw new Error("Passwords don't match");
      }

      const result = await UserAccountService.changePassword(formData);
      toast({
        title: "Success",
        description: result.message,
        variant: "default",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [formDataRole, setFormDataRole] = useState({
    currentPasswordRole: "",
    newPasswordRole: "",
    confirmPasswordRole: "",
  });
  const handleInputChangeRole = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataRole((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingRole(true);

    try {
      if (!UserAccountService.validatePassword(formDataRole.newPasswordRole)) {
        console.log(formDataRole.newPasswordRole);
        throw new Error(
          "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
        );
      }

      if (
        !UserAccountService.passwordsMatch(
          formDataRole.newPasswordRole,
          formDataRole.confirmPasswordRole
        )
      ) {
        throw new Error("Passwords don't match");
      }

      const resultaxios = await axios.patch(
        "/api/users/profile/Security/Role_password",
        formDataRole
      );
      const result = resultaxios.data;
      toast({
        title: "Success",
        description: result.message,
        variant: "default",
      });
      setFormDataRole({
        currentPasswordRole: "",
        newPasswordRole: "",
        confirmPasswordRole: "",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingRole(false);
    }
  };
  return (
    <div className="w-full max-w-none space-y-6">
      {/* Main Password Card */}
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl text-gray-200">Password</CardTitle>
          <CardDescription className="text-sm md:text-base">Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm md:text-base text-gray-200 font-medium">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                  placeholder="Enter your current password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm md:text-base text-gray-200 font-medium">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                  placeholder="Enter your new password"
                />
                <p className="text-xs md:text-sm text-gray-400">
                  Must be at least 8 characters with uppercase, lowercase, number and special character
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm md:text-base text-gray-200 font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Role Password Card */}
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl text-gray-200">Role Password</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Update your role password for database access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <form onSubmit={handleSubmitRole} className="space-y-4 md:space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPasswordRole" className="text-sm md:text-base text-gray-200 font-medium">
                  Current Role Password
                </Label>
                <Input
                  id="currentPasswordRole"
                  type="password"
                  value={formDataRole.currentPasswordRole}
                  onChange={handleInputChangeRole}
                  className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                  placeholder="Enter your current role password"
                />
                <p className="text-xs md:text-sm text-gray-400">
                  Initially your email is your role password. Please update if not already done.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPasswordRole" className="text-sm md:text-base text-gray-200 font-medium">
                  New Role Password
                </Label>
                <Input
                  id="newPasswordRole"
                  type="password"
                  value={formDataRole.newPasswordRole}
                  onChange={handleInputChangeRole}
                  className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                  placeholder="Enter your new role password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPasswordRole" className="text-sm md:text-base text-gray-200 font-medium">
                  Confirm New Role Password
                </Label>
                <Input
                  id="confirmPasswordRole"
                  type="password"
                  value={formDataRole.confirmPasswordRole}
                  onChange={handleInputChangeRole}
                  className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                  placeholder="Confirm your new role password"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800">
              <Button
                type="submit"
                disabled={isLoadingRole}
                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
              >
                {isLoadingRole ? "Updating..." : "Update Role Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
