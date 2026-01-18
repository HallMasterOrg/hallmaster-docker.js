import http from "node:http";
import fs from "node:fs/promises";
import type { Stats } from "node:fs";
import type { DockerVersion } from "./types/DockerVersion.js";
import type { DockerInfo } from "./types/DockerInfo.js";
import type { DockerAuthToken } from "./types/DockerAuthToken.js";

declare interface HttpResponse {
  response: http.IncomingMessage;
  body: Buffer<ArrayBuffer>;
}

class DockerAPIHttpError {
  constructor(
    readonly status: number,
    readonly reason?: string,
  ) {}
}

export class DockerSocket {
  private dockerSocketPath: string;

  private dockerVersion: DockerVersion | null = null;

  private dockerAuthToken: string | null = null;

  constructor(
    unixSocketPath: string = "/var/run/docker.sock",
    private readonly apiBaseURL: string = "http://localhost",
  ) {
    this.dockerSocketPath = unixSocketPath;
  }

  async isReady(): Promise<boolean> {
    let stat: Stats;
    try {
      stat = await fs.lstat(this.dockerSocketPath);
    } catch {
      return false;
    }

    if (stat.isSymbolicLink()) {
      this.dockerSocketPath = await fs.readlink(this.dockerSocketPath);

      return await this.isReady();
    }

    return stat.isSocket();
  }

  private async request(
    method: Request["method"],
    path: string | URL,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView;
      query?: Record<string, string>;
    },
  ) {
    const url = new URL(path, this.apiBaseURL);
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        url.searchParams.set(k, v);
      }
    }

    const requestOptions: http.RequestOptions = {
      hostname: url.hostname,
      host: url.host,
      protocol: url.protocol,
      port: url.port,
      path: url.pathname + url.search.toString(),
      headers: options?.headers,
      method: method,
      socketPath: this.dockerSocketPath,
    };

    return new Promise<HttpResponse>((resolve, reject) => {
      const request = http.request(requestOptions, (response) => {
        if (null !== response.errored) {
          reject(
            new DockerAPIHttpError(
              response.statusCode ?? 999,
              response.errored.message,
            ),
          );
          return;
        }

        response.once("error", (err) =>
          reject(new DockerAPIHttpError(999, err.message)),
        );

        let bodyChunks: HttpResponse["body"][] = [];

        response.on("data", (data) => bodyChunks.push(data));

        response.once("end", () => {
          if (response.statusCode && response.statusCode >= 300) {
            const reason = Buffer.concat(bodyChunks).toString("utf-8");
            try {
              reject(
                new DockerAPIHttpError(
                  response.statusCode,
                  JSON.parse(reason)["message"],
                ),
              );
            } catch {
              reject(new DockerAPIHttpError(response.statusCode, reason));
            }
          }
          resolve({ response, body: Buffer.concat(bodyChunks) });
        });
      });

      request.once("error", reject);

      if (undefined !== options?.body) {
        const body =
          options.body instanceof Buffer
            ? options.body
            : Buffer.from(options.body.toString("utf-8"));

        const contentLength =
          options?.headers?.["Content-Length"] ??
          options?.headers?.["Transfer-Encoding"] ??
          null;

        if (null === contentLength) {
          request.setHeader("Content-Length", Buffer.byteLength(body));
        }

        request.write(body);
      }

      request.end();
    });
  }

  async init(): Promise<void> {
    const isSocketAvailable = await this.isReady();
    if (!isSocketAvailable) {
      throw new Error(
        `Cannot connect to the Docker daemon at unix://${this.dockerSocketPath}. Is the docker daemon running?`,
      );
    }

    const response = await this.request("GET", "/version");

    this.dockerVersion = JSON.parse(response.body.toString("utf-8"));
  }

  get version() {
    if (null === this.dockerVersion) {
      throw new Error("DockerSocket: Wrapper uninitialized");
    }
    return this.dockerVersion;
  }

  get token() {
    if (null === this.dockerAuthToken) {
      throw new Error("DockerSocket: Unauthorized");
    }
    return this.dockerAuthToken;
  }

  async apiCall<T>(
    method: Request["method"],
    urlPath: string,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView;
      query?: Record<string, string>;
    },
  ): Promise<T> {
    const { ApiVersion } = this.version;

    const response = await this.request(
      method,
      `/v${ApiVersion}/${urlPath.replace(/^\//, "")}`,
      options,
    );

    const responseBody = response.body.toString("utf-8");

    try {
      return JSON.parse(responseBody);
    } catch {
      return responseBody as T;
    }
  }

  async authenticate(
    serverAddress: string,
    username: string,
    password: string,
  ): Promise<void> {
    const tokenPayload = JSON.stringify({ serverAddress, username, password });

    const response = await this.apiCall<DockerAuthToken>("POST", "/auth", {
      headers: {
        "Content-Type": "application/json",
      },
      body: tokenPayload,
    });

    if (response.Status !== "Login Succeeded") {
      throw new Error("DockerSocket: Invalid credentials");
    }

    this.dockerAuthToken = Buffer.from(tokenPayload, "utf-8").toString(
      "base64",
    );
  }

  async info(): Promise<DockerInfo> {
    return await this.apiCall<DockerInfo>("GET", "/info");
  }
}
