using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASL.Backend.Models;

/// <summary>
/// Request model to create a new match
/// </summary>
public class CreateMatchRequest
{
    /// <summary>
    /// Difficulty level of the match: "easy", "medium", or "hard"
    /// </summary>
    [Required]
    [JsonPropertyName("difficulty")]
    public string Difficulty { get; set; } = "easy"; // default to easy
}

/// <summary>
/// Request model to join an existing match
/// </summary>
public class JoinMatchRequest
{
    /// <summary>
    /// ID of the match to join
    /// </summary>
    [Required]
    [JsonPropertyName("matchId")]
    public string MatchId { get; set; } = string.Empty;
}

/// <summary>
/// Request model to submit a game result
/// </summary>
public class GameResultRequest
{
    /// <summary>
    /// ID of the match to complete
    /// </summary>
    [Required]
    [JsonPropertyName("matchId")]
    public string MatchId { get; set; } = string.Empty;

    /// <summary>
    /// ID of the user submitting the result
    /// </summary>
    [Required]
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
}

/// <summary>
/// Response model containing match details
/// </summary>
public class MatchResponse
{
    /// <summary>
    /// Unique identifier for the match
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Username of Player A (match creator)
    /// </summary>
    [JsonPropertyName("playerAUsername")]
    public string PlayerAUsername { get; set; } = string.Empty;

    /// <summary>
    /// Username of Player B (match joiner)
    /// </summary>
    [JsonPropertyName("playerBUsername")]
    public string? PlayerBUsername { get; set; }

    /// <summary>
    /// Username of the winner (if match is completed)
    /// </summary>
    [JsonPropertyName("winnerUsername")]
    public string? WinnerUsername { get; set; }

    /// <summary>
    /// The sentence that players need to sign
    /// </summary>
    [JsonPropertyName("sentence")]
    public string? Sentence { get; set; }

    /// <summary>
    /// Difficulty level of the match
    /// </summary>
    [JsonPropertyName("difficulty")]
    public string Difficulty { get; set; } = string.Empty;

    /// <summary>
    /// When the match was created
    /// </summary>
    [JsonPropertyName("startTime")]
    public DateTime StartTime { get; set; }

    /// <summary>
    /// When the match was completed
    /// </summary>
    [JsonPropertyName("endTime")]
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Whether the match is still active
    /// </summary>
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
}