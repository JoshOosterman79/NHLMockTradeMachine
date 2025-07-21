
import React, { useEffect, useState } from "react";

function App() {
    const [players, setPlayers] = useState("");
    const [team, setTeam] = useState("");
    const [trades, setTrades] = useState([]);
    const [response, setResponseText] = useState("");
    const [newPlayerName, setNewPlayerName] = useState("");

useEffect(() => {
fetch('http://localhost:8000/api/tradesview')
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    setTrades(data);
})
.catch(err => {
setResponseText(err);
});

}, []);


// response stores the backend's response after submitting the form
    const handleSubmit = async (e) => {
        e.preventDefault();
//stops the form from reloading the page
            try {
                const response = await fetch("http://localhost:8000/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    team: team,
                    players: players.split(",").map(p =>p.trim())
                    // sends a POST request to the FastAPI server
                    // Tells the server. "Here's some JSON data"
                    // Converts the string from the input field into a real array of strings
                }),
            });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const json = await response.json();
                setResponseText(JSON.stringify(json, null, 2));
                //Converts HTTP response to JS Object, then stores as a String
                // Null, 2 in .Stringify() "pretty-prints" the object
            } catch (err) {
                setResponseText("Error sending trade proposal");
            }
        }; 
 
  const handleDelete = async (player_id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tradesview?player_id=${player_id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      // Update state
      setTrades((prevTrades) =>
        prevTrades
          .map((trade) => ({
            ...trade,
            players: trade.players.filter((p) => p.id !== player_id),
          }))
          .filter((trade) => trade.players.length > 0)
      );
    } catch (err) {
      console.error(err);
    }
  };

const handleUpdate = async (playerId) => {
  const newName = newPlayerName[playerId];
  try {
    const response = await fetch(
      `http://localhost:8000/api/tradesview?player_id=${playerId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team: "", // or some placeholder value
          players: [newName],
        }),
      }
    );
    if (!response.ok) throw new Error("Update Failed");
    const result = await response.json();
    console.log("Trade Updated!", result);
  } catch (err) {
    console.error(err);
  }
};



    return (
    <div>
            <form onSubmit={handleSubmit}>
    <label>Team Name:</label>
    <input value={team} onChange = {(e) => setTeam(e.target.value)} />
     <br />
    <label>Players (comma seperated):</label>
    <input value={players} onChange={(e) => setPlayers(e.target.value)} />
    <br />
    <button type="submit">Submit Trade</button>
    </form>
    <pre>{response}</pre>
      {trades.map((trade) => (
        <ul key={trade.id}>
          {trade.players.map((player) => (
            <li key={player.id}>
              <span>{player.name}</span>
              <button onClick={() => handleDelete(player.id)}>Delete</button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(player.id);
                }}
                style={{ display: "inline", marginLeft: "10px" }}
              >
                <input
                  type="text"
                  placeholder="New name"
                  value={newPlayerName[player.id] || ""}
                  onChange={(e) =>
                    setNewPlayerName((prev) => ({ ...prev, [player.id]: e.target.value }))
                  }
                />
                <button type="submit">Update</button>
              </form>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
};

export default App;



