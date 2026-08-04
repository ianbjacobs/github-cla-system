export const CONTRIBUTOR_AGREEMENT_COMMENT_MARKER =
  "<!-- github-cla-system:contributor-agreement -->";

export function contributorAgreementCommentBody({ login, signingUrl }) {
  if (typeof login !== "string" || login.trim() === "") {
    throw new TypeError("login must be a non-empty string.");
  }
  if (typeof signingUrl !== "string" || !/^https:\/\//u.test(signingUrl)) {
    throw new TypeError("signingUrl must be an HTTPS URL.");
  }

  return `${CONTRIBUTOR_AGREEMENT_COMMENT_MARKER}
## Contributor Agreement required

@${login}, this pull request cannot be merged until you sign the Contributor Agreement.

[**Sign the Contributor Agreement**](${signingUrl})

After the generated agreement pull request is reviewed and merged, the \`Contributor Agreement\` check will be refreshed automatically.`;
}

export async function synchronizeContributorAgreementComment({
  state,
  login,
  signingUrl,
  listComments,
  createComment,
  updateComment,
  deleteComment,
}) {
  if (state !== "success" && state !== "failure") {
    throw new TypeError('state must be either "success" or "failure".');
  }

  const comments = await listComments();
  const managedComments = comments.filter(
    (comment) =>
      typeof comment?.body === "string" &&
      comment.body.includes(CONTRIBUTOR_AGREEMENT_COMMENT_MARKER),
  );

  if (state === "success") {
    await Promise.all(managedComments.map((comment) => deleteComment(comment.id)));
    return { action: managedComments.length === 0 ? "none" : "deleted" };
  }

  const body = contributorAgreementCommentBody({ login, signingUrl });
  const [primary, ...duplicates] = managedComments;

  await Promise.all(duplicates.map((comment) => deleteComment(comment.id)));

  if (!primary) {
    await createComment(body);
    return { action: "created" };
  }

  if (primary.body !== body) {
    await updateComment(primary.id, body);
    return { action: "updated" };
  }

  return { action: duplicates.length === 0 ? "none" : "deduplicated" };
}
