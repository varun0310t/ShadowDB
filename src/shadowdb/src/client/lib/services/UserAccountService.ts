import axios from 'axios';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordResetRequestData {
  email: string;
}

interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export class UserAccountService {
  private static readonly BASE_URL = '/api/users/profile/Security';

  /**
   * Change password for logged in user
   */
  static async changePassword(data: PasswordChangeData): Promise<{ message: string }> {
    try {
      const response = await axios.patch(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to change password');
    }
  }

  /**
   * Request password reset email
   */
  static async requestPasswordReset(data: PasswordResetRequestData): Promise<{ message: string }> {
    try {
      const response = await axios.post(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to request password reset');
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(data: PasswordResetData): Promise<{ message: string }> {
    try {
      const response = await axios.put(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to reset password');
    }
  }

  /**
   * Validate password complexity
   */
  static validatePassword(password: string): boolean {
    const passwordRegex = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    return passwordRegex.test(password);
  }

  /**
   * Check if passwords match
   */
  static passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}