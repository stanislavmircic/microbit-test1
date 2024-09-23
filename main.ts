let test = 0
neurobit.startRecordingECG()
basic.forever(function () {
    pins.digitalWritePin(DigitalPin.P1, 1)
    test = neurobit.getHeartRate()
    serial.writeNumber(test)
    serial.writeLine("")
    pins.digitalWritePin(DigitalPin.P1, 0)
})
