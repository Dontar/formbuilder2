/// <reference path="../typings/node/node.d.ts" />

import * as FS from "fs";
import * as PATH from "path";

declare var Promise: PromiseConstructorLike;

export function writeFile(path: string, data: any): PromiseLike<any> {
    return new Promise((resolve, reject) => {
        FS.writeFile(path, data, err => {
            err ? reject(err) : resolve();
        })
    })
}

export function stat(path: string): PromiseLike<FS.Stats> {
    return new Promise((resolve, reject) => {
        FS.stat(path, (err, stats) => {
            err ? reject(err) : resolve(stats);
        });
    });
}

export function rmdir(path: string): PromiseLike<any> {
    return new Promise((resolve, reject) => {
        FS.rmdir(path, err => {
            err ? reject(err) : resolve();
        });
    });
}

export function unlink(path: string): PromiseLike<any> {
    return new Promise((resolve, reject) => {
        FS.unlink(path, err => {
            err ? reject(err) : resolve();
        });
    });
}

export function readFile(path: string): PromiseLike<string> {
    return new Promise((resolve, reject) => {
        FS.readFile(path, "utf8", (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}

export function rename(oldPath: string, newPath: string): PromiseLike<any> {
    return new Promise((resolve, reject) => {
        FS.rename(oldPath, newPath, err => {
            err ? reject(err) : resolve();
        });
    });
}

export function readdir(path: string): PromiseLike<{name: string, path: string, stat: FS.Stats}[]> {
    return new Promise((resolve, reject) => {
        FS.readdir(path, (err, files) => {
            err?reject(err):resolve(files.map(f => {
                return {
                    name: f,
                    path: PATH.join(path, f),
                    stat: FS.statSync(PATH.join(path, f))
                }
            }));
        });
    });
}

export function mkdir(path: string): PromiseLike<void> {
    return new Promise<void>((resolve, reject) => {
        FS.mkdir(path, (err) => {
            err?reject(err):resolve();
        })
    });
}
