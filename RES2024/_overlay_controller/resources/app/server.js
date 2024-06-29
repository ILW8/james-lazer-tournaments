// Import express, expressWs, and http
const express = require("express");
const expressWs = require("express-ws");
const http = require("http");

const elecApp = require("electron").app;
const fs = require("fs");

// const location = JSON.parse(fs.readFileSync(`${elecApp.getPath("userData")}/config.json`, "utf-8")).location;
// let initialJson = JSON.parse(fs.readFileSync(`${location}\\config.json`, "utf-8"));

let app = express();
let port = 3727;
let server = http.createServer(app).listen(port);

// Apply expressWs
const wss = expressWs(app, server);
let confirmInit = false;

// const updateJson = () => {
//     const json = JSON.parse(fs.readFileSync(`${location}\\config.json`, "utf-8"));
//     if (JSON.stringify(initialJson) !== JSON.stringify(json)) {
//         initialJson = json;
//         wss.getWss().clients.forEach((client) => {
//             const retMes = JSON.stringify({
//                 type: "updateJson",
//                 data: json,
//             });

//             client.send(retMes);
//         });
//     }
// };

// setInterval(updateJson, 1000);

// This lets the server pick up the '/ws' WebSocket route
app.ws("/ws", async function (ws, req) {
    // After which we wait for a message and respond to it
    console.log("A client connected");

    ws.on("message", async (message) => {
        console.log(message);
        const mes = JSON.parse(message);

        switch (mes.type) {
            // case "initController":
            //     wss.getWss().clients.forEach((client) => {
            //         const retMes = JSON.stringify({
            //             type: "initController",
            //             data: initialJson,
            //         });

            //         client.send(retMes);
            //     });
            //     break;
            case "setOverlay":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "setOverlay",
                        data: mes.data,
                    });

                    client.send(retMes);
                });
                break;
            case "setPoolStatus":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "setPoolStatus",
                        data: mes.data,
                    });

                    client.send(retMes);
                });
                break;
            case "setNaviStatus":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "setNaviStatus",
                        data: mes.data,
                    });

                    client.send(retMes);
                });
                break;
            case "confirmInit":
                wss.getWss().clients.forEach((client) => {
                    confirmInit = true;
                    const retMes = JSON.stringify({
                        type: "confirmInit",
                    });

                    client.send(retMes);
                });
                break;
            case "askInit":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "confirmInit",
                    });

                    client.send(retMes);
                });
                break;
            case "fetchData":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "fetchData",
                    });

                    client.send(retMes);
                });
                break;
            case "setMap":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "fetchData",
                    });

                    client.send(retMes);
                });
                break;
            case "setWinner":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "setWinner",
                        data: mes.data,
                    });

                    client.send(retMes);
                });
                break;
            case "fetchInitRoundData":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "fetchInitRoundData",
                    });

                    client.send(retMes);
                });
                break;
            case "setInitialData":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "setInitialData",
                        data: mes.data,
                    });

                    client.send(retMes);
                });
                break;
            case "nextPick":
                wss.getWss().clients.forEach((client) => {
                    const retMes = JSON.stringify({
                        type: "nextPick",
                    });

                    client.send(retMes);
                });
                break;
        }
    });
});
