
const { invoke } = window.__TAURI__.tauri;
const assets_path = "assets/";

async function build_board(board_dim, board_length) {

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
  canvas.style.position = "relative";
  document.querySelector("#container").appendChild(canvas);

  let ctx = canvas.getContext("2d");
  ctx.canvas.width  = board_length;
  ctx.canvas.height = board_length;
  ctx.canvas.top_left_x = 0;
  ctx.canvas.top_left_y = 0;
  let square_length = board_length / board_dim;

  for (var i = 0; i < board_dim; i++) {
      for (var j = 0; j < board_dim; j++) {
        
        ctx.beginPath();
        ctx.lineWidth = "2";
        ctx.rect(i*square_length, j*square_length, square_length, square_length);
        ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
        ctx.fill();
        ctx.strokeStyle = "black";  
        ctx.stroke();
        let label = (board_dim*board_dim) - (j*board_dim + (board_dim-i));
        let add_to_pos = square_length / 4;
        ctx.font = "15px Arial";
        ctx.fillStyle = "black";
        ctx.fillText(label.toString(), add_to_pos + i*square_length, add_to_pos + j*square_length); 

      }
  }

}

async function build_sliders(items, type, board_dim, board_length) {

  // receive an array of ladders or snakes of shape [[start, end], [start, end], ...]
  // draw the items on the array 

  let square_length = board_length / board_dim;
  let canvas = document.querySelector("#board_canvas");
  let asset = assets_path + type + ".png";
  let ctx = canvas.getContext("2d");

  for (var i = 0; i < items.length; i++) {

    let start = items[i][0];
    let end = items[i][1];

    // top left x y computation
    let y_end = board_length - (board_length * (Math.floor(end / board_dim) / board_dim)) - (square_length / 2);
    let x_end = board_length * ((end % board_dim) / board_dim) + (square_length / 2);
    let y_start = board_length - (board_length * (Math.floor(start / board_dim) / board_dim)) - (square_length / 2);
    let x_start = board_length * ((start % board_dim) / board_dim) + (square_length / 2);
    let top_left_x = Math.min(x_start, x_end);
    let top_left_y = Math.min(y_start, y_end);
    let bottom_right_x = Math.max(x_start, x_end);
    let bottom_right_y = Math.max(y_start, y_end);

    // rotation computation
    let adjacent = bottom_right_y - top_left_y;
    let opposite = bottom_right_x - top_left_x; 
    let hypotenuse = Math.sqrt(adjacent*adjacent + opposite*opposite);
    let angle_radians = Math.acos(adjacent/hypotenuse);
    let angle_degress = angle_radians * 180 / Math.PI;
    if (x_start > x_end) {
      angle_degress = 360 - angle_degress;
    }
    let rotation = (angle_degress * Math.PI) / 180;

    // width and height computations
    let height = hypotenuse;
    let width = square_length / 2;

    var img = new Image();
    img.src = asset;

    img.onload = function () {

      ctx.save();
      ctx.translate(x_end, y_end);
      ctx.rotate( rotation );
      ctx.drawImage(img, 0, 0, width, height);
      ctx.restore();

    };

  }

}

async function build_players(n) {
  
  // make n players (typical n=2) 

  let canvas = document.querySelector("#board_canvas");
  let container = document.querySelector("#container");

  // receive number of players and build img objects
  for (var i = 0; i < n; i ++ ) {
    
    // height position
    let top = (canvas.height - 50).toString() + "px";
    let left = (10 + (i * 2.5 * 10)).toString() + "px";

    let player_id = i;
    let asset = assets_path + "player" + player_id + ".png";
    
    let player = document.createElement('img');
    player.src = asset;
    player.width = "20";
    player.height = "20";
    player.style.position = "absolute";
    player.style.top = top;
    player.style.left = left;
    player.id = player_id;
    container.appendChild(player);
  }

}

