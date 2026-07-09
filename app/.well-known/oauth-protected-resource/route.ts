import {
  protectedResourceHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from '@clerk/mcp-tools/next';

// RFC 9728 — tells Claude which OAuth authorization server (Clerk) protects the
// MCP endpoint. Must be publicly reachable (see proxy.ts) and its `resource`
// must match the MCP URL the user enters in Claude exactly.
const handler = protectedResourceHandlerClerk();
const options = metadataCorsOptionsRequestHandler();

export { handler as GET, options as OPTIONS };
