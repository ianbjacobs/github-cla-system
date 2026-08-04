const TITLE_PREFIX = "[Agreement] Acceptance";
const BRANCH_MARKER = " for branch: ";

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

export function agreementIssueTitle(targetBranch) {
  return `${TITLE_PREFIX}${BRANCH_MARKER}${nonEmptyString(targetBranch, "targetBranch")}`;
}

export function agreementTargetBranch(issueTitle, defaultBranch) {
  const fallback = nonEmptyString(defaultBranch, "defaultBranch");
  if (typeof issueTitle !== "string") return fallback;

  const title = issueTitle.trim();
  if (!title.startsWith(`${TITLE_PREFIX}${BRANCH_MARKER}`)) return fallback;

  const branch = title.slice(`${TITLE_PREFIX}${BRANCH_MARKER}`.length).trim();
  return branch === "" ? fallback : branch;
}
