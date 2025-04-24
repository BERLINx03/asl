using System.Collections.Generic;

namespace ASL.Backend.Services;

public class SentenceService
{
    private readonly Dictionary<string, List<string>> _sentences = new()
    {
        ["easy"] = new List<string>
        {
            "Hello world",
            "Good morning",
            "How are you",
            "Nice to meet you",
            "Thank you very much",
            "Have a nice day",
            "See you later",
            "My name is",
            "Welcome back",
            "Good job",
        },
        ["medium"] = new List<string>
        {
            "The quick brown fox jumps over the lazy dog",
            "I would like to learn American Sign Language",
            "Please repeat that sentence one more time",
            "Can you teach me how to sign that phrase",
            "Practice makes perfect when learning new skills",
            "Thank you for helping me improve my signing",
            "Let me know if my hand position is correct",
            "Communication is essential for understanding each other",
            "Sign language is a beautiful form of expression",
            "I am excited to practice with you today",
        },
        ["hard"] = new List<string>
        {
            "American Sign Language has its own grammar and syntax different from English",
            "The linguistics of visual languages involve spatial grammar and simultaneous expression of concepts",
            "Sign language interpreters must process information rapidly while maintaining accuracy and cultural context",
            "Facial expressions are grammatical markers that can completely change the meaning of identical hand movements",
            "The National Association of the Deaf advocates for accessibility and linguistic rights for the Deaf community",
            "Fingerspelling is used for proper nouns and words that don't have established signs in the language",
            "Deaf culture emphasizes visual storytelling traditions and maintains unique cultural perspectives",
            "ASL is not a universal language, as different countries have developed their own sign languages independently",
            "The development of video technology has revolutionized remote communication for sign language users",
            "Learning a visual language requires developing strong spatial awareness and visual processing skills",
        }
    };

    private readonly Random _random = new();

    public string GetRandomSentence(string difficulty)
    {
        // Default to easy if difficulty is not found
        if (!_sentences.ContainsKey(difficulty.ToLower()))
        {
            difficulty = "easy";
        }

        var sentences = _sentences[difficulty.ToLower()];
        return sentences[_random.Next(sentences.Count)];
    }
}