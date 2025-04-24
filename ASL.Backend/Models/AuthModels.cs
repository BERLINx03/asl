using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASL.Backend.Models;

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// User's email address
    /// </summary>
    [Required]
    [EmailAddress]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's password
    /// </summary>
    [Required]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Request model for user registration
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User's email address
    /// </summary>
    [Required]
    [EmailAddress]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's password (min 6 characters)
    /// </summary>
    [Required]
    [MinLength(6)]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Confirmation of password (must match password)
    /// </summary>
    [Required]
    [Compare("Password")]
    [JsonPropertyName("confirmPassword")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>
    /// User's username
    /// </summary>
    [Required]
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// User's first name (optional)
    /// </summary>
    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }

    /// <summary>
    /// User's last name (optional)
    /// </summary>
    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }
}

/// <summary>
/// Response model for authentication operations
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// Indicates if the authentication was successful
    /// </summary>
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    /// <summary>
    /// JWT token for authenticated requests
    /// </summary>
    [JsonPropertyName("token")]
    public string? Token { get; set; }

    /// <summary>
    /// Refresh token for getting a new JWT (when implemented)
    /// </summary>
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }

    /// <summary>
    /// When the token expires
    /// </summary>
    [JsonPropertyName("expiration")]
    public DateTime? Expiration { get; set; }

    /// <summary>
    /// Message describing the authentication result
    /// </summary>
    [JsonPropertyName("message")]
    public string? Message { get; set; }

    /// <summary>
    /// User's unique ID
    /// </summary>
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    /// <summary>
    /// User's username
    /// </summary>
    [JsonPropertyName("username")]
    public string? Username { get; set; }
}