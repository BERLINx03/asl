using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ASL.Backend.Models;
using Microsoft.IdentityModel.Tokens;

namespace ASL.Backend.Services;

public class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateJwtToken(ApplicationUser user, IList<string> roles)
    {
        // Use shorter claim types to reduce token size
        var claims = new List<Claim>
        {
            // Use "sub" instead of ClaimTypes.NameIdentifier (which is much longer)
            new Claim("sub", user.Id),
            // Include only essential claims
            new Claim("name", user.UserName ?? string.Empty),
            new Claim("email", user.Email ?? string.Empty)
        };

        // Add roles using a shorter claim name
        if (roles.Any())
        {
            claims.Add(new Claim("role", string.Join(",", roles)));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Shorter expiration time (4 hours instead of 1 day)
        var expires = DateTime.UtcNow.AddHours(4);

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT:ValidIssuer"],
            audience: _configuration["JWT:ValidAudience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}