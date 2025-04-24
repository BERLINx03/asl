using ASL.Backend.Models;
using ASL.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using System.Security.Claims;

namespace ASL.Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class GameController : ControllerBase
{
    private readonly GameService _gameService;
    private readonly ILogger<GameController> _logger;

    public GameController(GameService gameService, ILogger<GameController> logger)
    {
        _gameService = gameService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new game match
    /// </summary>
    /// <param name="request">The match creation details including difficulty</param>
    /// <returns>The created match details</returns>
    [HttpPost("create")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Match created successfully", typeof(ApiResponse<MatchResponse>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Invalid request", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.Unauthorized, "User not authenticated", typeof(ApiResponse<object>))]
    public async Task<IActionResult> CreateMatch([FromBody] CreateMatchRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Invalid model state",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("User not authenticated"));
            }

            var match = await _gameService.CreateMatchAsync(userId, request.Difficulty);

            var response = new MatchResponse
            {
                Id = match.Id,
                PlayerAUsername = match.PlayerA?.UserName ?? "Unknown",
                Difficulty = match.Difficulty,
                StartTime = match.StartTime,
                IsActive = match.IsActive
            };

            return Ok(ApiResponse<MatchResponse>.SuccessResponse(response, "Match created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating match");
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Join an existing match
    /// </summary>
    /// <param name="request">The join request with match ID</param>
    /// <returns>The joined match details</returns>
    [HttpPost("join")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Joined match successfully", typeof(ApiResponse<MatchResponse>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Invalid request or match is full", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.Unauthorized, "User not authenticated", typeof(ApiResponse<object>))]
    public async Task<IActionResult> JoinMatch([FromBody] JoinMatchRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Invalid model state",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("User not authenticated"));
            }

            var match = await _gameService.JoinMatchAsync(request.MatchId, userId);

            var response = new MatchResponse
            {
                Id = match.Id,
                PlayerAUsername = match.PlayerA?.UserName ?? "Unknown",
                PlayerBUsername = match.PlayerB?.UserName,
                Sentence = match.Sentence,
                Difficulty = match.Difficulty,
                StartTime = match.StartTime,
                IsActive = match.IsActive
            };

            return Ok(ApiResponse<MatchResponse>.SuccessResponse(response, "Joined match successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining match {MatchId}", request.MatchId);
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Complete a match and declare a winner
    /// </summary>
    /// <param name="request">The game result request</param>
    /// <returns>The completed match details</returns>
    [HttpPost("complete")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Match completed successfully", typeof(ApiResponse<MatchResponse>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Invalid request", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.Unauthorized, "User not authenticated", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.Forbidden, "Cannot complete match for another user", typeof(ApiResponse<object>))]
    public async Task<IActionResult> CompleteMatch([FromBody] GameResultRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Invalid model state",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));
        }

        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("User not authenticated"));
            }

            // Ensure the user is completing their own game
            if (userId != request.UserId)
            {
                return StatusCode(403, ApiResponse<object>.ErrorResponse("Cannot complete a match for another user"));
            }

            var match = await _gameService.CompleteMatchAsync(request.MatchId, userId);

            var response = new MatchResponse
            {
                Id = match.Id,
                PlayerAUsername = match.PlayerA?.UserName ?? "Unknown",
                PlayerBUsername = match.PlayerB?.UserName,
                WinnerUsername = match.Winner?.UserName,
                Sentence = match.Sentence,
                Difficulty = match.Difficulty,
                StartTime = match.StartTime,
                EndTime = match.EndTime,
                IsActive = match.IsActive
            };

            return Ok(ApiResponse<MatchResponse>.SuccessResponse(response, "Match completed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing match {MatchId}", request.MatchId);
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Get all active matches
    /// </summary>
    /// <returns>List of active matches</returns>
    [HttpGet("active")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Active matches retrieved", typeof(ApiResponse<List<MatchResponse>>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Error retrieving matches", typeof(ApiResponse<object>))]
    public async Task<IActionResult> GetActiveMatches()
    {
        try
        {
            var matches = await _gameService.GetActiveMatchesAsync();

            var response = matches.Select(m => new MatchResponse
            {
                Id = m.Id,
                PlayerAUsername = m.PlayerA?.UserName ?? "Unknown",
                PlayerBUsername = m.PlayerB?.UserName,
                Difficulty = m.Difficulty ?? "easy",
                StartTime = m.StartTime,
                IsActive = m.IsActive
            }).ToList();

            return Ok(ApiResponse<List<MatchResponse>>.SuccessResponse(response, "Active matches retrieved"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active matches");
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Get match details by ID
    /// </summary>
    /// <param name="id">The match ID</param>
    /// <returns>Match details</returns>
    [HttpGet("{id}")]
    [SwaggerResponse((int)HttpStatusCode.OK, "Match retrieved successfully", typeof(ApiResponse<MatchResponse>))]
    [SwaggerResponse((int)HttpStatusCode.NotFound, "Match not found", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Error retrieving match", typeof(ApiResponse<object>))]
    public async Task<IActionResult> GetMatch(string id)
    {
        try
        {
            var match = await _gameService.GetMatchByIdAsync(id);

            if (match == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Match not found"));
            }

            var response = new MatchResponse
            {
                Id = match.Id,
                PlayerAUsername = match.PlayerA?.UserName ?? "Unknown",
                PlayerBUsername = match.PlayerB?.UserName,
                WinnerUsername = match.Winner?.UserName,
                Sentence = match.Sentence,
                Difficulty = match.Difficulty ?? "easy",
                StartTime = match.StartTime,
                EndTime = match.EndTime,
                IsActive = match.IsActive
            };

            return Ok(ApiResponse<MatchResponse>.SuccessResponse(response, "Match retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting match {MatchId}", id);
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Get all matches for the current user
    /// </summary>
    /// <returns>List of user matches</returns>
    [HttpGet("user")]
    [SwaggerResponse((int)HttpStatusCode.OK, "User matches retrieved", typeof(ApiResponse<List<MatchResponse>>))]
    [SwaggerResponse((int)HttpStatusCode.Unauthorized, "User not authenticated", typeof(ApiResponse<object>))]
    [SwaggerResponse((int)HttpStatusCode.BadRequest, "Error retrieving matches", typeof(ApiResponse<object>))]
    public async Task<IActionResult> GetUserMatches()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("User not authenticated"));
            }

            var matches = await _gameService.GetUserMatchesAsync(userId);

            var response = matches.Select(m => new MatchResponse
            {
                Id = m.Id,
                PlayerAUsername = m.PlayerA?.UserName ?? "Unknown",
                PlayerBUsername = m.PlayerB?.UserName,
                WinnerUsername = m.Winner?.UserName,
                Sentence = m.Sentence,
                Difficulty = m.Difficulty ?? "easy",
                StartTime = m.StartTime,
                EndTime = m.EndTime,
                IsActive = m.IsActive
            }).ToList();

            return Ok(ApiResponse<List<MatchResponse>>.SuccessResponse(response, "User matches retrieved"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user matches");
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }
}