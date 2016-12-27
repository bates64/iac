const charcodesOf = str => [...str]
  .map(char => char.charCodeAt(0))

const EventEmitter = require('events')

let operations = module.exports = new Proxy({
  will: 251, // Sender WILL do something
  wont: 252, // Sender WONT do something

  do:   253, // Sender is saying DO something
  dont: 254, // Sender is saying DONT do something

  sb:   250, // Subnegotiation
  on:   ()=>{},
}, {
  get(target, key) {
    if (key === 'valueOf') return operations
    const op = key = key.toString().toLowerCase()

    const iac = 255
    const se = 240

    const operation = target[key]
    if (typeof operation === 'undefined') return undefined

    if (key === 'on') {
      return (sock, command, handler) => {
        if (!(sock instanceof EventEmitter))
          throw new TypeError('sock must be EventEmitter')
        if (typeof command === 'undefined')
          throw new TypeError('command must be defined')
        if (!(handler instanceof Function))
          throw new TypeError('handler must be Function')

        const [ expectedIac, expectedOperation, expectedOption ] = command instanceof Buffer
          ? command.toJSON().data
          : command instanceof Function
          ? command().toJSON().data.slice(0, 3)
          : command.toArray

        sock.on('data', data => {
          const [ remoteIac, remoteOperation, remoteOption, ...args ] = data.toJSON().data

          if (expectedIac === remoteIac
            && (!expectedOperation || expectedOperation === remoteOperation)
            && (!expectedOption || expectedOption === remoteOption)) {
            if (expectedOption) {
              if (remoteOperation === 250) {
                // Subnegotiation
                let subargs = []
                let currSubarg = []

                args.pop() // SE

                for (let i in args) {
                  let arg = args[i]

                  if (arg === 0 || arg === 255) {
                    if (currSubarg.length)
                      subargs.push(currSubarg)
                    currSubarg = []
                  } else {
                    currSubarg.push(arg)
                  }
                }

                handler(...subargs)
              } else {
                handler(...args)
              }
            } else {
              handler(remoteOption, ...args)
            }
          }
        })

        return operations
      }
    }

    let options = new Proxy({
      binary: 0,        // Binary Transmission
      echo: 1,          // Echo
      suppress: 3,      // Suppress Go Ahead
      status: 5,        // Status
      timing: 6,        // Timing Mark
      terminal: 24,     // Terminal Type
      naws: 31,         // Negotiate About Window Size
      speed: 32,        // Terminal Speed
      flow: 33,         // Remote Flow Control
      linemode: 34,     // Linemode
      env: 36,          // Environment Variables
    }, {
      get(target, key) {
        if (key === 'valueOf') return `IAC ${op}`
        if (key === 'toArray') return [ 255, operation ]
        key = key.toString().toLowerCase()

        const option = target[key]
        if (typeof option === 'undefined') return undefined

          if (operation === 250) {
            // Subnegotiation

            return (...args) => {
              let res = [ iac, operation, option ]

              if (args.length === 0) {
                // Value Requested
                res.push(1)
              } else {
                for (let arg of args) {
                  // Value Given
                  if (arg instanceof Number) res.push(0, arg)
                  else res.push(0, ...charcodesOf(arg))
                }
              }

              res.push(iac, se)

              return new Buffer(res)
            }
          } else return new Buffer([ iac, operation, option ])
      }
    })

    return options
  }
})