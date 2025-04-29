import { useRef, useState, useEffect } from 'react';
import { predictFromBase64, checkAPIHealth } from '../../services/aToFApiService';
import './exercises.css';

// Import images directly
import checkmarkIcon from '../../assets/icon/done-256.svg';
import AhandImg from '../../assets/asl_alphabets/Ahand.svg';
import BhandImg from '../../assets/asl_alphabets/Bhand.svg';
import ChandImg from '../../assets/asl_alphabets/Chand.svg';
import DhandImg from '../../assets/asl_alphabets/Dhand.svg';
import EhandImg from '../../assets/asl_alphabets/Ehand.svg';
import FhandImg from '../../assets/asl_alphabets/Fhand.svg';

interface Landmark {
  x: number;
  y: number;
  z: number;
  index: number;
}

interface PredictionResponse {
  sign: string;
  confidence: number;
  landmarks: Landmark[];
  has_hand: boolean;
  is_a_to_f: boolean;
}

// Finger connections for drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],  // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],  // index finger
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],  // ring finger
  [0, 17], [17, 18], [18, 19], [19, 20],  // pinky
  [5, 9], [9, 13], [13, 17],  // palm connections
];

const AtoFExercise = () => {
  // References for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State variables
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isStarted, setIsStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);

  // A to F specific state
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [currentSign, setCurrentSign] = useState<string>(letters[0]);
  const [signHoldProgress, setSignHoldProgress] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [exerciseComplete, setExerciseComplete] = useState(false);
  
  // Create a mapping of letter to hand image
  const letterImages = {
    'A': AhandImg,
    'B': BhandImg,
    'C': ChandImg,
    'D': DhandImg,
    'E': EhandImg,
    'F': FhandImg
  };
  
  // Constants
  const LETTER_HOLD_TIME = 1000; // 1 second hold time
  const CAPTURE_INTERVAL = 150; // Throttle API calls
  
  // Refs for timers and animation
  const requestRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  const lastCaptureTime = useRef<number>(0);
  const lastDetectedTime = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add new state for API stability tracking
  const [apiErrorCount, setApiErrorCount] = useState(0);
  const [apiStable, setApiStable] = useState(true);
  const MAX_ERRORS_BEFORE_WARNING = 5;

  // Add new state for debug mode
  const [showDebug, setShowDebug] = useState(false);

  // Check API health when component mounts
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthStatus = await checkAPIHealth();
        setApiStatus(healthStatus.status === 'healthy' ? 'online' : 'offline');
        console.log("A-to-F API status:", healthStatus);
      } catch (error) {
        console.error('A-to-F API health check failed:', error);
        setApiStatus('offline');
      }
    };

    checkHealth();
  }, []);

  // Setup webcam when component mounts
  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              
              // Initialize processing canvas
              if (processingCanvasRef.current) {
                processingCanvasRef.current.width = videoRef.current.videoWidth;
                processingCanvasRef.current.height = videoRef.current.videoHeight;
              }
              
              // Auto-start the exercise
              setIsStarted(true);
              startRenderingFrames();
            }
          };
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setError('Could not access webcam. Please make sure your camera is connected and permissions are granted.');
      }
    };

    setupWebcam();
    
    // Cleanup function to stop webcam when unmounting
    return () => {
      stopAllTimers();
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Stop all timers and animation frames
  const stopAllTimers = () => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = null;
    }
    
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  
  // Start or stop the continuous processing
  useEffect(() => {
    if (isStarted && apiStatus === 'online') {
      requestRef.current = requestAnimationFrame(processFrame);
      console.log("Started continuous processing");
    } else if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isStarted, apiStatus]);
  
  // Track detection changes and check for correct letter
  useEffect(() => {
    if (!detectedSign || detectedSign === 'no_hand') {
      setSignHoldProgress(0);
      setIsCorrect(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }
    
    // Check if the detected sign matches the current target letter
    const isSignCorrect = detectedSign.toUpperCase() === currentSign;
    setIsCorrect(isSignCorrect);
    
    // If incorrect, reset progress
    if (!isSignCorrect) {
      setSignHoldProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }
    
    // If correct, start/continue the progress timer
    if (isSignCorrect && !progressIntervalRef.current) {
      lastDetectedTime.current = Date.now();
      
      progressIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedTime = now - lastDetectedTime.current;
        
        if (elapsedTime >= LETTER_HOLD_TIME) {
          // Letter successfully held for required time
          handleLetterComplete();
          
          // Clear interval after completion
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setSignHoldProgress(0);
        } else {
          // Update progress bar
          const progress = (elapsedTime / LETTER_HOLD_TIME) * 100;
          setSignHoldProgress(progress);
        }
      }, 33); // Update at ~30fps for smooth progress bar
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [detectedSign, currentSign]);
  
  // Handle letter completion
  const handleLetterComplete = () => {
    // Add current letter to completed list
    setCompletedLetters(prev => [...prev, currentSign]);
    
    // Move to next letter or finish exercise
    if (currentLetterIndex < letters.length - 1) {
      const nextIndex = currentLetterIndex + 1;
      setCurrentLetterIndex(nextIndex);
      setCurrentSign(letters[nextIndex]);
    } else {
      // Exercise complete!
      setExerciseComplete(true);
      setIsStarted(false);
    }
  };
  
  // Function to restart the exercise
  const restartExercise = () => {
    setCurrentLetterIndex(0);
    setCurrentSign(letters[0]);
    setCompletedLetters([]);
    setExerciseComplete(false);
    setIsStarted(true);
    setSignHoldProgress(0);
    setIsCorrect(false);
    
    // Clear any active timers
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  
  // Function to continuously render video frames to canvas
  const startRenderingFrames = () => {
    // Cancel any existing render loop
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
    }
    
    // Start new render loop
    renderVideoFrame();
  };
  
  const renderVideoFrame = () => {
    const drawFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        renderFrameRef.current = requestAnimationFrame(drawFrame);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        return;
      }
      
      // Ensure canvas is the right size
      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }
      
      // Clear the canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Flip horizontally to fix mirror effect
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Draw landmarks if available
      if (landmarks && landmarks.length > 0) {
        drawLandmarksOnCanvas(ctx, canvas.width, canvas.height);
      }
      
      // Schedule next frame
      renderFrameRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the rendering loop
    renderFrameRef.current = requestAnimationFrame(drawFrame);
  };
  
  // Add API stability monitoring
  useEffect(() => {
    if (apiErrorCount > MAX_ERRORS_BEFORE_WARNING) {
      setApiStable(false);
    } else if (apiErrorCount === 0) {
      setApiStable(true);
    }
  }, [apiErrorCount]);
  
  // Process frame and update ui continuously
  const processFrame = async () => {
    if (
      !videoRef.current ||
      !processingCanvasRef.current ||
      !processingCanvasRef.current.getContext('2d') ||
      apiStatus !== 'online' ||
      processing ||
      exerciseComplete
    ) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = Date.now();
    // Throttle API calls to prevent overwhelming the server
    if (now - lastCaptureTime.current < CAPTURE_INTERVAL) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    lastCaptureTime.current = now;
    setProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = processingCanvasRef.current;
      const context = canvas.getContext('2d')!;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame onto the canvas
      // Note: we don't flip the processing canvas as the API processes it correctly as is
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas image to base64 (removing the data:image/png;base64, prefix)
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      // Send to ASL Recognition API
      const result = await predictFromBase64(imageBase64);
      
      if (result.has_hand) {
        console.log(`Hand detected with sign: ${result.sign}, A-to-F: ${result.is_a_to_f}`);
        setDetectedSign(result.sign);
        setConfidence(result.confidence);
        setLandmarks(result.landmarks);
        setError(null);
      } else {
        // Only clear sign if no hand is detected
        console.log("No hand detected in the frame");
        setDetectedSign(null);
        setConfidence(null);
        setLandmarks([]);
        // Don't show error for no hand - that's normal during usage
      }
      
      // Reset error count on successful API call (whether hand detected or not)
      setApiErrorCount(0);
      setApiStable(true);
    } catch (error) {
      console.error('Error processing frame:', error);
      
      // Increment error count and check stability
      const newErrorCount = apiErrorCount + 1;
      setApiErrorCount(newErrorCount);
      
      if (newErrorCount >= MAX_ERRORS_BEFORE_WARNING) {
        setApiStable(false);
      }
      
      setError('Error processing image. The API may be unavailable.');
    } finally {
      setProcessing(false);
      requestRef.current = requestAnimationFrame(processFrame);
    }
  };
  
  // Draw landmarks on provided canvas context
  const drawLandmarksOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!landmarks || landmarks.length === 0) return;
    
    // Scaling the landmarks to canvas size and applying horizontal flip
    const scaleX = width;
    const scaleY = height;
    
    // Color for connections
    const connectionColor = isCorrect ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    
    // Draw connections first
    ctx.lineWidth = 3;
    ctx.strokeStyle = connectionColor;
    
    for (const [start, end] of HAND_CONNECTIONS) {
      if (landmarks[start] && landmarks[end]) {
        // Calculate flipped coordinates
        const startX = width - (landmarks[start].x * scaleX);
        const startY = landmarks[start].y * scaleY;
        const endX = width - (landmarks[end].x * scaleX);
        const endY = landmarks[end].y * scaleY;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
    
    // Draw landmarks
    const landmarkColor = isCorrect ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    
    for (const landmark of landmarks) {
      const x = width - (landmark.x * scaleX);
      const y = landmark.y * scaleY;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = landmarkColor;
      ctx.fill();
    }
  };

  // Helper function to get current letter image
  const getCurrentLetterImage = () => {
    return letterImages[currentSign as keyof typeof letterImages];
  };

  return (
    <div className="exercise-page a-to-f-exercise">
      <div className="exercise-header">
        <h1>A to F Exercise</h1>
        <p className="description">
          Practice American Sign Language alphabet letters A through F. 
          Position your hand clearly in front of the camera and try to match each letter.
          Hold the correct sign for 1 second to advance.
        </p>
      </div>
      
      <div className="exercise-container">
        <div className="exercise-main-content">
          <div className="video-section">
            <div className="video-container">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="webcam-video"
              />
              <canvas 
                ref={canvasRef}
                className="landmark-canvas"
              />
              <canvas 
                ref={processingCanvasRef}
                style={{ display: showDebug ? 'block' : 'none', position: 'absolute', top: 0, left: 0, opacity: 0.5 }}
              />
              
              <div className="debug-overlay">
                <div>API: {apiStatus} {!apiStable && <span style={{color: 'orange'}}>(unstable)</span>}</div>
                {confidence !== null && <div>Confidence: {(confidence * 100).toFixed(0)}%</div>}
                {apiErrorCount > 0 && <div>Errors: {apiErrorCount}</div>}
                <button 
                  onClick={() => setShowDebug(!showDebug)} 
                  style={{ background: 'none', border: '1px solid white', color: 'white', padding: '2px 5px', cursor: 'pointer' }}
                >
                  {showDebug ? 'Hide Debug' : 'Show Debug'}
                </button>
                <div>
                  <p style={{ color: '#ffff00', margin: '5px 0' }}>
                    Tips for hand detection:
                  </p>
                  <ul style={{ color: '#ffffff', fontSize: '12px', padding: '0 0 0 20px', margin: '0' }}>
                    <li>Good lighting on your hand</li>
                    <li>Hold hand 1-2 feet from camera</li>
                    <li>Keep hand in center of view</li>
                    <li>Use a plain background</li>
                    <li>Form clear, distinct shapes</li>
                  </ul>
                </div>
              </div>
            </div>

            {apiStatus === 'offline' && (
              <div className="alert alert-danger">
                A-to-F API is offline. Please make sure the specialized API is running.
              </div>
            )}
            
            {!apiStable && (
              <div className="alert alert-warning">
                API performance is unstable. Recognition may be interrupted.
              </div>
            )}
            
            {error && (
              <div className="alert alert-warning">
                {error}
              </div>
            )}
          </div>

          <div className="exercise-sidebar">
            {exerciseComplete ? (
              <div className="exercise-complete">
                <h2>Exercise Complete! 🎉</h2>
                <p>You've successfully learned all the letters from A to F.</p>
                <button 
                  className="restart-button"
                  onClick={restartExercise}
                >
                  Practice Again
                </button>
              </div>
            ) : (
              <>
                <div className="current-letter-container">
                  <h2>Current Letter</h2>
                  <div className="letter-display">
                    <div className="current-letter">
                      <div className="letter-image-container">
                        <div 
                          className="letter-image"
                          style={{ backgroundImage: `url(${getCurrentLetterImage()})` }}
                        ></div>
                      </div>
                      <div className="letter-label">{currentSign}</div>
                    </div>
                  </div>
                  
                  {isCorrect && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${signHoldProgress}%` }}
                        ></div>
                      </div>
                      <div className="progress-label">
                        Hold the sign for 1 second
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="letters-progress">
                  <h3>Progress</h3>
                  <div className="letter-sequence">
                    {letters.map((letter, index) => (
                      <div 
                        key={letter}
                        className={`sequence-letter ${index === currentLetterIndex ? 'current' : ''} ${completedLetters.includes(letter) ? 'completed' : ''}`}
                      >
                        {completedLetters.includes(letter) ? (
                          <img 
                            src={checkmarkIcon} 
                            alt="Completed" 
                            className="completed-icon"
                            width="24"
                            height="24"
                          />
                        ) : (
                          letter
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="detected-sign">
                  <h3>Detected Sign</h3>
                  <div className={`sign-display ${isCorrect ? 'correct' : ''}`}>
                    {detectedSign ? detectedSign : 'No sign detected'}
                  </div>
                </div>
                
                <div className="instructions">
                  <h3>Instructions</h3>
                  <ol>
                    <li>Position your hand clearly in front of the camera</li>
                    <li>Form the sign shown in the current letter box</li>
                    <li>Hold the correct sign for 1 second to advance</li>
                    <li>Complete all letters from A to F to finish the exercise</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtoFExercise; 