import { useState } from 'react';

interface ASLLetter {
  letter: string;
  image: string;
  description: string;
}

const DictionaryPage = () => {
  const [selectedLetter, setSelectedLetter] = useState<ASLLetter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in a real app, these would be actual images and descriptions
  const aslAlphabet: ASLLetter[] = [
    { letter: 'A', image: '/images/asl-a.png', description: 'Make a fist with your hand, with your thumb resting on the side of your finger.' },
    { letter: 'B', image: '/images/asl-b.png', description: 'Hold your hand flat, with your fingers together and your thumb tucked against your palm.' },
    { letter: 'C', image: '/images/asl-c.png', description: 'Curve your hand into a "C" shape.' },
    // Add all letters A-Z here
    { letter: 'Z', image: '/images/asl-z.png', description: 'Make the letter "Z" with your index finger, starting at the upper left and moving to the lower right.' },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectLetter = (letter: ASLLetter) => {
    setSelectedLetter(letter);
  };

  const filteredLetters = aslAlphabet.filter(letter => 
    letter.letter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dictionary-page">
      <h1>ASL Dictionary</h1>
      <div className="dictionary-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for a letter..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="letters-grid">
          {filteredLetters.map(letter => (
            <div 
              key={letter.letter}
              className={`letter-card ${selectedLetter?.letter === letter.letter ? 'selected' : ''}`}
              onClick={() => handleSelectLetter(letter)}
            >
              <div className="letter">{letter.letter}</div>
              <img 
                src={letter.image} 
                alt={`ASL Letter ${letter.letter}`} 
                className="letter-image"
              />
            </div>
          ))}
        </div>
        
        {selectedLetter && (
          <div className="letter-details">
            <h2>Letter {selectedLetter.letter}</h2>
            <div className="letter-image-large">
              <img 
                src={selectedLetter.image} 
                alt={`ASL Letter ${selectedLetter.letter}`} 
              />
            </div>
            <div className="letter-description">
              <h3>How to sign:</h3>
              <p>{selectedLetter.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPage; 