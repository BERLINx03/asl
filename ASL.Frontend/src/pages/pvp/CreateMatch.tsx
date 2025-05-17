import { useState, useEffect } from 'react';
import { gameApi } from '../../services/apiService';
import { Match } from '@testing-library/react';
import { Link, useNavigate } from 'react-router-dom';

interface CreateMatchForm {
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// interface MatchResponse {
//   success: boolean;
//   message: string;
//   data: {
//     id: string;
//     playerA: string;
//     playerB: string | null;
//     startTime: string;
//     difficulty: string;
//     sentence: string;
//     isActive: boolean;
//   };
//   errors: Record<string, string[]> | null;
// }


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


const CreateMatch = () => {
  const [formData, setFormData] = useState<CreateMatchForm>({
    difficulty: 'Medium',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [joinedMatch, setJoinedMatch] = useState<{
    id: string;
    playerA: string;
    difficulty: string;
    sentence: string;
  } | null>(null);


  ////////////
  const [isPolling, setIsPolling] = useState(false);
  const navigate = useNavigate();


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
      const response = await gameApi.createMatch(formData.difficulty) as MatchResponse;
      if (response.success) {
        setMatchId(response.data.id);
        setJoinedMatch({
          id: response.data.id,
          playerA: response.data.playerAUsername,
          difficulty: response.data.difficulty,
          sentence: response.data.sentence,
        });
        ///////////
        setIsPolling(true); // بدء الـ Polling بعد إنشاء المباراة
      } else {
        console.error('Error creating match:', response.errors);
      }
      setIsCreating(false);
      
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

      // setTimeout(() => {
      //   setMatchId('abcd1234');
      //   setIsCreating(false);
      // }, 1000);
    } catch (error) {
      console.error('Error creating match:', error);
      console.error('Error status:', (error as Error).message);
      setIsCreating(false);
    }
  };

  /////////////
  // Polling to check if player B has joined the match
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isPolling && matchId) {
      intervalId = setInterval(async () => {
        try {
          const response = await gameApi.getMatch(matchId) as MatchResponse;
          if (response.success && response.data.playerBUsername) {
            // print('Player B joined the match:'data.playerBUsername);
            // P2 انضم، أوقف الـ Polling وانتقل إلى صفحة اللعبة
            setIsPolling(false);
            navigate(`/pvp/gameb/${response.data.sentence || 'Hello'}/${matchId}`, {
              state: { username: response.data.playerAUsername },
            });
          }
        } catch (error) {
          console.error('Error checking match status:', error);
          setIsPolling(false);
        }
      }, 3000); // تحقق كل 3 ثوانٍ
    }

    return () => {
      if (intervalId) clearInterval(intervalId); // تنظيف الـ Polling عند إلغاء المكون
    };
  }, [isPolling, matchId, joinedMatch, navigate]);

  return (
    <div className="create-match-page">
      <h1>Create New Match</h1>
      
      {matchId ? (
        <div className="match-created">
    <h2>Match Created!</h2>
    <p>Your match ID: <strong>{matchId}</strong></p>
    <p>Share this ID with a friend so they can join your match.</p>
    <br />
    <p>Difficulty: <strong>{joinedMatch?.difficulty}</strong></p>
    <p>Start Time: <strong>{new Date().toLocaleString()}</strong></p>
    <br />
    {isPolling ? (
      <p>Waiting for the second player to join...</p>
    ) : (
      <Link
        to={`/pvp/gameb/${joinedMatch?.sentence || 'Hello'}/${joinedMatch?.id}`}
        className="start-button"
      >
        Go to Match
      </Link>
    )}
    <br />
    {/* <button onClick={handleCancelMatch} className="btn btn-secondary">
      Cancel Match
    </button> */}
  </div>
        // <div className="match-created">
        //   <h2>Match Created!</h2>
        //   <p>Your match ID: <strong>{matchId}</strong></p>
        //   <p>Share this ID with a friend so they can join your match.</p>
        //   <br/>
        //   <p>Difficulty: <strong>{joinedMatch?.difficulty}</strong></p>
        //   <p>Start Time: <strong>{new Date().toLocaleString()}</strong></p>
        //   <br/>
        //   <Link to={`/pvp/gameb/${joinedMatch?.sentence ? joinedMatch?.sentence:'Hello'}/${joinedMatch?.id}`} className="start-button">
        //     Go to Match
        //   </Link>
        //   {/* <button className="btn btn-primary">
        //     Start Match
        //   </button> */}
        // </div>
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