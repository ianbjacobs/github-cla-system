const ACCEPTANCE = "I have read and agree to the Contributor License Agreement.";
const IDENTITY = "I am submitting this agreement for my own authenticated GitHub account.";
export function checked(body, label) {
  const expected = label.trim().replace(/\s+/g, " ").toLowerCase();
  return body.split(/\r?\n/).some((line) => {
    const match = line.trim().match(/^-\s*\[([xX ])\]\s*(.+)$/);
    return (
      match?.[1]?.toLowerCase() === "x" &&
      match[2]?.trim().replace(/\s+/g, " ").toLowerCase() === expected
    );
  });
}
export function acceptanceComplete(body) {
  return checked(body, ACCEPTANCE) && checked(body, IDENTITY);
}
