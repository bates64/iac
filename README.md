# iac
> Node.js interface to Telnet's Interpret As Command

[![npm version](https://img.shields.io/npm/v/iac.svg)](https://www.npmjs.com/package/iac)
[![npm downloads](https://img.shields.io/npm/dt/iac.svg)](https://www.npmjs.com/package/iac)
[![license](https://img.shields.io/github/license/nanalan/iac.svg)](LICENSE)

Install with npm:
```sh
$ npm install --save iac
```

`iac` relies on es6 `Proxy`, therefore you must use **Node.js version 6.0.0 or above**.

## Examples
#### As the server
```js
const net = require('net')
const iac = require('iac')

net
  .createServer(sock => {
    // IAC WILL ECHO
    sock.write(iac.will.echo)

    // Handler for IAC SB NAWS
    iac.on(sock, iac.sb.naws, (width, height) => {
      console.log(`Remote terminal is ${width}x${height}`)
    })
  })
  .listen(3000)
```

##### As the client
```js
const net = require('net')
const iac = require('iac')

net
  .createConnection('localhost', 3000)
  .on('connect', conn => {
    // IAC SB NAWS 0 80 0 24 IAC SE
    //  A window 80 characters wide, 24 characters high
    //  See RFC 1073

    conn.write(iac.sb.naws(80, 24))
  })
```

## API
`iac.OPERATION.OPTION` will always be a `Buffer`, where:

**OPERATION** is one of:
- will
- wont
- do
- dont
- sb [(special case)](#subnegotiation)

**OPTION** is one of:
- binary (Binary Transmission)
- echo
- suppress (Suppress Go Ahead)
- status [not fully supported]
- timing (Timing Mark)
- terminal (Terminal Type)
- naws (Negotiate About Window Size)
- speed (Terminal Speed)
- flow (Remote Flow Control)
- linemode
- env (Environment Variables)

Both OPERATION and OPTION are **case insensitive**. If either are not one of the operations/options listed then it shall return `undefined`.

e.g.
```js
const iac = require('iac')

// IAC DONT SUPPRESS-GO-AHEAD
iac.dont.suppress

// IAC WILL LINEMODE
iac.will.linemode 
```

### Subnegotiation
To use subnegotiation, _call_ `iac.sb.OPTION()`:

- **Strings** are interpolated into ASCII
- **Numbers** are passed directly
- Passing **no arguments** implies subnegotiation _value required_ (1).

e.g.
```js
const iac = require('iac')

// IAC SB NAWS 0 80 0 24 IAC SE
iac.sb.naws(80, 24)

// IAC SB TERMINAL-TYPE 1 IAC SE
iac.sb.terminal()
```

### On
`iac` also provides support for **assigning handlers for socket data of specific IAC commands** on a socket with `iac.on(socket, command, handler)`. _command_ should be something like `iac.do.suppress` or `iac.sb.status`.

e.g.
```js
const net = require('net')
const iac = require('iac')

net
  .createServer(sock => {
    // Do not use `sock.setEncoding` at any point if using `iac.on(sock)`

    // Handlers...
    iac
      .on(sock, iac.will.naws, () => console.log(`Remote will NAWS`))
      .on(sock, iac.wont.naws, () => console.log(`Remote wont NAWS`))
      .on(sock, iac.sb.naws, (width, height) => {
        // Note encoding is operation-specific
        console.log(`Remote terminal size is ${width}x${height}`)
      })

    // Ask socket to negotiate window size
    sock.write(iac.do.naws)
  })
  .listen(3000)
```