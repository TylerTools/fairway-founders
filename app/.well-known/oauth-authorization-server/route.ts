import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from '@clerk/mcp-tools/next';

// RFC 8414 — proxies Clerk's authorization-server metadata at this app's origin,
// so MCP clients that look for it here (rather than at the Clerk issuer) can
// still discover the /authorize + /token endpoints and DCR support.
const handler = authServerMetadataHandlerClerk();
const options = metadataCorsOptionsRequestHandler();

export { handler as GET, options as OPTIONS };
