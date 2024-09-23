let test = 0
neurobit.startRecordingEMG()
basic.forever(function () {
    pins.digitalWritePin(DigitalPin.P1, 1)
    test = neurobit.getSignal()
    if (test > 700) {
        led.plot(1, 1)
        led.unplot(3, 3)
    } else {
        led.plot(3, 3)
        led.unplot(1, 1)
    }
    serial.writeNumber(test)
    serial.writeLine("")
    pins.digitalWritePin(DigitalPin.P1, 0)
})
