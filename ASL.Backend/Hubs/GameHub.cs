using ASL.Backend.Models;
using ASL.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Text.Json;

namespace ASL.Backend.Hubs;

[Authorize]
public class GameHub : Hub
{
    private readonly GameService _gameService;
    private readonly ILogger<GameHub> _logger;
    private static readonly Dictionary<string, string> UserMatchMapping = new();

    public GameHub(GameService gameService, ILogger<GameHub> logger)
    {
        _gameService = gameService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId != null)
        {
            _logger.LogInformation("User {UserId} connected to GameHub", userId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId != null)
        {
            _logger.LogInformation("User {UserId} disconnected from GameHub", userId);

            // Remove from any active match groups
            if (UserMatchMapping.TryGetValue(userId, out var matchId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, matchId);
                UserMatchMapping.Remove(userId);

                // Notify others in the match
                var response = ApiResponse<string>.SuccessResponse(userId, "Player disconnected");
                await Clients.Group(matchId).SendAsync("PlayerDisconnected", response);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinMatch(string matchId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
        {
            throw new HubException(JsonSerializer.Serialize(
                ApiResponse<object>.ErrorResponse("User not authenticated")));
        }

        try
        {
            var match = await _gameService.GetMatchByIdAsync(matchId);

            if (match == null)
            {
                throw new HubException(JsonSerializer.Serialize(
                    ApiResponse<object>.ErrorResponse("Match not found")));
            }

            if (match.PlayerAId != userId && match.PlayerBId != userId)
            {
                throw new HubException(JsonSerializer.Serialize(
                    ApiResponse<object>.ErrorResponse("You are not a participant in this match")));
            }

            // Add user to the match group
            await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
            UserMatchMapping[userId] = matchId;

            // Notify others in the match
            var playerInfo = new
            {
                UserId = userId,
                Username = Context.User?.FindFirst(ClaimTypes.Name)?.Value
            };
            var playerJoinedResponse = ApiResponse<object>.SuccessResponse(playerInfo, "Player joined the match");
            await Clients.OthersInGroup(matchId).SendAsync("PlayerJoined", playerJoinedResponse);

            // If both players are present, start the match
            if (match.PlayerAId != null && match.PlayerBId != null && !string.IsNullOrEmpty(match.Sentence))
            {
                var matchInfo = new
                {
                    MatchId = match.Id,
                    Sentence = match.Sentence,
                    PlayerA = match.PlayerA?.UserName,
                    PlayerB = match.PlayerB?.UserName
                };
                var matchStartedResponse = ApiResponse<object>.SuccessResponse(matchInfo, "Match started");
                await Clients.Group(matchId).SendAsync("MatchStarted", matchStartedResponse);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining match {MatchId} for user {UserId}", matchId, userId);
            throw new HubException(JsonSerializer.Serialize(
                ApiResponse<object>.ErrorResponse($"Error joining match: {ex.Message}")));
        }
    }

    public async Task CompleteMatch(string matchId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
        {
            throw new HubException(JsonSerializer.Serialize(
                ApiResponse<object>.ErrorResponse("User not authenticated")));
        }

        try
        {
            var match = await _gameService.CompleteMatchAsync(matchId, userId);

            // Notify all players in the match
            var winnerInfo = new
            {
                MatchId = match.Id,
                WinnerId = userId,
                WinnerUsername = Context.User?.FindFirst(ClaimTypes.Name)?.Value
            };
            var matchCompletedResponse = ApiResponse<object>.SuccessResponse(winnerInfo, "Match completed");
            await Clients.Group(matchId).SendAsync("MatchCompleted", matchCompletedResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing match {MatchId} for user {UserId}", matchId, userId);
            throw new HubException(JsonSerializer.Serialize(
                ApiResponse<object>.ErrorResponse($"Error completing match: {ex.Message}")));
        }
    }
}