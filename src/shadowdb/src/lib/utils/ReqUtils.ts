import { NextRequest } from "next/server";

export async function parseFormData(req: NextRequest) {
  const formData = await req.formData();
  const data: Record<string, any> = {};

  // Process all form fields
  for (const [key, value] of formData.entries()) {
    // Check if it's a file-like object without using instanceof File
    if (value && 
        typeof value === 'object' && 
        'name' in value && 
        'type' in value && 
        'arrayBuffer' in value &&
        typeof (value as any).arrayBuffer === 'function') {
      // It's a file-like object
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