import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import ForwardIcon from "@material-ui/icons/Forward";
import Grid from "@material-ui/core/Grid";
import Canvas from "./Canvas";
import Card from "@material-ui/core/Card";
import Container from "@material-ui/core/Container";
import { useState } from "react";

// fix stupid javascript modulo bug
function mod(n, m) {
  return ((n % m) + m) % m;
}

// ---- Here is only Game of Life Logic

const GameProperties = {
  CELLS_X: 100,
  CELLS_Y: 100,
}

class Generation {
  constructor(previous_generation = null) {
    this.cells = this.makeArray(GameProperties.CELLS_X, GameProperties.CELLS_Y, TYPE.DEAD);
    if (previous_generation) {
      this.advance(previous_generation);
    }
  }

  makeArray(w, h, val) {
    var arr = [];
    for (let i = 0; i < h; i++) {
      arr[i] = [];
      for (let j = 0; j < w; j++) {
        arr[i][j] = val;
      }
    }
    return arr;
  }
  
  add_blinker() {
    this.cells[(3, 2)] = TYPE.NEW;
    this.cells[(3, 3)] = TYPE.NEW;
    this.cells[(3, 4)] = TYPE.NEW;
  }

  neighbours(x, y) {
    let n = 0;
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        if (i !== 0 && j !== 0) {
          if (
            this.cells[mod(x + i, GameProperties.CELLS_X)][
              mod(y + i, GameProperties.CELLS_Y)
            ] === TYPE.NORMAL ||
            this.cells[mod(x + i, GameProperties.CELLS_X)][
              mod(y + i, GameProperties.CELLS_Y)
            ] === TYPE.NEW
          )
            n++;
        }
    return n;
  }

  advance(previous_generation) {
    for (let x = 0; x < this.cells.length; x++) {
      for (let y = 0; y < this.cells.length; y++) {
        let n = previous_generation.neighbours(x, y);
        if (
          previous_generation.cells[x][y] === undefined ||
          previous_generation.cells[x][y] === TYPE.DEAD ||
          previous_generation.cells[x][y] === TYPE.DYING
        ) {
          if (n == 3) {
            this.cells[x][y] = TYPE.NEW;
          }
        } else {
          if (n === 2 || n === 3) {
            this.cells[x][y] = TYPE.NORMAL;
          } else {
            this.cells[x][y] = TYPE.DYING;
          }
        }
      }
    }
  }
}

class Game {
  constructor() {
    this.generations = [];
    this.generations[0] = new Generation();
    this.generations[0].add_blinker();
  }
  get_latest_generation() {
    return this.generations[this.generations.length - 1];
  }
  get_generation_count() {
    return this.generations.length;
  }
  advance() {
    this.generations[this.generations.length] = new Generation(
      this.get_latest_generation()
    );
  }
}

const TYPE = {
  DEAD: 0,
  NORMAL: 1,
  NEW: 2,
  DYING: 3,
};

// --------------


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: 10,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  controller: {},
  generation_label: {},
  world: {
    padding: 10,
  },
}));

// --------------

function World(props) {
  const classes = useStyles();
  const g = props.generation;

  const draw = (ctx, frameCount) => {
    ctx.clearRect(0, 0, ctx.canvas.width + 2, ctx.canvas.height + 2);
    ctx.lineWidth = 1;
    for (let x = 0; x <= GameProperties.CELLS_X; x++) {
      ctx.beginPath();
      ctx.moveTo(x * props.pixelsPerCell + 1, 0);
      ctx.lineTo(x * props.pixelsPerCell + 1, ctx.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= GameProperties.CELLS_Y; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * props.pixelsPerCell + 1);
      ctx.lineTo(ctx.canvas.width, y * props.pixelsPerCell + 1);
      ctx.stroke();
    }
    for (let x = 0; x < GameProperties.CELLS_X; x++) {
      for (let y = 0; y <= GameProperties.CELLS_Y; y++) {
        if (g.cells[x][y] === TYPE.NORMAL || g.cells[x][y] === TYPE.NEW) {
          ctx.beginPath();
          ctx.rect(
            x * props.pixelsPerCell,
            y * props.pixelsPerCell,
            (x + 1) * props.pixelsPerCell,
            (y + 1) * props.pixelsPerCell
          );
          ctx.stroke();
        }
      }
    }
  };

  return (
    <Canvas
      draw={draw}
      width={GameProperties.CELLS_X * props.pixelsPerCell + 2}
      height={GameProperties.CELLS_Y * props.pixelsPerCell + 2}
    />
  );
}

function Controller(props) {
  const classes = useStyles();
  const advance = props.advance;
  return (
    <Grid className={classes.controller} container spacing={2}>
      <Grid item>
        <IconButton aria-label="advance" onClick={advance}>
          <ForwardIcon />
        </IconButton>
      </Grid>
      <Grid item>
        <Typography
          variant="h5"
          display="block"
          className={classes.generation_label}
        >
          Generation {props.index}
        </Typography>
      </Grid>
    </Grid>
  );
}

function App() {
  const classes = useStyles();
  const [game, setGame] = useState(new Game());
  const [generation, setGeneration] = useState(game.get_latest_generation());

  const advance = () => {
    game.advance();
    setGeneration(game.get_latest_generation());
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Game Of Life
          </Typography>
        </Toolbar>
      </AppBar>

      <Card className={classes.root}>
        <Controller index={game.get_generation_count()} advance={advance} />
        <World generation={generation} pixelsPerCell={10} />
      </Card>
    </div>
  );
}

export default App;
