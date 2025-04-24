using Microsoft.AspNetCore.Identity;

namespace ASL.Backend.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;
    public int GamesPlayed { get; set; } = 0;
    public int GamesWon { get; set; } = 0;
}