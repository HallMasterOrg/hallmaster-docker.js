import http from "node:http";
import type { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path/posix";
import type { DockerVersion } from "./types/DockerVersion";
import type { DockerInfo } from "./types/DockerInfo";
import type { DockerAuthToken } from "./types/DockerAuthToken";

declare interface HttpResponse {
  response: http.IncomingMessage;
  body: Buffer<ArrayBuffer>;
}

export default class DockerSocket {
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
    },
  ) {
    const url = new URL(path, this.apiBaseURL);

    const requestOptions: http.RequestOptions = {
      hostname: url.hostname,
      host: url.host,
      protocol: url.protocol,
      port: url.port,
      path: url.pathname,
      headers: options?.headers,
      method: method,
      socketPath: this.dockerSocketPath,
    };

    return new Promise<HttpResponse>((resolve, reject) => {
      const request = http.request(requestOptions, (response) => {
        if (null !== response.errored) {
          reject(response.errored);
          return;
        }

        response.once("error", reject);

        let bodyChunks: HttpResponse["body"][] = [];

        response.on("data", (data) => bodyChunks.push(data));

        response.once("end", () =>
          resolve({ response, body: Buffer.concat(bodyChunks) }),
        );
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
    },
  ): Promise<T> {
    const { ApiVersion } = this.version;

    const response = await this.request(
      method,
      path.join("/", `v${ApiVersion}`, urlPath),
      options,
    );

    return JSON.parse(response.body.toString("utf-8"));
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

    this.dockerAuthToken = Buffer.from(
      tokenPayload,
      "utf-8",
    ).toString("base64");
  }

  async info(): Promise<DockerInfo> {
    return await this.apiCall<DockerInfo>("GET", "/info");
  }
}
