from fastapi import FastAPI, HTTPException, Query, Body
#Used for data validation and parsing
from pydantic import BaseModel
#BaseModel
#Lets you define a clear schema
#Automatically validates data to their type, e.g. ensures a team is a str type
#Converts Json input into a Python object you can easily work with
from fastapi.middleware.cors import CORSMiddleware
import json
# this is to save your data into a json file
import os
#this will let you save files within your system

TRADES_FILE = "trades.json"

def load_trades():
    if not os.path.exists(TRADES_FILE):
        return []
    with open(TRADES_FILE, "r") as f:
        return json.load(f)

def save_trades(trades):
    with open(TRADES_FILE, "w") as f:
        json.dump(trades, f, indent=2)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TradeProposal(BaseModel):
    team: str
    players: list[str]
#This class defines what your API expects when a client sends the data in a post request like api/trade
 
@app.post("/api/trade")
def submit_trade(trade: TradeProposal):
    trades = []
    if os.path.exists(TRADES_FILE):
        with open(TRADES_FILE, "r") as f:
            try:
                trades = json.load(f)
            except json.JSONDecodeError:
                trades = []

    # ✅ Find max existing player ID
    existing_ids = [
        player["id"]
        for t in trades
        for player in t["players"]
    ]
    next_id = max(existing_ids, default=0) + 1

    # ✅ Assign unique IDs to new players
    players_with_ids = []
    for player_name in trade.players:
        players_with_ids.append({
            "id": next_id,
            "name": player_name
        })
        next_id += 1

    # ✅ Add trade with player objects
    trades.append({
        "team": trade.team,
        "players": players_with_ids
    })

    # Save back to file
    with open(TRADES_FILE, "w") as f:
        json.dump(trades, f, indent=2)

    return {"message": "Trade submitted", "trade": trades[-1]}




@app.get("/api/tradesview")
def view_trades():
    trade = []
    if os.path.exists(TRADES_FILE):
        with open(TRADES_FILE, "r") as f:
            try:
                trade = json.load(f)
                return(trade)
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="File not Okay")

@app.delete("/api/tradesview")
def delete_player(player_id: int = Query(...)):
    trades = load_trades()
    updated_trades = []

    for trade in trades:
        # Remove the player from the trade
        new_players = [p for p in trade["players"] if p["id"] != player_id]

        if len(new_players) > 0:
            # Keep trade if players remain
            trade["players"] = new_players
            updated_trades.append(trade)
        else:
            # Skip adding this trade (i.e., delete it)
            continue

    if len(updated_trades) == len(trades):
        raise HTTPException(status_code=404, detail="Player not found")

    save_trades(updated_trades)
    return {"message": "Player deleted successfully"}


    
@app.put("/api/tradesview")
def update_player_name(
    player_id: int = Query(...),
    data: TradeProposal = Body(...)
):
    trades = load_trades()
    for trade in trades:
        for player in trade["players"]:
            if player["id"] == player_id:
                player["name"] = data.players[0]
                save_trades(trades)  # Save changes to the file
                return {"message": "Player updated", "trade": trade}
    
    raise HTTPException(status_code=404, detail="Player not found")

    

# this return just sends back the JSON response
# basically echos back what data the user sent to the POST
#

# @app.get("/api/message")
# def getmessage():
#     return {"message": "Hello World!"}

