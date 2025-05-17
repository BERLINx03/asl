import { useState, useEffect } from 'react';
import { gameApi } from '../../services/apiService';

// interface Match {
//   id: string;
//   playerA: string;
//   playerB: string | null;
//   startTime: string;
//   difficulty: string;
//   sentence: string;
//   isActive: boolean;
// }
 interface Match {
  id: string;
  playerAUsername: string;
  playerBUsername: string | null;
  winnerUsername: string | null;
  sentence: string | null;
  difficulty: 'easy' | 'medium' | 'hard'; // Assuming only these three difficulties. Otherwise use `string`
  startTime: string; // ISO date string
  endTime: string | null;
  isActive: boolean;
}
 interface ActiveMatchesResponse {
  success: boolean;
  message: string;
  data: Match[];
  errors: any; // You can replace `any` with a more specific type if you know the structure of errors
}

interface MatchResponse {
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
const ActiveMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [joinedMatch, setJoinedMatch] = useState<{
    id: string;
    playerA: string;
    difficulty: string;
  } | null>(null);
  
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);

      try {
          const response = await gameApi.getActiveMatches() as ActiveMatchesResponse;
              if (response.success) {
                setTimeout(() => {
                  setMatches(response.data);
                  setIsLoading(false);
                }, 1000);
              } else {
                console.error('Error creating match:', response.errors);
              }
        // TODO: Implement API call to fetch active matches
        // const response = await fetch('/api/Game/active', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
        
        // if (!response.ok) {
        //   throw new Error('Failed to fetch matches');
        // }
        
        // const data = await response.json();
        // setMatches(data.matches);


        // setMatches([
        //   {
        //     id: 'abcd1234',
        //     playerAUsername: 'Player1',
        //     playerBUsername: null,
        //     winnerUsername: null,
        //     sentence: 'Hello world',
        //     difficulty: 'medium',
        //     startTime: new Date().toISOString(),
        //     endTime: null,
        //     isActive: true
        //   },
        //   {
        //     id: 'efgh5678',
        //     playerAUsername: 'Player2',
        //     playerBUsername: 'Player3',
        //     winnerUsername: null,
        //     sentence: 'ASL is awesome',
        //     difficulty: 'hard',
        //     startTime: new Date().toISOString(),
        //     endTime: null,
        //     isActive: true
        //   }]);



        // Mock data for now
        // setTimeout(() => {
        //   setMatches([
        //     {
        //       id: 'abcd1234',
        //       playerA: 'Player1',
        //       playerB: null,
        //       startTime: new Date().toISOString(),
        //       difficulty: 'Medium',
        //       sentence: 'Hello world',
        //       isActive: true
        //     },
        //     {
        //       id: 'efgh5678',
        //       playerA: 'Player2',
        //       playerB: 'Player3',
        //       startTime: new Date().toISOString(),
        //       difficulty: 'Hard',
        //       sentence: 'ASL is awesome',
        //       isActive: true
        //     }
        //   ]);
        //   setIsLoading(false);
        // }, 1000);
      } catch (error) {
        setError('Failed to load active matches. Please try again.');
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleJoinMatch =async (matchId: string) => {
    const response = await gameApi.joinMatch(matchId) as MatchResponse;
    if (response.success) {
      if (matchId === response.data.id) {
        setTimeout(() => {
          setJoinedMatch({
            id: response.data.id,
            playerA: response.data.playerA,
            difficulty: response.data.difficulty
        });
        setIsJoining(false);
      }, 1000);
      }else if (matchId !== response.data.id) {
         setTimeout(() => {
          setJoinedMatch({
            id: response.data.id,
            playerA: response.data.playerA,
            difficulty: response.data.difficulty
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
    console.log(`Joining match ${matchId}`);
  };

  return (
    <div className="active-matches-page">
      <h1>Active Matches</h1>
      
      {isLoading ? (
        <div className="loading">Loading active matches...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : matches.length === 0 ? (
        <div className="no-matches">
          <p>No active matches found.</p>
          <button className="btn btn-primary">Create a Match</button>
        </div>
      ) :joinedMatch ? (
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
      ) :(
        <div className="matches-list">
          <table className="matches-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Host</th>
                <th>Player 2</th>
                <th>Difficulty</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(match => (
                <tr key={match.id}>
                  <td>{match.id}</td>
                  <td>{match.playerAUsername}</td>
                  <td>{match.playerBUsername  || 'Waiting for player...'}</td>
                  <td>{match.difficulty}</td>
                  <td>{new Date(match.startTime).toLocaleTimeString()}</td>
                  <td>
                    {!match.playerBUsername ? (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJoinMatch(match.id)}
                      >
                        Join
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm">
                        Spectate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="refresh-controls">
        <button 
          className="btn btn-secondary"
          onClick={() => window.location.reload()}
        >
          Refresh List
        </button>
      </div>
    </div>
  );
};

export default ActiveMatches; 