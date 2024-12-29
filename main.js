// main.js
const { app, BrowserWindow, dialog, BrowserView, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const http = require('http');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // Load the index.html (renderer)
    mainWindow.loadFile("index.html");

    // Check Docker status after window is ready
    mainWindow.webContents.on('did-finish-load', checkDockerStatus);
}

// Listen for a request to start the Docker container
ipcMain.handle("start-container", async (event, repoUrl) => {
    try {
        // 1. Check if Docker is installed
        const dockerVersion = await runCommand("docker --version");
        console.log("Docker is installed:", dockerVersion);

        // 2. Build the Docker image if not already built (optional)
        //    For large images, you'd typically build once. For demonstration:
        const buildOutput = await runCommand("docker build -t code-server-dev ./docker/frontend");
        console.log(buildOutput);

        // 3. Run the container (detached) and clone the repo
        const localRepoName = repoUrl.split("/").pop().replace(".git", "");
        console.log("Cloning repo:", repoUrl, "to local:", localRepoName);
        const runCmd = `
            docker run --name code-server-container -d -p 127.0.0.1:8080:8080 code-server-dev bash -c "
                git clone ${repoUrl} &&
                code-server /home/contest/${localRepoName} --bind-addr 0.0.0.0:8080 --auth none
            "
        `;
        runCommand(runCmd).then(runOutput => {
            console.log("Container started:", runOutput);

            // 4. Send message to renderer to open code-server on port 8080 in an iframe
            checkCodeServerStatus('http://127.0.0.1:8080', () => {
                mainWindow.webContents.send('open-code-server-iframe', 'http://127.0.0.1:8080');
            });
        }).catch(error => {
            console.error("Error starting container:", error);
            return { success: false, message: error.message };
        });

        return { success: true, message: "Container started successfully!" };
    } catch (error) {
        console.error("Error starting container:", error);
        return { success: false, message: error.message };
    }
});

// ping code-server every 5 seconds to check if it's running
function checkCodeServerStatus(url, successCallback) {
    let intervalId;
    intervalId = setInterval(async () => {
        const isRunning = await isCodeServerRunning(url);
        if (!isRunning) {
            console.log('code-server is NOT RUNNING yet...');
        } else {
            if (typeof successCallback === 'function') {
                successCallback();
            }
            console.log('code-server is RUNNING...');
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    }, 2500);
}

function isCodeServerRunning(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            // e.g., check status code
            if (res.statusCode === 200 || res.statusCode === 302) {
                console.log('oh jeez http.get code-server is running');
                resolve(true);
            } else {
                console.log('oh jeez http.get code-server is NOT running');
                resolve(false);
            }
        }).on('error', (err) => {
            console.log('oh jeez http.get code-server is NOT running ERROR!!', err);
            resolve(false);
        });
    });
}

async function checkDockerStatus() {
    try {
        const dockerInfo = await runCommand('docker info');
        console.log('Docker is running:\n', dockerInfo);
    } catch (error) {
        console.error('Docker is not running:', error);
        showDockerNotRunningDialog();
    }
}

function showDockerNotRunningDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Docker Not Running',
        message: 'Docker does not appear to be running. Please launch or install Docker, after that, click on "Retry" to retry.',
        buttons: ['Retry', 'Cancel']
    }).then((response) => {
        if (response.response === 0) {
            // user clicked 'Retry'
            checkDockerStatus();
        }
    });
}

// Utility to run shell commands with Promise
function runCommand(cmd) {
    return new Promise((resolve, reject) => {
        console.log(`Executing command: ${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${cmd}`, error);
                reject(stderr.trim() || error.message);
            } else {
                console.log(`Command output: ${stdout.trim()}`);
                resolve(stdout.trim());
            }
        });
    });
}
app.whenReady().then(createWindow);

app.on("will-quit", async (e) => {
    e.preventDefault();
    app.removeAllListeners("will-quit"); // Remove the event listener to prevent infinite loop
    try {
        console.log("Checking if the container is running...");
        const inspectOutput = await runCommand("docker inspect -f '{{.State.Running}}' code-server-container");
        if (inspectOutput.trim() === "true") {
            console.log("Attempting to stop the container...");
            const stopOutput = await runCommand("docker stop code-server-container");
            console.log("Container stopped:", stopOutput);

            console.log("Attempting to remove the container...");
            const removeOutput = await runCommand("docker rm code-server-container");
            console.log("Container removed:", removeOutput);
        } else {
            console.log("Container is not running.");
        }
    } catch (error) {
        if (error.message.includes("No such object")) {
            console.log("Container does not exist.");
        } else {
            console.error("Error stopping/removing container:", error);
        }
    } finally {
        app.quit();
    }
});

app.on('window-all-closed', () => {
    // On macOS, it's common to keep the app open until user quits, 
    // but you could also call app.quit() here if you want:
    app.quit();
});