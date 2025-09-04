/**
 * Resolves the path to an asset and returns the result.
 * @param path Asset path.
 * @returns Resolved path.
 */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
