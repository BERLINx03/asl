import { useRef, useState, useEffect } from 'react';
import { aslRecognitionApi } from '../../services/apiService';
import './exercise.css';

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
  model_used: string;
}

interface NavigationButton {
  image: string;
  onClick: () => void;
  alt: string;
}

interface ExerciseTemplateProps {
  title: string;
  letters: string[];
  description: string;
  modelName?: string; // Name of specialized model to use
  showHandSigns?: boolean; // Whether to show hand sign images
  navigationButton?: NavigationButton; // Button to navigate to exercise menu
}

// Hand connections for drawing landmarks
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],  // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],  // index finger
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],  // ring finger
  [0, 17], [17, 18], [18, 19], [19, 20],  // pinky
  [5, 9], [9, 13], [13, 17],  // palm connections
];

// Hand sign image mapping with string paths
const handSignImages: { [key: string]: string } = {
  'A': '/assets/asl_alphabets/Ahand.svg',
  'B': '/assets/asl_alphabets/Bhand.svg',
  'C': '/assets/asl_alphabets/Chand.svg',
  'D': '/assets/asl_alphabets/Dhand.svg',
  'E': '/assets/asl_alphabets/Ehand.svg',
  'F': '/assets/asl_alphabets/Fhand.svg',
  'G': '/assets/asl_alphabets/Ghand.svg',
  'H': '/assets/asl_alphabets/Hhand.svg',
  'I': '/assets/asl_alphabets/Ihand.svg',
  'J': '/assets/asl_alphabets/Jhand.svg',
  'K': '/assets/asl_alphabets/Khand.svg',
  'L': '/assets/asl_alphabets/Lhand.svg',
  'M': '/assets/asl_alphabets/Mhand.svg',
  'N': '/assets/asl_alphabets/Nhand.svg',
  'O': '/assets/asl_alphabets/Ohand.svg',
  'P': '/assets/asl_alphabets/Phand.svg',
  'Q': '/assets/asl_alphabets/Qhand.svg',
  'R': '/assets/asl_alphabets/Rhand.svg',
  'S': '/assets/asl_alphabets/Shand.svg',
  'T': '/assets/asl_alphabets/Thand.svg',
  'U': '/assets/asl_alphabets/Uhand.svg',
  'V': '/assets/asl_alphabets/Vhand.svg',
  'W': '/assets/asl_alphabets/Whand.svg',
  'X': '/assets/asl_alphabets/Xhand.svg',
  'Y': '/assets/asl_alphabets/Yhand.svg',
  'Z': '/assets/asl_alphabets/Zhand.svg'
};

