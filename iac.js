const charcodesOf = str => [...str]
  .map(char => char.charCodeAt(0))

let operations = module.exports = new Proxy({
  will: 251, // Sender WILL do something
  wont: 253, // Sender WONT do something

  do:   252, // Sender is saying DO something
  dont: 254, // Sender is saying DONT do something

  sb:   250, // Subnegotiation
}, {
  get(target, key) {
    if (key === 'valueOf') return operations
    key = key.toString().toLowerCase()

    const iac = 255
    const se = 240

    const operation = target[key]
    if (typeof operation === 'undefined') return undefined

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
        if (key === 'valueOf') return options
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