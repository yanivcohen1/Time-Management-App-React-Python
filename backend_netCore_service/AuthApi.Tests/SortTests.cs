using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuthApi.Models;
using FluentAssertions;

namespace AuthApi.Tests;

public class SortTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SortTests(CustomWebApplicationFactory factory)
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
    public async Task GetTodos_SortByStatus_ShouldWork()
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

        // Create Todos with different statuses
        var statuses = new[] { Status.PENDING, Status.BACKLOG, Status.COMPLETED };
        foreach (var status in statuses)
        {
            var createRequest = new TodoCreate 
            { 
                Title = $"Todo {status}", 
                Status = status 
            };
            await client.PostAsJsonAsync("/todos", createRequest, options);
        }

        // Sort Ascending
        // Expected alphabetical order: BACKLOG, COMPLETED, PENDING
        var responseAsc = await client.GetAsync("/todos?sort_by=status&sort_desc=false&size=100");
        responseAsc.EnsureSuccessStatusCode();
        var resultAsc = await responseAsc.Content.ReadFromJsonAsync<TodoResponse>(options);
        
        // Filter to only the ones we just created (or assume test db is clean/isolated enough or check relative order)
        // Since we can't easily isolate, let's just check if the returned list respects the order for the items we care about
        // Or better, just check if the whole list is sorted by status.
        
        var itemsAsc = resultAsc!.Items.ToList();
        // We can't guarantee other items in DB, but let's check if the items are sorted.
        // Note: If there are other items, they should also be sorted.
        
        var statusStringsAsc = itemsAsc.Select(t => t.Status.ToString()).ToList();
        statusStringsAsc.Should().BeInAscendingOrder();

        // Sort Descending
        // Expected: PENDING, COMPLETED, BACKLOG
        var responseDesc = await client.GetAsync("/todos?sort_by=status&sort_desc=true&size=100");
        responseDesc.EnsureSuccessStatusCode();
        var resultDesc = await responseDesc.Content.ReadFromJsonAsync<TodoResponse>(options);
        
        var itemsDesc = resultDesc!.Items.ToList();
        var statusStringsDesc = itemsDesc.Select(t => t.Status.ToString()).ToList();
        statusStringsDesc.Should().BeInDescendingOrder();
    }
}
