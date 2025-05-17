import { useRef, useState, useEffect } from 'react';
import { aslRecognitionApi, gameApi } from '../../services/apiService';
import './../detection/detection.css';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

// Import images directly
import checkmarkIcon from '../../assets/icon/done-128.svg';

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
}

interface MatchResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    playerAUsername: string;
    playerBUsername: string | null;
    winnerUsername: string | null;
    sentence: string;
    difficulty: string;
    startTime: string;
    endTime: string | null;
    isActive: boolean;
  } | null;
  errors: Record<string, string[]> | null;
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

const GameBPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const requestRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);

  const { word, matchid } = useParams<{ word: string; matchid: string }>();
  const words = word?.split(' ') || ['hellow', 'world'];
  // const wordsLetters = words.map(w => w.toUpperCase().split(""));
  const wordsLetters = words.map(w => w.split(''));
  // const wordsLettersCount = wordsLetters.reduce((acc, letters) => acc + letters.length, 0);
  // Game-specific state
  // const [targetWord, setTargetWord] = useState<string>(words[0]?.toLowerCase() || 'hello'); 
  const [targetWord, setTargetWord] = useState<string>(word?.toLowerCase() || 'hello'); 
  const [currentLetterIndex, setCurrentLetterIndex] = useState<number>(0); // Tracks which letter to sign
  const [gameWon, setGameWon] = useState<boolean>(false); // Tracks if the game is won
  const [feedback, setFeedback] = useState<string>(''); // Feedback for correct/incorrect signs
  const lastDetectedTime = useRef<number>(0);
  const LETTER_HOLD_TIME = 1000; // 1 second to hold a sign
  const lastCaptureTime = useRef<number>(0);
  const CAPTURE_INTERVAL = 150; // ms between captures
  const [signHoldProgress, setSignHoldProgress] = useState<number>(0);
  const [lastDetectedSign, setLastDetectedSign] = useState<string | null>(null);


  /////////////
  // const [isPolling, setIsPolling] = useState(false);
  // const [matchStatus, setMatchStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  // const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  
  const location = useLocation();
const username = location.state?.username || null;
const [isPolling, setIsPolling] = useState(false);
const [matchStatus, setMatchStatus] = useState<'playing' | 'won' | 'lost'>('playing');
 

  
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = payload['sub'] || payload['nameid'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      setUserId(id);
    } catch (error) {
      console.error('Error parsing token:', error);
      setError('Failed to load user information. Redirecting...');
      setTimeout(() => navigate('/pvp/create'), 2000);
    }
  } else {
    console.error('No token found. Redirecting to create match.');
    navigate('/pvp/create');
  }

  if (!username) {
    console.error('Username not available. Redirecting to create match.');
    navigate('/pvp/create');
  }
}, [username, navigate]);


  //////////////
//   useEffect(() => {
//   const fetchCurrentUser = async () => {
//     try {
//       // const userResponse = await gameApi.getCurrentUser();
//       // setCurrentUsername(userResponse.username);
//       setCurrentUsername('vivovivo');
//     } catch (error) {
//       console.error('Error fetching current user:', error);
//       setError('Failed to load user information.');
//     }
//   };
//   fetchCurrentUser();
// }, []);


