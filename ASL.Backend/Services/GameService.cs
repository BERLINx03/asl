using ASL.Backend.Data;
using ASL.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace ASL.Backend.Services;

public class GameService
{
    private readonly ApplicationDbContext _context;
    private readonly SentenceService _sentenceService;

    public GameService(ApplicationDbContext context, SentenceService sentenceService)
    {
        _context = context;
        _sentenceService = sentenceService;
    }

    public async Task<GameMatch> CreateMatchAsync(string userId, string difficulty)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new ArgumentException("User not found");

        var match = new GameMatch
        {
            PlayerAId = userId,
            PlayerA = user,
            Difficulty = difficulty.ToLower(),
            IsActive = true
        };

        await _context.GameMatches.AddAsync(match);
        await _context.SaveChangesAsync();

        return match;
    }

    public async Task<GameMatch> JoinMatchAsync(string matchId, string userId)
    {
        var match = await _context.GameMatches
            .Include(m => m.PlayerA)
            .FirstOrDefaultAsync(m => m.Id == matchId && m.IsActive)
            ?? throw new ArgumentException("Match not found or already completed");

        if (match.PlayerAId == userId)
        {
            throw new InvalidOperationException("Cannot join your own match");
        }

        if (match.PlayerBId != null)
        {
            throw new InvalidOperationException("Match already has two players");
        }

        var user = await _context.Users.FindAsync(userId)
            ?? throw new ArgumentException("User not found");

        match.PlayerBId = userId;
        match.PlayerB = user;

        // Now that both players are present, select a sentence
        match.Sentence = _sentenceService.GetRandomSentence(match.Difficulty);

        await _context.SaveChangesAsync();
        return match;
    }

    public async Task<GameMatch> CompleteMatchAsync(string matchId, string winnerId)
    {
        var match = await _context.GameMatches
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .FirstOrDefaultAsync(m => m.Id == matchId && m.IsActive)
            ?? throw new ArgumentException("Match not found or already completed");

        // Validate winner is a player in this match
        if (match.PlayerAId != winnerId && match.PlayerBId != winnerId)
        {
            throw new InvalidOperationException("Winner must be a player in this match");
        }

        var winner = await _context.Users.FindAsync(winnerId)
            ?? throw new ArgumentException("Winner not found");

        match.WinnerId = winnerId;
        match.Winner = winner;
        match.IsActive = false;
        match.EndTime = DateTime.UtcNow;

        // Update player stats
        winner.GamesWon++;

        if (match.PlayerA != null)
            match.PlayerA.GamesPlayed++;

        if (match.PlayerB != null)
            match.PlayerB.GamesPlayed++;

        await _context.SaveChangesAsync();
        return match;
    }

    public async Task<List<GameMatch>> GetActiveMatchesAsync()
    {
        return await _context.GameMatches
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .Where(m => m.IsActive)
            .ToListAsync();
    }

    public async Task<GameMatch?> GetMatchByIdAsync(string matchId)
    {
        return await _context.GameMatches
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .Include(m => m.Winner)
            .FirstOrDefaultAsync(m => m.Id == matchId);
    }

    public async Task<List<GameMatch>> GetUserMatchesAsync(string userId)
    {
        return await _context.GameMatches
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .Include(m => m.Winner)
            .Where(m => m.PlayerAId == userId || m.PlayerBId == userId)
            .OrderByDescending(m => m.StartTime)
            .ToListAsync();
    }
}