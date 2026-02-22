import {
  DockerContainersAPI,
  DockerImagesAPI,
  DockerSocket,
} from "@hallmaster/docker.js";

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

(async function () {
  const socket = new DockerSocket();
  await socket.init();

  const dockerImagesAPI = new DockerImagesAPI(socket);

  console.log("Downloading random logger image...");
  await dockerImagesAPI.create({
    fromImage: "chentex/random-logger",
    tag: "latest",
  });
  console.log("Random logger image downloaded.");

  const dockerContainersAPI = new DockerContainersAPI(socket);

  const createdContainer = await dockerContainersAPI.create(
    {
      Image: "chentex/random-logger:latest",
      Labels: {
        "@hallmaster/docker.js": "true",
      },
    },
    "random-logger-stream-test",
  );

  await dockerContainersAPI.start(createdContainer.Id);

  await sleep(2000);

  console.log("--- STREAM LOGS BEGIN ---");

  const stream = await dockerContainersAPI.logs(createdContainer.Id, {
    follow: true,
    stdout: true,
    stderr: true,
    timestamps: true,
  });

  stream.on("data", (log) => {
    const prefix =
      log.stream === "STDERR" ? "[STDERR]" : "[STDOUT]";
    process.stdout.write(`[${prefix}] ${log.content}`);
  });

  stream.on("error", (err) => {
    console.error("Stream error:", err);
  });

  await sleep(60000);

  console.log("\n--- STREAM LOGS END ---");

  stream.destroy();

  console.log("Killing test container");
  await dockerContainersAPI.kill(createdContainer.Id);
  console.log("Test container killed");

  console.log("Removing test container");
  await dockerContainersAPI.remove(createdContainer.Id);
  console.log("Test container removed");
})();
