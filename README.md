# Docker.js

This repository is heavily used for the Hallmaster project, that you can check
out [right here](https://github.com/hallmasterorg/hallmaster).

It is a library used to manipulate Docker containers, images and all interfaces
that can be managed by the Docker Engine.

## How to use

The entrypoint of this library is the `DockerSocket` object. It has to be
instantiated given a UNIX socket (the one used by the Docker Engine) as well as
the API hostname.

```typescript
// index.ts
import { DockerSocket } from "@hallmaster/docker.js";

(async function () {
  const socket = new DockerSocket();

  await socket.init(); // prepare the UNIX socket to be used

  // get the information about the API (Docker Engine's version, ...)
  console.log(await socket.info());
})();
```

Once you have instantiated the `DockerSocket` object and initialized it with the
`init()` method, you are ready to use it everywhere.

### Containers

To fetch data from containers, you may use this snippet :

```typescript
import { DockerContainersAPI, DockerSocket } from "@hallmaster/docker.js";

async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  const dockerContainersApi = new DockerContainersAPI(socket);

  const containers = await dockerContainersApi.list();
  for (const container of containers) {
    const containerLogs = await dockerContainersApi.logs(container.Id, {
      stdout: true,
      stderr: true,
    });
    console.log("-----------");
    console.log(`Logs for the container #${container.Id}`);
    console.log(containerLogs);
    console.log("-----------");
  }

  const createdContainer = await dockerContainersApi.create(
    {
      Image: "redis:8.2.1-bookworm",
      Labels: {
        "@hallmaster/docker.js": "true",
      },
    },
    "redis-container",
  );

  for (const warning of createdContainer.Warnings) {
    console.warn(`[CONTAINER WARNING]: ${warning}`);
  }

  await dockerContainersApi.start(createdContainer.Id);

  await sleep(2000);

  const logs = await dockerContainersApi.logs(createdContainer.Id, {
    stderr: true,
    stdout: true,
  });

  console.log("--- REDIS TEST CONTAINER LOGS BEGIN ---");
  console.log(logs);
  console.log("--- REDIS TEST CONTAINER LOGS END ---");

  console.log("Killing test container");
  await dockerContainersApi.kill(createdContainer.Id);
  console.log("Test container killed");

  console.log("Removing test container");
  await dockerContainersApi.remove(createdContainer.Id);
  console.log("Test container removed");

  const availableContainers = await dockerContainersApi.list({ all: true });
  const isAnyContainerMatchingTestContainer = availableContainers.filter(
    (container) => container.Id === createdContainer.Id,
  );
  if (isAnyContainerMatchingTestContainer.length === 1) {
    console.error("The test container has not been remove properly");
  }
})();
```

### Images

To create an image, you would use something similar to this :

```typescript
import {
  DockerImagesAPI,
  DockerRegistryCredential,
  DockerSocket,
} from "@hallmaster/docker.js";
import { pack } from "tar-fs"; // create a Readable tarball for build context

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  const dockerImagesApi = new DockerImagesAPI(socket);

  const imageName = "dockerjs-test-image";
  const tag = "latest";

  // create the Readable build context
  const buildContext = pack("./test/context");

  // build the image
  await dockerImagesApi.build(buildContext, [], {
    tag: `${imageName}:${tag}`,
  });

  // lookup all images
  const images = await dockerImagesApi.list({
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
  await dockerImagesApi.tag(imageName, {
    repo: taggedImageName,
    tag: tag,
  });

  // push the image
  await dockerImagesApi.push(taggedImageName, {
    tag: tag,
    auth: registryCredential,
  });

  // remove the image for test cleanup
  for (const imageNameToDelete of [imageName, taggedImageName]) {
    const deletedImages = await dockerImagesApi.remove(imageNameToDelete, {
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
  await dockerImagesApi.create({
    fromImage: "nginx",
    tag: "latest",
  });

  // pull an image from remote private registry
  await dockerImagesApi.create({
    fromImage: taggedImageName,
    auth: registryCredential,
  });
})().catch((e) => {
  throw e;
});
```

If you want to try to push the image to a registry, use the service located in
the [`docker-compose.yml`](./docker-compose.yml) file. It will setup a local
registry.

Then, use this command to setup the credentials inside :
```bash
docker run --rm --entrypoint htpasswd httpd:2 -Bbn admin password > auth/htpasswd
```

By default, username is `admin` and password is `password`. Obviously, this is
not secure, it's for demonstration purpose only. Also, `identitytoken`-based
authentication will not work, use the `username`/`password` and `serveraddress`
authentication, as in the provided example

## Contributors

To contribute, there is a [`docker-compose.yml`](./docker-compose.yml) file at
the root of the project which contains a service called `openapi-server`. It's
a web server listening on port `8080` which hosts the OpenAPI specs of the REST
endpoints of the Docker Engine. It's an ease for development.
