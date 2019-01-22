import React, { Component } from 'react';
import * as mm from '@magenta/music';

var DEFAULT_NOTE_CANVAS = {
    notes: [
        {pitch: 30, startTime: 0.0, endTime: 0.5},
        {pitch: 100, startTime: 3.5, endTime: 4.0},
    ],
    totalTime: 8
};
var FOUND_SOUND_URL = 'audio/sirenshort.wav';
var METRONOME_URL = 'audio/metronome.wav';

class MagentaTranscribeCanvas extends Component
///
/// This class encapsulates a drum pattern generator.
///
{

    constructor(props) 
    ///
    /// Here we initialize state variables and load the audio transcriber.
    ///
    {
        super(props);

        // Bind methods.
        this.handleRecord = this.handleRecord.bind(this);
        this.toggleMetronome = this.toggleMetronome.bind(this);
        this.toggleFoundSound = this.toggleFoundSound.bind(this);
        this.analyzeBuffer = this.analyzeBuffer.bind(this);

        // Initialize state.
        this.state = {
            enabled: true,
            recording: false,
            found_sound_muted: false,
            metronome_muted: false
        };

        // Create some placeholders for audio assets.
        this.metronome_gain = null;
        this.found_sound_gain = null;
        this.trans_samples = null;
        this.found_sound = null;
        this.found_sound_source = null;
        this.metronome_sound = null;
        this.metronome_source = null;
        this.recorder = null;
        this.audio_context = null;

        // Create audio transcriber.
        this.config_transcriber = {
            noteHeight: 6,
            pixelsPerTimeStep: 20,  // like a note width
            noteSpacing: 1,
            noteRGB: '8, 41, 64',
            activeNoteRGB: '112, 201, 198',
        };
        this.transcriber = new mm.OnsetsAndFrames('https://storage.googleapis.com/magentadata/js/checkpoints/transcription/onsets_frames_uni');
    }

    initialize(ready_callback, play_callback)
    ///
    /// Loads the audio transcriber and sets a callback to be triggered once a
    /// single transcription has been played back. Typically, loading the model takes a
    /// moment.
    ///
    /// @param ready_callback:
    ///     The callback to be called once the model is loaded and the transcriber
    ///     is operational.
    ///
    /// @param play_callback:
    ///     The callback to be called at the end of each iteration of a transcription.
    ///
    {
        // Create some volume controls.
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        this.audio_context = new AudioContext();
        this.metronome_gain = this.audio_context.createGain();
        this.metronome_gain.connect(this.audio_context.destination);
        this.found_sound_gain = this.audio_context.createGain();
        this.found_sound_gain.connect(this.audio_context.destination);

        // Initialize recorder
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                this.recorder = new window.MediaRecorder(stream);
                this.recorder.addEventListener('dataavailable', (e) => {
                    requestAnimationFrame(() => requestAnimationFrame(() => this.analyzeBuffer(e.data)));
                    this.loadSample(e.data)
                        .then(decoded_audio => {this.found_sound = decoded_audio;})
                        .then(() => this.setState({recording: false}));
                });
            }, () => {
                console.log('fail');
            });

        // Initialize visualizer and player
        this.viz_transcribe = new mm.Visualizer(DEFAULT_NOTE_CANVAS, document.getElementById('transcribecanvas'), this.config_transcriber);
        this.viz_player_transcribed = new mm.Player(false, {
            run: (note) => this.viz_transcribe.redraw(note),
            stop: () => { play_callback(); }
        });
        
        // Initialize model
        this.transcriber.initialize()
            .then(() => this.loadRemoteAudio(FOUND_SOUND_URL))   // LOADING AUDIO COULD BE PARALELLIZED...
            .then(decoded_audio => {this.found_sound = decoded_audio;})
            .then(() => this.loadRemoteAudio(METRONOME_URL))     // LOADING AUDIO COULD BE PARALELLIZED...
            .then(decoded_audio => {this.metronome_sound = decoded_audio;})
            .then(() => fetch(FOUND_SOUND_URL))                 // LOADING AUDIO COULD BE PARALELLIZED AND FOUND SOUND REUSED HERE...
            .then(res => res.blob())
            .then(blob => this.analyzeBuffer(blob))
            .then(() => ready_callback());
    }

    continuePlaying()
    ///
    /// Play one cycle of both the found sound recorded audio and
    /// its MIDI trasncription.
    ///
    {
        this.viz_player_transcribed.start(this.trans_samples);
        this.found_sound_source = this.audio_context.createBufferSource();
        this.found_sound_source.buffer = this.found_sound;
        this.found_sound_source.connect(this.found_sound_gain);
        this.found_sound_source.start(this.audio_context.currentTime);
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

    loadRemoteAudio(url) 
    ///
    /// Loads audio date from a remote URL.
    ///
    /// @param url:
    ///     A string containing the url of the audio data to be loaded.
    ///
    /// @return Promise:
    ///     A promise that is fulfilled once the audio is retrieved, decoded and loaded into a buffer.
    ///     Upon fulfillment the audio buffer is provided.
    ///
    {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(res => res.blob())
                .then(blob => this.loadSample(blob))
                .then(decoded_audio => resolve(decoded_audio));
        });
    }

    loadSample(blob)
    ///
    /// Load an audio sample from a data blob into an audio array buffer.
    ///
    /// @param blob:
    ///     An audio blob to be transcribed.
    ///
    /// @return Promise:
    ///     A promise that is fulfilled once the audio is decoded and loaded into a buffer.
    ///     Upon fulfillment the audio buffer is provided.
    ///
    {
        return new Promise((resolve, reject) => {
            var filereader = new FileReader();
            filereader.onloadend = () => {
                this.audio_context.decodeAudioData(filereader.result, decoded => {
                    resolve(decoded);
                }).catch(e => {
                    console.log("error: ", e);
                });
            };
            filereader.readAsArrayBuffer(blob);
        });
    }

    analyzeBuffer(blob) 
    ///
    /// Analyze an audio buffer blob by transcribing the audio and updating the note
    /// display.
    ///
    /// @param blob:
    ///     An audio blob to be transcribed.
    ///
    /// @return Promise:
    ///     A promise that is fulfilled once transcription is complete and notes are updated.
    ///
    {
        return this.transcriber.transcribeFromAudioFile(blob, 4)
            .then(notes => {
                this.trans_samples = notes;
                this.viz_transcribe.noteSequence = notes;
                this.viz_transcribe.redraw();
            })
    }

    toggleFoundSound() 
    ///
    /// Turn the sound recording on / off - the opposite of the state it is currently in.
    /// The found sound is played along with its transcription each time playback is triggered.
    ///
    {
        if(this.found_sound_gain.gain.value) {
            this.found_sound_gain.gain.value = 0.0;
            this.setState({found_sound_muted: true});
        } else {
            this.found_sound_gain.gain.value = 1.0;
            this.setState({found_sound_muted: false});
        }
    }

    toggleMetronome() 
    ///
    /// Turn the metronome on / off - the opposite of the state it is currently in.
    /// The metronome is heard during recording.
    ///
    {
        if(this.metronome_gain.gain.value) {
            this.metronome_gain.gain.value = 0.0;
            this.setState({metronome_muted: true});
        } else {
            this.metronome_gain.gain.value = 1.0;
            this.setState({metronome_muted: false});
        }
    }
    
    handleRecord() 
    ///
    /// Record a new audio sample and provide the user with a metronome while
    /// recording.
    /// Once a recording is complete, transcription of the audio will be triggered
    /// via a callback on this class's recorder.
    ///
    {
        // this.initiateContext();
        this.setState({recording: true});
        this.metronome_source = this.audio_context.createBufferSource();
        this.metronome_source.buffer = this.metronome_sound;
        this.metronome_source.connect(this.metronome_gain);
        this.recorder.start();
        this.metronome_source.start(this.audio_context.currentTime);
        setTimeout(() => {
            this.recorder.stop();
        }, 4000);
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
            <div className="FoundSound">
                <canvas id="transcribecanvas"></canvas>
                <br/>
                <br/>
                <button className="control" onClick={this.handleRecord} disabled={this.state.recording || !this.state.enabled} data-toggle="button"><b>{this.state.recording ? "Recording..." : "Record"}</b></button>
                <br/>
                <br/>
                <button className="control" onClick={this.toggleMetronome} data-toggle="button"><b>{this.state.metronome_muted ? "Unmute Metronome" : "Mute Metronome"}</b></button>
                <button className="control" onClick={this.toggleFoundSound} data-toggle="button"><b>{this.state.found_sound_muted ? "Unmute Found Sound" : "Mute Found Sound"}</b></button>
                <br/>
            </div>
        );
    }
}

export default MagentaTranscribeCanvas;
