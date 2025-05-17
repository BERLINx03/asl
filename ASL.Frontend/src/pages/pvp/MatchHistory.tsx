import { useState, useEffect } from 'react';
import { gameApi } from '../../services/apiService';

interface MatchHistoryX {
  id: string;
  playerA: string;
  playerB: string;
  winner: string;
  difficulty: string;
  sentence: string;
  startTime: string;
  endTime: string;
}
 interface UserMatchesResponse {
  success: boolean;
  message: string;
  data: MatchHistory[];
  errors: any; // You can replace `any` if you have a specific structure for errors
}

 interface MatchHistory {
  id: string;
  playerAUsername: string;
  playerBUsername: string | null;
  winnerUsername: string | null;
  sentence: string | null;
  difficulty: 'easy' | 'medium' | 'hard'; // You can expand if you have more levels
  startTime: string; // ISO 8601 date-time string
  endTime: string | null;
  isActive: boolean;
}
const MatchHistory = () => {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await gameApi.getUserMatches() as UserMatchesResponse;
                      if (response.success) {
                        setTimeout(() => {
                          setMatches(response.data);
                          setIsLoading(false);
                        }, 1000);
                      } else {
                        console.error('Error creating match:', response.errors);
                      }

        // TODO: Implement API call to fetch match history
        // const response = await fetch('/api/Game/user', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
        
        // if (!response.ok) {
        //   throw new Error('Failed to fetch match history');
        // }
        
        // const data = await response.json();
        // setMatches(data.matches);

        // Mock data for now
        // setTimeout(() => {
        //   setMatches([
        //     {
        //       id: 'match1',
        //       playerA: 'CurrentUser',
        //       playerB: 'Opponent1',
        //       winner: 'CurrentUser',
        //       difficulty: 'Easy',
        //       sentence: 'Hello world',
        //       startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        //       endTime: new Date(Date.now() - 86400000 + 300000).toISOString() // Yesterday + 5 minutes
        //     },
        //     {
        //       id: 'match2',
        //       playerA: 'Opponent2',
        //       playerB: 'CurrentUser',
        //       winner: 'Opponent2',
        //       difficulty: 'Medium',
        //       sentence: 'Nice to meet you',
        //       startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        //       endTime: new Date(Date.now() - 172800000 + 450000).toISOString() // 2 days ago + 7.5 minutes
        //     },
        //     {
        //       id: 'match3',
        //       playerA: 'CurrentUser',
        //       playerB: 'Opponent3',
        //       winner: 'CurrentUser',
        //       difficulty: 'Hard',
        //       sentence: 'ASL is awesome',
        //       startTime: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        //       endTime: new Date(Date.now() - 259200000 + 600000).toISOString() // 3 days ago + 10 minutes
        //     }
        //   ]);
        //   setIsLoading(false);
        // }, 1000);
      } catch (error) {
        setError('Failed to load match history. Please try again.');
        setIsLoading(false);
      }
    };

    fetchMatchHistory();
  }, []);

  // Calculate match duration in minutes
  const getMatchDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="match-history-page">
      <h1>Match History</h1>
      
      {isLoading ? (
        <div className="loading">Loading match history...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : matches.length === 0 ? (
        <div className="no-matches">
          <p>You haven't played any matches yet.</p>
          <button className="btn btn-primary">Play a Match</button>
        </div>
      ) : (
        <div className="matches-history-list">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Players</th>
                <th>Sentence</th>
                <th>Difficulty</th>
                <th>Duration</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(match => {
                const isWinner = match.winnerUsername === 'CurrentUser';
                const playerName = match.playerAUsername === 'CurrentUser' ? match.playerBUsername : match.playerAUsername;
                
                return (
                  <tr key={match.id} className={isWinner ? 'win' : 'loss'}>
                    <td>{formatDate(match.startTime)}</td>
                    <td>vs {playerName}</td>
                    <td>{match.sentence}</td>
                    <td>{match.difficulty}</td>
                    <td>{match.endTime ? getMatchDuration(match.startTime, match.endTime) : 'N/A'}</td>
                    <td>
                      <span className={`result ${isWinner ? 'win-text' : 'loss-text'}`}>
                        {isWinner ? 'Win' : 'Loss'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="stats-summary">
        <h3>Summary</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-label">Total Matches</div>
            <div className="stat-value">{matches.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Wins</div>
            <div className="stat-value">{matches.filter(m => m.winnerUsername === 'CurrentUser').length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">
              {matches.length > 0 
                ? `${Math.round((matches.filter(m => m.winnerUsername === 'CurrentUser').length / matches.length) * 100)}%` 
                : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchHistory; 