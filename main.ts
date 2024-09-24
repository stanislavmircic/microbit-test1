let test = 0
neurobit.startRecordingEEG()
// Output the filtered data
// serial.writeLine("Filtered data: " + data.join(", "));
basic.forever(function () {
    pins.digitalWritePin(DigitalPin.P1, 1)
    test = neurobit.getAlphaWaves()
    serial.writeNumber(test)
    serial.writeLine("")
    pins.digitalWritePin(DigitalPin.P1, 0)
})
