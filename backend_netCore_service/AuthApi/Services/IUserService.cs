using AuthApi.Models;

namespace AuthApi.Services;

public interface IUserService
{
    ApplicationUser? ValidateCredentials(string username, string password);
    ApplicationUser? GetUser(string username);
    IEnumerable<ApplicationUser> GetAllUsers();
}
