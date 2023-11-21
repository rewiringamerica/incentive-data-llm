export interface Metadata {
  // We allow arbitrary metadata fields, plus the specific ones
  // recognized below.
  [index: string]: string | string[] | undefined;

  "folder"?: string;
  "tags"?: string[];
}