const getNextNonSpaceIndex = (currentIndex: number, word: string): number => {
  let nextIndex = currentIndex + 1;
  while (nextIndex < word.length && word[nextIndex] === ' ') {
    nextIndex++;
  }
  return nextIndex;
};

  const expectedLetter = targetWord[currentLetterIndex] === ' ' 
  ? targetWord[getNextNonSpaceIndex(currentLetterIndex, targetWord)] 
  : targetWord[currentLetterIndex];
 // Track detected sign and progress in the game
 useEffect(() => {
  if (gameWon || !detectedSign) {
    setSignHoldProgress(0);
    setFeedback('');
    return;
  }

  // Normalize signs to lowercase for comparison
  const currentSign = detectedSign.toLowerCase();
  // const expectedLetter = targetWord[currentLetterIndex].toLowerCase();


const isCorrect = detectedSign === expectedLetter;
  // If the sign changes or is different from the last detected sign, reset timer
  if (currentSign !== lastDetectedSign?.toLowerCase()) {
    setLastDetectedSign(currentSign);
    lastDetectedTime.current = Date.now();
    setSignHoldProgress(0);
    setFeedback('');
    console.log(`New sign detected: ${currentSign}, expecting: ${expectedLetter}`);
    return;
  }
   
  // Update progress bar and check for letter completion
  const progressInterval = setInterval(() => {
    const now = Date.now();
    const elapsedTime = now - lastDetectedTime.current;

    if (elapsedTime >= LETTER_HOLD_TIME) {
      // Check if the held sign matches the expected letter
      const isCorrect = currentSign === expectedLetter;

      // if (isCorrect) {
      //   console.log(`Correct sign '${currentSign}' detected for letter ${currentLetterIndex + 1}`);
      //   setFeedback(`Correct! '${currentSign.toUpperCase()}' matches.`);
      //   const nextIndex = currentLetterIndex + 1;
      //   if (nextIndex >= targetWord.length) {
      //     setGameWon(true);
      //     setFeedback('You Won!');
      //     console.log('Game won!');
      //   } else {
      //     setCurrentLetterIndex(nextIndex);
      //     console.log(`Advancing to letter ${nextIndex + 1}: ${targetWord[nextIndex]}`);
      //   }
      // } else {
      //   setFeedback(`Incorrect. Expected '${expectedLetter.toUpperCase()}', got '${currentSign.toUpperCase()}'.`);
      //   console.log(`Incorrect sign: ${currentSign}, expected: ${expectedLetter}`);
      // }

      /////////////

      const getNextNonSpaceIndex = (currentIndex: number, word: string): number => {
        let nextIndex = currentIndex + 1;
        while (nextIndex < word.length && word[nextIndex] === ' ') {
          nextIndex++;
        }
        return nextIndex;
      };

      if (isCorrect) {
        console.log(`Correct sign '${currentSign}' detected for letter ${currentLetterIndex + 1}`);
        setFeedback(`Correct! '${currentSign.toUpperCase()}' matches.`);
        setCompletedLetters([...completedLetters, expectedLetter]);
        const nextIndex = getNextNonSpaceIndex(currentLetterIndex, targetWord);
        // عدّ الحروف غير المسافات للتحقق من إكمال الكلمة
        const nonSpaceLetters = targetWord.replace(/\s/g, '').length;
        const completedNonSpaceLetters = completedLetters.length + 1; // +1 للحرف الحالي
        if (completedNonSpaceLetters >= nonSpaceLetters) {
          setGameWon(true);
          setMatchStatus('won');
          setFeedback('You Won!');
          console.log('Game won! Attempting to complete match...');
          const completeMatch = async () => {
            if (!userId) {
              console.error('User ID not available for completeMatch');
              setError('Failed to update match status, but you won! The other player will be notified soon.');
              return;
            }
            try {
              const response = await gameApi.completeMatch(matchid!, userId);
              console.log('Complete match response:', response);
            } catch (error) {
              console.error('Error completing match:', error);
              setError('Failed to update match status, but you won! The other player will be notified soon.');
            }
          };
          completeMatch();
        } else {
          setCurrentLetterIndex(nextIndex);
          console.log(`Advancing to letter ${nextIndex + 1}: ${targetWord[nextIndex] || 'end'}`);
        }
      }

      // Visual feedback
      const feedbackElement = document.querySelector('.feedback-message');
      if (feedbackElement) {
        feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect');
        setTimeout(() => {
          feedbackElement.classList.remove('correct', 'incorrect');
        }, 300);
      }

      // Reset progress and timer for next detection
      setSignHoldProgress(0);
      setLastDetectedSign(null); // Clear last detected sign to force re-detection
      lastDetectedTime.current = now;

      clearInterval(progressInterval);
    } else {
      // Update progress bar
      const progress = (elapsedTime / LETTER_HOLD_TIME) * 100;
      setSignHoldProgress(progress);
    }
  }, 33); // Update at ~30fps for smooth progress bar

  return () => clearInterval(progressInterval);
}, [detectedSign, lastDetectedSign, currentLetterIndex, gameWon, targetWord]);
  

