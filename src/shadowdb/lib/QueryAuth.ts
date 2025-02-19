//// filepath: /B:/git repos B/ShadowDB/src/shadowdb/lib/queryAuth.ts
import jwt,{Secret,SignOptions} from "jsonwebtoken";

const SECRET:Secret = process.env.QUERY_SECRET || "your-very-secret-string";

/**
 * Generates a token that encodes session information.
 *
 * @param payload - Information to encode (e.g. userId)
 * @param expiresIn - Expiration time (optional; default: 1 hour)
 * @returns A JWT
 */
export function generateQueryToken(
  payload: object,
  expiresIn: string = "30d"
): string {
    const options: SignOptions = {expiresIn: expiresIn as any};
  return jwt.sign(payload, SECRET,  options);
}

/**
 * Verifies the token and returns the decoded payload if valid.
 *
 * @param token - The JWT to verify.
 * @returns The decoded payload.
 * @throws an error if token is invalid or expired.
 */
export function verifyQueryToken(token: string): any {
  return jwt.verify(token, SECRET);
}