
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// backend uses tauri commands on top of home-made game logic 
use tauri::State;
use std::{sync::{Mutex, Arc}, error::Error, fmt::Display};
use serde::Serialize;
use rand::{self, seq::{IteratorRandom, SliceRandom}, Rng};


fn main() {
    tauri::Builder::default()
        .manage(BoardState::default())
        .invoke_handler(tauri::generate_handler![
            init_game, 
            draw_turn, 
            switch_player, 
            is_win, 
            advance, 
            get_player_position, 
            slider_bust
        ])
        .run(tauri::generate_context!())
        .expect("error while running the application");
}

// A struct that locks a Board structure that handles the logic and states
#[derive(Default)]
struct BoardState(Arc<Mutex<Board>>);

// tauri commands
// these commands are invoked from the frontend side and use the game logic
#[tauri::command(rename_all = "snake_case")]
fn init_game(board_state: State<'_, BoardState>) -> Result<Board, BoardStateError> {

    // this commands returns the initialized board with default parameters
    match board_state.0.lock() {
        Ok(board) => return Ok(board.clone()),
        Err(_) => return Err(BoardStateError::BoardLockError)
    };
}

#[tauri::command(rename_all = "snake_case")]
fn draw_turn(board_state: State<'_, BoardState>) -> Result<usize, BoardStateError> {

    // this command invokes the board's dice's draw functioanlity and returns a new dice value

    let board = match board_state.0.lock() {
        Ok(board) => board,
        Err(_) => return Err(BoardStateError::BoardLockError)
    };
    let roll_value = board.dice.draw();
    Ok(roll_value)
}

#[tauri::command(rename_all = "snake_case")]
fn switch_player(board_state: State<'_, BoardState>) -> Result<usize, BoardStateError> {

    // this command invokes the board's switch functionality and returns the id of the next player

    let mut board = match board_state.0.lock() {
        Ok(board) => board,
        Err(_) => return Err(BoardStateError::BoardLockError)
    };
    
    board.switch();
    let next_player = board.next.unwrap(); // safe to unwrap, potential error returned by switch
    Ok(next_player)

}

#[tauri::command(rename_all = "snake_case")]
fn is_win(board_state: State<'_, BoardState>, finish_line: usize) -> Result<bool, BoardStateError> {

    // this command invokes the board's win functionality and returns the answer (is end game)
    // based on the end point of the board

    let board = match board_state.0.lock() {
        Ok(board) => board,
        Err(_) => return Err(BoardStateError::BoardLockError)
    };

    let end_game = board.win(finish_line)?;
    Ok(end_game)
}

#[tauri::command(rename_all = "snake_case")]
fn advance(board_state: State<'_, BoardState>, step_size: usize) -> Result<(), BoardStateError> {

    // this command invokes the board's step functionality that updates the board's player's position
    // based on the given step size

    let mut board = match board_state.0.lock() {
        Ok(board) => board,
        Err(_) => return Err(BoardStateError::BoardLockError)
    };
    board.step(step_size)
}

#[tauri::command(rename_all = "snake_case")]
fn get_player_position(board_state: State<'_, BoardState>) -> Result<usize, BoardStateError> {

    // this command invokes the board's current player position field and return the position

    let board = match board_state.0.lock() {
        Ok(board) => board,
        Err(_) => return Err(BoardStateError::BoardLockError)
    };
    board.this_player_position()
}

#[tauri::command(rename_all = "snake_case")]
fn slider_bust(board_state: State<'_, BoardState>) -> Result<usize, BoardStateError> {

    // this command invokes the board's bust functionality and returns the new position

    let mut board = match board_state.0.lock() {
        Ok(board) => board,
        Err(_) => return Err(BoardStateError::BoardLockError)
    };
    board.bust()?;
    board.this_player_position()
}

////////////////
// Game logic //
////////////////

// Dice implements a draw functionality to retrieve a random number of dice roll
#[derive(Clone, Serialize)]
struct Dice;

// Player has a player id which is unique, and a positions on the board
#[derive(Clone, Serialize)]
struct Player {
    player_id: usize,
    position: usize
}

