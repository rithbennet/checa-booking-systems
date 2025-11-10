# API Security Guide

This document outlines the security measures implemented for API routes in the ChECA Lab Service Portal.

## Security Features

### 1. Authentication
- All API routes require authentication via Better Auth
- Users must have a valid session cookie
- Session validation happens on every request

### 2. Authorization
- Users must have `active` status to access protected endpoints
- Pending, inactive, or rejected users are blocked
- Role-based access control can be extended as needed

### 3. Rate Limiting
- **Default**: 100 requests per minute per IP address
- Prevents DDoS attacks and abuse
- Returns HTTP 429 (Too Many Requests) when exceeded
- Includes standard rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: When the limit resets
  - `Retry-After`: Seconds to wait before retrying

### 4. Input Validation
- Query parameters are validated and sanitized
- Type checking prevents injection attacks
- Invalid inputs return HTTP 400 (Bad Request)

### 5. Error Handling
- Errors are logged server-side
- Generic error messages returned to clients (prevents info leakage)
- Proper HTTP status codes used

## Usage

### Basic Protected Route

```typescript
import { withAuth } from "@/shared/server/api-middleware";

export const GET = withAuth(
  async (request, auth) => {
    // auth.user contains user info
    // auth.session contains session info
    
    return NextResponse.json({ data: "protected data" });
  },
  {
    requireActive: true, // Require active user status
    rateLimit: {
      maxRequests: 100, // 100 requests
      windowMs: 60000, // per minute
    },
  }
);
```

### Custom Rate Limits

```typescript
export const POST = withAuth(
  async (request, auth) => {
    // Handler logic
  },
  {
    requireActive: true,
    rateLimit: {
      maxRequests: 10, // Stricter limit for write operations
      windowMs: 60000, // per minute
    },
  }
);
```

### Public Routes (No Auth)

For routes that don't require authentication, don't use `withAuth`:

```typescript
export async function GET(request: Request) {
  // Public endpoint logic
  return NextResponse.json({ data: "public data" });
}
```

## Production Considerations

### Rate Limiting
The current implementation uses in-memory rate limiting. For production:

1. **Use Redis** for distributed rate limiting across multiple servers
2. **Use a service** like Upstash Redis or Cloudflare Rate Limiting
3. **Implement per-user rate limiting** instead of just IP-based

### Additional Security Measures

1. **CORS**: Configure CORS headers if needed for cross-origin requests
2. **CSRF Protection**: Better Auth handles this, but verify for custom endpoints
3. **Request Size Limits**: Add middleware to limit request body size
4. **IP Allowlisting**: For admin endpoints, consider IP allowlisting
5. **API Keys**: For programmatic access, implement API key authentication
6. **Monitoring**: Set up logging and monitoring for suspicious activity
7. **WAF**: Use a Web Application Firewall (e.g., Cloudflare) for additional protection

### Example: Redis Rate Limiting

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

async function rateLimitRedis(
  identifier: string,
  maxRequests: number,
  windowMs: number
) {
  const key = `rate_limit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  
  return current <= maxRequests;
}
```

## Testing Security

1. **Test unauthenticated access**: Should return 401
2. **Test inactive users**: Should return 403
3. **Test rate limiting**: Make 101 requests quickly, should get 429
4. **Test input validation**: Send invalid parameters, should get 400
5. **Test SQL injection**: Try SQL in query params (should be sanitized)

## Security Headers

Consider adding security headers via Next.js middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  return response;
}
```

