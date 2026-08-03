export interface RepositoryRef {
  owner: string;
  repo: string;
}

export interface Contributor {
  id: number;
  login: string;
}

export interface AgreementEntry {
  githubId: number;
  githubLogin: string;
  agreementVersion: string;
  signedAt: string;
  repository: string;
  issueNumber: number;
  issueNodeId: string;
  contributionPullRequestNumber: number;
}

export interface AgreementRegistry {
  schemaVersion: 1;
  agreements: AgreementEntry[];
}

export interface ClaConfig {
  agreementVersion: string;
  agreementTemplatePath: string;
  agreementRegistryPath: string;
  statusCheckName: string;
  labels: { agreement: string; pending: string };
}
