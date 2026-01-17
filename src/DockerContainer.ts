import DockerSocket from "./DockerSocket";
import type { DockerContainerStats } from "./types/DockerContainerStats";
import type { DockerContainerSumary } from "./types/DockerContainerSummary";
import type { DockerContainerTop } from "./types/DockerContainerTop";

export default class DockerContainer {
  constructor(private readonly dockerSocket: DockerSocket) {}

  async list(
    options: {
      all?: boolean;
      limit?: number;
      size?: boolean;
      filters?: Record<string, string[]>;
    } = { all: false, limit: 0, size: false, filters: {} },
  ) {
    const apiOptions = {
      all: (options.all ?? false).toString(),
      limit: (options.limit ?? 0).toString(),
      size: (options.size ?? false).toString(),
      filters: JSON.stringify(options.filters ?? {}),
    };

    return await this.dockerSocket.apiCall<DockerContainerSumary>(
      "GET",
      "/containers/json",
      {
        query: apiOptions,
      },
    );
  }

  async get(containerId: string, size: boolean = false) {
    return await this.dockerSocket.apiCall<DockerContainer>(
      "GET",
      `/containers/${containerId}/json`,
      { query: { size: size.toString() } },
    );
  }

  async top(containerId: string, psArgs: string = "-ef") {
    return await this.dockerSocket.apiCall<DockerContainerTop>(
      "GET",
      `/containers/${containerId}/top`,
      { query: { psArgs: psArgs } },
    );
  }

  async logs(
    containerId: string,
    options: {
      follow?: boolean;
      stdout?: boolean;
      stderr?: boolean;
      since?: number;
      until?: number;
      timestamps?: boolean;
      tail?: number | "all";
    } = {
      follow: false,
      stdout: false,
      stderr: false,
      since: 0,
      until: 0,
      timestamps: false,
      tail: "all",
    },
  ) {
    const apiOptions: Record<string, string> = {
      follow: (options?.follow ?? false).toString(),
      stdout: (options?.stdout ?? false).toString(),
      stderr: (options?.stderr ?? false).toString(),
      since: (options?.since ?? 0).toString(),
      until: (options?.until ?? 0).toString(),
      timestamps: (options?.timestamps ?? false).toString(),
      tail: (options?.tail ?? "all").toString(),
    };

    return await this.dockerSocket.apiCall<string>(
      "GET",
      `/containers/${containerId}/logs`,
      {
        query: apiOptions,
      },
    );
  }

  async stats(
    containerId: string,
    options:
      | { stream: true; oneShot?: false }
      | {
          stream: false;
          oneShot?: boolean;
        } = {
      stream: true,
      oneShot: false,
    },
  ) {
    const apiOptions: Record<string, string> = {
      stream: (options.stream ?? true).toString(),
      "one-shot": (options.oneShot ?? false).toString(),
    };

    return await this.dockerSocket.apiCall<DockerContainerStats>(
      "GET",
      `/containers/${containerId}/stats`,
      {
        query: apiOptions,
      },
    );
  }
}
