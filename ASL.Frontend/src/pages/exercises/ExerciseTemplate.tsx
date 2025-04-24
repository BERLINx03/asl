import { useRef, useState, useEffect } from 'react';

interface ExerciseTemplateProps {
  title: string;
  letters: string[];
  description: string;
}

const ExerciseTemplate: React.FC<ExerciseTemplateProps> = ({ 
  title,
  letters,
  description
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string>(letters[0]);
  const [detectedLetter, setDetectedLetter] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  
  // Setup webcam when component mounts
  useEffect(() => {
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    setupWebcam();

    // Cleanup function to stop webcam when unmounting
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startExercise = () => {
    setIsDetecting(true);
    setScore(0);
    setCurrentLetter(letters[0]);
  };

  const stopExercise = () => {
    setIsDetecting(false);
    setDetectedLetter(null);
  };

  // Function to check if the detected letter matches the current letter
  const checkLetter = () => {
    if (videoRef.current && canvasRef.current && canvasRef.current.getContext('2d')) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // TODO: Process the image using our ASL model
      // For demo purposes, we'll randomly decide if the detection was correct
      const isCorrect = Math.random() > 0.5;
      
      if (isCorrect) {
        setDetectedLetter(currentLetter);
        setScore(prev => prev + 1);
        
        // Move to the next letter
        const currentIndex = letters.indexOf(currentLetter);
        const nextIndex = (currentIndex + 1) % letters.length;
        setCurrentLetter(letters[nextIndex]);
      } else {
        // For demo, show a random incorrect letter
        const incorrectLetters = letters.filter(l => l !== currentLetter);
        const randomIndex = Math.floor(Math.random() * incorrectLetters.length);
        setDetectedLetter(incorrectLetters[randomIndex]);
      }
    }
  };

  return (
    <div className="exercise-page">
      <h1>{title} Exercise</h1>
      <p className="description">{description}</p>
      
      <div className="exercise-container">
        <div className="current-task">
          <h2>Show the letter: <span className="target-letter">{currentLetter}</span></h2>
          <div className="score">Score: {score}</div>
        </div>
        
        <div className="video-container">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
          <canvas 
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="controls">
          {!isDetecting ? (
            <button onClick={startExercise} className="btn btn-primary">
              Start Exercise
            </button>
          ) : (
            <button onClick={stopExercise} className="btn btn-danger">
              Stop Exercise
            </button>
          )}
          
          <button 
            onClick={checkLetter} 
            disabled={!isDetecting}
            className="btn btn-secondary"
          >
            Check Letter
          </button>
        </div>
        
        {detectedLetter && (
          <div className="result">
            <h3>Detected Letter: <span className="detected">{detectedLetter}</span></h3>
            {detectedLetter === currentLetter ? (
              <div className="feedback correct">Correct! Try the next letter.</div>
            ) : (
              <div className="feedback incorrect">Not quite right, try again!</div>
            )}
          </div>
        )}
        
        <div className="letters-container">
          <h3>Letters in this exercise:</h3>
          <div className="letters-list">
            {letters.map(letter => (
              <div 
                key={letter} 
                className={`letter ${letter === currentLetter ? 'current' : ''}`}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTemplate; 