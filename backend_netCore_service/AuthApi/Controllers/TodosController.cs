using AuthApi.Models;
using AuthApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuthApi.Controllers;

[ApiController]
[Route("todos")]
[Authorize]
public class TodosController : ControllerBase
{
    private readonly ITodoService _todoService;
    private readonly IUserService _userService;

    public TodosController(ITodoService todoService, IUserService userService)
    {
        _todoService = todoService;
        _userService = userService;
    }

    private string GetCurrentUserId()
    {
        var username = User.Identity?.Name;
        if (username == null) throw new UnauthorizedAccessException();
        var user = _userService.GetUser(username);
        if (user == null || user.Id == null) throw new UnauthorizedAccessException();
        return user.Id;
    }

    private DateTime? NormalizeDueDate(DateTime? date)
    {
        if (!date.HasValue) return null;
        // Set to Noon UTC to avoid timezone shifts (day-1 issue)
        return DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc).AddHours(12);
    }

    [HttpGet]
    public async Task<IActionResult> GetTodos(
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        [FromQuery(Name = "sort_by")] string sortBy = "created_at",
        [FromQuery(Name = "sort_desc")] bool sortDesc = true,
        [FromQuery] Status? status = null,
        [FromQuery] string? search = null,
        [FromQuery(Name = "due_date_start")] DateTime? dueDateStart = null,
        [FromQuery(Name = "due_date_end")] DateTime? dueDateEnd = null,
        [FromQuery(Name = "user_id")] string? userId = null)
    {
        // Map snake_case sort_by to PascalCase property names if needed
        // But Mongo driver might handle it if we map it correctly or use BsonElement
        // For now let's assume simple mapping: created_at -> CreatedAt
        
        var sortProperty = sortBy switch
        {
            "created_at" => "CreatedAt",
            "due_date" => "DueDate",
            "title" => "Title",
            "status" => "Status",
            _ => "CreatedAt"
        };

        if (dueDateStart.HasValue)
        {
            dueDateStart = dueDateStart.Value.Date;
        }

        if (dueDateEnd.HasValue)
        {
            dueDateEnd = dueDateEnd.Value.Date.AddDays(1).AddTicks(-1);
        }

        string targetUserId = GetCurrentUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            var username = User.Identity?.Name;
            if (username != null)
            {
                var currentUser = _userService.GetUser(username);
                if (currentUser?.Role == "Admin")
                {
                    targetUserId = userId;
                }
            }
        }

        var result = await _todoService.GetTodosAsync(targetUserId, page, size, sortProperty, sortDesc, status, search, dueDateStart, dueDateEnd);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTodo([FromBody] TodoCreate todoIn)
    {
        var todo = new Todo
        {
            Title = todoIn.Title,
            Description = todoIn.Description,
            Status = todoIn.Status,
            DueDate = NormalizeDueDate(todoIn.DueDate),
            Duration = todoIn.Duration,
            UserId = GetCurrentUserId()
        };

        var createdTodo = await _todoService.CreateTodoAsync(todo);
        return Ok(createdTodo);
    }

    [HttpGet("stats/status")]
    public async Task<IActionResult> GetStatusStats()
    {
        var stats = await _todoService.GetStatusStatsAsync(GetCurrentUserId());
        return Ok(stats);
    }

    [HttpGet("stats/workload")]
    public async Task<IActionResult> GetWorkloadStats()
    {
        var stats = await _todoService.GetWorkloadStatsAsync(GetCurrentUserId());
        return Ok(stats);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTodo(string id, [FromBody] TodoUpdate todoIn)
    {
        if (todoIn.DueDate.HasValue)
        {
            todoIn.DueDate = NormalizeDueDate(todoIn.DueDate);
        }
        
        var updatedTodo = await _todoService.UpdateTodoAsync(id, GetCurrentUserId(), todoIn);
        if (updatedTodo == null) return NotFound(new { detail = "Todo not found" });
        return Ok(updatedTodo);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTodo(string id)
    {
        var success = await _todoService.DeleteTodoAsync(id, GetCurrentUserId());
        if (!success) return NotFound(new { detail = "Todo not found" });
        return Ok(new { message = "Todo deleted" });
    }
}
