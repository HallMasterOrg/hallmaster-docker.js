import { DockerContainersAPI, DockerSocket } from "@hallmaster/docker.js";

async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

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
