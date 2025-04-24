using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASL.Backend.Models;

/// <summary>
/// Generic API response wrapper for standardized responses
/// </summary>
/// <typeparam name="T">The type of data being returned</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Indicates if the operation was successful
    /// </summary>
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    /// <summary>
    /// Human-readable message describing the result
    /// </summary>
    [JsonPropertyName("message")]
    public string? Message { get; set; }

    /// <summary>
    /// The data payload of the response
    /// </summary>
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    /// <summary>
    /// List of error messages when Success is false
    /// </summary>
    [JsonPropertyName("errors")]
    public List<string>? Errors { get; set; }

    /// <summary>
    /// Creates a successful response
    /// </summary>
    /// <param name="data">The data to include in the response</param>
    /// <param name="message">A success message</param>
    /// <returns>A standardized success response</returns>
    public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    /// <summary>
    /// Creates an error response
    /// </summary>
    /// <param name="message">The error message</param>
    /// <param name="errors">Optional list of detailed error messages</param>
    /// <returns>A standardized error response</returns>
    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors
        };
    }
}