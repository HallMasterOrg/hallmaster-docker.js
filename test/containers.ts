import {
  DockerContainersAPI,
  DockerImagesAPI,
  DockerSocket,
} from "@hallmaster/docker.js";

async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  const dockerImagesAPI = new DockerImagesAPI(socket);

  console.log("Downloading Redis image...");
  await dockerImagesAPI.create({
    fromImage: "redis",
    tag: "8.2.1-bookworm",
  });
  console.log("Redis image downloaded.");

  const dockerContainersAPI = new DockerContainersAPI(socket);

  const containers = await dockerContainersAPI.list();
  for (const container of containers) {
    const containerLogs = await dockerContainersAPI.logs(container.Id, {
      stdout: true,
      stderr: true,
    });
    console.log("-----------");
    console.log(`Logs for the container #${container.Id}`);
    console.log(containerLogs);
    console.log("-----------");
  }

  const createdContainer = await dockerContainersAPI.create(
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

  await dockerContainersAPI.start(createdContainer.Id);

  await sleep(2000);

  const logs = await dockerContainersAPI.logs(createdContainer.Id, {
    stderr: true,
    stdout: true,
  });

  console.log("--- REDIS TEST CONTAINER LOGS BEGIN ---");
  console.log(logs);
  console.log("--- REDIS TEST CONTAINER LOGS END ---");

  console.log("Killing test container");
  await dockerContainersAPI.kill(createdContainer.Id);
  console.log("Test container killed");

  console.log("Removing test container");
  await dockerContainersAPI.remove(createdContainer.Id);
  console.log("Test container removed");

  const availableContainers = await dockerContainersAPI.list({ all: true });
  const isAnyContainerMatchingTestContainer = availableContainers.filter(
    (container) => container.Id === createdContainer.Id,
  );
  if (isAnyContainerMatchingTestContainer.length === 1) {
    console.error("The test container has not been remove properly");
  }
})();
