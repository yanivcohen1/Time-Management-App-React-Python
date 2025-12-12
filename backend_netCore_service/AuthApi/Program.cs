using System.Security.Claims;
using System.Text;
using AuthApi;
using AuthApi.Models;
using AuthApi.Options;
using AuthApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Parse environment from command line args, default to dev
string env = "dev";
if (args.Length >= 2 && args[0] == "--env")
{
    env = args[1];
}

builder.Configuration.AddYamlFile($"{env}.appsettings.yaml", optional: true, reloadOnChange: true);

// Configure server URLs from YAML
var urls = builder.Configuration["Server:Urls"];
if (!string.IsNullOrEmpty(urls))
{
    builder.WebHost.UseUrls(urls);
}

builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

// Configure CORS from YAML
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',') ?? new[] { "http://localhost:3000", "http://localhost:3001" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), new MySqlServerVersion(new Version(8, 0, 21)),
        mySqlOptions => mySqlOptions.EnableStringComparisonTranslations()));

// Register user service based on database provider
var databaseProvider = builder.Configuration["Database:Provider"];
if (databaseProvider == "MongoDB")
{
    var mongoConnection = builder.Configuration.GetConnectionString("MongoConnection");
    var databaseName = mongoConnection?.Split('/').Last() ?? "netcore_auth_xunit";
    builder.Services.AddScoped<IUserService>(sp => new MongoUserService(mongoConnection!, databaseName));
}
else
{
    builder.Services.AddScoped<IUserService, DatabaseUserService>(); // Use MySQL-backed user service
}

builder.Services.AddScoped<ITokenService, TokenService>();

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration is missing");

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.AddPolicy("AdminPolicy", policy => policy.RequireRole("Admin"));
    options.AddPolicy("UserPolicy", policy => policy.RequireRole("User", "Admin"));
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });

builder.Services.AddHealthChecks();

// Register TodoService
if (databaseProvider == "MongoDB")
{
    var mongoConnection = builder.Configuration.GetConnectionString("MongoConnection");
    var databaseName = mongoConnection?.Split('/').Last() ?? "netcore_auth_xunit";
    builder.Services.AddScoped<ITodoService>(sp => new MongoTodoService(mongoConnection!, databaseName));
}
else
{
    // Fallback or implementation for SQL if needed, for now throwing or using MongoService if connection string available
    // Assuming MongoDB is the primary target for Todos as per instructions
    var mongoConnection = builder.Configuration.GetConnectionString("MongoConnection") ?? "mongodb://localhost:27017/netcore_auth_xunit";
    var databaseName = mongoConnection.Split('/').Last();
    builder.Services.AddScoped<ITodoService>(sp => new MongoTodoService(mongoConnection, databaseName));
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsEnvironment("Testing") && !app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

public partial class Program;
