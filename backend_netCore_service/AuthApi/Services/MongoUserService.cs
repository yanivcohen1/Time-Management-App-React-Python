using AuthApi.Models;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;

namespace AuthApi.Services;

public class MongoUserService : IUserService
{
    private readonly IMongoCollection<ApplicationUser> _users;
    private readonly PasswordHasher<ApplicationUser> _passwordHasher = new();

    public MongoUserService(string connectionString, string databaseName)
    {
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        _users = database.GetCollection<ApplicationUser>("users");

        EnsureUsers();
    }

    private void EnsureUsers()
    {
        var hasher = new PasswordHasher<ApplicationUser>();

        var usersToEnsure = new[]
        {
            new { Username = "admin@todo.dev", Role = "Admin", Password = "ChangeMe123!", FullName = "Admin User" },
            new { Username = "user@todo.dev", Role = "User", Password = "ChangeMe123!", FullName = "Regular User" }
        };

        foreach (var u in usersToEnsure)
        {
            var existingUser = _users.Find(x => x.Username == u.Username).FirstOrDefault();
            
            var user = existingUser ?? new ApplicationUser 
            { 
                Username = u.Username, 
                Role = u.Role, 
                PasswordHash = "",
                FullName = u.FullName
            };
            
            // Update properties
            user.Role = u.Role;
            user.FullName = u.FullName;
            user.PasswordHash = hasher.HashPassword(user, u.Password);

            if (existingUser == null)
            {
                _users.InsertOne(user);
            }
            else
            {
                _users.ReplaceOne(x => x.Id == user.Id, user);
            }
        }
    }

    public ApplicationUser? ValidateCredentials(string username, string password)
    {
        var user = _users.Find(u => u.Username.ToLower() == username.ToLower()).FirstOrDefault();
        if (user is null)
        {
            return null;
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result == PasswordVerificationResult.Success ? user : null;
    }

    public ApplicationUser? GetUser(string username) =>
        _users.Find(u => u.Username.ToLower() == username.ToLower()).FirstOrDefault();

    public IEnumerable<ApplicationUser> GetAllUsers() => _users.Find(_ => true).ToList();
}