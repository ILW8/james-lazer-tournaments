import "../styles/Notes.css";

const Notes = () => {
    return <div className="container notes">
        <ul>
            <li>Left click a slot to select it</li>
            <li>Click outside to deselect any slot</li>
            <li>While a slot is selected, click on a map on the mappool to set the map for that slot</li>
            <li>Right click a slot to remove the map from that slot</li>
        </ul>
    </div>;
};

export default Notes;
