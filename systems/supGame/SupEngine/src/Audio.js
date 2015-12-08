var Audio = (function () {
    function Audio() {
    }
    Audio.prototype.getContext = function () {
        if (window["AudioContext"] == null)
            return null;
        if (this._ctx != null)
            return this._ctx;
        this._ctx = new AudioContext();
        this.masterGain = this._ctx.createGain();
        this.masterGain.gain.value = 1;
        this.masterGain.connect(this._ctx.destination);
        return this._ctx;
    };
    return Audio;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Audio;
