import type { Readable } from "node:stream";
import type { DockerSocket } from "./DockerSocket.js";
import type { DockerImageSummary } from "./types/images/DockerImageSummary.js";
import type { DockerRegistryCredential } from "./types/auth/DockerRegistryCredential.js";
import type { DockerImageDeleted } from "./types/images/DockerImageDeleted.js";

export class DockerImagesAPI {
  constructor(private readonly dockerSocket: DockerSocket) {}

  async list(
    options: {
      all?: boolean;
      filters?: Record<string, string[]>;
      sharedSize?: boolean;
      digests?: boolean;
      manifests?: boolean;
    } = {
      all: false,
      filters: {},
      sharedSize: false,
      digests: false,
      manifests: false,
    },
  ): Promise<DockerImageSummary[]> {
    const apiOptions: Record<string, string> = {
      all: (options.all ?? false).toString(),
      filters: JSON.stringify(options.filters ?? {}),
      "shared-size": (options.sharedSize ?? false).toString(),
      digests: (options.digests ?? false).toString(),
      manifests: (options.manifests ?? false).toString(),
    };

    return await this.dockerSocket.apiCall<DockerImageSummary[]>(
      "GET",
      "/images/json",
      {
        query: apiOptions,
      },
    );
  }

  async build(
    inputStream: Readable, // tar blob
    registriesCredentials: DockerRegistryCredential[] = [],
    options: {
      dockerfile?: string;
      tag?: string;
      extraHosts?: string;
      remote?: string;
      quiet?: boolean;
      noCache?: boolean;
      cacheFrom?: string;
      pull?: string;
      rm?: boolean;
      forceRm?: boolean;
      memory?: number;
      memSwap?: number;
      cpuShares?: number;
      cpuSetCpus?: string;
      cpuPeriod?: number;
      cpuQuota?: number;
      buildArgs?: Record<string, string>;
      shmSize?: number;
      squash?: boolean;
      labels?: Record<string, string>;
      networkMode?: "bridge" | "host" | "none" | string; //container:<name|id>
      platform?: string; //linux/arm/v8, ...
      target?: string;
      buildKitOutputs?: string;
      buildKitVersion?: 1 | 2;
    } = {
      dockerfile: "Dockerfile",
      tag: undefined,
      extraHosts: undefined,
      remote: undefined,
      quiet: false,
      noCache: false,
      cacheFrom: undefined,
      pull: undefined,
      rm: true,
      forceRm: false,
      memory: undefined,
      memSwap: undefined,
      cpuShares: undefined,
      cpuSetCpus: undefined,
      cpuPeriod: undefined,
      cpuQuota: undefined,
      buildArgs: undefined,
      shmSize: undefined,
      squash: undefined,
      labels: undefined,
      networkMode: undefined,
      platform: undefined,
      target: undefined,
      buildKitOutputs: undefined,
      buildKitVersion: 1,
    },
  ) {
    const apiOptions: Record<string, string | undefined> = {
      dockerfile: options.dockerfile ?? "Dockerfile",
      t: options.tag,
      extrahosts: options.extraHosts,
      remote: options.remote,
      q: (options.quiet ?? false).toString(),
      nocache: (options.noCache ?? false).toString(),
      cachefrom: options.cacheFrom,
      pull: options.pull,
      rm: (options.rm ?? true).toString(),
      forcerm: (options.forceRm ?? false).toString(),
      memory: options.memory?.toString(),
      memswap: options.memSwap?.toString(),
      cpushares: options.cpuShares?.toString(),
      cpusetcpus: options.cpuSetCpus,
      cpuperiod: options.cpuPeriod?.toString(),
      cpuquota: options.cpuQuota?.toString(),
      buildargs: options.buildArgs
        ? JSON.stringify(options.buildArgs)
        : undefined,
      shmsize: options.shmSize?.toString(),
      squash: options.squash?.toString(),
      labels: options.labels ? JSON.stringify(options.labels) : undefined,
      networkmode: options.networkMode,
      platform: options.platform,
      target: options.target,
      outputs: options.buildKitOutputs,
      version: (options.buildKitVersion ?? 1).toString(),
    };

    const registryConfig: Record<
      string,
      Pick<DockerRegistryCredential, "username" | "password">
    > = registriesCredentials.reduce(
      (acc, cur) => ({
        ...acc,
        [cur.serveraddress]: { username: cur.username, password: cur.password },
      }),
      {},
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/x-tar",
    };
    if (Object.keys(registryConfig).length > 0) {
      const rawRegistryConfig = Buffer.from(
        JSON.stringify(registryConfig),
      ).toString("base64");
      headers["X-Registry-Config"] = rawRegistryConfig;
    }

    await this.dockerSocket.apiCall<void>("POST", "/build", {
      query: apiOptions,
      body: inputStream,
      headers: headers,
    });
  }

