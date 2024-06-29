import { useContext, useEffect, useState } from "react";

import "../styles/Maplist.css";

import { ControllerDataContext } from "../App";

const ModRow = (props) => {
    const ControllerData = useContext(ControllerDataContext);
    const [isEnabled, setIsEnabled] = useState(false);
    const [picked, setPicked] = useState([]);

    const handleMapClick = async (mods, id) => {
        if (JSON.stringify(ControllerData.selected) !== "{}") {
            const { pos, type, idx } = ControllerData.selected;
            const temp = { ...ControllerData.poolStatus };

            temp[pos][type][idx] = {
                mapIndex: `${mods}${id}`,
                beatmapData: ControllerData.mappoolData.pool[mods][id - 1],
                winner: "none",
            };
            ControllerData.setPoolStatus(temp);
            ControllerData.setSelected({});

            // const selectedMaps = ["left", "right"].reduce(
            //     (prev, currPos) => prev.concat(["ban", "pick"].reduce((prev, currType) => prev.concat(temp[currPos][currType].filter((e) => e)), [])),
            //     []
            // );

            // setPicked(selectedMaps);
        }
    };

    useEffect(() => {
        console.log(JSON.stringify(ControllerData.selected));
        if (JSON.stringify(ControllerData.selected) !== "{}") setIsEnabled(true);
        else setIsEnabled(false);
    }, [JSON.stringify(ControllerData.selected)]);

    return (
        <div className={`modRow ${isEnabled ? "" : "disabled"}`}>
            <div className={`mod ${props.mods}`}>{props.mods}</div>
            <div className="mapContainer">
                {props.idlist.map((id, idx) => {
                    return (
                        <button
                            className={`map ${props.mods}`}
                            key={idx}
                            onClick={() => {
                                handleMapClick(props.mods, idx + 1);
                            }}
                            disabled={!isEnabled || picked.includes(`${props.mods}${idx + 1}`)}
                        >
                            {props.mods}
                            {idx + 1}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const Maplist = (props) => {
    const ControllerData = useContext(ControllerDataContext);
    return (
        <div className="container maplist">
            {ControllerData
                ? Object.keys(ControllerData.mappoolData.pool).map((mods) => (
                      <ModRow mods={mods} key={mods} idlist={ControllerData.mappoolData.pool[mods]} />
                  ))
                : ""}
        </div>
    );
};

export default Maplist;
