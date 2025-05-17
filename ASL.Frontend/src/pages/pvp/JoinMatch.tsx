import { useState } from 'react';
import { gameApi } from '../../services/apiService';
import { Link,useNavigate } from 'react-router-dom';


interface MatchResponseX {
  success: boolean;
  message: string;
  data: {
    id: string;
    playerA: string;
    playerB: string | null;
    startTime: string;
    difficulty: string;
    sentence: string;
    isActive: boolean;
  };
  errors: Record<string, string[]> | null;
}

interface MatchResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    playerAUsername: string;
    playerBUsername: string | null;
    sentence: string;
    difficulty: string;
    startTime: string;
    isActive: boolean;
  };
  errors: Record<string, string[]> | null;
}
const JoinMatch = () => {
  const [matchId, setMatchId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedMatch, setJoinedMatch] = useState<{
    id: string;
    playerA: string;
    difficulty: string;
    sentence: string;
  } | null>(null);
  const navigate = useNavigate();
  const handleMatchIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatchId(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setError(null);

    try {
      const response = await gameApi.joinMatch(matchId) as MatchResponse;
      if (response.success) {
        if (matchId === response.data.id) {
          setTimeout(() => {
            setJoinedMatch({
              id: response.data.id,
              playerA: response.data.playerAUsername,
              difficulty: response.data.difficulty,
              sentence: response.data.sentence,
          });
          setIsJoining(false);
            navigate(`/pvp/gameb/${response.data.sentence || 'Hello'}/${matchId}`, {
              state: { username: response.data.playerBUsername },
            });
        }, 1000);
        }else if (matchId !== response.data.id) {
           setTimeout(() => {
            setJoinedMatch({
              id: response.data.id,
              playerA: response.data.playerAUsername,
              difficulty: response.data.difficulty,
              sentence: response.data.sentence,
          });
          setIsJoining(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setError('Match not found. Please check the ID and try again.');
          setIsJoining(false);
        }, 1000);
      }
      } else {
        console.error('Error creating match:', response.errors);
      }
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
      // if (matchId === 'abcd1234') {
      //   setTimeout(() => {
      //     setJoinedMatch({
      //       id: matchId,
      //       playerA: 'Player1',
      //       difficulty: 'Medium'
      //     });
      //     setIsJoining(false);
      //   }, 1000);
      // } else {
      //   setTimeout(() => {
      //     setError('Match not found. Please check the ID and try again.');
      //     setIsJoining(false);
      //   }, 1000);
      // }
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
          {/* <Link href={`/pvp/game/koshy/${joinedMatch.id}`} className="btn btn-primary">
            Go to Match 
          </a> */}
          <br/>
          <Link to={`/pvp/gameb/${joinedMatch?.sentence ? joinedMatch?.sentence:'Hello'}/${joinedMatch?.id}`} className="start-button">
            Go to Match
          </Link>
          <br/>
          <br/>
          <Link to={`/detection`} className="btn btn-secondary">
          Leave The Match
          </Link>
          <br/>
          {/* <button className="btn btn-secondary">
            Leave Match
          </button> */}
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