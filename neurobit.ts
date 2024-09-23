// Enums to be used in extension
enum Signal {
    EMG,
    EEG,
    ECG
}



//% color="#E69138" icon="\uf188" weight=90
namespace neurobit {
    let buffer:number[] = [];
    let ecgTimestamps: number[] = [];
    let signalType: Signal = Signal.EMG
    let notInitialized = 1
    let envelopeValue:number = 0
    let tempCaluclationValue:number = 0
    let lastSample = 0
    let bpmECG:number = 0
    const MAX_BUFFER_SIZE = 500;
    const NOISE_FLOOR = 580;
    const ENVELOPE_DECAY = 2;
    const ECG_JUMP = 40
    const DEBOUNCE_PERIOD_ECG = 300
    

    // Define your background function
    function backgroundTask(): void {
        while (true) {
            pins.digitalWritePin(DigitalPin.P2, 1)
            lastSample = tempCaluclationValue
            tempCaluclationValue = pins.analogReadPin(AnalogPin.P0)
            buffer.push(tempCaluclationValue);
            if (buffer.length > MAX_BUFFER_SIZE) {
                buffer.removeAt(0)
            }
            if (signalType == Signal.ECG)
            {
                if((tempCaluclationValue-lastSample)>ECG_JUMP)
                {
                    let currentMillis = control.millis()
                    if (ecgTimestamps.length>0)
                    {
                        if ((currentMillis - ecgTimestamps[ecgTimestamps.length - 1]) > DEBOUNCE_PERIOD_ECG)
                        {
                            ecgTimestamps.push(currentMillis)
                        }
                    }
                    else
                    {
                        ecgTimestamps.push(currentMillis)
                    }
                    
                    if (ecgTimestamps.length>3)
                    {
                        ecgTimestamps.removeAt(0)
                        bpmECG = (120000 / (ecgTimestamps[2] - ecgTimestamps[1] + ecgTimestamps[1] - ecgTimestamps[0])) | 0
                    }

                }
            }
            else if (signalType == Signal.EMG)
            {
                tempCaluclationValue = tempCaluclationValue - NOISE_FLOOR;
                if (tempCaluclationValue>0)
                {
                    if (tempCaluclationValue > envelopeValue)
                    {
                        envelopeValue = tempCaluclationValue;
                    }                    
                }
                
                envelopeValue = envelopeValue - ENVELOPE_DECAY;
                
                if (envelopeValue < 0)
                {
                    envelopeValue = 0;
                }
            }
            else if (signalType = Signal.EEG)
            {

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
        signalType = Signal.EEG;
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
        signalType = Signal.EMG;
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
        signalType = Signal.ECG;
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
         * Return last envelope value
         */

    //% group="Signal"
    //% weight=44
    //% block="getEnvelope"
    export function getEnvelope(): number {
        return envelopeValue;
    }

    /**
         * Return heart rate
         */

    //% group="Signal"
    //% weight=43
    //% block="getHeartRate"
    export function getHeartRate(): number {
        return bpmECG;
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