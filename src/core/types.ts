export type FindingLevel = "error" | "warning" | "info" | "ok";

export interface DoctorFinding {
  readonly code: string;
  readonly level: FindingLevel;
  readonly message: string;
  readonly detail?: string;
  readonly path?: string;
  readonly uri?: string;
}

export interface ParsedJsonDocument {
  readonly exists: boolean;
  readonly isValid: boolean;
  readonly rawText?: string;
  readonly value?: unknown;
  readonly parseErrors: ReadonlyArray<{
    readonly error: string;
    readonly offset: number;
    readonly length: number;
  }>;
}

export interface WorkspaceFiles {
  readonly configUri: string | null;
  readonly pluginManifestUris: readonly string[];
  readonly packageJsonUri: string | null;
  readonly agentsUri: string | null;
}

export interface WorkspaceSummary {
  readonly workspaceName: string;
  readonly workspaceFolderUri: string | null;
  readonly files: WorkspaceFiles;
  readonly nodeVersion: string;
  readonly cliBinary: string;
  readonly cliAvailable: boolean;
  readonly findings: readonly DoctorFinding[];
}
