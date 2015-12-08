var SoundPlayer = (function () {
    function SoundPlayer(audioCtx, audioMasterGain, buffer) {
        this.offset = 0;
        this.isLooping = false;
        this.state = SoundPlayer.State.Stopped;
        this.volume = 1;
        this.pitch = 0;
        this.pan = 0;
        this.audioCtx = audioCtx;
        this.audioMasterGain = audioMasterGain;
        this.buffer = buffer;
    }
    SoundPlayer.prototype.destroy = function () {
        this.stop();
        this.audioCtx = null;
        this.audioMasterGain = null;
    };
    SoundPlayer.prototype.play = function () {
        var _this = this;
        if (this.audioCtx == null || this.buffer == null)
            return;
        if (this.state === SoundPlayer.State.Playing)
            return;
        if (this.source != null)
            this.stop();
        // if this.buffer instanceof HTMLAudioElement
        if (typeof this.buffer === "string") {
            var audio = new Audio();
            audio.src = this.buffer;
            this.source = this.audioCtx.createMediaElementSource(audio);
            // FIXME: Very new so not included in d.ts file just yet
            if (this.source["mediaElement"] == null) {
                this.source = null;
                return;
            }
            this.source["mediaElement"].loop = this.isLooping;
        }
        else {
            // Assuming AudioBuffer
            var source = this.source = this.audioCtx.createBufferSource();
            source.buffer = this.buffer;
            source.loop = this.isLooping;
            // NOTE: As of November 2015, playbackRate is not supported on MediaElementSources
            // so let's only apply it for buffer sources
            source.playbackRate.value = Math.pow(2, this.pitch);
        }
        this.pannerNode = this.audioCtx.createStereoPanner();
        this.pannerNode.pan.value = this.pan;
        this.pannerNode.connect(this.audioMasterGain);
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = this.volume;
        this.gainNode.connect(this.pannerNode);
        this.source.connect(this.gainNode);
        this.state = SoundPlayer.State.Playing;
        this.source.addEventListener("ended", function () { _this.state = SoundPlayer.State.Stopped; });
        this.startTime = this.audioCtx.currentTime - this.offset;
        if (this.source["mediaElement"] != null) {
            this.source["mediaElement"].currentTime = this.offset;
            this.source["mediaElement"].play();
        }
        else
            this.source.start(0, this.offset);
    };
    SoundPlayer.prototype.stop = function () {
        if (this.audioCtx == null)
            return;
        if (this.source != null) {
            if (this.source["mediaElement"] != null) {
                this.source["mediaElement"].pause();
                this.source["mediaElement"].currentTime = 0;
            }
            else
                this.source.stop(0);
            this.source.disconnect();
            delete this.source;
            this.gainNode.disconnect();
            delete this.gainNode;
            this.pannerNode.disconnect();
            delete this.pannerNode;
        }
        this.offset = 0;
        this.state = SoundPlayer.State.Stopped;
    };
    SoundPlayer.prototype.pause = function () {
        if (this.audioCtx == null || this.source == null)
            return;
        this.offset = this.audioCtx.currentTime - this.startTime;
        if (this.source.mediaElement != null)
            this.source.mediaElement.pause();
        else
            this.source.stop(0);
        this.source.disconnect();
        delete this.source;
        this.gainNode.disconnect();
        delete this.gainNode;
        this.pannerNode.disconnect();
        delete this.pannerNode;
        this.state = SoundPlayer.State.Paused;
    };
    SoundPlayer.prototype.getState = function () {
        // Workaround Webkit audio's lack of support for the onended callback
        if (this.state === SoundPlayer.State.Playing) {
            // FIXME: Very new so not included in d.ts file just yet
            if (this.source.playbackState != null && this.source.playbackState === this.source.FINISHED_STATE)
                this.state = SoundPlayer.State.Stopped;
            else if (this.source.mediaElement != null && this.source.mediaElement.paused)
                this.state = SoundPlayer.State.Stopped;
        }
        return this.state;
    };
    SoundPlayer.prototype.setLoop = function (isLooping) {
        this.isLooping = isLooping;
        if (this.source == null)
            return;
        if (this.source.mediaElement != null) {
            this.source.mediaElement.loop = this.isLooping;
        }
        else {
            this.source.loop = this.isLooping;
        }
    };
    SoundPlayer.prototype.setVolume = function (volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.source != null)
            this.gainNode.gain.value = this.volume;
    };
    SoundPlayer.prototype.setPan = function (pan) {
        this.pan = Math.max(-1, Math.min(1, pan));
        if (this.source != null)
            this.pannerNode.pan.value = this.pan;
    };
    SoundPlayer.prototype.setPitch = function (pitch) {
        this.pitch = Math.max(-1, Math.min(1, pitch));
        if (this.source != null) {
            // NOTE: playbackRate is not supported on MediaElementSources
            if (this.source.playbackRate != null) {
                this.source.playbackRate.value = Math.pow(2, this.pitch);
            }
        }
    };
    return SoundPlayer;
})();
var SoundPlayer;
(function (SoundPlayer) {
    (function (State) {
        State[State["Playing"] = 0] = "Playing";
        State[State["Paused"] = 1] = "Paused";
        State[State["Stopped"] = 2] = "Stopped";
    })(SoundPlayer.State || (SoundPlayer.State = {}));
    var State = SoundPlayer.State;
    ;
})(SoundPlayer || (SoundPlayer = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundPlayer;
