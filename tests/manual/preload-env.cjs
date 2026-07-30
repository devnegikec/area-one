// Preload: loads .env.local before any TypeScript module
// Used with: npx tsx --require ./tests/manual/preload-env.cjs tests/manual/test-extraction.ts
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env.local"), override: true });
