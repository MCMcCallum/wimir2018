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

    // Initisalize state.
    this.state = {
      loading: true
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

  handleNewDrums() 
  ///
  /// This function is to be called every time we get a new
  /// drum pattern. It creates a new visualizer and loads the
  /// drum samples into it.
  ///
  {
    return new Promise((resolve, reject) => {
      this.vae_model.sample(1)
        .then((samples) => {
        var drum_samples = samples[0];
        var viz_vae = new mm.Visualizer(drum_samples, document.getElementById('vaecanvas'), this.config_beat);
        })
        .then(() => resolve());
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
          <div className="Beat">
            <canvas id="vaecanvas"></canvas>
          </div>
        </div>
      </div>
    );
  }
}

export default App;