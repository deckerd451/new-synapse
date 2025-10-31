// Browser-safe shim for node-fetch used by Supabase in ESM builds

export const fetch = (...args) => window.fetch(...args);
export const Headers = window.Headers;
export const Request = window.Request;
export const Response = window.Response;

export default fetch;