// Board has the vital states of the game, including ladders and snakes positions on the board (start, end) vecs,
// players vec, the current player (next) and the dice object. Board needs to implement serialize, as it is returend
// to the frontend to draw the players, snakes, ladders etc.
#[derive(Clone, Serialize)]
pub struct Board {
    ladders: Vec<(usize, usize)>,
    snakes: Vec<(usize, usize)>,
    players: Vec<Player>,
    next: Option<usize>,
    dice: Dice
}

// The trait that defines the behavior of a Dice
trait Roll {
    fn draw(&self) -> usize;
}

impl Roll for Dice {
    fn draw(&self) -> usize {
        rand::thread_rng().gen_range(1..=6)
    }
}

// Board implements Default, which is used when the app is initialized
impl Default for Board {

    fn default() -> Self {
        
        // these parameters should be from somewhere else if possible
        let board_dim = 10;
        let n = 2*2*4; // have 4 snakes and 4 letters
        let item_limit = (board_dim*board_dim) -1; // don't allow snake / ladder on last + first squares

        let sort_pair = |a: usize, b: usize| -> (usize, usize) { if a > b { (b, a) } else { (a, b) } };

        // sample ladders and snakes positions from 1..board_dim**2
        let positions = (1..item_limit).choose_multiple(&mut rand::thread_rng(), n);
        let (ladders, snakes): (Vec<(usize, usize)>, Vec<(usize, usize)>) = positions.chunks(2*2).map(|quad| {
            (sort_pair(quad[0], quad[1]), sort_pair(quad[2], quad[3]))
        }).unzip();

        // generate two players
        let players = (0..=1).into_iter().map(|i| Player {position: 0, player_id: i }).collect::<Vec<Player>>();

        Board { ladders: ladders, snakes: snakes, players: players, next: None, dice: Dice{} }
    }
}

impl Board {
    fn next_is_some(&self) -> Result<usize, BoardStateError> {
        match self.next {
            Some(next) => Ok(next),
            None => return Err(BoardStateError::NextPlayerError)
        }
    }

    fn this_player_position(&self) -> Result<usize, BoardStateError> {
        Ok(self.players[self.next_is_some()?].position)
    }
}

// The behavior Board must implement for the game logic
trait GameActions {
    // should check the current position of the current player against the entries of snakes and ladders and update if needed
    fn bust(&mut self) -> Result<(), BoardStateError>;
    // should promote the current player's position a step of value
    fn step(&mut self, value: usize) -> Result<(), BoardStateError>;
    // should check if the position of the current player exceeds the finish_line
    fn win(&self, finish_line: usize) -> Result<bool, BoardStateError>;
    // should switch to the next player
    fn switch(&mut self);
}

impl GameActions for Board {

    fn bust(&mut self) -> Result<(), BoardStateError> {
        
        let next = self.next_is_some()?;
        let current_position = self.players[next].position;
        
        // check for ladders bust and update
        if let Some(index) = self.ladders.iter().position(|&x| x.0 == current_position) {
            self.players[next].position = self.ladders[index].1;
        }

        // check for snakes fall and update
        if let Some(index) = self.snakes.iter().position(|&x| x.1 == current_position) {
            self.players[next].position = self.snakes[index].0;
        }

        Ok(())

    }

    fn step(&mut self, value: usize) -> Result<(), BoardStateError> {
        let next = self.next_is_some()?;
        self.players[next].position += value;
        Ok(())
    }

    fn win(&self, finish_line: usize) -> Result<bool, BoardStateError> {
        let next = self.next_is_some()?;
        let is_win = self.players[next].position >= finish_line;
        Ok(is_win)
    }

    fn switch(&mut self) {

        // switch either switches between players or initalizes for the first time
        let next = match self.next_is_some() {
            Ok(next) => 1 - next,
            Err(_) => self.players.choose(&mut rand::thread_rng()).unwrap().player_id
        };
        self.next = Some(next);

    }

}


// Simple implementation of custom error for BoardState
#[derive(Debug, Serialize)]
pub enum BoardStateError {
    BoardLockError, // if the board can't be locked before some command exe
    NextPlayerError // if the next player is not initialized but used
}

impl Display for BoardStateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        
        match self {
            BoardStateError::BoardLockError => write!(f, "BoardStateError: failed to lock board game object during invoked command"),
            BoardStateError::NextPlayerError => write!(f, "BoardStateError: next player is used, but next player is none")
        }
    }
}

impl Error for BoardStateError { }
