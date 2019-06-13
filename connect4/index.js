
const http = require('http')
const WebSocket = require('ws')
const fs = require('fs')


gamenumber = 0
games = {0: []}
gameStates = {}
watchers = {}
clientStates = {}

const readFile = file => new Promise((resolve, reject) => fs.readFile(file, (err, data) => err?reject(err):resolve(data)))

const server = http.createServer(async (request, response) =>
    response.end(await readFile((request.url=='/client.js'?'./client.js':'./index.html')))).listen(8080)

const makeMove = (move, data, color) => {
    for(i =  data[move].length ; i != 0; i--){
        if(data[move][i-1] == "lightgrey"){
            data[move].splice(i-1, 1, color)
            return true
        }
    }
    return false
}

const win = (data, color, moveCol) => {
    moveRow = -1
    check = 0
    //calculate row
    // vertical
    for(j = 0; j<data[0].length; j++){
        if(data[moveCol][j] == color){
            if(!(moveRow+1))
                moveRow = j
            check++
            if(check >= 4){
                console.log("Won")
                return true
            }
        }
        else{
            check = 0
        }
    }
    //horizontal
    check = 0
    for(j = 0; j<data.length; j++){
        if(data[j][moveRow] == color){
            check++
            if(check >= 4){
                console.log("Won")
                return true
            }
        }
        else{
            check = 0
        }
    } 
    //diagonal
    check = 0
    for(i = moveCol-4, j = moveRow-4; i< data.length && j < data[0].length; i++,j++  ){
        if(i < 0 || j < 0)
            continue

        if(data[i][j] == color){
            check ++
            if(check >= 4){
                console.log("Won")
                return true
            }
        }
        else
            check = 0
    }
    check = 0
    for(i = moveCol-4, j = moveRow+4; i< data.length && j >= 0; i++,j--  ){
        if(i < 0 || j > data[0].length)
            continue

        if(data[i][j] == color){
            check ++
            if(check >= 4){
                console.log("Won")
                return true
            }
        }
        else
            check = 0
    }

    return false
}

const playGame = (ws1) => {
    games[gamenumber].push(ws1)
    console.log("A Player joined")
    if (games[gamenumber].length == 2) {
        p1 = games[gamenumber][0]
        p2 = games[gamenumber][1]
        watchers[gamenumber] = []
        id = gamenumber
        gamenumber++
        games[gamenumber] = []
        console.log("2 players paired. Game Started")
        data = {
            "id" : gamenumber,
            "player": 0,
            "win": 0,
            "turn": 0, 
            "matrix":[["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],]}
        gameStates[gamenumber-1] = data
        p1Turn = 1
        p2Turn = 0
        gameStates[id]["turn"] = 1
        gameStates[id]["player"] = 1
        p1.send(JSON.stringify(gameStates[id]))
        gameStates[id]["turn"] = 0
        gameStates[id]["player"] = 2
        p2.send(JSON.stringify(gameStates[id]))
        clientStates[p1._socket.remoteAddress + ":" + p1._socket.remotePort] = {"otherPlayer": p2, "p1Turn": p1Turn, "p2Turn": p2Turn, "id": id, "player": 1}
        clientStates[p2._socket.remoteAddress + ":" + p2._socket.remotePort] = {"otherPlayer": p1, "p1Turn": p1Turn, "p2Turn": p2Turn, "id": id, "player": 2}

    }
}

const wss = new WebSocket.Server({server})
wss.on('connection', ws1 => {
    ws1.on('message', m => {
        msg = JSON.parse(m)
        if(msg["type"] == "menu"){
            if(msg["input"] == 1){
                playGame(ws1)
            }
            else{
                ws1.send(JSON.stringify(Object.keys(gameStates)))
            }

        }
        else if (msg["type"] == "watch"){
            watchers[msg["input"]].push(ws1)
            ws1.send(JSON.stringify(gameStates[msg["input"]]))
        }
        else if (msg["type"] == "quitWatch"){
            watchers[msg["input"][0]].splice(msg["input"][1])
        }
        else if (msg["type"] == "play"){
            clientId = ws1._socket.remoteAddress + ":" + ws1._socket.remotePort
            id = clientStates[clientId]["id"]
            p1 = clientStates[clientId]["player"] == 1? ws1: clientStates[clientId]["otherPlayer"]
            p2 = clientStates[clientId]["player"] == 2? ws1: clientStates[clientId]["otherPlayer"]
            color = clientStates[clientId]["player"] == 1? "red": "blue"
            p1Turn = clientStates[clientId]["player"] == 1? 0: 1
            p2Turn = clientStates[clientId]["player"] == 1? 1: 0
            turn = clientStates[clientId]["player"] == 1? p2Turn: p1Turn
            clientId2 = clientStates[clientId]["otherPlayer"]._socket.remoteAddress + ":" + clientStates[clientId]["otherPlayer"]._socket.remotePort
            move = msg["input"]
            if(move == -1){
                gameStates[id]["win"] = color == "red"? 2: 2
                clientStates[clientId]["otherPlayer"].send(JSON.stringify(gameStates[id]))
                for(i = 0; i < watchers[id].length; i++){
                    watchers[id][i].send(JSON.stringify(gameStates[id]))
                }
                delete gameStates[id]
                delete clientStates[clientId]
                delete clientStates[clientId2]
                delete watchers[id]
                delete games[id]
            }
            else if(turn){
                makeMove(move, gameStates[id]["matrix"], color)
                clientStates[clientId]["p1Turn"] = p1Turn
                clientStates[clientId]["p2Turn"] = p2Turn
                clientStates[clientId2]["p1Turn"] = p1Turn
                clientStates[clientId2]["p2Turn"] = p2Turn
                if(win(gameStates[id]["matrix"], color, move))
                    gameStates[id]["win"] = color == "red"? 1: 2
                gameStates[id]["turn"] = p1Turn
                gameStates[id]["player"] = 1
                p1.send(JSON.stringify(gameStates[id]))
                gameStates[id]["turn"] = p2Turn
                gameStates[id]["player"] = 2
                p2.send(JSON.stringify(gameStates[id]))
                for(i = 0; i < watchers[id].length; i++){
                    watchers[id][i].send(JSON.stringify(gameStates[id]))
                }
                if(gameStates[id]["win"] != 0){
                    delete gameStates[id]
                    delete clientStates[clientId]
                    delete clientStates[clientId2]
                    delete watchers[id]
                    delete games[id]

                }


            }
        }
    
    })
})

            
