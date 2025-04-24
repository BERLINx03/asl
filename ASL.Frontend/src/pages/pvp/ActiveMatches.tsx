import { useState, useEffect } from 'react';

interface Match {
  id: string;
  playerA: string;
  playerB: string | null;
  startTime: string;
  difficulty: string;
  sentence: string;
  isActive: boolean;
}

const ActiveMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);

      try {
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

        // Mock data for now
        setTimeout(() => {
          setMatches([
            {
              id: 'abcd1234',
              playerA: 'Player1',
              playerB: null,
              startTime: new Date().toISOString(),
              difficulty: 'Medium',
              sentence: 'Hello world',
              isActive: true
            },
            {
              id: 'efgh5678',
              playerA: 'Player2',
              playerB: 'Player3',
              startTime: new Date().toISOString(),
              difficulty: 'Hard',
              sentence: 'ASL is awesome',
              isActive: true
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setError('Failed to load active matches. Please try again.');
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleJoinMatch = (matchId: string) => {
    // TODO: Implement join match functionality
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
      ) : (
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
                  <td>{match.playerA}</td>
                  <td>{match.playerB || 'Waiting for player...'}</td>
                  <td>{match.difficulty}</td>
                  <td>{new Date(match.startTime).toLocaleTimeString()}</td>
                  <td>
                    {!match.playerB ? (
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