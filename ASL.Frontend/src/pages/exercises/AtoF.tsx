import React from 'react';
import { useNavigate } from 'react-router-dom';
import ExerciseTemplate from './ExerciseTemplate';

// Image path for display only, not for navigation
const abcImage = '/assets/img/ABC.png';

const AtoFExercise = () => {
  const navigate = useNavigate();

  return (
    <ExerciseTemplate
      title="A to F"
      letters={['A', 'B', 'C', 'D', 'E', 'F']}
      description="Practice American Sign Language alphabet letters A through F. Position your hand clearly in front of the camera and try to match each letter."
      modelName="A_to_F"
      showHandSigns={true}
      // Remove navigation button to make this a standalone screen
    />
  );
};

export default AtoFExercise; 