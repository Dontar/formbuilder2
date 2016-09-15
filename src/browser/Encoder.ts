var useHasOwn = {}.hasOwnProperty ? true : false;
var m = {
    "\b": '\\b',
    "\t": '\\t',
    "\n": '\\n',
    "\f": '\\f',
    "\r": '\\r',
    '"': '\\"',
    "\\": '\\\\'
};

function pad(n) {
    return n < 10 ? "0" + n : n;
};

function encodeString(s) {
    if (/["\\\x00-\x1f]/.test(s)) {
        return '"' + s.replace(/([\x00-\x1f\\"])/g, function(a, b) {
            var c = m[b];
            if (c) {
                return c;
            }
            c = b.charCodeAt();
            return "\\u00" + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
        }) + '"';
    }
    return '"' + s + '"';
};

function indentStr(n) {
    var str = "",
        i = 0;
    while (i < n) {
        str += "    ";
        i++;
    }
    return str;
};

function encodeArray(o, indent) {
    indent = indent || 0;
    var a = ["["], b, i,
        l = o.length, v;
    for (i = 0; i < l; i += 1) {
        v = o[i];
        switch (typeof v) {
            case "undefined":
            case "function":
            case "unknown":
                break;
            default:
                if (b) {
                    a.push(',');
                }
                a.push(v === null ? "null" : encode(v, indent + 1));
                b = true;
        }
    }
    a.push("]");
    return a.join("");
};

function encodeDate(o) {
    return '"' + o.getFullYear() + "-" + pad(o.getMonth() + 1) + "-" + pad(o.getDate()) + "T" + pad(o.getHours()) + ":" + pad(o.getMinutes()) + ":" +
        pad(o.getSeconds()) + '"';
};

export function encode(o, indent) {
    if (o.toJSON) {
        o = o.toJSON();
    }
    indent = indent || 0;
    if (typeof o == "undefined" || o === null) {
        return "null";
    } else if (o instanceof Array) {
        return encodeArray(o, indent);
    } else if (o instanceof Date) {
        return encodeDate(o);
    } else if (typeof o == "string") {
        return encodeString(o);
    } else if (typeof o == "number") {
        return isFinite(o) ? String(o) : "null";
    } else if (typeof o == "boolean") {
        return String(o);
    } else {
        var a = ["{\n"], b, i, v;
        // if (o.items instanceof Array) {
        //     var items = o.items;
        //     delete o.items;
        //     o.items = items;
        // }
        for (i in o) {
            if (i === "_node") {
                continue;
            }
            if (!useHasOwn || o.hasOwnProperty(i)) {
                v = o[i];
                if (i === "id" && /^form-gen-/.test(o[i])) {
                    continue;
                }
                if (i === "id" && /^ext-comp-/.test(o[i])) {
                    continue;
                }
                switch (typeof v) {
                    case "undefined":
                    case "function":
                    case "unknown":
                        break;
                    default:
                        if (b) {
                            a.push(',\n');
                        }
                        a.push(indentStr(indent), i, ":", v === null ? "null" : encode(v, indent + 1));
                        b = true;
                }
            }
        }
        a.push("\n" + indentStr(indent - 1) + "}");
        return a.join("");
    }
}