const ExerciseTemplate: React.FC<ExerciseTemplateProps> = ({ 
  title,
  letters,
  description,
  modelName = 'general',
  showHandSigns = false,
  navigationButton
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [processingFrame, setProcessingFrame] = useState(false);
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [letterHoldTime, setLetterHoldTime] = useState(0);
  const requestRef = useRef<number | null>(null);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);
  
  // Get current letter
  const currentLetter = letters[currentLetterIndex];
  
  // Check API health when component mounts
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const healthStatus = await aslRecognitionApi.checkHealth();
        setApiStatus(healthStatus.status === 'healthy' ? 'online' : 'offline');
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus('offline');
      }
    };

    checkApiHealth();
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
          
          // Setup canvas size once video dimensions are known
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              
              if (processingCanvasRef.current) {
                processingCanvasRef.current.width = videoRef.current.videoWidth;
                processingCanvasRef.current.height = videoRef.current.videoHeight;
              }
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
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Start/stop continuous detection
  useEffect(() => {
    if (isDetecting) {
      const detectFrame = () => {
        processFrame();
        requestRef.current = requestAnimationFrame(detectFrame);
      };
      
      requestRef.current = requestAnimationFrame(detectFrame);
    } else {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isDetecting]);

  // Draw landmarks when they update
  useEffect(() => {
    if (canvasRef.current && landmarks.length > 0) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawLandmarksOnCanvas(ctx, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [landmarks]);

  // Handle letter detection
  useEffect(() => {
    if (!isDetecting || !detectedSign) return;
    
    // If detected sign matches current letter
    if (detectedSign.toUpperCase() === currentLetter) {
      // Clear any existing timer
      if (holdTimer) {
        clearTimeout(holdTimer);
      }
      
      // Start new timer to track how long user holds the correct sign
      const timer = setTimeout(() => {
        // Mark letter as completed
        if (!completedLetters.includes(currentLetter)) {
          setCompletedLetters([...completedLetters, currentLetter]);
        }
        
        // Move to next letter or reset if all completed
        if (currentLetterIndex < letters.length - 1) {
          setCurrentLetterIndex(currentLetterIndex + 1);
        } else {
          // All letters completed
          setIsDetecting(false);
          // Could add celebration animation or message
        }
        
        setLetterHoldTime(0);
      }, 1500); // Need to hold correct sign for 1.5 seconds
      
      setHoldTimer(timer);
      setLetterHoldTime(prev => Math.min(prev + 100, 1500));
    } else {
      // Wrong sign, reset the timer
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }
      setLetterHoldTime(0);
    }
    
    return () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
      }
    };
  }, [detectedSign, isDetecting, currentLetter]);

  const startExercise = () => {
    setIsDetecting(true);
    setCurrentLetterIndex(0);
    setCompletedLetters([]);
  };

  const stopExercise = () => {
    setIsDetecting(false);
    setDetectedSign(null);
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setLetterHoldTime(0);
  };

  const drawLandmarksOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!landmarks || landmarks.length === 0) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Mirror the canvas for more intuitive display
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
    
    // Draw each landmark point
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      const color = getLandmarkColor(index);
      drawCircle(x, y, 5, color);
    });
    
    // Draw connections between landmarks
    ctx.lineWidth = 3;
    HAND_CONNECTIONS.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startX = landmarks[start].x * width;
        const startY = landmarks[start].y * height;
        const endX = landmarks[end].x * width;
        const endY = landmarks[end].y * height;
        
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });
    
    ctx.restore();
  };
  
  const getLandmarkColor = (index: number): string => {
    if (index === 0) return 'yellow'; // Wrist
    if (index >= 1 && index <= 4) return 'red'; // Thumb
    if (index >= 5 && index <= 8) return 'green'; // Index finger
    if (index >= 9 && index <= 12) return 'blue'; // Middle finger
    if (index >= 13 && index <= 16) return 'purple'; // Ring finger
    return 'orange'; // Pinky
  };
  
  const drawCircle = (x: number, y: number, radius: number, color: string) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  };

  const processFrame = async () => {
    if (!videoRef.current || processingFrame || !isDetecting) return;
    setProcessingFrame(true);
    
    try {
      // Capture the current frame
      if (videoRef.current && processingCanvasRef.current) {
        const video = videoRef.current;
        const canvas = processingCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setProcessingFrame(false);
          return;
        }
        
        // Draw the current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        // Send to API with specified model
        const result = await aslRecognitionApi.predictBase64(imageBase64, modelName);
        
        if (result.has_hand) {
          setDetectedSign(result.sign);
          setConfidence(result.confidence);
          setLandmarks(result.landmarks);
        } else {
          setDetectedSign(null);
          setConfidence(null);
          setLandmarks([]);
        }
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      setProcessingFrame(false);
    }
  };

  return (
    <div className="exercise-page">
      <div className="exercise-header">
        <h1>{title} Exercise</h1>
        
        {navigationButton && (
          <div className="navigation-button">
            <img 
              src={navigationButton.image} 
              alt={navigationButton.alt} 
              onClick={navigationButton.onClick}
            />
          </div>
        )}
      </div>
      
      <p className="description">{description}</p>
      
      <div className="exercise-container">
        {/* Left side: Video feed and controls */}
        <div className="camera-section">
          <div className="video-container">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }} /* Mirror video */
            />
            
            <canvas 
              ref={canvasRef}
              className="landmark-canvas"
            />
            
            <canvas 
              ref={processingCanvasRef}
              style={{ display: 'none' }}
            />
            
            {detectedSign && (
              <div className="detected-sign">
                Detected: {detectedSign} ({confidence !== null ? (confidence * 100).toFixed(1) : 0}%)
              </div>
            )}
          </div>
          
          <div className="controls">
            {!isDetecting ? (
              <button 
                onClick={startExercise} 
                className="btn btn-primary"
                disabled={apiStatus !== 'online'}
              >
                Start Exercise
              </button>
            ) : (
              <button onClick={stopExercise} className="btn btn-danger">
                Stop Exercise
              </button>
            )}
          </div>
          
          {apiStatus === 'offline' && (
            <div className="api-status error">
              API is offline. Please make sure the ASL recognition service is running.
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        {/* Right side: Current letter task and hand sign */}
        <div className="task-section">
          <div className="current-task">
            <h2>Sign the letter: <span className="target-letter">{currentLetter}</span></h2>
            
            {/* Hand sign image */}
            {showHandSigns && handSignImages[currentLetter] && (
              <div className="hand-sign-container">
                <img 
                  src={handSignImages[currentLetter]} 
                  alt={`ASL hand sign for ${currentLetter}`} 
                  className="hand-sign-image"
                />
              </div>
            )}
            
            {/* Hold progress bar */}
            {letterHoldTime > 0 && (
              <div className="hold-progress-container">
                <div 
                  className="hold-progress-bar" 
                  style={{ width: `${(letterHoldTime / 1500) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Progress indicators */}
          <div className="progress-indicators">
            {letters.map((letter, index) => (
              <div 
                key={letter} 
                className={`letter-indicator ${completedLetters.includes(letter) ? 'completed' : ''} ${letter === currentLetter ? 'current' : ''}`}
              >
                <div className="letter">{letter}</div>
                {completedLetters.includes(letter) && (
                  <img src="/assets/icon/done-128.svg" alt="Completed" className="completed-icon" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTemplate; 