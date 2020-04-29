/** 
 * notochord-song by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */
import * as _Tonal from 'tonal';
import _Tonal__default, {  } from 'tonal';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

var SongIterator = /** @class */ (function () {
    function SongIterator(song) {
        this.song = song;
        this.index = 0;
    }
    /**
     * Get a measure by absolute index, without advancing the iterator.
     * @param {number} idx
     * @returns {Measure}
     */
    SongIterator.prototype.get = function (idx) {
        return this.song.measures[idx];
    };
    /**
     * Get a measure relative to the current one, without advancing the iterator.
     * @param {number} [delta=0]
     * @returns {Measure}
     */
    SongIterator.prototype.getRelative = function (delta) {
        if (delta === void 0) { delta = 0; }
        var idx = this.index + delta;
        return this.song.measures[idx];
    };
    /**
     * Iterates over measures in playback order. See the Iterator Protocol.
     * @returns {{done: boolean, value: Measure|undefined}}
     */
    SongIterator.prototype.next = function () {
        if (this.index < this.song.measures.length) {
            return { value: this.song.measures[this.index++], done: false };
        }
        else {
            this.index++;
            return { done: true };
        }
    };
    return SongIterator;
}());

var Tonal = _Tonal__default || _Tonal;
var SCALE_DEGREES = {
    1: { numeral: 'i', flat: false },
    2: { numeral: 'ii', flat: true },
    3: { numeral: 'ii', flat: false },
    4: { numeral: 'iii', flat: true },
    5: { numeral: 'iii', flat: false },
    6: { numeral: 'iv', flat: false },
    7: { numeral: 'v', flat: true },
    8: { numeral: 'v', flat: false },
    9: { numeral: 'vi', flat: true },
    10: { numeral: 'vi', flat: false },
    11: { numeral: 'vii', flat: true },
    12: { numeral: 'vii', flat: false }
};
var Beat = /** @class */ (function () {
    function Beat(song, measure, index, pseudoBeat) {
        this.song = song;
        this.measure = measure;
        this.index = index;
        this.chord = pseudoBeat;
    }
    Object.defineProperty(Beat.prototype, "chord", {
        get: function () {
            var transpose = this.song.get('transpose');
            var chord = this._chord;
            if (chord) {
                if (transpose) {
                    var transposeInt = Tonal.Interval.fromSemitones(transpose);
                    var chordParts = Tonal.Chord.tokenize(chord);
                    chordParts[0] = Tonal.Note.enharmonic(Tonal.transpose(chordParts[0], transposeInt));
                    return chordParts.join('');
                }
                else {
                    return chord;
                }
            }
            else {
                return null;
            }
        },
        /**
         *
         * @param {?string} rawChord
         */
        set: function (rawChord) {
            var oldChord = this._chord;
            this._chord = null;
            if (rawChord) {
                var parsed = rawChord.replace(/-/g, 'm');
                var chordParts = Tonal.Chord.tokenize(parsed);
                if (this.song.get('transpose') && chordParts[0]) {
                    var transposeInt = Tonal.Interval.fromSemitones(this.song.get('transpose'));
                    chordParts[0] = Tonal.Note.enharmonic(Tonal.transpose(chordParts[0], Tonal.Interval.invert(transposeInt)));
                }
                // get the shortest chord name
                if (chordParts[1]) {
                    var names = Tonal.Chord.props(chordParts[1]).names;
                    if (names && names.length) {
                        chordParts[1] = names
                            .reduce(function (l, r) { return l.length <= r.length ? l : r; })
                            .replace(/_/g, 'm7');
                    }
                    else {
                        chordParts[1] = '';
                    }
                }
                parsed = chordParts.join('');
                this._chord = parsed;
            }
            this.song._emitChange('measures', {
                type: 'Beat.chord.set',
                beatObject: this,
                measureObject: this.measure,
                oldValue: oldChord,
                newValue: this._chord,
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Beat.prototype, "scaleDegree", {
        get: function () {
            var chord = this._chord;
            if (!chord)
                return null;
            var chordParts = Tonal.Chord.tokenize(chord);
            // ignore transposition because it's relative to the 1
            var semis = Tonal.Distance.semitones(this.song.get('key'), chordParts[0]) + 1;
            var minorish = chordParts[1][0] == 'm' || chordParts[1][0] == 'o';
            var SD = SCALE_DEGREES[semis];
            return {
                numeral: minorish ? SD.numeral : SD.numeral.toUpperCase(),
                flat: SD.flat,
                quality: chordParts[1]
            };
        },
        set: function (rawScaleDegree) {
            throw new Error('scaleDegree must not be set');
        },
        enumerable: true,
        configurable: true
    });
    Beat.prototype.serialize = function () {
        return this.chord;
    };
    return Beat;
}());

function isMeasureContainer(value) {
    return !!value.type;
}
/**
 * Handles repeats and stuff
 */
var MeasureContainer = /** @class */ (function () {
    function MeasureContainer(song, pseudoContainer, fill) {
        var e_1, _a;
        if (pseudoContainer === void 0) { pseudoContainer = MeasureContainer.DEFAULTS; }
        if (fill === void 0) { fill = false; }
        this.type = pseudoContainer.type || 'repeat';
        if (fill) {
            var songLength = 8;
            var measureLength = Number(song.get('timeSignature')[0]);
            var pseudoMeasure = { beats: (new Array(measureLength)).fill(null) };
            this.measures = [];
            for (var i = 0; i < songLength; i++) {
                this.measures.push(new Measure(song, pseudoMeasure));
            }
        }
        else {
            this.measures = [];
            try {
                for (var _b = __values(pseudoContainer.measures), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var pseudoMeasure = _c.value;
                    if (isMeasureContainer(pseudoMeasure)) {
                        this.measures.push(new MeasureContainer(song, pseudoMeasure));
                    }
                    else {
                        this.measures.push(new Measure(song, pseudoMeasure));
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        this.repeatInfo = __assign({}, pseudoContainer.repeatInfo);
    }
    MeasureContainer.prototype.serialize = function () {
        return {
            type: this.type,
            measures: this.measures.map(function (measure) { return measure.serialize(); }),
            repeatInfo: this.repeatInfo
        };
    };
    MeasureContainer.prototype[Symbol.iterator] = function () {
        var repeatCount, repeat, _a, _b, measure, e_2_1;
        var e_2, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    repeatCount = this.type == 'repeat' ? this.repeatInfo.repeatCount : 1;
                    repeat = 1;
                    _d.label = 1;
                case 1:
                    if (!(repeat <= repeatCount)) return [3 /*break*/, 16];
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 13, 14, 15]);
                    _a = (e_2 = void 0, __values(this.measures)), _b = _a.next();
                    _d.label = 3;
                case 3:
                    if (!!_b.done) return [3 /*break*/, 12];
                    measure = _b.value;
                    if (!(measure instanceof MeasureContainer)) return [3 /*break*/, 9];
                    if (!(measure.type == 'repeat')) return [3 /*break*/, 5];
                    return [5 /*yield**/, __values(measure)];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 8];
                case 5:
                    if (!(measure.type == 'ending')) return [3 /*break*/, 8];
                    if (!(measure.repeatInfo.ending == repeat)) return [3 /*break*/, 7];
                    return [5 /*yield**/, __values(measure)];
                case 6:
                    _d.sent();
                    return [3 /*break*/, 8];
                case 7: return [3 /*break*/, 11];
                case 8: return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, measure];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11:
                    _b = _a.next();
                    return [3 /*break*/, 3];
                case 12: return [3 /*break*/, 15];
                case 13:
                    e_2_1 = _d.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 15];
                case 14:
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 15:
                    repeat++;
                    return [3 /*break*/, 1];
                case 16: return [2 /*return*/];
            }
        });
    };
    MeasureContainer.DEFAULTS = {
        measures: [],
        repeatInfo: {},
        type: null,
    };
    return MeasureContainer;
}());
var Measure = /** @class */ (function () {
    function Measure(song, pseudoMeasure) {
        var _this = this;
        this.song = song;
        this.length = song.get('timeSignature')[0];
        this.beats = pseudoMeasure.map(function (pseudoBeat, index) {
            return new Beat(_this.song, _this, index, pseudoBeat);
        });
    }
    Measure.prototype.serialize = function () {
        return this.beats.map(function (beat) { return beat.serialize(); });
        // @todo props like repeats and stuff
    };
    return Measure;
}());

