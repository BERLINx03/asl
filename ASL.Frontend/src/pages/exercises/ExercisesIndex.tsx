import React from 'react';
import { useNavigate } from 'react-router-dom';
import './exercises-index.css';

// Define exercise options
const exercises = [
  { id: 'a-f', title: 'A to F', description: 'Practice ASL alphabet letters A through F' },
  { id: 'g-k', title: 'G to K', description: 'Practice ASL alphabet letters G through K' },
  { id: 'l-p', title: 'L to P', description: 'Practice ASL alphabet letters L through P' },
  { id: 'q-u', title: 'Q to U', description: 'Practice ASL alphabet letters Q through U' },
  { id: 'v-z', title: 'V to Z', description: 'Practice ASL alphabet letters V through Z' },
];

const ExercisesIndex = () => {
  const navigate = useNavigate();

  const handleExerciseClick = (exerciseId: string) => {
    navigate(`/exercises/${exerciseId}`);
  };

  return (
    <div className="exercises-index">
      <h1>ASL Exercises</h1>
      <p className="description">Select an exercise range to practice your American Sign Language skills</p>
      
      <div className="exercise-grid">
        {exercises.map(exercise => (
          <div 
            key={exercise.id}
            className="exercise-card"
            onClick={() => handleExerciseClick(exercise.id)}
          >
            <h2>{exercise.title}</h2>
            <p>{exercise.description}</p>
            <span className="exercise-arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExercisesIndex; 