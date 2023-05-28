
const { invoke } = window.__TAURI__.tauri;

async function build_screen(board_dim, board_length) {

  // leave us with empty screen
  document.querySelector("#start_screen").remove();

  // random colors
  let colors = Array(
    "BurlyWood", 
    "Chocolate", 
    "Wheat", 
    "Coral", 
    "DarkGoldenRod", 
    "DarkOrange", 
    "Gold", 
    "GoldenRod", 
    "Orange", 
    "OrangeRed", 
    "Yellow"
  );

  // create a colored square for every position on the board
  let canvas = document.createElement("canvas");
  canvas.id = "board_canvas";
  document.querySelector("#container").appendChild(canvas);

  let ctx = canvas.getContext("2d");
  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  let square_length = board_length / (board_dim);

  for (var i = 0; i < board_dim; i++) {
      for (var j = 0; j < board_dim; j++) {
        
        ctx.beginPath();
        ctx.lineWidth = "2";
        ctx.rect(i*square_length, j*square_length, square_length, square_length);
        ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
        ctx.fill();
        ctx.strokeStyle = "black";  
        ctx.stroke();

      }
  }

}

async function build_sliders(items) {
  // 
}

async function build_players(n) {
  //
}

window.addEventListener("DOMContentLoaded", () => {

  container = document.querySelector("#container");
  let board_dim = 10;
  let board_length = 600;

  document.querySelector("#start_button").addEventListener("click", (e) => {

    e.preventDefault();
    build_board(board_dim, board_length);

  });

});
