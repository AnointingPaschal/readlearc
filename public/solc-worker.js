/* Readlearc in-browser Solidity compiler worker.
 * Loads any official `soljson-*.js` build (any Solidity version) and runs the standard-JSON interface.
 * Message in : { url, input }   (input = standard-JSON string)
 * Messages out: { type:"status", text } … then { type:"result", output, version } or { type:"error", error } */
(function () {
  var post = function (m) { self.postMessage(m); };

  function ready(M) {
    return new Promise(function (resolve, reject) {
      var t0 = Date.now();
      (function poll() {
        var ok = typeof M.cwrap === "function" && (M._solidity_compile || M._compileStandard || M._compileJSONCallback || M._compileJSONMulti);
        if (ok) return resolve();
        if (Date.now() - t0 > 90000) return reject(new Error("Compiler failed to initialise (timeout)."));
        setTimeout(poll, 40);
      })();
    });
  }

  function run(M, input) {
    var version = "";
    try { if (M._solidity_version) version = M.cwrap("solidity_version", "string", [])(); else if (M._version) version = M.cwrap("version", "string", [])(); } catch (e) {}
    if (M._solidity_compile) {
      if (M._solidity_alloc) {
        // ≥0.8.x: copy the input into compiler-owned memory (no stack limits), free everything with solidity_reset.
        var alloc = M.cwrap("solidity_alloc", "number", ["number"]);
        var compile = M.cwrap("solidity_compile", "number", ["number", "number", "number"]);
        var reset = M._solidity_reset ? M.cwrap("solidity_reset", null, []) : function () {};
        var len = (typeof M.lengthBytesUTF8 === "function" ? M.lengthBytesUTF8(input) : input.length * 4) + 1;
        var ptr = alloc(len);
        M.stringToUTF8(input, ptr, len);
        var outPtr = compile(ptr, 0, 0);
        var out = M.UTF8ToString(outPtr);
        reset();
        return { output: out, version: version };
      }
      var c = M.cwrap("solidity_compile", "string", ["string", "number", "number"]);
      return { output: c(input, 0, 0), version: version };
    }
    if (M._compileStandard) return { output: M.cwrap("compileStandard", "string", ["string", "number"])(input, 0), version: version };
    throw new Error("This compiler build has no standard-JSON interface (Solidity < 0.4.11 isn’t supported).");
  }

  self.onmessage = function (e) {
    var d = e.data || {};
    Promise.resolve().then(function () {
      post({ type: "status", text: "Downloading compiler…" });
      importScripts(d.url);
      var M = self.Module;
      if (!M) throw new Error("Compiler script did not expose a Module.");
      post({ type: "status", text: "Starting compiler…" });
      return ready(M).then(function () {
        post({ type: "status", text: "Compiling…" });
        var r = run(M, d.input);
        post({ type: "result", output: r.output, version: r.version });
      });
    }).catch(function (err) { post({ type: "error", error: String((err && err.message) || err) }); });
  };
})();
