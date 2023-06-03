# SnakesAndLadders-Rs

![rust version](https://img.shields.io/badge/rust-1.69.0-blue)
![Tauri version](https://img.shields.io/badge/Tauri-1.3-orange)

An implementatation of the famous and popular snakes and ladders game, as a desktop app.\
Ladders and snakes are generated randomaly every time the game is initialized.
<br><br>
<img src="https://github.com/Sabn0/SnakesAndLadders-Rs/blob/main/src/assets/demo.gif" width="300" height="350">

## How to play
First you need to have [Rust](https://doc.rust-lang.org/book/ch01-01-installation.html) and npm on your machine.
Then run (on linux):
```
git clone https://github.com/Sabn0/SnakesAndLadders-Rs.git
cd SnakesAndLadders-Rs
npm install
npm run tauri dev
```

I also attached an sh script above. Required 2.3 GB when built on my local machine.

## Software
Programmed using the amazing [Tauri](https://github.com/tauri-apps/tauri) framework:
* Rust (vs 1.69.0) for the backend.
* JavaScript, HTML and CSS for the frontend.

## References
The dice implementation was heavily based on the nice tutorial [here](https://lenadesign.org/2020/06/18/roll-the-dice/).

## License
Under [MIT license](https://github.com/Sabn0/SnakesAndLadders-Rs/blob/main/LICENSE-MIT) and [Apache License, Version 2.0](https://github.com/Sabn0/SnakesAndLadders-Rs/blob/main/LICENSE-APACHE).
