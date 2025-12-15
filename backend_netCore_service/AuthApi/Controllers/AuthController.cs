using AuthApi.Models;
using AuthApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuthApi.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;

    public AuthController(IUserService userService, ITokenService tokenService)
    {
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromForm] LoginRequest request)
    {
        // Note: Python uses OAuth2PasswordRequestForm which expects form data 'username' and 'password'
        // Our LoginRequest model should match that or we use [FromForm] parameters
        
        var user = _userService.ValidateCredentials(request.Username, request.Password);
        if (user == null)
        {
            return Unauthorized(new { detail = "Incorrect username or password" });
        }

        var tokenResponse = _tokenService.CreateToken(user);
        
        // Python returns: {"access_token": access_token, "token_type": "bearer", "role": user.role, "name": user.full_name}
        // TokenService.CreateToken returns AuthResponse which has Token and Expiration
        // We need to construct the response to match Python
        
        return Ok(new
        {
            access_token = tokenResponse.Access_token,
            token_type = "bearer",
            role = user.Role,
            name = user.Username // Using Username as name since we don't have FullName in ApplicationUser yet
        });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {
        var username = User.Identity?.Name;
        if (username == null) return Unauthorized();

        var user = _userService.GetUser(username);
        if (user == null) return NotFound();

        return Ok(new
        {
            _id = user.Id,
            email = user.Username,
            full_name = user.FullName,
            role = user.Role
        });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetUsers()
    {
        var users = _userService.GetAllUsers();
        return Ok(users.Select(u => new
        {
            _id = u.Id,
            email = u.Username,
            full_name = u.FullName,
            role = u.Role
        }));
    }
}
