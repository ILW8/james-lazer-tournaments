import { useContext, useRef, useEffect } from "react";

import { ControllerDataContext } from "../App";
import "../styles/TeamSelector.css";
const TeamSelector = (props) => {
    const controllerData = useContext(ControllerDataContext);
    const clickRef = useRef(null);
    const outsideRef = useRef(null);

    const die = () => {
        controllerData.setShowTeamSelector({
            show: false,
            forTeam: "",
        });
    };

    const handleClick = (e) => {
        if (outsideRef.current?.contains(e.target) && !clickRef.current?.contains(e.target)) die();
    };

    useEffect(() => {
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, []);

    return (
        <div className="teamSelector" ref={outsideRef}>
            <div className="teamList" ref={clickRef}>
                <div className="exit">
                    <button
                        style={{
                            backgroundImage: `url(/static/close.png)`,
                        }}
                        onClick={die}
                    ></button>
                </div>
                {controllerData.mappoolData.teamList.map((team, idx) => {
                    return (
                        <div
                            className="team"
                            key={idx}
                            onClick={() => {
                                if (["Left", "Right"].includes(controllerData.showTeamSelector.forTeam)) {
                                    controllerData[`setTeam${controllerData.showTeamSelector.forTeam}`](idx);
                                    console.log(controllerData.showTeamSelector.forTeam)
                                    die();
                                }
                            }}
                        >
                            <div
                                className="teamAvatar"
                                style={{
                                    backgroundImage: `url(http://127.0.0.1:24050/ResCupOverlay/team/${team.teamIconURL})`,
                                }}
                            ></div>
                            <div className="teamName"> {team.teamName}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamSelector;