  async remove(
    imageNameOrId: string,
    options: {
      force?: boolean;
      noPrune?: boolean;
      platforms?: string[];
    } = {
      force: false,
      noPrune: false,
      platforms: undefined,
    },
  ) {
    const apiOptions: Record<string, string | undefined> = {
      force: (options.force ?? false).toString(),
      noprune: (options.noPrune ?? false).toString(),
      platforms: options.platforms
        ? JSON.stringify(options.platforms)
        : undefined,
    };

    return await this.dockerSocket.apiCall<DockerImageDeleted[]>(
      "DELETE",
      `/images/${imageNameOrId}`,
      {
        query: apiOptions,
      },
    );
  }

  async push(
    imageName: string, // registry.example.com/myimage, don't provide a tag here
    options: {
      tag: string;
      platform?:
        | {
            os: string; // linux
          }
        | {
            os: string; // linux
            architecture: string; // arm
          }
        | {
            os: string; // linux
            architecture: string; // arm
            variant: string; // v8
          };
      auth?:
        | { identitytoken: string } // DockerSocket.authenticate()
        | DockerRegistryCredential;
    } = {
      tag: "latest",
      platform: undefined,
      auth: undefined,
    },
  ) {
    const apiOptions: Record<string, string | undefined> = {
      tag: options.tag ?? "latest",
      platform: options.platform ? JSON.stringify(options.platform) : undefined,
    };

    const token = Buffer.from(JSON.stringify(options.auth ?? {})).toString(
      "base64url",
    );

    await this.dockerSocket.apiCall<string>(
      "POST",
      `/images/${imageName}/push`,
      {
        query: apiOptions,
        headers: {
          "X-Registry-Auth": token,
        },
      },
    );
  }

  async tag(
    imageNameOrId: string,
    options: {
      repo: string; // someuser/someimage
      tag?: string;
    },
  ) {
    const apiOptions: Record<string, string | undefined> = {
      repo: options.repo ?? "",
      tag: options.tag ?? "latest",
    };

    await this.dockerSocket.apiCall<void>(
      "POST",
      `/images/${imageNameOrId}/tag`,
      {
        query: apiOptions,
      },
    );
  }

  async create(options: {
    fromImage?: string;
    fromSrc?: "-" | string;
    repo?: string;
    tag?: string;
    message?: string;
    changes?: string[]; // 'ENV DEBUG=true', ...
    platform?: string;
    inputImage?: string | Readable;
    auth?:
      | { identitytoken: string } // DockerSocket.authenticate()
      | DockerRegistryCredential;
  }) {
    const apiOptions: Record<string, string | string[] | undefined> = {
      fromImage: options.fromImage,
      fromSrc: options.fromSrc,
      repo: options.repo,
      tag: options.tag,
      message: options.message,
      changes: options.changes?.map(encodeURIComponent),
      platform: options.platform,
    };

    const headers: Record<string, string> = {};
    if (options.auth) {
      headers["X-Registry-Auth"] = Buffer.from(
        JSON.stringify(options.auth),
      ).toString("base64url");
    }

    if (options.inputImage) {
      headers["Content-Type"] =
        typeof options.inputImage === "string"
          ? "text/plain"
          : "application/octet-stream";
    }

    await this.dockerSocket.apiCall<void>("POST", "/images/create", {
      headers,
      body: options.inputImage,
      query: apiOptions,
    });
  }
}
