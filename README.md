# SnakesAndLadders-Rs

![rust version](https://img.shields.io/badge/rust-1.69.0-blue)
![Tauri version](https://img.shields.io/badge/Tauri-1.3-orange)

An implementatation of the famous and popular snakes and ladders game, as a desktop app.\
Ladders and snakes are generated randomaly every time the game is initialized.
<!-- ![demo](https://github.com/Sabn0/SnakesAndLadders-Rs/assets/45892555/77fd9cf5-1120-4919-a741-1624d93662fb) -->
<img src="https://github.com/Sabn0/SnakesAndLadders-Rs/assets/45892555/77fd9cf5-1120-4919-a741-1624d93662fb" width="300" height="350">

## How to play
Requires Rust and npm. In order to play (on linux):
```
git clone https://github.com/Sabn0/SnakesAndLadders-Rs.git
cd SnakesAndLadders-Rs
npm install
npm run tauri dev
```

I also attached an sh script above.

## Software
Programmed using the amazing [Tauri](https://github.com/tauri-apps/tauri) framework:
* Rust (vs 1.69.0) for the backend.
* JavaScript, HTML and CSS for the frontend. 

## References
The dice implementation was heavily based on the nice implementation [here](https://lenadesign.org/2020/06/18/roll-the-dice/).

## License
Under [MIT license]() and [Apache License, Version 2.0]().
