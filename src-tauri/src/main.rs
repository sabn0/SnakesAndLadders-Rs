
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


fn main() {
    tauri::Builder::default()
        .manage(BoardState::default())
        .invoke_handler(tauri::generate_handler![init_game, draw_turn, switch_player, is_win, advance, get_player_position, slider_bust])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

//// tauri commands
#[tauri::command(rename_all = "snake_case")]
fn init_game(board_state: State<'_, BoardState>) -> Result<Board, String> {

    // update board to default and return serialized snakes and ladders
    let default_board = Board::default();
    let mut board = board_state.0.lock().expect("could not lock board game");
    board.ladders = default_board.ladders;
    board.snakes = default_board.snakes;
    board.players = default_board.players;
    board.next = default_board.next;
    board.dice = default_board.dice;

    Ok(board.clone())
}

#[tauri::command(rename_all = "snake_case")]
fn draw_turn(board_state: State<'_, BoardState>) -> usize {

    let board = board_state.0.lock().expect("could not lock board game");
    let roll_value = board.dice.draw();
    roll_value
}

#[tauri::command(rename_all = "snake_case")]
fn switch_player(board_state: State<'_, BoardState>) -> usize {

    let mut board = board_state.0.lock().expect("could not lock board game");
    board.switch();
    board.next

}

#[tauri::command(rename_all = "snake_case")]
fn is_win(board_state: State<'_, BoardState>, finish_line: usize) -> bool {

    let board = board_state.0.lock().expect("could not lock board game");
    board.win(finish_line)
}

#[tauri::command(rename_all = "snake_case")]
fn advance(board_state: State<'_, BoardState>, step_size: usize) {

    let mut board = board_state.0.lock().expect("could not lock board game");
    board.step(step_size);
}

#[tauri::command(rename_all = "snake_case")]
fn get_player_position(board_state: State<'_, BoardState>) -> usize {

    let board = board_state.0.lock().expect("could not lock board game");
    board.players[board.next].position
}

#[tauri::command(rename_all = "snake_case")]
fn slider_bust(board_state: State<'_, BoardState>) -> usize {

    let mut board = board_state.0.lock().expect("could not lock board game");
    board.bust();
    board.players[board.next].position
}

/////////////

use std::{sync::{Mutex, Arc}};
use serde::Serialize;
use tauri::State;
use rand::{self, seq::{SliceRandom, IteratorRandom}, Rng};

// need to implement default and serialize
#[derive(Default)]
struct BoardState(Arc<Mutex<Board>>);

#[derive(Clone, Serialize)]
struct Dice;

#[derive(Clone, Serialize)]
struct Player {
    player_id: usize,
    position: usize
}

// need to implement serialize and clone
#[derive(Clone, Serialize)]
pub struct Board {
    ladders: Vec<(usize, usize)>,
    snakes: Vec<(usize, usize)>,
    players: Vec<Player>,
    next: usize,
    dice: Dice
}

trait Roll {
    fn draw(&self) -> usize;
}

impl Roll for Dice {
    fn draw(&self) -> usize {
        rand::thread_rng().gen_range(1..=6)
    }
}


impl Default for Board {

    fn default() -> Self {

        let board_dim = 10;
        let n = 2*2*3; // have 3 snakes and 3 letters

        let sort_pair = |a: usize, b: usize| -> (usize, usize) { if a > b { (b, a) } else { (a, b) } };

        // sample ladders and snakes positions from 1..board_dim**2
        let positions = (1..board_dim*board_dim).choose_multiple(&mut rand::thread_rng(), n);
        let (ladders, snakes): (Vec<(usize, usize)>, Vec<(usize, usize)>) = positions.chunks(2*2).map(|quad| {
            (sort_pair(quad[0], quad[1]), sort_pair(quad[2], quad[3]))
        }).unzip();

        // generate two players
        let players = (0..=1).into_iter().map(|i| Player {position: 0, player_id: i }).collect::<Vec<Player>>();
        let next = players.choose(&mut rand::thread_rng()).unwrap().player_id;

        Board { ladders: ladders, snakes: snakes, players: players, next: next, dice: Dice{} }
    }
}

trait GameActions {

    fn bust(&mut self);
    fn step(&mut self, value: usize);
    fn win(&self, finish_line: usize) -> bool;
    fn switch(&mut self);
}

impl GameActions for Board {

    fn bust(&mut self) {
        
        let current_position = self.players[self.next].position;
        
        // check for ladders bust and update
        if let Some(index) = self.ladders.iter().position(|&x| x.0 == current_position) {
            self.players[self.next].position = self.ladders[index].1;
        }

        // check for snakes fall and update
        if let Some(index) = self.snakes.iter().position(|&x| x.1 == current_position) {
            self.players[self.next].position = self.snakes[index].0;
        }

    }

    fn step(&mut self, value: usize) {
        self.players[self.next].position += value; 
    }

    fn win(&self, finish_line: usize) -> bool {
        self.players[self.next].position >= finish_line
    }

    fn switch(&mut self) {
        self.next = 1 - self.next;
    }

}