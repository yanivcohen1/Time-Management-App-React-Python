using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AuthApi.Models;
using FluentAssertions;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AuthApi.Tests;

public class AuthFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public AuthFlowTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        using var client = _factory.CreateClient();
        var formContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("username", "admin@todo.dev"),
            new KeyValuePair<string, string>("password", "ChangeMe123!")
        });

        var response = await client.PostAsync("/auth/login", formContent);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        payload.Should().NotBeNull();
        payload!.Role.Should().Be("Admin");
        payload.Access_token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        using var client = _factory.CreateClient();
        var formContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("username", "admin@todo.dev"),
            new KeyValuePair<string, string>("password", "wrong")
        });

        var response = await client.PostAsync("/auth/login", formContent);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_ReturnsUnauthorized_WhenNoToken()
    {
        using var client = _factory.CreateClient();

        // /auth/me is a protected endpoint
        var response = await client.GetAsync("/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_ReturnsOk_WhenAuthenticated()
    {
        using var client = _factory.CreateClient();

        var token = await GetTokenAsync(client, "admin@todo.dev", "ChangeMe123!");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await response.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
        user.Should().NotBeNull();
        user!.Username.Should().Be("admin@todo.dev");
    }

    private async Task<string> GetTokenAsync(HttpClient client, string username, string password)
    {
        var formContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("username", username),
            new KeyValuePair<string, string>("password", password)
        });
        
        var response = await client.PostAsync("/auth/login", formContent);
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>(_jsonOptions);
        return payload!.Access_token;
    }

    private class UserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
