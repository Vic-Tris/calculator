/* Offline Vosk WebAssembly microphone bridge. The Vosk runtime is loaded by index.html. */
(function () {
    'use strict';

    // Override when serving a different extracted Vosk model folder.
    const MODEL_URL = window.VOSK_MODEL_URL || './model/';
    const SAMPLE_RATE = 16000;
    let model = null;
    let recognizer = null;
    let audioContext = null;
    let mediaStream = null;
    let source = null;
    let processor = null;
    let onlineRecognition = null;
    let onlineListening = false;
    let isListening = false;
    let isSpeaking = false;

    function setVoiceStatus(message, state) {
        const status = document.getElementById('voiceStatus');
        if (status) {
            status.textContent = message;
            status.dataset.state = state || '';
        }
    }

    function speak(message) {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.15;
        utterance.onstart = function () {
            isSpeaking = true;
            setVoiceStatus('Speaking', 'speaking');
        };
        utterance.onend = utterance.onerror = function () {
            isSpeaking = false;
            if (!isListening) setVoiceStatus('Ready', 'ready');
        };
        window.speechSynthesis.speak(utterance);
    }

    function setListeningState(listening) {
        isListening = listening;
        document.getElementById('micBtn')?.classList.toggle('listening', listening);
        if (!listening && !isSpeaking) setVoiceStatus('Ready', 'ready');
    }

    function showTranscript(text) {
        const transcript = document.getElementById('voiceTranscript');
        if (transcript) transcript.textContent = text;
    }

    async function loadModel() {
        if (model) return model;
        if (!window.Vosk || typeof window.Vosk.createModel !== 'function') {
            throw new Error('Local Vosk runtime was not loaded from js/vosk.js');
        }
        setVoiceStatus('Loading offline voice model...', 'loading');
        try {
            const modelResponse = await fetch(MODEL_URL, { cache: 'no-store' });
            if (!modelResponse.ok) {
                throw new Error(`Offline voice model folder returned HTTP ${modelResponse.status}`);
            }
            model = await Promise.race([
                window.Vosk.createModel(MODEL_URL),
                new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error(
                        'Offline voice model timed out. Serve the app over HTTP and check the model folder.'
                    )), 30000);
                })
            ]);
            return model;
        } catch (error) {
            model = null;
            throw error;
        }
    }

    function stopAudio() {
        processor?.disconnect();
        source?.disconnect();
        mediaStream?.getTracks().forEach(track => track.stop());
        if (audioContext && audioContext.state !== 'closed') audioContext.close();
        processor = null;
        source = null;
        mediaStream = null;
        audioContext = null;
        recognizer?.removeAllListeners?.();
        recognizer = null;
    }

    function getOnlineRecognition() {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return null;
        if (!onlineRecognition) {
            onlineRecognition = new Recognition();
            onlineRecognition.continuous = false;
            onlineRecognition.interimResults = false;
            onlineRecognition.lang = 'en-US';
            onlineRecognition.onresult = event => {
                const result = event.results[event.resultIndex];
                const transcript = result?.[0]?.transcript || '';
                showTranscript(transcript);
                if (result?.isFinal) {
                    handleTranscript(transcript);
                    onlineListening = false;
                    setListeningState(false);
                }
            };
            onlineRecognition.onerror = event => {
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setVoiceStatus('Microphone permission denied', 'error');
                } else if (event.error !== 'aborted') {
                    setVoiceStatus('Online voice input failed', 'error');
                }
                onlineListening = false;
                setListeningState(false);
            };
            onlineRecognition.onend = () => {
                onlineListening = false;
                if (isListening) setListeningState(false);
            };
        }
        return onlineRecognition;
    }

    function startOnlineListening(reason) {
        const recognition = getOnlineRecognition();
        if (!recognition) {
            throw new Error('Online speech recognition is not supported by this browser');
        }
        setVoiceStatus(`Switching to online voice${reason ? `: ${reason}` : ''}...`, 'online');
        onlineListening = true;
        setListeningState(true);
        recognition.start();
        setVoiceStatus('Listening online...', 'listening');
    }

    async function startListening() {
        if (isListening) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Microphone capture is not supported by this browser');
        }

        await loadModel();
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
        });
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        source = audioContext.createMediaStreamSource(mediaStream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);
        recognizer = new model.KaldiRecognizer(SAMPLE_RATE);

        recognizer.on('result', event => handleTranscript(event.result?.text));
        recognizer.on('partialresult', event => showTranscript(event.result?.partial || ''));
        processor.onaudioprocess = event => {
            if (!recognizer) return;
            recognizer.acceptWaveform(event.inputBuffer);
        };
        source.connect(processor);
        processor.connect(audioContext.destination);
        setListeningState(true);
        setVoiceStatus('Listening offline...', 'listening');
    }

    function handleTranscript(text) {
        const transcript = String(text || '').toLowerCase().trim();
        if (!transcript) return;
        showTranscript(transcript);
        processVoiceCommand(transcript);
    }

    function stopListening() {
        if (!isListening) return;
        if (onlineListening) {
            onlineListening = false;
            onlineRecognition?.stop();
            setListeningState(false);
            return;
        }
        if (recognizer) {
            const finalResult = recognizer.retrieveFinalResult?.();
            handleTranscript(finalResult?.text);
        }
        stopAudio();
        setListeningState(false);
    }

    window.toggleVoiceInput = async function () {
        if (isListening) {
            stopListening();
            return;
        }
        try {
            await startListening();
        } catch (error) {
            stopAudio();
            setListeningState(false);
            if (error.name !== 'NotAllowedError' && error.name !== 'NotFoundError') {
                try {
                    startOnlineListening('offline model unavailable');
                    console.warn('[Voice] Offline model unavailable; using online recognition.', error);
                    return;
                } catch (onlineError) {
                    console.error('[Voice] Online fallback unavailable.', onlineError);
                }
            }
            const message = error.name === 'NotAllowedError' ? 'Microphone permission denied' :
                error.message.includes('model') ? 'Offline voice model failed to load' : 'Offline voice input failed';
            setVoiceStatus(message, 'error');
            speak(message);
            console.error('[Vosk]', error);
        }
    };

    window.addEventListener('beforeunload', stopAudio);
    if (window.Vosk && typeof window.Vosk.createModel === 'function') {
        setVoiceStatus('Offline voice ready', 'offline');
    } else {
        setVoiceStatus('Add local Vosk runtime', 'error');
    }
}());