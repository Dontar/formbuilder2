interface ObjectConstructor {
    assign(target: any, ...srcs: any[]): any
}
interface NodeModule {}
interface NodeRequireFunction {
    amd?: any;
    toUrl?: (resource: string) => string;
    (id: string, dependencies: string[], factory: (...args: any[]) => any): void;
    (dependencies: string[], factory: (...args: any[]) => any): void;
    (factory: (require: NodeRequireFunction, exports: any, module: NodeModule) => any): void;
    <T extends Object>(factory: T): void;
}
if (typeof Object.assign != 'function') {
    (function() {
        Object.assign = function(target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    })();
}
namespace AMDLoader {

    namespace PathUtils {
        export function dirname(path: string) {
            return path.substring(0, path.lastIndexOf("/"));
        }
        export function join(...paths: string[]) {
            return normalize(paths.filter(p => p.length > 0).join("/"));
        }
        export function toPath(moduleId: string) {
            return moduleId.substring(moduleId.indexOf("!") + 1);
        }
        export function toPluginType(moduleId: string) {
            return moduleId.substring(0, moduleId.indexOf("!"));
        }
        export function normalize(path: string) {
            return path.split("/").reduce((p, c) => {
                switch (c) {
                    case "":
                    case ".":
                        return p;
                    case "..":
                        if (p.length > 0 && p[p.length - 1] != ".") {
                            return p.substring(0, p.lastIndexOf("/"));
                        }
                    default:
                        return p.length > 0?(p == "."?c:p + "/" + c):"/" + c;
                }
            });
        }
        export function normalizeModuleId(parentModId: string, moduleId: string) {
            var parentPath, modulePluginType, modulePath;
            [parentPath, modulePluginType, modulePath] = [
                dirname(toPath(parentModId)), toPluginType(moduleId), toPath(moduleId)];
            return (modulePluginType?modulePluginType + "!":"") + join(parentPath, modulePath);
        }
    }

    enum EState {
        loaded, complete
    }

    class Module {
        state: EState = EState.loaded;
        context: any = {};
        dependencies: string[];
        constructor(public id: string, deps: string[], private cb: Function, private modules: Module[]) {
            if (deps && deps.indexOf("require") > -1 && typeof cb == "function") {
                var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
                var cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
                cb.toString().replace(commentRegExp, '').replace(cjsRequireRegExp, (match, dep) => { deps.push(dep); return null;});
            }
            if (id) {
                deps = deps.map(dId => PathUtils.normalizeModuleId(id, dId));
            }
            this.dependencies = deps;
        }
        getCompletedDependencies(): Module[] {
            if (this.dependencies.length > 0) {
                return this.dependencies.filter(mId => (<any>mm.getModule(mId) || {}).state == EState.complete).map(mId => mm.getModule(mId));
            }
            return [];
        }
        complete(): void {
            var _complete;
            (_complete = () => {
                if (this.state < EState.complete) {
                    var d = this.getCompletedDependencies();
                    if (d.length == this.dependencies.length) {
                        var contexts = d.map(m => {
                            if (m.id == "require") {
                                return (...args: any[]) => {
                                    if (typeof args[0] == "string") {
                                        return mm.getModule(args[0]).context;
                                    } else {
                                        var deps = args[0].map(id => PathUtils.normalizeModuleId(this.id, id));
                                        mm.defineUnresolvedModule(deps, args[1]);
                                    }
                                }
                            }
                            return m.id == "exports" ? this.context : m.context
                        });
                        var v = this.cb.apply(this.context, contexts);
                        if (this.dependencies.indexOf("exports") == -1) {
                            this.context = v;
                        }
                        this.state = EState.complete;
                    } else {
                        setTimeout(_complete, 40);
                    }
                }
            })();
        }
        resolve(moduleId: string) {
            this.id = moduleId;
            this.dependencies = this.dependencies.map(dId => PathUtils.normalizeModuleId(this.id, dId));
        }
    }

    class ModuleLoader {
        private loadedModules: string[] = [];

        private _loadingCount : number = 0;
        public get loading() : boolean {
            return this._loadingCount > 0;
        }

        load(moduleId: string, onLoad: Function, onError: Function) {
            if (this.loadedModules.indexOf(moduleId) == -1) {
                this._loadingCount++;
                switch (PathUtils.toPluginType(moduleId)) {
                    case "text":
                        this.loadText(moduleId, onLoad, onError);
                        break;
                    case "css":
                        this.loadCss(moduleId, onLoad, onError);
                        break;
                    case "json":
                        this.loadJson(moduleId, onLoad, onError);
                        break;
                    default:
                        this.loadScript(moduleId, onLoad, onError);
                        break;
                }
                this.loadedModules.push(moduleId);
            }
        }
        constructor(private moduleManager: ModuleManager) { }
        loadScript(moduleId: string, onLoad: Function, onError: Function) {
            var script = document.createElement("script");
            script.addEventListener("load", (e: Event) => {
                this._loadingCount--;
                document.head.removeChild(script);
                onLoad(moduleId);
            });
            script.addEventListener("error", (e: Event) => {
                this._loadingCount--;
                document.head.removeChild(script);
                var context;
                try {
                    context = nodeRequire(moduleId);
                } catch (error) {
                    context = error;
                }
                var m = this.moduleManager.defineModule(moduleId, [], () => {});
                m.context = context;
                context instanceof Error?onError(moduleId):onLoad(moduleId);
            });
            script.src = moduleId + ".js";
            document.head.appendChild(script);
        }
        loadText(moduleId: string, onLoad: Function, onError: Function) {
            var loader = new XMLHttpRequest();
            loader.addEventListener("load", () => {
                this._loadingCount--;
                var m = this.moduleManager.defineModule(moduleId, [], () => {});
                m.context = loader.responseText;
                onLoad(moduleId);
            });
            loader.open("GET", moduleId.substr(5), true);
            loader.send();
        }
        loadCss(moduleId: string, onLoad: Function, onError: Function) {
            var link = document.createElement("link");
            [link.rel, link.type, link.media, link.href] = ["stylesheet", "text/css", "screen", PathUtils.toPath(moduleId)];

            link.addEventListener("load", () => {
                this._loadingCount--;
                var m = this.moduleManager.defineModule(moduleId, [], () => {});
                m.state = EState.complete;
                onLoad(moduleId);
            });
            document.head.appendChild(link);
        }
        loadJson(moduleId: string, onLoad: Function, onError: Function) {
            var loader = new XMLHttpRequest();
            loader.addEventListener("load", () => {
                this._loadingCount--;
                var context;
                try {
                    context = JSON.parse(loader.responseText);
                } catch (error) {
                    context = error;
                }
                var m = this.moduleManager.defineModule(moduleId, [], () => {});
                m.context = context;
                onLoad(moduleId);
            });
            loader.open("GET", moduleId.substr(5), true);
            loader.send();
        }
    }

    class ModuleManager {
        private moduleLoader: ModuleLoader = new ModuleLoader(this);
        private modules: Module[] = [];
        private unresolvedModules: Module[] = [];
        constructor() {
            this.defineModule("require", [], () => {});
            this.defineModule("exports", [], () => {});
            this.defineModule("module", [], () => {});
        }
        getModule(moduleId: string): Module {
            for (let i = 0; i < this.modules.length; i++) {
                if (this.modules[i].id == moduleId) {
                    return this.modules[i];
                }
            }
        }
        defineModule(moduleId: string, dependencies: string[], cb: any) {
            var m = this.getModule(moduleId);
            if (!m) {
                m = new Module(moduleId, dependencies, cb, this.modules);
                this.modules.push(m);
                this.resolveDependencies(m);
                m.complete();
            }
            return m;
        }
        private anonModCounter = 0;
        defineUnresolvedModule(dependencies: string[], cb: any) {
            if (this.modules.length == 3) {
                this.defineModule("main", dependencies, cb);
            } else if (!this.moduleLoader.loading) {
                this.defineModule("anon" + this.anonModCounter++, dependencies, cb);
            } else {
                var m = new Module(null, dependencies, cb, this.modules);
                this.unresolvedModules.push(m);
            }
            return m;
        }
        onModuleLoad(moduleId: string) {
            var mod: Module;
            mod = this.getModule(moduleId);
            if (!mod) {
                mod = this.unresolvedModules.shift();
                this.modules.push(mod);
                mod.resolve(moduleId);
                this.resolveDependencies(mod);
                mod.complete();
            }

        }
        onModuleError() {}
        resolveDependencies(mod: Module) {
            mod.dependencies.forEach(id => {
                if (!this.getModule(id)) {
                    this.moduleLoader.load(id, this.onModuleLoad.bind(this), this.onModuleError.bind(this));
                }
            });
        }
    }

    export var mm = new ModuleManager();
    export var nodeRequire: Function;

    export function define(...args: any[]): void {
        var id: string, deps: string[], cb: any;
        switch (args.length) {
            case 3:
                [id, deps, cb] = args;
                break;
            case 2:
                [deps, cb] = args;
                break;
            default:
                cb = args[0];
                if (typeof cb == "funciton") {
                    deps = ["require", "exports", "module"];
                }
                if (typeof cb == "object") {
                    var ext = cb;
                    cb = function() {return ext;};
                }
                break;
        }
        if (id) {
            mm.defineModule(id, deps, cb);
        } else {
            mm.defineUnresolvedModule(deps, cb);
        }
    }
}
// if we are in node env
if (require) {
    AMDLoader.nodeRequire = require;
}
var define:NodeRequireFunction = AMDLoader.define;
var requirejs:NodeRequireFunction = AMDLoader.define;
define.amd = true;