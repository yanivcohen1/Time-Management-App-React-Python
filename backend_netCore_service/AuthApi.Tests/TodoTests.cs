using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuthApi.Models;
using FluentAssertions;
using MongoDB.Bson;

namespace AuthApi.Tests;

public class TodoTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public TodoTests(CustomWebApplicationFactory factory)
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
    public async Task Create_And_Delete_Todo_Should_Work()
    {
        using var client = _factory.CreateClient();
        var token = await GetTokenAsync(client, "admin@todo.dev", "ChangeMe123!");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        // 1. Create Todo
        var createRequest = new TodoCreate { Title = "Test Todo", Status = Status.BACKLOG };
        var createResponse = await client.PostAsJsonAsync("/todos", createRequest, options);
        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var createdTodo = await createResponse.Content.ReadFromJsonAsync<Todo>(options);
        createdTodo.Should().NotBeNull();
        createdTodo!.Id.Should().NotBeNullOrEmpty();

        // 2. Update Todo
        var updateRequest = new TodoUpdate { Title = "Updated Title", Status = Status.IN_PROGRESS };
        var updateResponse = await client.PutAsJsonAsync($"/todos/{createdTodo.Id}", updateRequest, options);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedTodo = await updateResponse.Content.ReadFromJsonAsync<Todo>(options);
        updatedTodo!.Title.Should().Be("Updated Title");
        updatedTodo.Status.Should().Be(Status.IN_PROGRESS);

        // 3. Delete Todo
        var deleteResponse = await client.DeleteAsync($"/todos/{createdTodo.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 4. Verify Deletion
        var getResponse = await client.GetAsync($"/todos/{createdTodo.Id}");
        // Note: The API doesn't have a GetById endpoint exposed in the controller shown, 
        // but we can verify it's gone by trying to delete it again or update it
        
        var deleteAgainResponse = await client.DeleteAsync($"/todos/{createdTodo.Id}");
        deleteAgainResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
