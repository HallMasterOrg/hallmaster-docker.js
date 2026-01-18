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

  // if you want, you may authenticate to a Docker Image registry
  // await socket.authenticate(
  //   "ghcr.io",
  //   "github_username",
  //   "github_pat",
  // );
  // console.log(socket.token);

  // you can get the information of the API from the socket such as the version
  // of the Docker Engine
  console.log(await socket.info());
})();
```

Once you have instantiated the `DockerSocket` object and initialized it with the
`init()` method, you are ready to use it everywhere.

For instance, to fetch data from containers, you may use this snippet :

```typescript
import { DockerContainersAPI } from "@hallmaster/docker.js";

(async function() {
    // ...

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
})();
```
