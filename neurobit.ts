// Enums to be used in extension
enum Signal {
    EMG,
    EEG,
    ECG
}



//% color="#E69138" icon="\uf188" weight=90
namespace neurobit {
    let buffer:number[] = [];
    let signalType: Signal = Signal.EMG
    let notInitialized = 1
    // Define your background function
    function backgroundTask(): void {
        while (true) {
            pins.digitalWritePin(DigitalPin.P2, 1)
            buffer.push(pins.analogReadPin(AnalogPin.P0));
            if (buffer.length > 500) {
                buffer.removeAt(0)
            }
            pins.digitalWritePin(DigitalPin.P2, 0)
            basic.pause(0)
        }
    }

    /**
     * Start recording EEG signal
     */

    //% group="Signal"
    //% weight=46 
    //% block="StartRecordingEEG"
    export function startRecordingEEG(): void {
        pins.digitalWritePin(DigitalPin.P5, 0)
        pins.digitalWritePin(DigitalPin.P6, 0)
        if (notInitialized)
        {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }

    /**
     * Start recording EMG signal 
     */

    //% group="Signal"
    //% weight=45 
    //% block="StartRecordingEMG"
    export function startRecordingEMG(): void {
        pins.digitalWritePin(DigitalPin.P5, 0)
        pins.digitalWritePin(DigitalPin.P6, 0)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }


    /**
     * Start recording ECG signal
     */

    //% group="Signal"
    //% weight=44 
    //% block="StartRecordingECG"
    export function startRecordingECG(): void {
        pins.digitalWritePin(DigitalPin.P5, 0)
        pins.digitalWritePin(DigitalPin.P6, 0)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }
    /**
     * Return last measured value of the signal
     */

    //% group="Signal"
    //% weight=50 
    //% block="getSignal"
    export function getSignal(): number {
        if (buffer.length>0)
        {
            return buffer[buffer.length-1];
        }
        else
        {
            return 0;
        }
    }

    /**
     * Return two seconds of recorded signal
     */

    //% group="Signal"
    //% weight=47 
    //% block="getBuffer"
    export function getBuffer(): number[] {
        return buffer;
    }

}