import {
  DockerImagesAPI,
  DockerRegistryCredential,
  DockerSocket,
} from "@hallmaster/docker.js";
import { pack } from "tar-fs"; // create a Readable tarball for build context

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  const dockerImagesAPI = new DockerImagesAPI(socket);

  const imageName = "dockerjs-test-image";
  const tag = "latest";

  // create the Readable build context
  const buildContext = pack("./test/context");

  // build the image
  await dockerImagesAPI.build(buildContext, [], {
    tag: `${imageName}:${tag}`,
  });

  // lookup all images
  const images = await dockerImagesAPI.list({
    all: true,
  });

  // checks the image has been built properly
  const dockerjsTestImage = images.filter((image) =>
    image.RepoTags.includes(`${imageName}:${tag}`),
  );
  if (dockerjsTestImage.length === 0) {
    console.error("The Docker.js test image has not been built properly");
    return;
  }

  const registryCredential: DockerRegistryCredential = {
    serveraddress: "localhost:5001",
    username: "admin",
    password: "password",
  };

  const taggedImageName = `${registryCredential.serveraddress}/${registryCredential.username}/${imageName}`;

  // tag the image
  await dockerImagesAPI.tag(imageName, {
    repo: taggedImageName,
    tag: tag,
  });

  // push the image
  await dockerImagesAPI.push(taggedImageName, {
    tag: tag,
    auth: registryCredential,
  });

  // remove the image for test cleanup
  for (const imageNameToDelete of [imageName, taggedImageName]) {
    const deletedImages = await dockerImagesAPI.remove(imageNameToDelete, {
      force: true,
      noPrune: false,
    });

    // make sure the image has been deleted
    const hasBeenDeleted = deletedImages.filter(
      (deleted) =>
        Object.keys(deleted).includes("Untagged") &&
        Object.keys(deleted).includes(imageNameToDelete),
    );
    if (!hasBeenDeleted) {
      console.error("The Docker.js test image has not been removed properly");
      return;
    }
  }

  // pull an image from remote registry
  await dockerImagesAPI.create({
    fromImage: "nginx",
    tag: "latest",
  });

  // pull an image from remote private registry
  await dockerImagesAPI.create({
    fromImage: taggedImageName,
    auth: registryCredential,
  });
})().catch((e) => {
  throw e;
});
