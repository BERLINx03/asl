using ASL.Backend.Models;
using ASL.Backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using Swashbuckle.AspNetCore.Annotations;

namespace ASL.Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        TokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new user
    /// </summary>
    /// <param name="model">The registration details</param>
    /// <returns>User info and authentication token</returns>
    [HttpPost("register")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Registration successful", typeof(ApiResponse<AuthResponse>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Registration failed", typeof(ApiResponse<object>))]
    public async Task<IActionResult> Register([FromBody] RegisterRequest model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Invalid model state",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));
        }

        var user = new ApplicationUser
        {
            UserName = model.Username,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<object>.ErrorResponse("Registration failed", errors));
        }

        // Add to default role
        await _userManager.AddToRoleAsync(user, "User");

        _logger.LogInformation("User {UserId} created a new account", user.Id);

        var response = new AuthResponse
        {
            Success = true,
            UserId = user.Id,
            Username = user.UserName,
            Message = "Registration successful"
        };

        return Ok(ApiResponse<AuthResponse>.SuccessResponse(response, "User registered successfully"));
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="model">The login credentials</param>
    /// <returns>Authentication token and user info</returns>
    [HttpPost("login")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Login successful", typeof(ApiResponse<AuthResponse>))]
    [SwaggerResponse((int)HttpStatusCode.Unauthorized, "Invalid credentials", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Invalid request", typeof(ApiResponse<object>))]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Invalid model state",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));
        }

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
        {
            return Unauthorized(ApiResponse<object>.ErrorResponse("Invalid email or password"));
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized(ApiResponse<object>.ErrorResponse("Invalid email or password"));
        }

        _logger.LogInformation("User {UserId} logged in", user.Id);

        // Generate token
        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateJwtToken(user, roles);

        var response = new AuthResponse
        {
            Success = true,
            Token = token,
            UserId = user.Id,
            Username = user.UserName,
            Message = "Login successful"
        };

        return Ok(ApiResponse<AuthResponse>.SuccessResponse(response, "User logged in successfully"));
    }
}