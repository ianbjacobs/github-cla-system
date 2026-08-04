import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
export class GitHubAuth {
  env;
  constructor(env) {
    this.env = env;
  }
  async installationClient(installationId) {
    const auth = createAppAuth({
      appId: this.env.APP_ID,
      privateKey: this.env.privateKey,
      installationId,
    });
    const token = await auth({ type: "installation" });
    return new Octokit({ auth: token.token, baseUrl: this.env.GITHUB_API_URL });
  }
}
