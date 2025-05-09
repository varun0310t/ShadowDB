import { NextRequest } from "next/server";
export async function parseFormData(req: NextRequest) {
  const formData = await req.formData();
  const data: Record<string, any> = {};

  // Process all form fields
  for (const [key, value] of formData.entries()) {
    // If it's a file, handle it separately
    if (value instanceof File) {
      data[key] = value;
    } else {
      // Parse JSON strings for object fields
      try {
        data[key] = JSON.parse(value.toString());
      } catch {
        data[key] = value.toString();
      }
    }
  }

  return data;
}
