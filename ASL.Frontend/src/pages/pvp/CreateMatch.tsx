import { useState } from 'react';

interface CreateMatchForm {
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const CreateMatch = () => {
  const [formData, setFormData] = useState<CreateMatchForm>({
    difficulty: 'Medium',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // TODO: Implement API call to create match
      // const response = await fetch('/api/Game/create', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(formData)
      // });
      
      // const data = await response.json();
      // setMatchId(data.matchId);

      // Mock response for now
      setTimeout(() => {
        setMatchId('abcd1234');
        setIsCreating(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating match:', error);
      setIsCreating(false);
    }
  };

  return (
    <div className="create-match-page">
      <h1>Create New Match</h1>
      
      {matchId ? (
        <div className="match-created">
          <h2>Match Created!</h2>
          <p>Your match ID: <strong>{matchId}</strong></p>
          <p>Share this ID with a friend so they can join your match.</p>
          <button className="btn btn-primary">
            Start Match
          </button>
        </div>
      ) : (
        <div className="create-match-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleDifficultyChange}
                required
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Match'}
            </button>
          </form>
          
          <div className="difficulty-info">
            <h3>Difficulty Levels:</h3>
            <ul>
              <li><strong>Easy:</strong> Simple words with 3-4 letters</li>
              <li><strong>Medium:</strong> Common words with 5-6 letters</li>
              <li><strong>Hard:</strong> Challenging words with 7+ letters</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMatch; 