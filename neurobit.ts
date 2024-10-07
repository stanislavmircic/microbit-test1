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
    let tempCalculationValue:number = 0
    let lastSample = 0
    let bpmECG:number = 0
    const MAX_BUFFER_SIZE = 500;
    const NOISE_FLOOR = 580;
    const ENVELOPE_DECAY = 2;
    const ECG_JUMP = 40
    const DEBOUNCE_PERIOD_ECG = 300


    // Filter coefficients: [b0, b1, b2, a1, a2]
    let coefficients: number[] = [0, 0, 0, 0, 0];

    // Buffers to keep the last two input and output samples
    let gInputKeepBuffer: number[] = [0, 0];
    let gOutputKeepBuffer: number[] = [0, 0];

    // Filter parameters
    const SAMPLING_RATE: number = 250;       // Hz
    const ALPHA_WAVE_FREQUENCY: number = 10;     // Hz (Notch frequency)
    const Q: number = 1;                   // Quality factor
    const BASELINE_ALPHA:number = 20;

    let eegSignalPower:number = 0;
    let eegNotchedSignalPower:number = 0;
    let filteredValue:number = 0;
    let eegAlphaPower:number = 0;

    /**
     * Calculate intermediate variables and set filter coefficients
     */
    function calculateNotchCoefficients(Fc: number, Q: number, Fs: number): void {
        const omega = (2 * Math.PI * Fc) / Fs;
        const omegaS = Math.sin(omega);
        const omegaC = Math.cos(omega);
        const alpha = omegaS / (2 * Q);

        const a0 = 1 + alpha;
        const b0 = 1 / a0;
        const b1 = (-2 * omegaC) / a0;
        const b2 = 1 / a0;
        const a1 = (-2 * omegaC) / a0;
        const a2 = (1 - alpha) / a0;

        // Set the coefficients array
        coefficients[0] = b0;
        coefficients[1] = b1;
        coefficients[2] = b2;
        coefficients[3] = a1;
        coefficients[4] = a2;
    }



    /**
  * Filter a single input sample and return the filtered output
  * @param inputValue The input sample to be filtered
  * @returns The filtered output sample
  */
    export function filterSingleSample(inputValue: number): number {
        // Compute the filtered output using the difference equation:
        // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
        const y = (coefficients[0] * inputValue) +
            (coefficients[1] * gInputKeepBuffer[0]) +
            (coefficients[2] * gInputKeepBuffer[1]) -
            (coefficients[3] * gOutputKeepBuffer[0]) -
            (coefficients[4] * gOutputKeepBuffer[1]);

        // Update the input buffer (shift the samples)
        gInputKeepBuffer[1] = gInputKeepBuffer[0]; // x[n-2] = x[n-1]
        gInputKeepBuffer[0] = inputValue;           // x[n-1] = x[n]

        // Update the output buffer (shift the samples)
        gOutputKeepBuffer[1] = gOutputKeepBuffer[0]; // y[n-2] = y[n-1]
        gOutputKeepBuffer[0] = y;                     // y[n-1] = y[n]

        return y | 0;
    }

    // Define your background function
    function backgroundTask(): void {
        while (true) {
            pins.digitalWritePin(DigitalPin.P2, 1)
            lastSample = tempCalculationValue
            tempCalculationValue = pins.analogReadPin(AnalogPin.P1)
            buffer.push(tempCalculationValue);

            if (buffer.length > MAX_BUFFER_SIZE) {
                buffer.removeAt(0)
            }
            if (signalType == Signal.ECG)
            {
                if ((tempCalculationValue-lastSample)>ECG_JUMP)
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
                tempCalculationValue = tempCalculationValue - NOISE_FLOOR;
                if (tempCalculationValue>0)
                {
                    if (tempCalculationValue > envelopeValue)
                    {
                        envelopeValue = tempCalculationValue;
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
                eegSignalPower = eegSignalPower * 0.99 +0.01* (Math.abs(tempCalculationValue-512))
                filteredValue = filterSingleSample(tempCalculationValue)
                eegNotchedSignalPower = eegNotchedSignalPower * 0.99 + 0.01 * (Math.abs(filteredValue - 512))
                eegAlphaPower = (eegSignalPower - eegNotchedSignalPower) - BASELINE_ALPHA;
                if (eegAlphaPower<0)
                {
                    eegAlphaPower = 0;
                }
            }

            pins.digitalWritePin(DigitalPin.P2, 0)
            basic.pause(0)
        }
    }



    /**
     * Start recording EMG signal 
     */

    //% group="Initialization"
    //% weight=45 
    //% block="StartRecordingEMG"
    export function startRecordingEMG(): void {
        signalType = Signal.EMG;
        pins.digitalWritePin(DigitalPin.P8, 1)
        pins.digitalWritePin(DigitalPin.P9, 1)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }


    /**
     * Start recording ECG signal
     */

    //% group="Initialization"
    //% weight=44 
    //% block="StartRecordingECG"
    export function startRecordingECG(): void {
        signalType = Signal.ECG;
        pins.digitalWritePin(DigitalPin.P8, 0)
        pins.digitalWritePin(DigitalPin.P9, 1)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }

    /**
 * Start recording EEG signal
 */

    //% group="Initialization"
    //% weight=43 
    //% block="StartRecordingEEG"
    export function startRecordingEEG(): void {
        signalType = Signal.EEG;
        calculateNotchCoefficients(ALPHA_WAVE_FREQUENCY, Q, SAMPLING_RATE);
        pins.digitalWritePin(DigitalPin.P8, 0)
        pins.digitalWritePin(DigitalPin.P9, 0)
        if (notInitialized) {
            control.inBackground(() => {
                backgroundTask()
            })
        }
    }

    /**
     * Return last measured value of the signal
     */

    //% group="Raw data"
    //% weight=42
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

    //% group="Raw data"
    //% weight=41 
    //% block="getBuffer"
    export function getBuffer(): number[] {
        return buffer;
    }

    /**
         * Return last envelope value
         */

    //% group="Processed data"
    //% weight=40
    //% block="getEnvelope"
    export function getEnvelope(): number {
        return envelopeValue;
    }

    /**
         * Return heart rate
         */

    //% group="Processed data"
    //% weight=39
    //% block="getHeartRate"
    export function getHeartRate(): number {
        return bpmECG;
    }

    /**
         * Return alpha waves power
         */

    //% group="Processed data"
    //% weight=38
    //% block="getAlphaWaves"
    export function getAlphaWaves(): number {
        return eegAlphaPower;
    }


}