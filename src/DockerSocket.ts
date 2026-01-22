import http from "node:http";
import fs from "node:fs/promises";
import { Readable } from "node:stream";
import type { Stats } from "node:fs";
import type { DockerVersion } from "./types/system/DockerVersion.js";
import type { DockerInfo } from "./types/system/DockerInfo.js";
import type { DockerAuthToken } from "./types/auth/DockerAuthToken.js";
import type { DockerRegistryCredential } from "./types/auth/DockerRegistryCredential.js";

declare interface HttpResponse {
  response: http.IncomingMessage;
  body: Buffer<ArrayBuffer>;
}

class DockerAPIHttpError extends Error {
  constructor(
    readonly status: number,
    readonly reason?: string,
    cause?: unknown,
  ) {
    super(reason ?? `Docker API error: ${status}`, { cause });
    this.name = "DockerAPIHttpError";
  }
}

export class DockerSocket {
  private dockerSocketPath: string;

  private dockerVersion: DockerVersion | null = null;

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

  private static isReadableStream(obj: any): obj is Readable {
    return (
      obj && typeof obj.pipe === "function" && typeof obj.read === "function"
    );
  }

  private async request(
    method: Request["method"],
    path: string | URL,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView | Readable;
      query?: Record<string, string | string[] | undefined>;
    },
  ) {
    const url = new URL(path, this.apiBaseURL);
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v === undefined) {
          continue;
        }
        if (!Array.isArray(v)) {
          url.searchParams.set(k, v);
          continue;
        }
        for (const element of v) {
          url.searchParams.set(k, element);
        }
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

        response.once("error", (err) => {
          reject(new DockerAPIHttpError(999, err.message));
        });

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
          } else {
            resolve({ response, body: Buffer.concat(bodyChunks) });
          }
        });
      });

      request.once("error", reject);

      if (DockerSocket.isReadableStream(options?.body)) {
        options.body.pipe(request);
        options.body.once("error", (err) => request.destroy(err));
        return;
      }

      if (undefined !== options?.body) {
        const body =
          options.body instanceof Buffer
            ? options.body
            : Buffer.from(options.body.toString("utf-8"));

        if (
          !options?.headers?.["Content-Length"] &&
          !options?.headers?.["Transfer-Encoding"]
        ) {
          request.setHeader("Content-Length", Buffer.byteLength(body));
        }

        request.end(body);
        return;
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

  async apiCall<T>(
    method: Request["method"],
    urlPath: string,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView | Readable;
      query?: Record<string, string | string[] | undefined>;
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
    } catch (e) {
      responseBody.split(/\r\n/).forEach((line) => {
        let parsedLine: ReturnType<typeof JSON.parse>;
        try {
          parsedLine = JSON.parse(line);
        } catch {
          return;
        }

        if ("error" in parsedLine) {
          throw new DockerAPIHttpError(
            response.response.statusCode ?? 400,
            parsedLine["error"],
          );
        }
      });

      return responseBody as T;
    }
  }

  async authenticate(credential: DockerRegistryCredential): Promise<string> {
    const tokenPayload = JSON.stringify(credential);

    const response = await this.apiCall<DockerAuthToken>("POST", "/auth", {
      headers: {
        "Content-Type": "application/json",
      },
      body: tokenPayload,
    });

    if (response.Status !== "Login Succeeded") {
      throw new Error("DockerSocket: Invalid credentials");
    }

    return Buffer.from(tokenPayload, "utf-8").toString("base64");
  }

  async info(): Promise<DockerInfo> {
    return await this.apiCall<DockerInfo>("GET", "/info");
  }
}
