
const assert = require("./asserter.js");
const spawn = require('child_process').spawn;

module.exports = SpawnedProcess;

function SpawnedProcess(exePath, args)
{
    assert.isStringOrThrow(exePath);
    assert.isValidPathOrThrow(exePath);
    assert.isArrayOrThrow(args);

    //console.log(`Spawning process at ${exePath} with args ${args}`);

    const _process = spawn(exePath, args);
    _process.stderr.setEncoding("utf8");
    _process.stdout.setEncoding("utf8");

    this.onError = (doThis) => _process.on("error", (error) => doThis(error));
    
    this.onExited = (doThis) => _process.on("exit", (code, signal) => 
    {
        //console.log(`Process exited with code ${code} and signal ${signal}`);
        if (signal == null)
            doThis(code);
    });

    this.onTerminated = (doThis) => _process.on("exit", (code, signal) => 
    {
        //console.log(`Process terminated with code ${code} and signal ${signal}`);
        if (code == null)
            doThis(signal);
    });

    this.onStdioExited = (doThis) => _process.on("close", (code, signal) =>
    {
        //console.log(`Process stdio exited with code ${code} and signal ${signal}`);
        if (signal == null)
            doThis(code);
    });

    this.onStdioTerminated = (doThis) => _process.on("close", (code, signal) =>
    {
        //console.log(`Process stdio terminated with code ${code} and signal ${signal}`);
        if (code == null)
            doThis(signal);
    });

    this.onStderrData = (doThis) => _process.stderr.on("data", (data) => 
    {
        //console.log(`Process stderr data: `, data);
        doThis(data);
    });

    this.onStderrError = (doThis) => _process.stderr.on("error", (error) => 
    {
        //console.log(`Process stderr error: `, error);
        doThis(error);
    });

    this.onStdoutData = (doThis) => _process.stdout.on("data", (data) => 
    {
        //console.log(`Process stdout data: `, data);
        doThis(data)
    });

    // Reads the entirety of the stdout data spewed before returning.
    // This is necessary for tcpqueries on Linux, because contrary to
    // Windows, the stdout is asynchronous and will spew out the tcpquery
    // information line by line rather than as a whole.
    // https://nodejs.org/api/process.html#process_a_note_on_process_i_o
    this.readWholeStdoutData = () => 
    {
        var accumulatedData = "";

        return new Promise((resolve, reject) =>
        {
            _process.stdout.on("readable", () => 
            {
                var data;

                while(data = _process.stdout.read())
                    accumulatedData += data;
            });

            _process.stdout.on("end", () => resolve(accumulatedData));
            _process.stdout.on("error", (err) => reject(new Error(err.message)));
        });
    };

    this.onStdoutError = (doThis) => _process.stdout.on("error", (error) => 
    {
        //console.log(`Process stdout error: `, error);
        doThis(error)
    });
}