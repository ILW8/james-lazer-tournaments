import { useState, useContext, useRef, useEffect, createContext } from "react";

import "../styles/StatusBoard.css";

import { ControllerDataContext } from "../App";

const TB = (props) => {
    return (
        <div className="tb">
            <Row pos="tb" type="PICK" idx={0} />
        </div>
    );
};

const Row = (props) => {
    const controllerData = useContext(ControllerDataContext);

    const [isClicked, setIsClicked] = useState(false);
    const [selectedMap, setSelectedMap] = useState({});
    const [winner, setWinner] = useState("none");
    const rowRef = useRef(null);
    const winnerRef = useRef(null);

    const handleRightClick = (e) => {
        e.preventDefault();
        if (rowRef.current && rowRef.current.contains(e.target)) {
            // console.log("Hello!");
            const temp = { ...controllerData.poolStatus };
            temp[props.pos][props.type.toLowerCase()][props.idx] = {};
            controllerData.setPoolStatus(temp);
            setSelectedMap({})
            setWinner("none");
        }
    };

    const handleClick = (e) => {
        // console.log(props.pos, props.type, props.idx, isClicked);

        if (rowRef.current && rowRef.current.contains(e.target) && !winnerRef.current?.contains(e.target)) {
            controllerData.setSelected({
                pos: props.pos,
                type: props.type.toLowerCase(),
                idx: props.idx,
            });

            controllerData.setNaviStatus({
                phase: props.pos === "tb" ? "Tiebreak" : props.type.toLowerCase() === "ban" ? "Banning Phase" : "Picking...",
                team: props.pos,
                pos:
                    props.pos === "tb"
                        ? Math.ceil((controllerData.bestOf + 1) / 2) - 1
                        : props.type.toLowerCase() === "ban"
                        ? 0
                        : props.type.toLowerCase() === "pick"
                        ? props.idx + 1
                        : 0,
            });
        } else {
            // if (isClicked) {
            //     controllerData.setSelected({});
            // }
            // if (JSON.stringify(controllerData.selected) !== "{}") {
            //     console.log(controllerData.selected);
            //     const { pos, type, idx } = { ...controllerData.selected };
            //     // console.log(pos, type, idx, props.pos, props.type, props.idx);
            //     if (pos === props.pos && type === props.type.toLowerCase() && idx === props.idx) {
            //         controllerData.setSelected({});
            //     }
            // }
        }

        if (!winnerRef.current?.contains(e.target)) {
            setIsClicked(rowRef.current && rowRef.current.contains(e.target));
        }
    };

    const onChangeValue = (e) => {
        if (JSON.stringify(selectedMap) !== "{}") {
            setWinner(e.target.value);
            const temp = { ...controllerData.poolStatus };
            temp[props.pos][props.type.toLowerCase()][props.idx].winner = e.target.value;
            controllerData.setPoolStatus(temp);
        }
    };

    useEffect(() => {
        if (
            controllerData.selected.pos === props.pos &&
            controllerData.selected.type === props.type.toLowerCase() &&
            controllerData.selected.idx === props.idx
        ) {
            setIsClicked(true);
        } else {
            setIsClicked(false);
        }
    }, [JSON.stringify(controllerData.selected)]);

    useEffect(() => {
        document.addEventListener("click", handleClick);
        document.addEventListener("contextmenu", handleRightClick);

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("contextmenu", handleRightClick);
        };
    }, []);

    useEffect(() => {
        if (JSON.stringify(controllerData.poolStatus[props.pos][props.type.toLowerCase()][props.idx] ?? {}) !== "{}") {
            setSelectedMap(controllerData.poolStatus[props.pos][props.type.toLowerCase()][props.idx]);
            setWinner(controllerData.poolStatus[props.pos][props.type.toLowerCase()][props.idx].winner);
        }
    }, [JSON.stringify(controllerData.poolStatus[props.pos][props.type.toLowerCase()][props.idx])]);

    useEffect(() => {
        // console.log(props.pos, props.type, props.idx, isClicked);
        if (
            !isClicked &&
            JSON.stringify(controllerData.selected) ===
                JSON.stringify({
                    pos: props.pos,
                    type: props.type.toLowerCase(),
                    idx: props.idx,
                })
        )
            controllerData.setSelected({});
    }, [isClicked]);

    return (
        <div className={`previewRow ${isClicked ? "splashing" : ""} ${JSON.stringify(selectedMap) !== "{}" ? "" : "fade"}`} ref={rowRef}>
            <div className={`mapIndex ${JSON.stringify(selectedMap) !== "{}" ? selectedMap.mapIndex.slice(0, 2) : "fade"}`}>
                {JSON.stringify(selectedMap) !== "{}" ? selectedMap.mapIndex : "To be selected"}
            </div>
            {props.type.toLowerCase() === "pick" && props.pos !== "tb" ? (
                <div className="winner" ref={winnerRef} onChange={onChangeValue}>
                    <input type="radio" value="none" name={`winner-${props.pos}-${props.idx}`} checked={winner === "none"} readOnly />
                    <span>None</span>
                    <input type="radio" value="left" name={`winner-${props.pos}-${props.idx}`} checked={winner === "left"} readOnly />
                    <span>Left</span>
                    <input type="radio" value="right" name={`winner-${props.pos}-${props.idx}`} checked={winner === "right"} readOnly />
                    <span>Right</span>
                </div>
            ) : (
                ""
            )}
            <div className={`rowType ${props.type.toLowerCase()}`}>{props.type}</div>
        </div>
    );
};

const Col = (props) => {
    const controllerData = useContext(ControllerDataContext);

    return (
        <div className={`previewCol ${props.pos}`}>
            {[...Array(controllerData.nBans).keys()].map((idx) => (
                <Row pos={props.pos} idx={idx} type="BAN" key={idx} />
            ))}
            {[...Array(Math.ceil((controllerData.bestOf - 1) / 2)).keys()].map((idx) => (
                <Row pos={props.pos} idx={idx} type="PICK" key={idx} />
            ))}
        </div>
    );
};

const StatusBoard = (props) => {
    return (
        <div className="container statusBoard">
            <div className="colContainer">
                <Col pos="left" />
                <Col pos="right" />
            </div>
            <TB />
        </div>
    );
};

export default StatusBoard;