function make_draggable(element, dist_rect) {

  return new Promise ( (resolve, _reject) => {

  // https://www.w3schools.com/howto/howto_js_draggable.asp
  // dist_rec: {x, y, width, height}
  let base_x=0;
  let base_y=0;
  let old_x=0;
  let old_y=0;
  let new_x=0;
  let new_y=0;

  element.onmousedown = drag_mouse_down;

  function drag_mouse_down(e) {

    e.preventDefault();
    old_x = e.clientX;
    old_y = e.clientY;

    base_x = element.style.left;
    base_y = element.style.top;

    document.onmouseup = release;
    document.onmousemove = drag;

  }

  function drag(e) {

    e.preventDefault();

    new_x = old_x - e.clientX;
    new_y = old_y - e.clientY;
    old_x = e.clientX;
    old_y = e.clientY;
  
    element.style.top = (element.offsetTop - new_y) + "px";
    element.style.left = (element.offsetLeft - new_x) + "px";


  }

  function release(e) {

    document.onmouseup = null;
    document.onmousemove = null;

    //let x_cond = (dist_rect.x < e.pageX) && (e.pageX < dist_rect.x + dist_rect.width);
    //let y_cond = (dist_rect.y < e.pageY) && (e.pageY < dist_rect.y + dist_rect.height);
    let x_bound_check = x_bounds(e.pageX, dist_rect.x, dist_rect.width);
    let y_bound_check = y_bounds(e.pageY, dist_rect.y, dist_rect.height);

    if (x_bound_check && y_bound_check) {
      resolve("success");
    } else {
      element.style.top = base_y;
      element.style.left = base_x;
    }

  }


  })



}

function x_bounds(x, left_bound, width) {
  return (left_bound < x) && (x < (left_bound + width))
}

function y_bounds(y, top_bound, height) {
  return (top_bound < y) && (y < (top_bound + height))
}

async function build_dice() {

  let container = document.querySelector("#container");
  
  // create a line for user interaction, something like
  // user roll button --- label  ... turn ...  comp label

  let roll_container = document.createElement("div");
  roll_container.id = "dice_container";
  roll_container.style.display = "flex";
  roll_container.style.flexDirection = "row";
  roll_container.style.columnGap = "100px";
  container.appendChild(roll_container);

  let roll_button = document.createElement("button");
  roll_button.type = "button";
  roll_button.innerHTML = "Roll!";
  roll_button.id = "roll_button";
  roll_button.style.width = "100px";
  roll_container.appendChild(roll_button);

  let roll_show = document.createElement("label");
  roll_show.innerHTML = "";
  roll_show.id = "roll_show";
  roll_container.appendChild(roll_show);
  
  let roll_comp = document.createElement("label");
  roll_comp.innerHTML = "";
  roll_comp.id = "roll_comp";
  roll_container.appendChild(roll_comp);
  

}

function square_to_x(square, board_dim, board_length) {
 
  let x = board_length * ((square % board_dim) / board_dim);
  return x
  
}

function square_to_y(square, board_dim, board_length) {
 
  let y = board_length - (board_length * (Math.floor(square / board_dim) / board_dim));
  return y
  
}

function get_dist_rect(current_value, dice_value, board_dim, board_length) {

  let dist_square = current_value + dice_value;
  let square_length = board_length / board_dim;
  
  let y = square_to_y(dist_square, board_dim, board_length) - square_length;
  let x = square_to_x(dist_square, board_dim, board_length);

  let dist_rect = {
    x: x,
    y: y,
    width: square_length,
    height: square_length
  };

  return dist_rect

}

function delay_game(delay_period) {
  new Promise(resolve => setTimeout(resolve, delay_period));
}

