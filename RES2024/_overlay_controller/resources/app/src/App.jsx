import { useState, createContext, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
// const app = window.require("electron");

import "./App.css";

import OverlayNavigator from "./components/CurrentPosition";
import Maplist from "./components/Maplist";
import StatusBoard from "./components/StatusBoard";
import Notes from "./components/Notes";
import TeamSelector from "./components/TeamSelector";

const WS_URL = "ws://localhost:3727/ws";
const ControllerDataContext = createContext();

function App() {
    const [connectStatus, setConnectStatus] = useState(false);
    const [isInit, setIsInit] = useState(false);
    const [bestOf, setBestOf] = useState(3);
    const [nBans, setNBans] = useState(1);
    const [teamLeft, setTeamLeft] = useState(-1);
    const [teamRight, setTeamRight] = useState(-1);
    const [roundName, setRoundName] = useState("");
    const [mapId, setMapId] = useState(-1);
    const [showTeamSelector, setShowTeamSelector] = useState({
        show: false,
        forTeam: "",
    });
    const [mappoolData, setMappoolData] = useState({});
    const [poolStatus, setPoolStatus] = useState({});
    const [naviStatus, setNaviStatus] = useState({
        phase: "Banning Phase",
        team: "left",
        pos: 0,
    });

    const [selected, setSelected] = useState({});

    const gosuWS = useWebSocket("ws://127.0.0.1:24050/ws", {
        onOpen: () => {
            console.log("gosumemory connected");
        },
        onMessage: (event) => {
            const data = JSON.parse(event.data);
            if (data.tourney.manager.bestOF !== bestOf) setBestOf(data.tourney.manager.bestOF < 3 ? 3 : data.tourney.manager.bestOF);
            if (data.menu.bm.id !== mapId) {
                setMapId(data.menu.bm.id);

                let matchedMap = null;

                for (const mod in mappoolData.pool) {
                    mappoolData.pool[mod].forEach((map, idx) => {
                        if (map.id === data.menu.bm.id)
                            matchedMap = {
                                mod,
                                idx,
                                map,
                            };
                    });
                }

                if (JSON.stringify(selected) !== "{}" && matchedMap) {
                    const { pos, type, idx } = selected;
                    const temp = { ...poolStatus };

                    if (JSON.stringify(temp[pos][type][idx]) === "{}") {
                        temp[pos][type][idx] = {
                            mapIndex: `${matchedMap.mod}${matchedMap.idx + 1}`,
                            beatmapData: matchedMap.map,
                            winner: "none",
                        };

                        setPoolStatus(temp);
                        setSelected({});
                    }
                }
            }
        },
        shouldReconnect: (closeEvent) => true,
    });

    let ws = useWebSocket(WS_URL, {
        onOpen: () => {
            console.log("WebSocket connected");
            setConnectStatus(true);
        },
        onMessage: (event) => {
            console.log(JSON.parse(event.data));
            if (event.data[0] !== "{") return;

            const mes = JSON.parse(event.data);

            switch (mes.type) {
                case "initController":
                    // setMappoolData({
                    //     bestOf: mes.data.bestOf,
                    //     nBans: mes.data.nBans,
                    //     pool: {},
                    // });

                    setMappoolData(mes.data);

                    setPoolStatus({
                        left: {
                            ban: [...Array(nBans).keys()].map((n) => {
                                return {};
                            }),
                            pick: [...Array(Math.ceil((bestOf - 1) / 2)).keys()].map((n) => {
                                return {};
                            }),
                        },
                        right: {
                            ban: [...Array(nBans).keys()].map((n) => {
                                return {};
                            }),
                            pick: [...Array(Math.ceil((bestOf - 1) / 2)).keys()].map((n) => {
                                return {};
                            }),
                        },
                        tb: {
                            pick: [{}],
                        },
                    });

                    ws.sendJsonMessage({ type: "confirmInit" }, false);
                    setIsInit(true);
                    break;
                case "fetchData":
                    ws.sendJsonMessage(
                        {
                            type: "setOverlay",
                            data: {
                                bestOf: bestOf,
                                nBans: nBans,
                                status: {
                                    poolStatus,
                                    naviStatus,
                                },
                            },
                        },
                        false
                    );
                    break;
                case "updateJson":
                    console.log("alo");
                    setMappoolData(mes.data);
                    setPoolStatus({
                        left: {
                            ban: [...Array(nBans).keys()].map((n) => {
                                if (!poolStatus.left.ban[n]) return {};
                                if (JSON.stringify(poolStatus.left.ban[n]) !== "{}") {
                                    const mod = poolStatus.left.ban[n].mapIndex.slice(0, 2);
                                    const idx = poolStatus.left.ban[n].mapIndex.at(-1);

                                    return {
                                        ...poolStatus.left.ban[n],
                                        beatmapData: mes.data.pool[mod][idx - 1],
                                    };
                                }
                                return {};
                            }),
                            pick: [...Array(Math.ceil((bestOf - 1) / 2)).keys()].map((n) => {
                                if (!poolStatus.left.pick[n]) return {};
                                if (JSON.stringify(poolStatus.left.pick[n]) !== "{}") {
                                    const mod = poolStatus.left.pick[n].mapIndex.slice(0, 2);
                                    const idx = poolStatus.left.pick[n].mapIndex.at(-1);

                                    return {
                                        ...poolStatus.left.pick[n],
                                        beatmapData: mes.data.pool[mod][idx - 1],
                                    };
                                }
                                return {};
                            }),
                        },
                        right: {
                            ban: [...Array(nBans).keys()].map((n) => {
                                if (!poolStatus.right.ban[n]) return {};
                                if (JSON.stringify(poolStatus.right.ban[n]) !== "{}") {
                                    const mod = poolStatus.right.ban[n].mapIndex.slice(0, 2);
                                    const idx = poolStatus.right.ban[n].mapIndex.at(-1);

                                    return {
                                        ...poolStatus.right.ban[n],
                                        beatmapData: mes.data.pool[mod][idx - 1],
                                    };
                                }
                                return {};
                            }),
                            pick: [...Array(Math.ceil((bestOf - 1) / 2)).keys()].map((n) => {
                                if (!poolStatus.right.pick[n]) return {};
                                if (JSON.stringify(poolStatus.right.pick[n]) !== "{}") {
                                    const mod = poolStatus.right.pick[n].mapIndex.slice(0, 2);
                                    const idx = poolStatus.right.pick[n].mapIndex.at(-1);

                                    return {
                                        ...poolStatus.right.pick[n],
                                        beatmapData: mes.data.pool[mod][idx - 1],
                                    };
                                }
                                return {};
                            }),
                        },
                        tb: poolStatus.tb,
                    });
                    setNaviStatus({
                        phase: "Banning Phase",
                        team: "left",
                        pos: 0,
                    });
                    break;
                case "setWinner":
                    if (naviStatus.phase !== "Picking...") break;
                    const temp = { ...poolStatus };
                    temp[naviStatus.team].pick[naviStatus.pos - 1].winner = mes.data.winner;
                    setPoolStatus(temp);
                    break;
                case "fetchInitRoundData":
                    ws.sendJsonMessage({
                        type: "setInitialData",
                        data: {
                            left: teamLeft,
                            right: teamRight,
                            name: roundName,
                        },
                    });
                    break;
                case "nextPick":
                    if (naviStatus.team === "tb") break;
                    const tempNavi = { ...naviStatus };

                    if (
                        JSON.stringify(poolStatus[naviStatus.team === "left" ? "right" : "left"].pick[naviStatus.pos - 1]) !== "{}" &&
                        naviStatus.pos < (bestOf - 1) / 2
                    )
                        tempNavi.pos++;

                    if (
                        JSON.stringify(poolStatus.left.pick[naviStatus.pos - 1]) !== "{}" &&
                        JSON.stringify(poolStatus.right.pick[naviStatus.pos - 1]) !== "{}" &&
                        naviStatus.pos === (bestOf - 1) / 2
                    ) {
                        tempNavi.team = "tb";
                    } else tempNavi.team = tempNavi.team === "left" ? "right" : "left";

                    setNaviStatus(tempNavi);
                    setSelected({
                        pos: tempNavi.team,
                        type: "pick",
                        idx: tempNavi.team === "tb" ? 0 : tempNavi.pos - 1,
                    });
                    break;
            }
        },
        onClose: () => {
            setConnectStatus(false);
            setIsInit(false);
            console.log("WebSocket disconnected");
        },
        shouldReconnect: (closeEvent) => true,
    });

    useEffect(() => {
        if (connectStatus) {
            ws.sendJsonMessage({ type: "initController" }, false);
        }
    }, [connectStatus]);

    useEffect(() => {
        setPoolStatus({
            left: {
                ban: [...Array(nBans).keys()].map((n) => {
                    if (!poolStatus.left?.ban[n]) return {};
                    if (JSON.stringify(poolStatus?.left.ban[n]) !== "{}") {
                        const mod = poolStatus.left?.ban[n].mapIndex.slice(0, 2);
                        const idx = poolStatus.left?.ban[n].mapIndex.at(-1);

                        return {
                            ...poolStatus.left?.ban[n],
                            beatmapData: mappoolData.pool[mod][idx - 1],
                        };
                    }
                    return {};
                }),
                pick: [...Array(Math.ceil((bestOf - 1) / 2)).keys()].map((n) => {
                    if (!poolStatus.left?.pick[n]) return {};
                    if (JSON.stringify(poolStatus.left?.pick[n]) !== "{}") {
                        const mod = poolStatus.left?.pick[n].mapIndex.slice(0, 2);
                        const idx = poolStatus.left?.pick[n].mapIndex.at(-1);

                        return {
                            ...poolStatus.left?.pick[n],
                            beatmapData: mappoolData.pool[mod][idx - 1],
                        };
                    }
                    return {};
                }),
            },
            right: {
                ban: [...Array(nBans).keys()].map((n) => {
                    if (!poolStatus.right?.ban[n]) return {};
                    if (JSON.stringify(poolStatus.right?.ban[n]) !== "{}") {
                        const mod = poolStatus.right?.ban[n].mapIndex.slice(0, 2);
                        const idx = poolStatus.right?.ban[n].mapIndex.at(-1);

                        return {
                            ...poolStatus.right?.ban[n],
                            beatmapData: mappoolData.pool[mod][idx - 1],
                        };
                    }
                    return {};
                }),
                pick: [...Array(Math.ceil((bestOf - 1) / 2)).keys()].map((n) => {
                    if (!poolStatus.right?.pick[n]) return {};
                    if (JSON.stringify(poolStatus.right.pick[n]) !== "{}") {
                        const mod = poolStatus.right?.pick[n].mapIndex.slice(0, 2);
                        const idx = poolStatus.right?.pick[n].mapIndex.at(-1);

                        return {
                            ...poolStatus.right?.pick[n],
                            beatmapData: mappoolData.pool[mod][idx - 1],
                        };
                    }
                    return {};
                }),
            },
            tb: poolStatus.tb,
        });
        setNaviStatus({
            phase: "Banning Phase",
            team: "left",
            pos: 0,
        });
    }, [bestOf, nBans]);

    // useEffect(() => {
    //     console.log(selected);
    // }, [JSON.stringify(selected)]);

    useEffect(() => {
        console.log(poolStatus);
        ws.sendJsonMessage(
            {
                type: "setPoolStatus",
                data: poolStatus,
            },
            false
        );
    }, [JSON.stringify(poolStatus)]);

    useEffect(() => {
        console.log(naviStatus);
        ws.sendJsonMessage(
            {
                type: "setNaviStatus",
                data: naviStatus,
            },
            false
        );
    }, [JSON.stringify(naviStatus)]);

    useEffect(() => {
        ws.sendJsonMessage({
            type: "setInitialData",
            data: {
                left: teamLeft,
                right: teamRight,
                name: roundName,
            },
        });
    }, [teamLeft, teamRight, roundName]);

    // useEffect(() => {
    //     const handleKeyDown = (e) => {
    //         if (e.key === "F12") app.ipcRenderer.send("openDevTools");
    //     };

    //     document.addEventListener("keydown", handleKeyDown);

    //     return () => {
    //         document.removeEventListener("keydown", handleKeyDown);
    //     };
    // }, []);

    const openConfig = () => {
        // shell.openPath("C:\\");
        // app.ipcRenderer.send("openFolder");
    };

    return (
        <ControllerDataContext.Provider
            value={
                isInit
                    ? {
                          mappoolData,
                          setMappoolData,
                          poolStatus,
                          setPoolStatus,
                          selected,
                          setSelected,
                          naviStatus,
                          setNaviStatus,
                          bestOf,
                          nBans,
                          setNBans,
                          showTeamSelector,
                          setShowTeamSelector,
                          teamLeft,
                          setTeamLeft,
                          teamRight,
                          setTeamRight,
                          roundName,
                          setRoundName,
                      }
                    : null
            }
        >
            {isInit ? (
                <>
                    <div className="title">Resurrection Cup - Streamer Dashboard</div>
                    <button className="openConfig" onClick={openConfig}>
                        Open config folder
                    </button>
                    <div className="leftSection">
                        <OverlayNavigator />
                        <Notes />
                    </div>
                    <Maplist />
                    <StatusBoard />
                    {showTeamSelector.show ? <TeamSelector /> : ""}
                </>
            ) : (
                ""
            )}
        </ControllerDataContext.Provider>
    );
}

export default App;
export { ControllerDataContext };
