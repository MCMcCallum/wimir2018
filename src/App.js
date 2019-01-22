import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import MagentaDrumCanvas from './MagentaDrumCanvas.js';
import MagentaTranscribeCanvas from './MagentaTranscribeCanvas.js';

class App extends Component {
///
/// This class encapsulates a drum pattern generator and playback controls.
///

    constructor(props) 
    ///
    /// Here we initialize state variables and load the model.
    ///
    {
        super(props);

        // Bind methods to this class where necessary.
        this.begin = this.begin.bind(this);
        this.handlePlay = this.handlePlay.bind(this);
        this.handleStop = this.handleStop.bind(this);
        this.componentInitialized = this.componentInitialized.bind(this);
        this.playbackComplete = this.playbackComplete.bind(this);

        // Initisalize state.
        this.state = {
            playing: false,
            stopping: false,
            loaded: false,
            begun: false
        };

        // Create components.
        this.components_initialized = 0;
        this.components = [React.createRef(), React.createRef()];
    }

    begin()
    ///
    /// Method to be called after component is in the DOM.
    ///
    {
        this.setState({begun: true});
        // Initialize components and set callbacks.
        // Currently only one callback is called no matter how many components we play.
        // because of the way magenta works. So we give all components playbackComplete callbacks.
        for(var i = 0; i<this.components.length; ++i)
        {
            this.components[i].current.initialize(this.componentInitialized, this.playbackComplete);
        }
    }

    componentInitialized()
    ///
    /// Callback for when a component has loaded and is operational.
    ///
    {
        this.components_initialized++;
        if(this.components_initialized >= this.components.length)
        {
            this.setState({loaded: true})
        }
    }

    playbackComplete()
    ///
    /// Callback for when playback has completed a single loop cycle.
    /// This is in the parent class as it serves to synchronize all child loop cycles.
    ///
    {
        if(this.state.stopping)
        {
            this.stopped();
        }
        else
        {
            for(var i = 0; i<this.components.length; ++i)
            {
                this.components[i].current.continuePlaying();
            }
        }
    }

    enableComponents(enable)
    ///
    /// Enables all child components so they may be changed and altered by the user.
    /// Currently this is not supposed to happen during playback.
    ///
    {
        for(var i = 0; i<this.components.length; ++i)
        {
            this.components[i].current.enableControls(enable);
        }
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
        this.enableComponents(false);
        this.playbackComplete();
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
        this.enableComponents(true);
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
    /// @return:
    ///     React jsx formatting.
    ///
    {
        return (
            <div className="App">
                <div hidden={this.state.begun}>
                    <button onClick={this.begin}>Begin</button>
                </div>
                <div hidden={this.state.loaded || !this.state.begun}>
                    <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo" />
                        Loading...
                    </header>
                </div>
                <div hidden={!this.state.loaded}>
                    <div className="PlayControls">
                        <button className="transport_controls" onClick={this.handlePlay} disabled={this.state.playing} data-toggle="button"><b>Play Loop</b></button>
                        <button className="transport_controls" onClick={this.handleStop} disabled={!this.state.playing} data-toggle="button"><b>{this.state.stopping ? "Stopping..." : "Stop Loop"}</b></button>
                    </div>
                    <MagentaTranscribeCanvas ref={this.components[0]} />
                    <MagentaDrumCanvas ref={this.components[1]} />
                </div>
            </div>
        );
    }
}

export default App;