useEffect(() => {
  let intervalId: NodeJS.Timeout | null = null;

  if (matchid && username && userId && !gameWon) {
    setIsPolling(true);
    intervalId = setInterval(async () => {
      try {
        const response = await gameApi.getMatch(matchid) as MatchResponse;
        console.log('Polling match status:', { response, currentUsername: username });
        if (response.success && response.data) {
          if (response.data.winnerUsername || !response.data.isActive || response.data.endTime) {
            setIsPolling(false);
            if (response.data.winnerUsername && response.data.winnerUsername === username) {
              setMatchStatus('won');
              setFeedback('You Won!');
            } else {
              setMatchStatus('lost');
              setFeedback('You Lost!');
            }
            setGameWon(true);
          }
        } else {
          console.error('Match not found:', response.message);
          setIsPolling(false);
          setError('Match not found. Redirecting to create match...');
          setTimeout(() => navigate('/pvp/create'), 2000);
        }
      } catch (error) {
        console.error('Error checking match status:', error);
        setIsPolling(false);
        setError('Error checking match status. Redirecting to create match...');
        setTimeout(() => navigate('/pvp/create'), 2000);
      }
    }, 1000); // تحقق كل ثانية
  }

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [matchid, username, userId, gameWon, navigate]);

// useEffect(() => {
//   let intervalId: NodeJS.Timeout | null = null;

//   if (matchid && username && !gameWon) {
//     setIsPolling(true);
//     intervalId = setInterval(async () => {
//       try {
//         const response = await gameApi.getMatch(matchid) as MatchResponse;
//         console.log('Polling match status:', response);
//         if (response.success && response.data?.winnerUsername) {
//           setIsPolling(false);
//           if (response.data.winnerUsername === username) {
//             setMatchStatus('won');
//             setFeedback('You Won!');
//           } else {
//             setMatchStatus('lost');
//             setFeedback('You Lost!');
//           }
//           setGameWon(true); // إيقاف اللعبة
//         } else if (!response.success) {
//           console.error('Match not found:', response.message);
//           setIsPolling(false);
//           setError('Match not found. Please start a new match.');
//         }
//       } catch (error) {
//         console.error('Error checking match status:', error);
//         setIsPolling(false);
//         setError('Error checking match status. Please try again.');
//       }
//     }, 3000); // تحقق كل 3 ثوانٍ
//   }

//   return () => {
//     if (intervalId) clearInterval(intervalId);
//   };
// }, [matchid, username, gameWon]);





// Check API health
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

  // Setup webcam
  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsStarted(true);
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              startRenderingFrames();
            }
          };
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setError('Could not access webcam. Please ensure camera permissions are granted.');
      }
    };

    setupWebcam();

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Restart rendering when landmarks change
  useEffect(() => {
    if (landmarks.length > 0) {
      startRenderingFrames();
    }
  }, [landmarks]);

  // Render video frames to canvas
  const renderVideoFrame = () => {
    const drawFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        renderFrameRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        console.error('Failed to get 2D context');
        return;
      }

      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (landmarks.length > 0) {
        drawLandmarksOnCanvas(ctx, canvas.width, canvas.height);
      }

      renderFrameRef.current = requestAnimationFrame(drawFrame);
    };

    renderFrameRef.current = requestAnimationFrame(drawFrame);
  };

  const startRenderingFrames = () => {
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
    }
    renderVideoFrame();
  };

  // Draw landmarks on canvas
  const drawLandmarksOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const scaleX = width;
    const scaleY = height;

    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 2;

    const colors = {
      thumb: 'rgba(255, 0, 0, 0.9)',
      indexFinger: 'rgba(0, 255, 0, 0.9)',
      middleFinger: 'rgba(0, 0, 255, 0.9)',
      ringFinger: 'rgba(255, 255, 0, 0.9)',
      pinky: 'rgba(255, 0, 255, 0.9)',
      wrist: 'rgba(255, 255, 255, 0.9)',
    };

    const getLandmarkColor = (index: number): string => {
      if (index === 0) return colors.wrist;
      if (index >= 1 && index <= 4) return colors.thumb;
      if (index >= 5 && index <= 8) return colors.indexFinger;
      if (index >= 9 && index <= 12) return colors.middleFinger;
      if (index >= 13 && index <= 16) return colors.ringFinger;
      if (index >= 17 && index <= 20) return colors.pinky;
      return 'rgba(0, 255, 0, 0.9)';
    };

    const drawCircle = (x: number, y: number, radius: number, color: string) => {
      ctx.beginPath();
      ctx.arc(width - x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    ctx.lineWidth = 2;
    const intermediatePoints: Array<{ x: number; y: number; color: string }> = [];

    for (const [start, end] of HAND_CONNECTIONS) {
      if (landmarks[start] && landmarks[end]) {
        const startX = width - (landmarks[start].x * scaleX);
        const startY = landmarks[start].y * scaleY;
        const endX = width - (landmarks[end].x * scaleX);
        const endY = landmarks[end].y * scaleY;

        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, getLandmarkColor(landmarks[start].index));
        gradient.addColorStop(1, getLandmarkColor(landmarks[end].index));

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.stroke();

        const point30X = startX + (endX - startX) * 0.3;
        const point30Y = startY + (endY - startY) * 0.3;
        const point70X = startX + (endX - startX) * 0.7;
        const point70Y = startY + (endY - startY) * 0.7;

        intermediatePoints.push({ x: point30X, y: point30Y, color: getLandmarkColor(landmarks[start].index) });
        intermediatePoints.push({ x: point70X, y: point70Y, color: getLandmarkColor(landmarks[end].index) });
      }
    }

    ctx.shadowBlur = 0;

    for (const landmark of landmarks) {
      drawCircle(landmark.x * scaleX, landmark.y * scaleY, landmark.index === 0 ? 5 : 3, getLandmarkColor(landmark.index));
    }

    for (const point of intermediatePoints) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = point.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // Process video frame
  const processFrame = async () => {
    if (
      !videoRef.current ||
      !processingCanvasRef.current ||
      !processingCanvasRef.current.getContext('2d') ||
      apiStatus !== 'online' ||
      processing ||
      gameWon
    ) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = Date.now();
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      const result = await aslRecognitionApi.detectSign(imageBase64);

      if (result.has_hand) {
        setDetectedSign(result.sign);
        setConfidence(result.confidence);
        setLandmarks(result.landmarks);
        setError(null);
      } else {
        setDetectedSign(null);
        setConfidence(null);
        setLandmarks([]);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      setError('Error processing image. API may be unavailable.');
    } finally {
      setProcessing(false);
      requestRef.current = requestAnimationFrame(processFrame);
    }
  };

  // Start/stop processing
  useEffect(() => {
    if (isStarted && apiStatus === 'online' && matchStatus === 'playing') {
      requestRef.current = requestAnimationFrame(processFrame);
    } else if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isStarted, apiStatus, matchStatus]);
  // }, [isStarted, apiStatus, gameWon]);

  // Restart game
  const restartGame = () => {
    setCurrentLetterIndex(0);
    setGameWon(false);
    setFeedback('');
    setDetectedSign(null);
    setLastDetectedSign(null);
    setSignHoldProgress(0);
    lastDetectedTime.current = 0;
  };

  // Display text for signs
  const getDisplayText = (sign: string | null): string => {
    if (!sign) return '';
    return sign;
  };

  return (
    <div className="detection-page">
      <div className="video-section">
        <div className="video-container">
          <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
          <canvas ref={canvasRef} className="landmark-canvas" />
          <canvas ref={processingCanvasRef} style={{ display: 'none' }} />
          <div className="debug-overlay">
            <div>API: {apiStatus}</div>
          </div>
        </div>
      </div>

      <div className="info-section">
        {apiStatus === 'offline' && <div className="alert alert-danger">API is offline</div>}
        {error && <div className="alert alert-warning">{error}</div>}

        <div className="game-section">
          {!username && <div className="alert alert-danger">User information not available. Please start a new match.</div>}
            {error && <div className="alert alert-warning">{error}</div>}
          <h2>ASL Word Game</h2>
          <div className="target-word">
            Target Word: <span className="word-text">{targetWord.toUpperCase()}</span>
          </div>
          <div className="progress">
            Progress:{' '}
            {targetWord.split('').map((letter, index) => (
              <span
                key={index}
                className={`letter ${
                  index < currentLetterIndex ? 'completed' : index === currentLetterIndex ? 'current' : ''
                }`}
              >
                {letter.toUpperCase()}
              </span>
            ))}
          </div>
          <div className="current-letter">
            Sign: <span className="letter-text">{targetWord[currentLetterIndex]?.toUpperCase()}</span>
          </div>
          <div className={`result-container ${detectedSign ? 'with-letter' : ''}`}>
          <div className="result">
            <div className="letter-display">
              {detectedSign ? (
                <>
                  <div className="detected-sign">{getDisplayText(detectedSign)}</div>
                </>
              ) : (
                <>
                  <div className="empty-sign">Waiting for hand sign...</div>
                  <div className="hand-preference">Use right hand</div>
                </>
              )}
            </div>
          </div>
        </div>
          {/* {detectedSign && (
            <div className="detected-sign">
              Detected: <span className="sign-text">{getDisplayText(detectedSign)}</span>
            </div>
          )} */}
          {/* {detectedSign && !gameWon && (
            <div className="sign-hold-progress">
              <div className="progress-label">
                Holding: <span className="current-hold-sign">{getDisplayText(detectedSign)}</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${signHoldProgress}%` }}></div>
              </div>
            </div>
          )} */}
          {detectedSign && matchStatus === 'playing' && (
            <div className="sign-hold-progress">
              <div className="progress-label">
                Holding: <span className="current-hold-sign">{getDisplayText(detectedSign)}</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${signHoldProgress}%` }}></div>
              </div>
            </div>
          )}
          <div className="feedback-message">{feedback}</div>
          {matchStatus !== 'playing' && (
            <div className="win-message">
              <h3>{matchStatus === 'won' ? 'You Won!' : 'You Lost!'}</h3>
              {/* <button className="restart-button" onClick={restartGame}>
                Play Again
              </button> */}
              <br/><br/>
              <a href="/pvp/create" className="btn btn-secondary">
                Back to Menu
              </a>
            </div>
          )}
        </div>
        <div style={{ width: '100%' }}>
                      <div className="letters-progress" style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        padding: '15px 20px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '20px'
                      }}>
                        <h3 style={{
                          margin: '0 0 15px 0',
                          fontSize: '18px',
                          fontWeight: '500',
                          color: '#e0e0e0',
                          textAlign: 'center'
                        }}>Progress</h3>
                        {wordsLetters.map((letters, wordIndex) => (
                          <div
                            key={wordIndex}
                            className="word-sequence"
                            style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}
                          >
                            {letters.map((letter, index) => {
                              const globalIndex = wordsLetters.slice(0, wordIndex).flat().length + index;
                              const isCompleted = completedLetters.includes(letter) && globalIndex < currentLetterIndex;
                              const isCurrent = globalIndex === currentLetterIndex;

                              return (
                                <div
                                  key={`${wordIndex}-${index}`}
                                  className={`sequence-letter ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                                  style={{
                                    position: 'relative',
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    backgroundColor: isCurrent
                                      ? '#f9bf2e'
                                      : isCompleted
                                        ? '#32BEA6'
                                        : '#2a2a2a',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: isCurrent || isCompleted ? '#ffffff' : '#888888',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    transition: 'all 0.3s ease',
                                    border: isCurrent ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: isCurrent ? '0 0 10px rgba(249, 191, 46, 0.5)' : 'none',
                                  }}
                                >
                                  {isCompleted ? (
                                    <img
                                      src={checkmarkIcon}
                                      alt="Completed"
                                      className="completed-icon"
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                      }}
                                    />
                                  ) : (
                                    letter
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}

                        {/* <div className="letter-sequence" style={{
                          display: 'flex', justifyContent: 'center', gap: '12px'
                        }}>
                          {letters.map((letter, index) => {
                            const isCompleted = completedLetters.includes(letter);
                            const isCurrent = index === currentLetterIndex;

                            return (
                              <div
                                key={letter}
                                className={`sequence-letter ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                                style={{
                                  position: 'relative',
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  backgroundColor: isCurrent ? '#f9bf2e' : isCompleted ? '#32BEA6' : '#2a2a2a',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  color: isCurrent || isCompleted ? '#ffffff' : '#888888',
                                  fontWeight: 'bold',
                                  fontSize: '18px',
                                  transition: 'all 0.3s ease',
                                  border: isCurrent ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
                                  boxShadow: isCurrent ? '0 0 10px rgba(249, 191, 46, 0.5)' : 'none'
                                }}
                              >
                                {isCompleted ? (
                                  <img
                                    src={checkmarkIcon}
                                    alt="Completed"
                                    className="completed-icon"
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)'
                                    }}
                                  />
                                ) : (
                                  letter
                                )}

                              </div>
                            );
                          })}
                        </div> */}

                      </div>

                      <div className="progress-container">
                        <div className="progress-bar" style={{
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          height: '12px',
                          overflow: 'hidden',
                          width: '100%',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                        }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: isCorrect ? `${signHoldProgress}%` : '0%',
                              height: '100%',
                              backgroundColor: '#32BEA6',
                              backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                              backgroundSize: '20px 20px',
                              borderRadius: '10px',
                              transition: 'width 0.1s ease-in-out',
                              boxShadow: '0 0 8px rgba(50, 190, 166, 0.5)'
                            }}
                          ></div>
                        </div>
                        <div className="progress-label" style={{
                          textAlign: 'center',
                          marginTop: '10px',
                          fontSize: '14px',
                          color: '#32BEA6',
                          fontWeight: '500'
                        }}>
                          Hold the sign for 1 second
                        </div>
                      </div>
                    </div>
        <div className="instructions">
          <h3>How to Play</h3>
          <ol>
            <li>Sign the letters of the word "{targetWord.toUpperCase()}" in order.</li>
            <li>Hold each sign for 1 second to register.</li>
            <li>Use your right hand for best results.</li>
            <li>Win by completing the word!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GameBPage;