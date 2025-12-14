using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuthApi.Models;
using FluentAssertions;

namespace AuthApi.Tests;

public class DueDateTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DueDateTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
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
        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return payload!.Access_token;
    }

    [Fact]
    public async Task Create_Todo_With_DueDate_Should_Normalize_To_Noon_UTC()
    {
        using var client = _factory.CreateClient();
        var token = await GetTokenAsync(client, "admin@todo.dev", "ChangeMe123!");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        var date = new DateTime(2023, 10, 27);
        var createRequest = new TodoCreate 
        { 
            Title = "Test DueDate", 
            Status = Status.BACKLOG,
            DueDate = date
        };

        var createResponse = await client.PostAsJsonAsync("/todos", createRequest, options);
        createResponse.EnsureSuccessStatusCode();
        
        var createdTodo = await createResponse.Content.ReadFromJsonAsync<Todo>(options);
        createdTodo.Should().NotBeNull();
        createdTodo!.DueDate.Should().NotBeNull();
        
        // Check that the date part is correct
        createdTodo.DueDate!.Value.Date.Should().Be(date.Date);
        
        // Check that it is normalized to Noon UTC (12:00:00)
        // Note: The returned DateTime might be Local or UTC depending on deserializer settings, 
        // but the underlying value sent was UTC.
        // If we inspect the raw string it would be "2023-10-27T12:00:00Z"
        
        // Let's check the hour in UTC
        createdTodo.DueDate!.Value.ToUniversalTime().Hour.Should().Be(12);
    }
}
