// src/services/authService.ts
import axios from "axios";

export const signUpEmail = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await axios.post("/api/auth/signup", data);
  return response.data;
};

export const loginEmail = async (data: { email: string; password: string }) => {
  const response = await axios.post("/api/auth/signin", data);
  return response.data;
};
