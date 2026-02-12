import { pack } from "tar-fs"; // create a Readable tarball for build context
import { createWriteStream } from "node:fs";
import { DockerImagesAPI, DockerSocket } from "@hallmaster/docker.js";

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  const dockerImagesAPI = new DockerImagesAPI(socket);

  const imageName = "dockerjs-test-image1";
  const tag = "latest";

  // create the Readable build context
  const buildContext = pack("./test/context");

  // build the image
  await dockerImagesAPI.build(buildContext, [], {
    tag: `${imageName}:${tag}`,
  });

  // create an output tar file to export the image
  const tarballPath = `${imageName}.tar`;
  const tarballWriter = createWriteStream(tarballPath);

  // stream the Docker Engine flux containing the tarball binary
  const tarballStream = await dockerImagesAPI.get(imageName);
  tarballStream.pipe(tarballWriter);
  tarballWriter.once("finish", () => {
    console.log(`Docker image ${imageName} exported to ${tarballPath}`);
  });
})().catch((e) => {
  throw e;
});
