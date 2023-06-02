
// trying to generate real dice

const { invoke } = window.__TAURI__.tauri;
const assets_path = "assets/";

async function build_board(board_dim, board_length) {

  // leave us with empty screen
  document.querySelector("#start_screen").remove();
  // document.querySelector("#bg_logo").remove();
  document.querySelector("#bg_logo").style.display = "none";

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
  canvas.setAttribute("class", "board_canvas");
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

async function build_players(n, board_dim, board_length) {
  
  // make n players (typical n=2) 
  let container = document.querySelector("#container");
  let square_length = board_length / board_dim;
  let side_pad = [square_length/8, 3*square_length/8];
  let players = [];

  // receive number of players and build img objects
  for (var i = 0; i < n; i ++ ) {
    
    let player = document.createElement('img');
    player.id = i;
    player.setAttribute("class", "player");

    player.src = assets_path + "player" + player.id + ".png";
    player.width = square_length / 2;
    player.height = square_length / 2;
    player.style.top = `${board_length - square_length}px`;
    player.style.left = `${0}px`;
    player.style.position = "absolute";

    //player.style.border = "2px solid black"; // for debug
    player.style.padding = `${square_length / 4}px`;
    player.style.paddingLeft = `${side_pad[i]}px`;
    player.style.paddingRight = `${side_pad[1-i]}px`;

    players.push(player);
  }

  // append to container in reverse order
  for (var i= (n-1); i>=0; i--) {
    container.appendChild(players[i]);
  }

}

async function show_dice_area() {

  // change the dice containr from not visible to ...
  let dice_container = document.querySelector("#dice_container");
  dice_container.style.display = "inline-flex";
  document.querySelector("#container").appendChild(dice_container);
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

    let x_bound_check = x_bounds(e.pageX, dist_rect.x, dist_rect.width);
    let y_bound_check = y_bounds(e.pageY, dist_rect.y, dist_rect.height);

    if (x_bound_check && y_bound_check) {
        resolve("success")
    } else {
      element.style.top = base_y;
      element.style.left = base_x;
    
    }

  }

  })

}

function flip_arrow(next_player) {
  if (next_player === 0) {
    document.querySelector("#left").style.color = "black";
    document.querySelector("#right").style.color = "white";
  } else {
    document.querySelector("#right").style.color = "black";
    document.querySelector("#left").style.color = "white";
  }
}

function get_different_random_value(except_value) {
  let random_value = 1 + Math.floor(Math.random() * 6);
  return (random_value === except_value) ? get_different_random_value(except_value) : random_value
}

async function change_roll(roll_value) {

  let random_value = get_different_random_value(roll_value);
  await update_roll(random_value, 2000, 750);
  await update_roll(roll_value, 2000, 2000)
}

function update_roll(roll_value, timeout, resolve_timeout) {

  return new Promise ( (resolve, _reject) => {

    function roll() {
      
      for (var i = 1; i <= 6; i++) {
        document.querySelector("#dice").classList.remove(`display_${i}`);
        if (i === roll_value) {
          document.querySelector("#dice").classList.add(`display_${roll_value}`);
        }
      }
          
    }

    setTimeout(roll(), timeout);
    setTimeout(resolve, resolve_timeout);

  });

}

function x_bounds(x, left_bound, width = null) {
  // null for automatic, width for manual (user)
  if (width == null) {
    let epsilon = 2;
    return (((left_bound - epsilon) < x) && (x < (left_bound + epsilon)))
  } else {
    return ((left_bound < x) && (x < (left_bound + width)));
  }
}

function y_bounds(y, top_bound, height = null) {
  // null for automatic, width for manual (user)
  if (height == null) {
    let epsilon = 2;
    return (((top_bound - epsilon) < y) && (y < (top_bound + epsilon)))
  } else {
    return ((top_bound < y) && (y < (top_bound + height)));
  }
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

  // if the current value + dice value is witin the board, do this is dist
  // if not, take the finish line

  let dist_square = Math.min(current_value + dice_value, -1 + board_dim*board_dim);
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
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, delay_period);
  })
}

