import { useRef, useState, useEffect } from 'react';

const DetectionPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState<string | null>(null);

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

  const startDetection = () => {
    setIsDetecting(true);
    // TODO: Implement real-time detection logic
    // This would connect to our ASL recognition model
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setDetectedLetter(null);
  };

  // Function to capture frame from webcam for processing
  const captureFrame = () => {
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
      // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // const result = processImageWithModel(imageData);
      
      // For demo purposes, return a random letter
      const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      setDetectedLetter(randomLetter);
    }
  };

  return (
    <div className="detection-page">
      <h1>ASL Detection</h1>
      <div className="detection-container">
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
            <button onClick={startDetection} className="btn btn-primary">
              Start Detection
            </button>
          ) : (
            <button onClick={stopDetection} className="btn btn-danger">
              Stop Detection
            </button>
          )}
          
          <button 
            onClick={captureFrame} 
            disabled={!isDetecting}
            className="btn btn-secondary"
          >
            Capture Sign
          </button>
        </div>
        
        {detectedLetter && (
          <div className="result">
            <h2>Detected Letter:</h2>
            <div className="detected-letter">{detectedLetter}</div>
          </div>
        )}
        
        <div className="instructions">
          <h3>How to use:</h3>
          <ol>
            <li>Position your hand in front of the camera</li>
            <li>Click "Start Detection" to begin</li>
            <li>Make an ASL hand sign</li>
            <li>Click "Capture Sign" to detect the letter</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DetectionPage; 