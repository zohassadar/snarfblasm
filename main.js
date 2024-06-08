// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import { dotnet } from './dotnet.js';

const is_browser = typeof window != 'undefined';
if (!is_browser) throw new Error(`Expected to be running in a browser`);


try {
    const url = new URL(document.location.href);
    const fragment = url.hash.slice(1);
    if (fragment) {
        const [filename, source] = JSON.parse(atob(fragment));
        document.getElementById('filenameBox').value = filename;
        document.getElementById('sourceBox').innerHTML = source;
    }
} catch (exc) {
    console.log(`Unable to load source: ${exc}`);
}

const { setModuleImports, getAssemblyExports, getConfig, runMainAndExit } =
    await dotnet
        .withDiagnosticTracing(false)
        .withApplicationArgumentsFromQuery()
        .create();

const config = getConfig();
const exports = await getAssemblyExports(config.mainAssemblyName);

/* FileSaver.js (source: http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js)
 * A saveAs() FileSaver implementation.
 * 1.3.8
 * 2018-03-22 14:03:47
 *
 * By Eli Grey, https://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/* eslint-disable */
var saveAs =
    saveAs ||
    (function (c) {
        'use strict';
        if (
            !(
                void 0 === c ||
                ('undefined' != typeof navigator &&
                    /MSIE [1-9]\./.test(navigator.userAgent))
            )
        ) {
            var t = c.document,
                f = function () {
                    return c.URL || c.webkitURL || c;
                },
                s = t.createElementNS('http://www.w3.org/1999/xhtml', 'a'),
                d = 'download' in s,
                u = /constructor/i.test(c.HTMLElement) || c.safari,
                l = /CriOS\/[\d]+/.test(navigator.userAgent),
                p = c.setImmediate || c.setTimeout,
                v = function (t) {
                    p(function () {
                        throw t;
                    }, 0);
                },
                w = function (t) {
                    setTimeout(function () {
                        'string' == typeof t
                            ? f().revokeObjectURL(t)
                            : t.remove();
                    }, 4e4);
                },
                m = function (t) {
                    return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
                        t.type,
                    )
                        ? new Blob([String.fromCharCode(65279), t], {
                              type: t.type,
                          })
                        : t;
                },
                r = function (t, n, e) {
                    e || (t = m(t));
                    var r,
                        o = this,
                        a = 'application/octet-stream' === t.type,
                        i = function () {
                            !(function (t, e, n) {
                                for (var r = (e = [].concat(e)).length; r--; ) {
                                    var o = t['on' + e[r]];
                                    if ('function' == typeof o)
                                        try {
                                            o.call(t, n || t);
                                        } catch (t) {
                                            v(t);
                                        }
                                }
                            })(
                                o,
                                'writestart progress write writeend'.split(' '),
                            );
                        };
                    if (((o.readyState = o.INIT), d))
                        return (
                            (r = f().createObjectURL(t)),
                            void p(function () {
                                var t, e;
                                (s.href = r),
                                    (s.download = n),
                                    (t = s),
                                    (e = new MouseEvent('click')),
                                    t.dispatchEvent(e),
                                    i(),
                                    w(r),
                                    (o.readyState = o.DONE);
                            }, 0)
                        );
                    !(function () {
                        if ((l || (a && u)) && c.FileReader) {
                            var e = new FileReader();
                            return (
                                (e.onloadend = function () {
                                    var t = l
                                        ? e.result
                                        : e.result.replace(
                                              /^data:[^;]*;/,
                                              'data:attachment/file;',
                                          );
                                    c.open(t, '_blank') ||
                                        (c.location.href = t),
                                        (t = void 0),
                                        (o.readyState = o.DONE),
                                        i();
                                }),
                                e.readAsDataURL(t),
                                (o.readyState = o.INIT)
                            );
                        }
                        r || (r = f().createObjectURL(t)),
                            a
                                ? (c.location.href = r)
                                : c.open(r, '_blank') || (c.location.href = r);
                        (o.readyState = o.DONE), i(), w(r);
                    })();
                },
                e = r.prototype;
            return 'undefined' != typeof navigator && navigator.msSaveOrOpenBlob
                ? function (t, e, n) {
                      return (
                          (e = e || t.name || 'download'),
                          n || (t = m(t)),
                          navigator.msSaveOrOpenBlob(t, e)
                      );
                  }
                : ((e.abort = function () {}),
                  (e.readyState = e.INIT = 0),
                  (e.WRITING = 1),
                  (e.DONE = 2),
                  (e.error =
                      e.onwritestart =
                      e.onprogress =
                      e.onwrite =
                      e.onabort =
                      e.onerror =
                      e.onwriteend =
                          null),
                  function (t, e, n) {
                      return new r(t, e || t.name || 'download', n);
                  });
        }
    })(
        ('undefined' != typeof self && self) ||
            ('undefined' != typeof window && window) ||
            this,
    );

function createLink() {
    const filename = document.getElementById('filenameBox').value;
    const source = document.getElementById('sourceBox').value;
    const fragment = btoa(JSON.stringify([filename, source]));
    window.location = `${window.location.href.split('#')[0]}#${fragment}`;
}

function assemblePatch() {
    const filename = document.getElementById('filenameBox').value;
    const source = document.getElementById('sourceBox').value;
    const patch = exports.snarfblasm.Program.AssemblePatch(source);
    // document.getElementById('sourceBox').innerHTML = patch;
    saveAs(new Blob([patch]), filename);
}

document.getElementById('buttonForCode').onclick = assemblePatch;
document.getElementById('buttonForLink').onclick = createLink;
