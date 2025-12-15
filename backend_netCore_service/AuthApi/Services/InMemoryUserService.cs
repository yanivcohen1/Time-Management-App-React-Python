using AuthApi.Models;
using Microsoft.AspNetCore.Identity;

namespace AuthApi.Services;

public class InMemoryUserService : IUserService
{
    private readonly List<ApplicationUser> _users;
    private readonly PasswordHasher<ApplicationUser> _passwordHasher = new();

    public InMemoryUserService()
    {
        _users = new List<ApplicationUser>
        {
            CreateUser("admin@example.com", "Admin123!", "Admin"),
            CreateUser("user@example.com", "User123!", "User")
        };
    }

    public ApplicationUser? ValidateCredentials(string username, string password)
    {
        var user = _users.SingleOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        if (user is null)
        {
            return null;
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result is PasswordVerificationResult.Success ? user : null;
    }

    public ApplicationUser? GetUser(string username) =>
        _users.SingleOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));

    public IEnumerable<ApplicationUser> GetAllUsers() => _users;

    private ApplicationUser CreateUser(string username, string password, string role)
    {
        var user = new ApplicationUser
        {
            Username = username,
            Role = role,
            PasswordHash = string.Empty
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        return user;
    }
}