function move_element(element, dist_rect) {

  return new Promise((resolve, _reject) => {
    
    let margin_x = dist_rect.x - parseFloat(element.style.left);
    let margin_y = dist_rect.y - parseFloat(element.style.top);

    // the steps are defined by the larger margin for slow speed
    let x_step;
    let y_step;
    if (Math.abs(margin_x) >= Math.abs(margin_y)) {
      x_step = margin_x >= 0 ? 1 : -1;
      y_step = x_step * (margin_y / margin_x);
    } else {
      y_step = margin_y >= 0 ? 1 : -1;
      x_step = y_step * (margin_x / margin_y);
    }

    var move = setInterval(function() {
  
      element.style.left = `${parseFloat(element.style.left) + x_step}px`;
      element.style.top = `${parseFloat(element.style.top) + y_step}px`;
  
      let x_cond = x_bounds(parseFloat(element.style.left), dist_rect.x, null);
      let y_cond = y_bounds(parseFloat(element.style.top), dist_rect.y, null);
      
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

function end_game(winning_player) {

  // remove all content in container div
  let container = document.querySelector("#container");
  document.querySelector("#bg_logo").style.display = "inline";
  while (container.lastChild.id != "bg_logo") {
    container.removeChild(container.lastChild);
  }
  container.style.textAlign = "center";

  let message = document.createElement("label");
  message.innerHTML = "";
  message.id = "end_msg";
  message.style.fontSize = "50px";
  message.style.alignSelf = "center";
  message.style.marginTop = "100px";
  message.style.position = "absolute";
  container.appendChild(message);

  if (winning_player === 0) {
    message.innerHTML = "You won ! ";
  } else {
    message.innerHTML = "You lost :( ";
  }

}

window.addEventListener("DOMContentLoaded", async function () {

  container = document.querySelector("#container");

  document.querySelector("#start_button").addEventListener("click", async function (e) {

    // retrive serialized board from backend
    let board = await invoke('init_game').then((response) => response ).catch((e) => console.error(e));
    console.log(board);
    let board_dim = board.measures.board_dim;
    let board_length = board.measures.board_length;
    let n_players = board.players.length;
    let snakes = board.snakes;
    let ladders = board.ladders;

    // build initial screen (board, snakes, ladders, draggable players, dice, etc)
    e.preventDefault();
    await build_board(board_dim, board_length);
    build_sliders(ladders, "ladders", board_dim, board_length);
    build_sliders(snakes, "snakes", board_dim, board_length);
    show_dice_area();
    build_players(n_players, board_dim, board_length);

    // play a turn while game doesn't end
    let next_player;
    let is_win;
    do {
      
      // draw a dice value and switch to next player
      let roll_value = await invoke('draw_turn').then((response) => response).catch((e) => console.error(e));
      next_player = await invoke('switch_player').then((response) => response).catch((e) => console.error(e));
      let player_position = await invoke('get_player_position').then((response) => response).catch((e) => console.error(e));

      // compute this player position and distination
      flip_arrow(next_player);
      let player_element = document.getElementById(next_player.toString());
      let distination_rect = get_dist_rect(player_position, roll_value, board_dim, board_length);

      // update backend states for new position
      await invoke('advance', {step_size: roll_value}).then().catch((e) => console.error(e));

      if (next_player === 0) {

          // if next is user : wait for roll button press, show value, make pawn draggable ..
          
          await new Promise( (resolve, _reject) => {

            document.querySelector("#roll_button").addEventListener("click", async function (e) {

              // show rolled value to user
              await change_roll(roll_value);

              // make pawn draggable so that the user can move it to distination
              // this is also in promise, to wait until succesful movement
              await make_draggable(player_element, distination_rect);

              resolve("success");

            }, {once: true});

          });

      } else {

          // else : move opponent pawn to distination
          // We want to show the rolled dice, wait, then move the pawn smoothly 

          // show rolled value to user
          await change_roll(roll_value);

          // move smooth
          await move_element(player_element, distination_rect);


      }

      // backend check for position bust with snakes / ladders and update
      // backend sends back the new position. If it is the same as it was, not bust
      let new_position = await invoke('slider_bust').then((response) => response ).catch((e) => console.error(e));
      await bust_on_item(player_element, player_position + roll_value, new_position, board_dim, board_length);

      // delay game for 0.5 second before continuing
      await delay_game(500);

      is_win = await invoke('is_win').then((response) => response ).catch((e) => console.error(e));

    }
    while ( !is_win );

    
    // print win / lose message on screen
    await delay_game(250);
    end_game(next_player);

  });

});
