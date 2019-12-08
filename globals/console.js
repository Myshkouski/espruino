if (!console.time) {
    const timers = {}

    console.time = label => {
        timers[label] = Date.now()
    }

    console.timeEnd = label => {
        if (label in timers) {
            console.log(`${label}: ${(Date.now() - timers[label]).toFixed(3)}ms`)
            delete timers[label]
        }
    }
}

if (!console.error) {
    console.error = console.log
}

if (!console.info) {
    console.info = console.log
}
