import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { verifyClerkToken } from '@clerk/mcp-tools/next';
import { auth } from '@clerk/nextjs/server';
import { registerMcpTools } from '@/lib/mcp/register-tools';

// Admin MCP server. Exposes course / event / member / sponsorship management
// tools so a platform admin can manage Fairway Founders from the Claude app.
// Auth: OAuth (Clerk) proves identity; each tool re-checks super_admin.
const handler = createMcpHandler((server) => {
  registerMcpTools(server);
});

const authHandler = withMcpAuth(
  handler,
  async (_req, token) => {
    // Accept a Clerk-issued OAuth access token presented as a Bearer token.
    const clerkAuth = await auth({ acceptsToken: 'oauth_token' });
    return verifyClerkToken(clerkAuth, token);
  },
  {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
  },
);

export { authHandler as GET, authHandler as POST };
