import { Env } from './types';
import { handleRequest } from './router';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Security check: JWT_SECRET must be set
    if (!env.JWT_SECRET) {
      return new Response('Server configuration error: JWT_SECRET is not set', { status: 500 });
    }
    
    // Security check: warn if JWT_SECRET is too weak
    if (env.JWT_SECRET.length < 32) {
      console.warn('[SECURITY WARNING] JWT_SECRET should be at least 32 characters for adequate security');
    }
    
    return handleRequest(request, env);
  },
};
