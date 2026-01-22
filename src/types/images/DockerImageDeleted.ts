export type DockerImageDeleted =
  | {
      Untagged: string;
    }
  | { Deleted: string };