var Tonal$1 = _Tonal__default || _Tonal;
var Song = /** @class */ (function () {
    function Song(pseudoSong) {
        if (pseudoSong === void 0) { pseudoSong = Song.DEFAULTS; }
        this.props = new Map(Object.entries(__assign({}, this._makeDefaultProps(), pseudoSong, { measureContainer: undefined })));
        this.callbackMap = new Map();
        this.measureContainer = new MeasureContainer(this, pseudoSong.measureContainer, !pseudoSong.measureContainer);
        this.measures = __spread(this.measureContainer); // depends on the naive asumption that songs have finite length
        this.measures.forEach(function (measure, index) {
            if (measure.index === undefined) {
                measure.index = index;
            }
        });
    }
    /**
     * Get the transposed key of the song
     * @returns {string}
     */
    Song.prototype.getTransposedKey = function () {
        var _a = __read(Tonal$1.Chord.tokenize(this.props.get('key')), 2), pc = _a[0], quality = _a[1];
        var interval = Tonal$1.Interval.fromSemitones(this.props.get('transpose'));
        return Tonal$1.transpose(pc, interval) + quality;
    };
    /**
     * Subscribe to changes to a property of the song (except measureContainer)
     * @param {string} property Property to subscribe to changes to
     * @param {function} callback Function that is passed the new value when the property updates
     */
    Song.prototype.onChange = function (property, callback) {
        if (!this.callbackMap.has(property))
            this.callbackMap.set(property, new Set());
        this.callbackMap.get(property).add(callback);
    };
    /**
     * Get a property of the song (except measureContainer)
     * @param {string} property
     * @returns {*} The value of that property (or undefined)
     */
    Song.prototype.get = function (property) {
        return this.props.get(property);
    };
    /**
     * Set a property of the song, and notify those subscribed to changes to that property.
     * @param {string} property
     * @param {*} value
     */
    Song.prototype.set = function (property, value) {
        this.props.set(property, value);
        this._emitChange(property, value);
    };
    /**
     * Generate default prop values. Can't just use a constant because the dates
     * change per runtime
     * @returns {Object}
     * @private
     */
    Song.prototype._makeDefaultProps = function () {
        return {
            title: 'New Song',
            composedOn: Date.now(),
            composer: '',
            updatedOn: Date.now(),
            updatedBy: '',
            tempo: 160,
            style: 'swing',
            key: 'C',
            transpose: 0,
            timeSignature: [4, 4]
        };
    };
    Song.prototype._emitChange = function (prop, value) {
        var e_1, _a;
        var cbs = this.callbackMap.get(prop);
        if (cbs) {
            try {
                for (var cbs_1 = __values(cbs), cbs_1_1 = cbs_1.next(); !cbs_1_1.done; cbs_1_1 = cbs_1.next()) {
                    var cb = cbs_1_1.value;
                    cb(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (cbs_1_1 && !cbs_1_1.done && (_a = cbs_1.return)) _a.call(cbs_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    Song.prototype.serialize = function () {
        var e_2, _a;
        // aww Object.fromEntries isn't ready yet :(
        var out = { measureContainer: null };
        try {
            for (var _b = __values(this.props), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], val = _d[1];
                out[key] = val;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        out.measureContainer = this.measureContainer.serialize();
        return out;
    };
    Song.prototype[Symbol.iterator] = function () {
        return new SongIterator(this);
    };
    Song.DEFAULTS = {
        title: '',
        tempo: 120,
        key: 'C',
        transpose: 0,
        timeSignature: [4, 4],
        measureContainer: null,
    };
    return Song;
}());

export default Song;
