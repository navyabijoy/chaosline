import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    chaosline: 'bin/chaosline.ts',
    'world-payments': '../world-payments/src/bin/mcp-server.ts',
    'world-fs': '../world-fs/src/bin/mcp-server.ts',
    'world-http': '../world-http/src/bin/mcp-server.ts',
    'world-db': '../world-db/src/bin/mcp-server.ts',
    'world-email': '../world-email/src/bin/mcp-server.ts',
    'world-search': '../world-search/src/bin/mcp-server.ts',
  },
  format: ['esm'],
  noExternal: [/@chaosline\/.*/],
  platform: 'node',
  dts: true,
  clean: true,
});
