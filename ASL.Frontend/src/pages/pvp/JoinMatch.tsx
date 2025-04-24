import { useState } from 'react';

const JoinMatch = () => {
  const [matchId, setMatchId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedMatch, setJoinedMatch] = useState<{
    id: string;
    playerA: string;
    difficulty: string;
  } | null>(null);

  const handleMatchIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatchId(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setError(null);

    try {
      // TODO: Implement API call to join match
      // const response = await fetch(`/api/Game/join`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ matchId })
      // });
      
      // if (!response.ok) {
      //   throw new Error('Match not found or already full');
      // }
      
      // const data = await response.json();
      // setJoinedMatch(data);

      // Mock response for now
      if (matchId === 'abcd1234') {
        setTimeout(() => {
          setJoinedMatch({
            id: matchId,
            playerA: 'Player1',
            difficulty: 'Medium'
          });
          setIsJoining(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setError('Match not found. Please check the ID and try again.');
          setIsJoining(false);
        }, 1000);
      }
    } catch (error) {
      setError('Error joining match. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="join-match-page">
      <h1>Join Match</h1>
      
      {joinedMatch ? (
        <div className="match-joined">
          <h2>Match Joined!</h2>
          <div className="match-details">
            <p><strong>Match ID:</strong> {joinedMatch.id}</p>
            <p><strong>Host:</strong> {joinedMatch.playerA}</p>
            <p><strong>Difficulty:</strong> {joinedMatch.difficulty}</p>
          </div>
          <p>Waiting for the host to start the match...</p>
          <button className="btn btn-secondary">
            Leave Match
          </button>
        </div>
      ) : (
        <div className="join-match-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="matchId">Match ID</label>
              <input
                type="text"
                id="matchId"
                name="matchId"
                value={matchId}
                onChange={handleMatchIdChange}
                placeholder="Enter the match ID"
                required
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isJoining || !matchId}
            >
              {isJoining ? 'Joining...' : 'Join Match'}
            </button>
          </form>
          
          <div className="join-info">
            <h3>How to join:</h3>
            <ol>
              <li>Ask your friend for their Match ID</li>
              <li>Enter the ID in the field above</li>
              <li>Click "Join Match"</li>
              <li>Wait for the host to start the match</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinMatch; 