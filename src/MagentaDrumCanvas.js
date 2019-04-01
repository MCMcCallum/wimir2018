import React, { Component } from 'react';
import * as mm from '@magenta/music';

var DEFAULT_NOTE_CANVAS = {
    notes: [
        {pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true},
        {pitch: 51, quantizedStartStep: 31, quantizedEndStep: 32, isDrum: true},
    ],
    totalQuantizedSteps: 32,
    quantizationInfo: {stepsPerQuarter: 4}
};

class MagentaDrumCanvas extends Component
///
/// This class encapsulates a playable drum pattern generator.
///
{

    constructor(props) 
    ///
    /// Here we initialize state variables and load the drum machine.
    ///
    {
        super(props);

        // Bind methods to this class where necessary.
        this.handleNewDrums = this.handleNewDrums.bind(this);

        // Initialize state.
        this.state = {
            enabled: true
        };

        // Create drum pattern generator.
        this.config_beat = {
            noteHeight: 6,
            pixelsPerTimeStep: 20,  // like a note width
            noteSpacing: 1,
            noteRGB: '8, 41, 64',
            activeNoteRGB: '240, 84, 119',
        };
        this.vae_model = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_nade_9_q2');
    }

    initialize(ready_callback, play_callback)
    ///
    /// Loads the drum pattern generator and sets a callback to be triggered once a
    /// single drum loop has been played back. Typically, loading the model takes a
    /// moment.
    ///
    /// @param ready_callback:
    ///     The callback to be called once the model is loaded and the drum pattern
    ///     generator is operational.
    ///
    /// @param play_callback:
    ///     The callback to be called at the end of each iteration of a drum loop.
    ///
    {
        // Create drum VAE
        this.viz_vae = new mm.PianoRollCanvasVisualizer(DEFAULT_NOTE_CANVAS, document.getElementById('vaecanvas'), this.config_beat);
        this.viz_player_vae = new mm.Player(false, {
            run: (note) => this.viz_vae.redraw(note),
            stop: () => { play_callback(); }
        });
        
        // Initialize model and populate with drums
        this.vae_model.initialize()
            .then(() => this.handleNewDrums())
            .then(() => ready_callback());
    }

    continuePlaying()
    ///
    /// To be called for every time the drum loop is to be played back once.
    ///
    {
        this.viz_player_vae.start(this.drum_samples, 120.0);
    }

    enableControls(enable)
    ///
    /// Enables / disables any component controls for user interactivity.
    ///
    /// @param enable:
    ///     True enables controls for the user, whilst false disables the controls.
    ///
    {
        this.setState({enabled: enable})
    }

    handleNewDrums() 
    ///
    /// This function is to be called every time we want a new
    /// drum pattern. It creates a new visualizer and loads the
    /// drum samples into it.
    ///
    /// @return:
    ///     A promise that is fulfilled when the vae_model has been repopulated with drum samples.
    ///
    {
        return this.vae_model.sample(1)
            .then(samples => {
                this.drum_samples = samples[0];
                console.log(this.drum_samples);
                this.viz_vae.noteSequence = this.drum_samples;
                this.viz_vae.redraw();
            })
    }

    render() 
    ///
    /// Render the HTML. This provides HTML content, based
    /// on the state in this JavaScript object, to render
    /// in a web browser.
    ///
    /// @return:
    ///     React jsx formatting.
    ///
    {
        return (
            <div className="Rhythm">
                <div style={{position:'relative'}}>
                    <div className="SectionBackground">
                        RHYTHM
                    </div>
                    <canvas id="vaecanvas"></canvas>
                    <br/>
                </div>
                <br/>
                <button className="Button" onClick={this.handleNewDrums} disabled={!this.state.enabled} data-toggle="button"><i className="fas fa-random"></i> SHUFFLE</button>
            </div>
        );
    }
}

export default MagentaDrumCanvas;
