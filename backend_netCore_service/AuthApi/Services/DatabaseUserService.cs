using AuthApi.Models;
using Microsoft.AspNetCore.Identity;

namespace AuthApi.Services;

public class DatabaseUserService : IUserService
{
    private readonly AuthDbContext _context;
    private readonly PasswordHasher<ApplicationUser> _passwordHasher = new();

    public DatabaseUserService(AuthDbContext context)
    {
        _context = context;
    }

    public ApplicationUser? ValidateCredentials(string username, string password)
    {
        var user = _context.Users.SingleOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        if (user is null)
        {
            return null;
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result is PasswordVerificationResult.Success ? user : null;
    }

    public ApplicationUser? GetUser(string username) =>
        _context.Users.SingleOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));

    public IEnumerable<ApplicationUser> GetAllUsers() => _context.Users.ToList();
}