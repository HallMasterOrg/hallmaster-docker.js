import { pack } from "tar-fs";
import { pack as packInMemory } from "tar-stream";
import { DockerImagesAPI, DockerSocket } from "@hallmaster/docker.js";
import { PassThrough } from "node:stream";
import path from "node:path";
import { readFile } from "node:fs/promises";

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  const dockerImagesAPI = new DockerImagesAPI(socket);

  const imageName = "dockerjs-test-image2";
  const tag = "latest";

  // create the Readable build context
  const buildContext = pack("./test/context");

  // build the image
  await dockerImagesAPI.build(buildContext, [], {
    tag: `${imageName}:${tag}`,
  });

  const derivedBuildContext = packInMemory();

  derivedBuildContext.entry(
    {
      name: "Dockerfile",
    },
    `FROM alpine:latest

    COPY ./package.json /package.json

    # Install bash (optional, but convenient for exec)
    RUN apk add --no-cache bash

    # Set working directory
    WORKDIR /root

    # Default command: sleep forever
    CMD ["sleep", "infinity"]`,
  );

  const packageJsonPath = path.resolve("./package.json");
  const packageJsonContent = await readFile(packageJsonPath);

  derivedBuildContext.entry(
    {
      name: "package.json",
      mode: 0o600,
    },
    packageJsonContent,
  );

  derivedBuildContext.finalize();
  await dockerImagesAPI.build(derivedBuildContext, [], {
    tag: `derived-${imageName}:${tag}`,
  });
})().catch((e) => {
  throw e;
});
