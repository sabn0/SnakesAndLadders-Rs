
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


fn main() {
    tauri::Builder::default()
        .manage(BoardState::default())
        .invoke_handler(tauri::generate_handler![init_game, draw_turn])
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
        let players = (0..=1).into_iter().map(|i| Player {position: 1, player_id: i }).collect::<Vec<Player>>();
        let next = players.choose(&mut rand::thread_rng()).unwrap().player_id;

        Board { ladders: ladders, snakes: snakes, players: players, next: next, dice: Dice{} }
    }
}

trait GameActions {
    fn step(&mut self);
    fn win(&self) -> bool;
    fn switch(&mut self);
    fn play(&mut self);
}

impl GameActions for Board {

    fn step(&mut self) {
        todo!()
    }

    fn win(&self) -> bool {
        todo!()
    }

    fn switch(&mut self) {
        self.next = 1 - self.next;
    }

    fn play(&mut self) {
        todo!()
    }
}