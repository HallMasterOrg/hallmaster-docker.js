import http from "node:http";
import fs from "node:fs/promises";
import { Readable } from "node:stream";
import type { Stats } from "node:fs";
import type { DockerVersion } from "./types/system/DockerVersion.js";
import type { DockerInfo } from "./types/system/DockerInfo.js";
import type { DockerAuthToken } from "./types/auth/DockerAuthToken.js";
import type { DockerRegistryCredential } from "./types/auth/DockerRegistryCredential.js";
import { isDataView } from "node:util/types";

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

  private async _rawRequest(
    method: string,
    path: string | URL,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView | Readable;
      query?: Record<string, string | string[] | undefined>;
    },
  ): Promise<http.IncomingMessage> {
    const url = new URL(path.toString(), this.apiBaseURL);
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v === undefined) continue;
        if (Array.isArray(v))
          v.forEach((val) => url.searchParams.append(k, val));
        else url.searchParams.set(k, v);
      }
    }

    const reqOptions: http.RequestOptions = {
      hostname: url.hostname,
      host: url.host,
      protocol: url.protocol,
      port: url.port,
      path: url.pathname + url.search,
      headers: options?.headers,
      method,
      socketPath: this.dockerSocketPath,
    };

    return new Promise((resolve, reject) => {
      const req = http.request(reqOptions, (res) => {
        if (!res) return reject(new DockerAPIHttpError(500, "No response"));
        resolve(res);
      });

      req.once("error", reject);

      if (DockerSocket.isReadableStream(options?.body)) {
        options.body.pipe(req);
        options.body.once("error", (err) => req.destroy(err));
      } else if (options?.body !== undefined) {
        const body =
          Buffer.isBuffer(options.body) || isDataView(options.body)
            ? Buffer.from(options.body.buffer)
            : Buffer.from(options.body, "utf-8");

        if (
          !options.headers?.["Content-Length"] &&
          !options.headers?.["Transfer-Encoding"]
        ) {
          req.setHeader("Content-Length", Buffer.byteLength(body));
        }
        req.end(body);
      } else {
        req.end();
      }
    });
  }

  private async request(
    method: string,
    path: string | URL,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView | Readable;
      query?: Record<string, string | string[] | undefined>;
    },
  ): Promise<{ response: http.IncomingMessage; body: Buffer }> {
    const res = await this._rawRequest(method, path, options);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode && res.statusCode >= 400) {
          return reject(
            new DockerAPIHttpError(res.statusCode, body.toString()),
          );
        }
        resolve({ response: res, body });
      });
      res.on("error", (err) =>
        reject(new DockerAPIHttpError(500, err.message)),
      );
    });
  }

  private async stream(
    method: string,
    path: string | URL,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView | Readable;
      query?: Record<string, string | string[] | undefined>;
    },
  ): Promise<Readable> {
    const res = await this._rawRequest(method, path, options);
    if (res.statusCode && res.statusCode >= 400) {
      // buffer error body
      const chunks: Buffer[] = [];
      return new Promise((_, reject) => {
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          reject(
            new DockerAPIHttpError(
              res.statusCode!,
              Buffer.concat(chunks).toString(),
            ),
          ),
        );
      });
    }
    return res;
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
    auth?: { identitytoken: string } | DockerRegistryCredential,
  ): Promise<T> {
    const { ApiVersion } = this.version;

    const headers = options?.headers ?? {};
    if (auth !== undefined) {
      if ("identitytoken" in auth) {
        headers["X-Registry-Auth"] = auth.identitytoken;
      } else {
        headers["X-Registry-Auth"] = Buffer.from(JSON.stringify(auth)).toString(
          "base64",
        );
      }
    }

    const response = await this.request(
      method,
      `/v${ApiVersion}/${urlPath.replace(/^\//, "")}`,
      {
        body: options?.body,
        headers: headers,
        query: options?.query,
      },
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

  async streamAPICall(
    method: Request["method"],
    urlPath: string,
    options?: {
      headers?: Record<string, string>;
      body?: string | Buffer | DataView | Readable;
      query?: Record<string, string | string[] | undefined>;
    },
    auth?: { identitytoken: string } | DockerRegistryCredential,
  ): Promise<Readable> {
    const { ApiVersion } = this.version;

    const headers = options?.headers ?? {};
    if (auth !== undefined) {
      if ("identitytoken" in auth) {
        headers["X-Registry-Auth"] = auth.identitytoken;
      } else {
        headers["X-Registry-Auth"] = Buffer.from(JSON.stringify(auth)).toString(
          "base64",
        );
      }
    }

    return await this.stream(
      method,
      `/v${ApiVersion}/${urlPath.replace(/^\//, "")}`,
      {
        body: options?.body,
        headers: headers,
        query: options?.query,
      },
    );
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
