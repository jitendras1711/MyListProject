using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using backend.Core.Entities;
using backend.Core.Interfaces;
using backend.Application.Services;
using backend.Data;
using backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Authentication Services
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://accounts.google.com";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudiences = new[] {
                "192788138454-6cvomopeu4lg6ppvbm288bqcrejgcibe.apps.googleusercontent.com", // Web
                "192788138454-dk8gf75h5kuiia9346enup99ub9i7inn.apps.googleusercontent.com"                  // Android
            },
            ValidateIssuer = true,
            ValidIssuer = "https://accounts.google.com"
        };
    });

builder.Services.AddAuthorization();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
var defaultOrigins = new[] {
    "http://localhost:8081",
    "http://localhost:3000",
    "https://jolly-beach-0f8530e10.7.azurestaticapps.net"
};

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.WithOrigins(defaultOrigins.Concat(allowedOrigins).Distinct().ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("Authorization");
    });
});

// In Azure, the connection string is usually injected through app settings or
// App Service connection-string environment variables.
var connectionString =
    FirstConfigured(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"),
        Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTIONSTRING"),
        Environment.GetEnvironmentVariable("SQLAZURECONNSTR_DefaultConnection"),
        Environment.GetEnvironmentVariable("SQLCONNSTR_DefaultConnection"),
        Environment.GetEnvironmentVariable("CUSTOMCONNSTR_DefaultConnection"));

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string is not configured. Set ConnectionStrings:DefaultConnection or AZURE_SQL_CONNECTIONSTRING.");
}
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(connectionString));
//builder.Services.AddDbContext<AppDbContext>(opt =>
//    opt.UseSqlite("Data Source=MyList.db"));

builder.Services.AddScoped<ITodoRepository, TodoRepository>();
builder.Services.AddScoped<TodoService>();


var app = builder.Build();

// Basic route to verify the API is live
app.MapGet("/", () => "Atomize API is running successfully!");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
//app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

//app.MapGet("/items", async (AppDbContext db) =>
//    await db.Items.ToListAsync());
string? GetClaimValue(ClaimsPrincipal user, string claimType) => user.FindFirst(claimType)?.Value;

// GET Items for the logged-in user
app.MapGet("/items", async (ClaimsPrincipal user, int? parentId, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(userId, email, name);
    var items = await todoService.GetItemsAsync(userId, parentId);
    return Results.Ok(items);
}).RequireAuthorization();
//app.MapGet("/items", async (ClaimsPrincipal user, int? parentId, AppDbContext db) =>
//{
//    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//    if (string.IsNullOrEmpty(userId))
//        return Results.Unauthorized();

//    var items = await db.Items
//        .Where(i => i.UserId == userId && i.ParentId == parentId)
//        .ToListAsync();
//    return Results.Ok(items);
//}).RequireAuthorization();

// POST new item for the logged-in user
app.MapPost("/items", async (TodoItem item, ClaimsPrincipal user, TodoService todoService) => {
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(userId, email, name);
    item.UserId = userId;
    var created = await todoService.AddItemAsync(item);
    return Results.Created($"/items/{created.Id}", created);
}).RequireAuthorization();

// TOGGLE completion status
app.MapPut("/items/{id}/toggle", async (int id, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(userId, email, name);
    var toggled = await todoService.ToggleAsync(id, userId);
    if (toggled is null)
        return Results.NotFound("Item not found or access denied.");

    return Results.Ok(toggled);
}).RequireAuthorization();

// SHARE a task with another user
app.MapPost("/items/{id}/share", async (int id, ShareRequest request, ClaimsPrincipal user, TodoService todoService) =>
{
    var ownerId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(ownerId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(ownerId, email, name);

    // Verify user owns the task
    var task = await todoService.GetByIdAsync(id, ownerId);
    if (task == null)
        return Results.Forbid();

    if (request.Emails == null || request.Emails.Count == 0)
        return Results.BadRequest("Recipient emails are required.");

    var success = await todoService.ShareTaskAsync(id, ownerId, request.Emails);
    if (!success)
        return Results.BadRequest("Could not share task. Ensure the recipient is on your friends list and you own the task.");

    return Results.Ok(new { message = "Shared successfully" });
}).RequireAuthorization();

// GET users who have access to a shared task
app.MapGet("/items/{id}/shared-users", async (int id, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(userId, email, name);

    // Check if user has access to the task (owns it or has it shared with them)
    var hasAccess = await todoService.HasAccessToTaskAsync(id, userId);
    if (!hasAccess)
        return Results.NotFound("Task not found or access denied.");

    var sharedUsers = await todoService.GetSharedUsersAsync(id, userId);
    return Results.Ok(sharedUsers);
}).RequireAuthorization();

// UPDATE an item title
app.MapPut("/items/{id}", async (int id, UpdateTodoRequest request, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(userId, email, name);
    var updated = await todoService.UpdateItemAsync(id, request.Title, userId);
    if (updated is null)
        return Results.NotFound("Item not found or access denied.");

    return Results.Ok(updated);
}).RequireAuthorization();

// DELETE an item
app.MapDelete("/items/{id}", async (int id, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    var email = GetClaimValue(user, ClaimTypes.Email);
    var name = GetClaimValue(user, ClaimTypes.Name) ?? GetClaimValue(user, "name");
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        return Results.Unauthorized();

    await todoService.EnsureUserAsync(userId, email, name);
    var deleted = await todoService.DeleteAsync(id, userId);
    if (!deleted)
        return Results.NotFound("Item not found or access denied.");

    return Results.NoContent();
}).RequireAuthorization();

// SEARCH for users
app.MapGet("/users/search", async (string q, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        return Results.BadRequest("Query must be at least 2 characters");

    var users = await todoService.SearchUsersAsync(q, userId);
    return Results.Ok(users);
}).RequireAuthorization();

// GET friends list
app.MapGet("/friends", async (ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    var friends = await todoService.GetFriendsAsync(userId);
    return Results.Ok(friends);
}).RequireAuthorization();

// ADD a friend
app.MapPost("/friends", async (AddFriendRequest request, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    if (string.IsNullOrEmpty(request.FriendEmail))
        return Results.BadRequest("Friend email is required");

    var success = await todoService.AddFriendAsync(userId, request.FriendEmail);
    if (!success)
        return Results.BadRequest("Could not add friend");

    return Results.Ok(new { message = "Friend added successfully" });
}).RequireAuthorization();

// REMOVE a friend
app.MapDelete("/friends/{friendEmail}", async (string friendEmail, ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    if (string.IsNullOrEmpty(friendEmail))
        return Results.BadRequest("Friend email is required");

    var success = await todoService.RemoveFriendAsync(userId, friendEmail);
    if (!success)
        return Results.BadRequest("Could not remove friend");

    return Results.NoContent();
}).RequireAuthorization();

// DELETE User Account (Required for Play Store/App Store compliance)
app.MapDelete("/users/me", async (ClaimsPrincipal user, TodoService todoService) =>
{
    var userId = GetClaimValue(user, ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var deleted = await todoService.DeleteUserAccountAsync(userId);
    if (!deleted) return Results.NotFound();

    return Results.NoContent();
}).RequireAuthorization();

app.Run();

static string? FirstConfigured(params string?[] values) =>
    values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

public record ShareRequest(List<string> Emails);
public record AddFriendRequest(string FriendEmail);
public record UpdateTodoRequest(string Title);