function move_element(element, dist_rect) {

  return new Promise((resolve, reject) => {

    let dist_x = dist_rect.x + dist_rect.width / 2;
    let dist_y = dist_rect.y;
    let margin_x = dist_x - parseFloat(element.style.left);
    let margin_y = dist_y - parseFloat(element.style.top);
  
    let x_step = margin_x > 0 ? 1 : -1;
    let y_step = x_step*(margin_y/margin_x);
    var move = setInterval(function() {
  
      element.style.left = `${parseFloat(element.style.left) + x_step}px`;
      element.style.top = `${parseFloat(element.style.top) + y_step}px`;
  
      let x_cond = x_bounds(parseFloat(element.style.left), dist_rect.x, dist_rect.width);
      let y_cond = y_bounds(parseFloat(element.style.top), dist_rect.y, dist_rect.height);
  
      if (x_cond && y_cond) {
        clearInterval(move);
        resolve("success");
      }
  
    }, 10);
  
  })



}

async function bust_on_item(element, current_position, new_position, board_dim, board_length) {

  // check if position updated by backend, if so slide it to new location
  if (current_position === new_position) {
    return
  }

  let square_length = board_length / board_dim;
  let y = square_to_y(new_position, board_dim, board_length) - square_length;
  let x = square_to_x(new_position, board_dim, board_length);

  let dist_position = {x: x, y: y, width: square_length, height: square_length};
  let _ = await move_element(element, dist_position);

}

window.addEventListener("DOMContentLoaded", async function () {

  container = document.querySelector("#container");
  let board_dim = 10;
  let board_length = 600;
  let n_players = 2;
  let delay_period = 3000;

  document.querySelector("#start_button").addEventListener("click", async function (e) {

    // retrive serialized board from backend
    let board = await invoke('init_game').then((response) => response ).catch((e) => console.error(e));

    // build initial screen (board, snakes, ladders, draggable players, dice, etc)
    e.preventDefault();
    await build_board(board_dim, board_length);
    build_sliders(board.ladders, "ladders", board_dim, board_length);
    build_sliders(board.snakes, "snakes", board_dim, board_length);
    build_dice();
    build_players(n_players);

    // play a turn while game doesn't end
    let is_win = await invoke('is_win', {board_length: board_length}).then((response) => response ).catch((e) => console.error(e));
    do {
      
      // draw a dice value and switch to next player
      let roll_value = await invoke('draw_turn').then((response) => response).catch((e) => console.error(e));
      let next_player = await invoke('switch_player').then((response) => response).catch((e) => console.error(e));
      let player_position = await invoke('get_player_position').then((response) => response).catch((e) => console.error(e));

      // compute this player position and distination
      let player_element = document.getElementById(next_player.toString());
      let distination_rect = get_dist_rect(player_position, roll_value, board_dim, board_length);

      // update backend states for new position
      await invoke('advance', {step_size: roll_value});

      if (next_player === 0) {

          // if next is user : wait for roll button press, show value, make pawn draggable ..
          
          let _ = await new Promise( (resolve, _reject) => {

            document.querySelector("#roll_button").addEventListener("click", async function (e) {

              // show rolled value to user
              document.querySelector("#roll_show").innerHTML = roll_value;

              // make pawn draggable so that the user can move it to distination
              // this is also in promise, to wait until succesful movement
              let _ = await make_draggable(player_element, distination_rect);
                  
              resolve("success");

            });


          } );


      } else {

          // else : move opponent pawn to distination
          // We want to show the rolled dice, wait, then move the pawn smoothly 

          // show rolled value to user
          document.querySelector("#roll_comp").innerHTML = roll_value;

          // move smooth
          let _ = await move_element(player_element, distination_rect);

      }

      // backend check for position bust with snakes / ladders and update
      // backend sends back the new position. If it is the same as it was, not bust
      let new_position = await invoke('slider_bust').then((response) => response ).catch((e) => console.error(e));
      bust_on_item(player_element, player_position + roll_value, new_position, board_dim, board_length);

      // delay game before continuing
      let _ = await delay_game(delay_period);

      is_win = await invoke('is_win', {board_length: board_length}).then((response) => response ).catch((e) => console.error(e));


    }
    while ( !is_win );

    // highlight next turn player?


  });

});
