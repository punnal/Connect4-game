const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

new Vue({
    template: `
        <div>
            <div v-bind:style = 'page'>
            <div v-bind:style = 'header'><img :src = 'logo'></div>
                <div v-if= 'toggle == 0' v-bind:style = "{'margin-bottom': '15px'}">
                <div v-for= '(o, i) in options' v-bind:style = "{'width': '100px','height': '50px','background-color':o[1], 'margin' : 'auto', 'margin-bottom' : '20px', 'text-align': 'center', 'vertical-align': 'middle'}" v-on:click = "menuSelect(o)" v-on:mouseover = "o.splice(1, 1, '#FFCF9E')" v-on:mouseleave = "o.splice(1, 1, 'orange')"><h2 v-bind:style ="{'color' : 'white', 'margin': 'auto'}">{{o[0]}}</h2></div>  
                </div>
                <div v-if= 'toggle == 2' v-bind:style = "{'margin-bottom': '15px'}">
                <div v-for= '(o, i) in watch' v-bind:style = "{'width': '100px','height': '50px','background-color':o[1], 'margin' : 'auto', 'margin-bottom' : '20px', 'text-align': 'center', 'vertical-align': 'middle'}" v-on:click = "gameSelect(o)" v-on:mouseover = "o.splice(1, 1, '#FFCF9E')" v-on:mouseleave = "o.splice(1, 1, 'orange')"><h2 v-bind:style ="{'color' : 'white', 'margin': 'auto'}">Game ID: {{o[0]}}</h2></div>  
                </div>

                <div v-if= 'toggle == 1' v-bind:style = 'board'>
                
                <div v-bind:style= 'col' v-for='(r,i) in gameMatrix' v-on:click = 'updatematrix(i)' v-on:mouseover = "changeColor(i)" v-on:mouseleave = "correctColor(i)">
                    <div v-bind:style="{'width': '100%','height': '100%','background-color':colColors[i]}" >
                    <div v-bind:style= 'row' v-for = 'c in gameMatrix[i]'>
                        <div v-bind:style="{'border-radius': '40px','width': '100%','height': '100%','background-color':c}" ></div>
                    </div>
                    </div>
                </div>
            </div>
            <div v-if= 'toggle == 1' v-bind:style = "{'width': '100px','height': '50px','background-color':'orange', 'margin' : 'auto', 'margin-bottom' : '20px', 'text-align': 'center', 'vertical-align': 'middle'}" v-on:click = "quit"><h2 v-bind:style ="{'color' : 'white', 'margin': 'auto'}">Quit</h2></div>  
            
            <div v-if= 'toggle == 1 && watchMode == false' v-bind:style = "messagebox">
                <p>{{message}}</p>
            </div>
            </div>
        </div>`

,
    data: {
        page:
        {
            'background-color': 'yellow',
            'height': '100%',
            'width':'100%',
        },
        header:
        {
            'margin':'auto',
            'margin-bottom': '100px',
            'text-align': 'center',
        },
        board:
        {
            'border': '2px solid #FFCF9E',
            'background-color':'orange',
            'width':'364px',
            'height':'302px',
            'margin':'auto',
            'margin-bottom': '100px',
        },
        col:
        {
            'border': '1px solid #FFCF9E',
            'background-color':'orange',
            'width':'50px',
            'height':'300px',
            'margin':'auto',
            'float': 'left',
        },
        row:
        {
            'width':'45px',
            'height':'45px',
            'border-radius': '40px',
            'border': '2.5px solid orange',
            'margin':'auto',
        },
        messagebox:
        {
            'border': '2px solid black',
            'padding': '5px',
            'width':'500px',
            'height':'100px',
            'margin':'auto',
            'text-align': 'center',
        },
        options : [["Play", "orange"], ["Watch", "orange"]],
        watch: [],
        colColors : ["orange", "orange", "orange", "orange", "orange", "orange", "orange"],
        gameMatrix : [["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],],
        watchMode : false,
        watching : -1,
        toggle : 0,
        player: 0,
        turn : 0,
        data: {},
        message: 'Waiting...',
        ws: new WebSocket('ws://localhost:8080'),
        logo: 'http://www.shuffle.cards/assets/images/licenses/connect4/header_logo.png',
    },
    methods: {
        updatematrix(c) {
            console.log(c)
            console.log(this.turn)
            if(this.turn){
                this.ws.send(JSON.stringify({"type":"play","input":c}))
            }
            else
                this.message = "Invalid Move!!!"
        },
        menuSelect(o){
            console.log(o[0])
            if(o[0] == "Play"){
                this.toggle = 1
                this.ws.send(JSON.stringify({"type":"menu","input":1}))
            }
            else if(o[0] == "Watch"){
                console.log("here")
                this.toggle = 2
                this.ws.send(JSON.stringify({"type":"menu","input":2}))
            }
        },
        gameSelect(o) {
            this.watchMode = true
            this.ws.send(JSON.stringify({"type":"watch","input":o[0]}))
            this.watching = o[0]
            this.toggle = 1
        },
        win(data, color, moveCol) {
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
                        return true
                    }
                }
                else
                    check = 0
            }   

            return false
        },
        makeMove(move, color) {
            for(i =  this.gameMatrix[move].length ; i != 0; i--){
                if(this.gameMatrix[move][i-1] == "lightgrey"){
                    this.gameMatrix[move].splice(i-1, 1, color)
                    return true
                }
            }
            return false
        },
        cancelMove(move, color) {
            for(i = 0 ; i < this.gameMatrix[move].length; i++){
                if(this.gameMatrix[move][i] == color){
                    this.gameMatrix[move].splice(i, 1, "lightgrey")
                    return true
                }
            }
            return false
        },
        changeColor(i) {
            if(this.watchMode == true)
                    this.colColors.splice(i, 1, "green")
            else{
                color = this.player == 2? "red": "blue"
                this.makeMove(i, color)
                if(this.win(this.gameMatrix, color, i))
                    this.colColors.splice(i, 1, "red")
                else
                    this.colColors.splice(i, 1, "green")
                this.cancelMove(i, color)
            }
        },
        correctColor(i) {
            this.colColors.splice(i, 1, "orange")
        },
        reset(){
            this.watch = []
            this.colColors = ["orange", "orange", "orange", "orange", "orange", "orange", "orange"]
            this.gameMatrix = [["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],
                      ["lightgrey","lightgrey","lightgrey","lightgrey","lightgrey","lightgrey"],]
            this.watchMode = false
            this.watching = -1
            this.toggle = 0
            this.player = 0
            this.turn =  0
            this.data = {}
            this.message = 'Waiting...'
            console.log("done")
        },
        quit(){
            if(this.watchMode == true){
                this.watchMode = false                
                this.ws.send(JSON.stringify({"type":"quitWatch","input":[this.watching, this.player - 2]}))
                this.reset()
            }
            else{
                this.ws.send(JSON.stringify({"type":"play","input":-1}))
                this.reset()
            }
        },
    
    },
    mounted() {
        this.ws.onmessage = e => {
            if(this.toggle == 1){
                this.data = JSON.parse(e.data)
                this.gameMatrix = this.data["matrix"]
                this.player = this.data["player"]
                this.turn = this.data["turn"]
                if(this.player == this.data["win"]){
                    this.message = "You Won"
                    setTimeout(() => this.reset(), 5000);
                }
                else if(this.data["win"] == 0){
                    if(this.turn)
                        this.message = "Your Turn"
                    else
                        this.message = "Opponent's Turn"
                }
                else{
                    this.message = "You lose"
                    setTimeout(() => this.reset(), 5000);
                }
            }
            else if(this.toggle == 2){
                this.watch = []
                keys = JSON.parse(e.data)
                for(i = 0; i < keys.length; i++){
                    this.watch.push([keys[i], "orange"])
                }
            }
        }       

    },
}).$mount('#root')
