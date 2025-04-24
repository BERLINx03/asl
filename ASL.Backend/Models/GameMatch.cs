using System;

namespace ASL.Backend.Models;

public class GameMatch
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? PlayerAId { get; set; }
    public string? PlayerBId { get; set; }
    public ApplicationUser? PlayerA { get; set; }
    public ApplicationUser? PlayerB { get; set; }
    public string? WinnerId { get; set; }
    public ApplicationUser? Winner { get; set; }
    public string? Sentence { get; set; }
    public string? Difficulty { get; set; }
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public bool IsActive { get; set; } = true;
}