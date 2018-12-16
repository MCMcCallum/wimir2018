import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as mm from '@magenta/music';

class App extends Component {
///
/// This class encapsulates a drum pattern generator.
///

  constructor(props) 
  ///
  /// Here we initialize state variables and load the model.
  ///
  {
    super(props);

    // Bind methods.
    this.handleNewDrums = this.handleNewDrums.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.stopped = this.stopped.bind(this);
    this.continuePlaying = this.continuePlaying.bind(this);

    // Initisalize state.
    this.state = {
      loading: true,
      playing: false,
      stopping: false
    };

    // Create drum pattern generator
    this.config_beat = {
      noteHeight: 6,
      pixelsPerTimeStep: 20,  // like a note width
      noteSpacing: 1,
      noteRGB: '8, 41, 64',
      activeNoteRGB: '240, 84, 119',
    };
    this.vae_model = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_nade_9_q2');
    this.vae_model.initialize()
      .then(() => this.setState({loading: false}))
      .then(() => this.handleNewDrums());
  }

  continuePlaying()
  ///
  /// Play one iteration of the drum loop.
  ///
  {
    this.viz_player_vae.start(this.drum_samples, 120.0);
  }

  handleNewDrums() 
  ///
  /// This function is to be called every time we want a new
  /// drum pattern. It creates a new visualizer and loads the
  /// drum samples into it.
  ///
  {
    return new Promise((resolve, reject) => {
      this.vae_model.sample(1)
        .then((samples) => {
          this.drum_samples = samples[0];
          var viz_vae = new mm.Visualizer(this.drum_samples, document.getElementById('vaecanvas'), this.config_beat);
          this.viz_player_vae = new mm.Player(false, {
            run: (note) => viz_vae.redraw(note),
            stop: () => {
              if(!this.state.stopping){
                this.continuePlaying();
              } else {
                this.stopped();
              }
            }
          });
        })
        .then(() => resolve());
    });
  }

  handlePlay() 
  ///
  /// Start playback.
  ///
  {
    this.setState({
      playing: true,
      stopping: false
    });
    this.continuePlaying();
  }

  handleStop()
  ///
  /// Stop playback.
  ///
  {
    if(this.state.playing)
    {
      this.setState({stopping: true})
    }
  }

  stopped()
  ///
  /// Set state when stopping is complete.
  ///
  {
    this.setState({
      playing: false,
      stopping: false
    });
  }

  render() 
  ///
  /// Render the HTML. This provides HTML content, based
  /// on the state in this JavaScript object, to render
  /// in a web browser.
  ///
  {
    return (
      <div className="App">
        <div hidden={!this.state.loading}>
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            Loading...
          </header>
        </div>
        <div hidden={this.state.loading}>
          <div className="PlayControls">
            <button className="transport_controls" onClick={this.handlePlay} disabled={this.state.playing} data-toggle="button"><b>Play Loop</b></button>
            <button className="transport_controls" onClick={this.handleStop} disabled={!this.state.playing} data-toggle="button"><b>{this.state.stopping ? "Stopping..." : "Stop Loop"}</b></button>
          </div>
          <div className="Beat">
            <canvas id="vaecanvas"></canvas>
            <br/>
            <button className="control" onClick={this.handleNewDrums} disabled={this.state.recording || this.state.playing} data-toggle="button"><b>Shuffle Beat</b></button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;