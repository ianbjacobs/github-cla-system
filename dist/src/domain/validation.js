export function normalizeLogin(value) {
  const login = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/.test(login)) {
    throw new Error(`Invalid GitHub login: ${value}`);
  }
  return login;
}
export function positiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${field} must be a positive integer.`);
  return value;
}
export function repositoryName(owner, repo) {
  const value = `${owner}/${repo}`;
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(value)) throw new Error(`Invalid repository: ${value}`);
  return value;
}
export function safePath(value) {
  const path = value.trim().replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+/g, "/");
  if (!path || path.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`Unsafe repository path: ${value}`);
  }
  return path;
}
