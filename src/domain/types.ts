export interface RepositoryRef {
  owner: string;
  repo: string;
}

export interface Contributor {
  id: number;
  nodeId: string;
  login: string;
}

export interface AgreementEntry {
  githubId: number;
  githubNodeId: string;
  githubLogin: string;
  agreementVersion: string;
  agreementPath: string;
  agreementCommit: string;
  signedAt: string;
  repository: string;
  issueNumber: number;
  issueNodeId: string;
  recordPath: string;
}

export interface AgreementRegistry {
  schemaVersion: 1;
  agreements: AgreementEntry[];
}

export interface ClaConfig {
  agreementVersion: string;
  agreementTemplatePath: string;
  agreementRegistryPath: string;
  agreementRecordsDirectory: string;
  statusCheckName: string;
  labels: { agreement: string; pending: string };
}
