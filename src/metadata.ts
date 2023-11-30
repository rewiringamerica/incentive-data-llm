export interface Metadata {
  // We allow arbitrary metadata fields, plus the specific ones
  // recognized below.
  [index: string]: string | string[] | number | undefined;

  "folder"?: string;
  "tags"?: string[];
  "Data URL"?: string;
}
