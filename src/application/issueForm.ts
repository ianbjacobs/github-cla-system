const ACCEPTANCE = "I have read and agree to the Contributor License Agreement.";
const IDENTITY = "I am submitting this agreement for my own authenticated GitHub account.";

export function checked(body: string, label: string): boolean {
  const expected = label.trim().replace(/\s+/g, " ").toLowerCase();
  return body.split(/\r?\n/).some((line) => {
    const match = line.trim().match(/^-\s*\[([xX ])\]\s*(.+)$/);
    return (
      match?.[1]?.toLowerCase() === "x" &&
      match[2]?.trim().replace(/\s+/g, " ").toLowerCase() === expected
    );
  });
}

export function acceptanceComplete(body: string): boolean {
  return checked(body, ACCEPTANCE) && checked(body, IDENTITY);
}

export function contributionPrNumber(body: string): number | null {
  const lines = body.split(/\r?\n/);
  const index = lines.findIndex(
    (line) => line.trim().toLowerCase() === "### contribution pull request number",
  );
  if (index < 0) return null;
  for (const line of lines.slice(index + 1)) {
    const value = line.trim();
    if (value.startsWith("### ")) break;
    if (value && value !== "_No response_") {
      const match = value.match(/(?:\/pull\/|#)?(\d+)/);
      return match ? Number(match[1]) : null;
    }
  }
  return null;
}
