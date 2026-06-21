import {
    XModule,
    type XCommand,
    XResponseOK,
    _xu,
    type XpellSkill,
    type XpellSkillCommand,
    _xlog
} from "@xpell/node";

import fs from "fs";
import path from "path";


const xu = _xu as any;
export class MusicPlayer extends XModule {
    static _name = "music-player";
    static _skill: XpellSkill = {
        _id: "music-player",
        _title: "Music Player",
        _version: "1.0.0",
        _active: true,
        _type: "client-module-api",
        _requires: ["xmodule", "xui"],

        _description:
            "Music Player module provides a simple music player interface and API for managing and playing music tracks.",

        _core_rules: [
            "Use XModule for module API, skill registration, and command handling.",
        ]
    };

    static _ops: Record<string, XpellSkillCommand> = {

        "scan-music-folder": {
            _name: "scan-music-folder",
            _scope: "module",
            _description: "Scan a music folder and return the list of tracks.",
            _params: {
                _music_folder: "Target music folder.",
                _env: "Optional environment. Defaults to current client env."
            }
        },

    };

    _work_folder: string;
    _music_folder: string = "";
    constructor(work_folder?: string) {

        super({ _name: MusicPlayer._name });
        this._work_folder = work_folder || "work";
        this._music_folder = path.join(this._work_folder, "music");
        _xlog.log("[music-player] initialized with work folder:", this._work_folder, "music folder:", this._music_folder);
    }

    async onLoad() {
        xu.checkFolders([this._work_folder, this._music_folder])
    }

    async _scan_music_folder(xcmd: XCommand) {
        _xlog.log("[music-player] scanning music folder:", this._music_folder);
        const files = fs.readdirSync(this._music_folder);
        _xlog.log("[music-player] found files:", files.length, files);
        const audio_files = files.filter(file => {
            const ext = path.extname(file).toLowerCase();

            return [
                ".mp3",
                ".wav",
                ".ogg",
                ".m4a"
            ].includes(ext);
        });

        _xlog.log("[music-player] found audio files:", audio_files.length, audio_files);

        const res = {
            _message: `Found ${audio_files.length} audio files.`,
            _music_folder: this._music_folder,
            _scanned: audio_files.length,
            _created: 0,
            _existing: 0,
            _skipped: 0,
            _tracks: audio_files.map(file => ({
                _file_name: file,
                _file_path: path.join(this._music_folder, file)
            }))
        }
        _xlog.log("[music-player] scan result:", res);
        return new XResponseOK(res).toXData();
    }
}

export default MusicPlayer;