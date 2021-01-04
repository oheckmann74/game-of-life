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
import EditIcon from "@material-ui/icons/Edit";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Slider from "@material-ui/core/Slider";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import FastForwardIcon from "@material-ui/icons/FastForward";
import StopIcon from "@material-ui/icons/Stop";

// fix stupid javascript modulo bug
function mod(n, m) {
  return ((n % m) + m) % m;
}

// ---- Here is only Game of Life Logic

const GameProperties = {
  CELLS_X: 25,
  CELLS_Y: 25,
};

class Generation {
  constructor(previous_generation = null) {
    this.cells = this.makeArray(
      GameProperties.CELLS_X,
      GameProperties.CELLS_Y,
      TYPE.DEAD
    );
    if (previous_generation) {
      this.advanceFrom(previous_generation);
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
    // TODO generalize
    this.cells[3][2] = TYPE.NEW;
    this.cells[3][3] = TYPE.NEW;
    this.cells[3][4] = TYPE.NEW;
  }

  neighbours(x, y) {
    let n = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i === 0 && j === 0)) {
          if (
            this.cells[mod(x + i, GameProperties.CELLS_X)][
              mod(y + j, GameProperties.CELLS_Y)
            ] === TYPE.NORMAL ||
            this.cells[mod(x + i, GameProperties.CELLS_X)][
              mod(y + j, GameProperties.CELLS_Y)
            ] === TYPE.NEW
          )
            n++;
        }
      }
    }
    return n;
  }

  advanceFrom(previous_generation) {
    for (let x = 1; x < this.cells.length; x++) {
      for (let y = 1; y < this.cells.length; y++) {
        let n = previous_generation.neighbours(x, y);
        if (
          previous_generation.cells[x][y] === undefined ||
          previous_generation.cells[x][y] === TYPE.DEAD ||
          previous_generation.cells[x][y] === TYPE.DYING
        ) {
          if (n === 3) {
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
    this.generations.push(new Generation());
    this.generations[0].add_blinker();
  }
  getLatestGeneration() {
    return this.getGeneration(this.getLatestGenerationIndex());
  }
  getLatestGenerationIndex() {
    return this.generations.length;
  }
  getGeneration(num) {
    return this.generations[num - 1];
  }
  advanceGeneration(fromIndex = null) {
    const from = fromIndex || this.getLatestGenerationIndex();
    if (from !== this.getLatestGenerationIndex()) {
      // we are advancing from not the latest generation and have to delete all other generations
      this.generations.splice(fromIndex, this.generations.length - fromIndex);
    }
    this.generations.push(new Generation(this.getGeneration(from)));
    return this.getLatestGenerationIndex();
  }
}

const TYPE = {
  DEAD: 0,
  NEW: 1,
  NORMAL: 2,
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
  generation_label: {
    align: "right",
  },
  world: {
    padding: 10,
  },
}));

// --------------

function World(props) {
  const classes = useStyles();
  const g = props.generation;

  const draw = (ctx, frameCount) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let x = 0; x < GameProperties.CELLS_X; x++) {
      for (let y = 0; y <= GameProperties.CELLS_Y; y++) {
        if (g.cells[x][y] !== TYPE.DEAD) {
          ctx.beginPath();
          if (props.colors) {
            if (g.cells[x][y] === TYPE.NEW) {
              ctx.fillStyle = "#555555";
            } else if (g.cells[x][y] === TYPE.NORMAL) {
              ctx.fillStyle = "black";
            } else if (g.cells[x][y] === TYPE.DYING) {
              ctx.fillStyle = "#DDDDDD";
            }
          } else {
            ctx.fillStyle = "black";
            if (g.cells[x][y] === TYPE.DYING) {
              ctx.fillStyle = "#FFFFFF";
            }
          }
          ctx.fillRect(
            x * props.pixelsPerCell + 1,
            y * props.pixelsPerCell + 1,
            props.pixelsPerCell,
            props.pixelsPerCell
          );
          ctx.stroke();
        }
      }
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
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
  };

  const clickHandler = (event) => {
    const x = Math.floor(event.nativeEvent.offsetX / props.pixelsPerCell);
    const y = Math.floor(event.nativeEvent.offsetY / props.pixelsPerCell);
    if (
      props.generation.cells[x][y] === TYPE.DEAD ||
      props.generation.cells[x][y] === TYPE.DYING
    ) {
      props.generation.cells[x][y] = TYPE.NEW;
    } else {
      props.generation.cells[x][y] = TYPE.DYING;
    }
  };

  return (
    <Canvas
      draw={draw}
      width={GameProperties.CELLS_X * props.pixelsPerCell + 2}
      height={GameProperties.CELLS_Y * props.pixelsPerCell + 2}
      onClick={props.editable ? clickHandler : ""}
    />
  );
}

function App() {
  const classes = useStyles();
  const [game, setGame] = useState(new Game());

  const [state, setState] = useState({
    editable: true,
    colors: false,
    running: false,
  });

  const [generationIndex, setGenerationIndex] = useState(
    game.getLatestGenerationIndex()
  );

  const step = () => {
    setGenerationIndex(game.advanceGeneration(generationIndex));
  };

  const flipEditable = () => {
    setState({ ...state, editable: !state.editable });
  };

  const flipColors = () => {
    setState({ ...state, colors: !state.colors });
  };

  const handleSliderChange = (event, newValue) => {
    setGenerationIndex(newValue);
  };

  const stop = () => {
    clearInterval(state.interval);
    setState({ ...state, running: false, interval: null });
  };

  const start = () => {
    step();
    let interval = setInterval(() => {
      setGenerationIndex(game.advanceGeneration());
    }, 1000);
    setState({ ...state, running: true, interval: interval });
  };

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
          <Typography variant="h6" className={classes.generation_label}>
            Generation {generationIndex}
          </Typography>
        </Toolbar>
      </AppBar>

      <Card className={classes.root}>
        <Grid className={classes.controller} container spacing={2}>
          <Grid item>
            <Button aria-label="run" onClick={state.running ? stop : start}>
              {state.running ? <StopIcon /> : <FastForwardIcon />}
              {state.running ? "Stop" : "Start"}
            </Button>
          </Grid>

          <Grid item>
            <Button
              aria-label="step"
              onClick={step}
              disabled={state.running ? true : false}
            >
              <SkipNextIcon />
              Step
            </Button>
          </Grid>

          <Grid item>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.editable}
                    onChange={flipEditable}
                    name="editable"
                  />
                }
                label="Edit Mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={state.colors}
                    onChange={flipColors}
                    name="colors"
                  />
                }
                label="Colors"
              />
            </FormGroup>
          </Grid>
        </Grid>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <Slider
              value={generationIndex}
              onChange={handleSliderChange}
              aria-labelledby="generation-slider"
              min={1}
              max={game.getLatestGenerationIndex()}
            />
          </Grid>
          <Grid item xs={2}>
            <Typography margin="dense">{generationIndex}</Typography>
          </Grid>
        </Grid>

        <World
          generation={game.getGeneration(generationIndex)}
          pixelsPerCell={20}
          editable={state.editable}
          colors={state.colors}
        />
      </Card>
    </div>
  );
}
export default App;
