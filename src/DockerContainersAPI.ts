import { DockerSocket } from "./DockerSocket.js";
import type { DockerContainer } from "./types/containers/DockerContainer.js";
import type { DockerContainerCreated } from "./types/containers/DockerContainerCreated.js";
import type { DockerContainerCreationBody } from "./types/containers/DockerContainerCreationBody.js";
import type { DockerContainerPrune } from "./types/containers/DockerContainerPrune.js";
import type { DockerContainerStats } from "./types/containers/DockerContainerStats.js";
import type { DockerContainerSummary } from "./types/containers/DockerContainerSummary.js";
import type { DockerContainerTop } from "./types/containers/DockerContainerTop.js";

export class DockerContainersAPI {
  constructor(private readonly dockerSocket: DockerSocket) {}

  async list(
    options: {
      all?: boolean;
      limit?: number;
      size?: boolean;
      filters?: Record<string, string[]>;
    } = { all: false, limit: 0, size: false, filters: {} },
  ): Promise<DockerContainerSummary[]> {
    const apiOptions = {
      all: (options.all ?? false).toString(),
      limit: (options.limit ?? 0).toString(),
      size: (options.size ?? false).toString(),
      filters: JSON.stringify(options.filters ?? {}),
    };

    return await this.dockerSocket.apiCall<DockerContainerSummary[]>(
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

  async create(
    body: Partial<DockerContainerCreationBody>,
    name?: string,
    platform?: string, // linux/arm64/v8, linux/amd64, ...
  ): Promise<DockerContainerCreated> {
    if (name !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_\.-]+$/.test(name)) {
      throw new Error("DockerContainerAPI: Invalid container name");
    }

    const apiOptions: Record<string, string> = {};
    if (name !== undefined) {
      apiOptions.name = name;
    }
    if (platform !== undefined) {
      apiOptions.platform = platform;
    }

    return await this.dockerSocket.apiCall<DockerContainerCreated>(
      "POST",
      "/containers/create",
      {
        body: JSON.stringify(body),
        query: apiOptions,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  async start(containerId: string, detachKeys?: string) {
    if (
      detachKeys !== undefined &&
      !/^(ctrl-[a-z@\^\[,_]|[a-z])$/.test(detachKeys)
    ) {
      throw new Error("DockerContainersAPI: Invalid detachKeys sequence");
    }

    const apiOptions: Record<string, string> = {};
    if (detachKeys !== undefined) {
      apiOptions.detachKeys = detachKeys;
    }

    await this.dockerSocket.apiCall<void>(
      "POST",
      `/containers/${containerId}/start`,
      {
        query: apiOptions,
      },
    );
  }

  async stop(
    containerId: string,
    signal: string = "SIGINT",
    timeout: number = 10,
  ) {
    const apiOptions: Record<string, string> = {};
    if (signal !== undefined) {
      apiOptions.signal = signal;
    }

    if (timeout !== undefined) {
      apiOptions.timeout = timeout.toString();
    }

    await this.dockerSocket.apiCall<void>(
      "POST",
      `/containers/${containerId}/stop`,
      {
        query: apiOptions,
      },
    );
  }

  async restart(
    containerId: string,
    signal: string = "SIGINT",
    timeout: number = 10,
  ) {
    const apiOptions: Record<string, string> = {};
    if (signal !== undefined) {
      apiOptions.signal = signal;
    }

    if (timeout !== undefined) {
      apiOptions.timeout = timeout.toString();
    }

    await this.dockerSocket.apiCall<void>(
      "POST",
      `/containers/${containerId}/restart`,
      {
        query: apiOptions,
      },
    );
  }

  async kill(containerId: string, signal: string = "SIGKILL") {
    const apiOptions: Record<string, string> = {};
    if (signal !== undefined) {
      apiOptions.signal = signal;
    }

    await this.dockerSocket.apiCall<void>(
      "POST",
      `/containers/${containerId}/kill`,
      {
        query: apiOptions,
      },
    );
  }

  async pause(containerId: string) {
    await this.dockerSocket.apiCall<void>(
      "POST",
      `/containers/${containerId}/pause`,
    );
  }

  async unpause(containerId: string) {
    await this.dockerSocket.apiCall<void>(
      "POST",
      `/containers/${containerId}/unpause`,
    );
  }

  async remove(containerId: string) {
    await this.dockerSocket.apiCall<void>(
      "DELETE",
      `/containers/${containerId}`,
    );
  }

  async prune(filters: Record<string, string[]> = {}) {
    return await this.dockerSocket.apiCall<DockerContainerPrune>(
      "POST",
      `/containers/prune`,
      {
        query: { filters: JSON.stringify(filters) },
      },
    );
  }
}
