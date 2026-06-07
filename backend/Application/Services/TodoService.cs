using backend.Core.Entities;
using backend.Core.Interfaces;

namespace backend.Application.Services;

public class TodoService
{
    private readonly ITodoRepository _repo;

    public TodoService(ITodoRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<TodoItem>> GetItemsAsync(string userId, int? parentId) => await _repo.GetForUserAsync(userId, parentId);
    public async Task<TodoItem?> GetByIdAsync(int id, string userId) => await _repo.GetByIdAsync(id, userId);

    public async Task<TodoUser> EnsureUserAsync(string userId, string email, string? name = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required", nameof(userId));
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required", nameof(email));

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existing = await _repo.GetUserByIdAsync(userId);
        if (existing is not null)
        {
            existing.Email = normalizedEmail;
            if (!string.IsNullOrWhiteSpace(name))
                existing.Name = name.Trim();
            return await _repo.AddOrUpdateUserAsync(existing);
        }

        var user = new TodoUser
        {
            Id = userId,
            Email = normalizedEmail,
            Name = name?.Trim(),
        };

        return await _repo.AddOrUpdateUserAsync(user);
    }

    public async Task<TodoItem> AddItemAsync(TodoItem item)
    {
        if (string.IsNullOrWhiteSpace(item.Title))
            throw new ArgumentException("Title is required", nameof(item.Title));

        var addedItem = await _repo.AddAsync(item);

        // If this is a subtask, share it with all users who have access to the parent task
        if (addedItem.ParentId.HasValue)
        {
            var sharedUsers = await _repo.GetSharedUsersAsync(addedItem.ParentId.Value, addedItem.UserId);
            foreach (var user in sharedUsers)
            {
                await _repo.AddSharedTodosAsync(new[] { addedItem.Id }, user.Id, addedItem.UserId);
            }
        }

        return addedItem;
    }

    public async Task<TodoItem?> UpdateItemAsync(int id, string title, string userId)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required", nameof(title));

        return await _repo.UpdateAsync(id, title, userId);
    }

    public async Task<TodoItem?> ToggleAsync(int id, string userId) => await _repo.ToggleCompleteAsync(id, userId);

    public async Task<bool> ShareTaskAsync(int id, string ownerId, List<string> recipientEmails)
    {
        if (recipientEmails == null || recipientEmails.Count == 0)
            return false;

        var task = await _repo.GetByIdAsync(id, ownerId);
        if (task is null)
            return false;

        var friendUsers = await _repo.GetFriendsAsync(ownerId);
        var friendEmailSet = new HashSet<string>(friendUsers
            .Select(f => f.Email?.Trim().ToLowerInvariant())
            .Where(e => !string.IsNullOrEmpty(e))
            .Select(e => e!));

        var normalizedRecipients = recipientEmails
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(email => email.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        if (normalizedRecipients.Count == 0)
            return false;

        if (!normalizedRecipients.All(friendEmailSet.Contains))
            return false;

        var descendantItems = await _repo.GetDescendantItemsAsync(id);
        var todoIds = new List<int> { id };
        todoIds.AddRange(descendantItems.Select(item => item.Id));

        bool allShared = true;
        foreach (var email in normalizedRecipients)
        {
            var recipient = await _repo.GetUserByEmailAsync(email);
            if (recipient is null || recipient.Id == ownerId)
            {
                allShared = false;
                continue;
            }

            var success = await _repo.AddSharedTodosAsync(todoIds, recipient.Id, ownerId);
            if (!success)
                allShared = false;
        }

        return allShared;
    }

    public async Task<List<TodoUser>> GetSharedUsersAsync(int todoId, string excludeUserId) => await _repo.GetSharedUsersAsync(todoId, excludeUserId);

    public async Task<bool> HasAccessToTaskAsync(int taskId, string userId) => await _repo.HasAccessToTaskAsync(taskId, userId);

    public async Task<bool> DeleteAsync(int id, string userId) => await _repo.DeleteAsync(id, userId);

    public async Task<List<TodoUser>> SearchUsersAsync(string query, string currentUserId) => await _repo.SearchUsersAsync(query, currentUserId);

    public async Task<List<TodoUser>> GetFriendsAsync(string userId) => await _repo.GetFriendsAsync(userId);

    public async Task<bool> AddFriendAsync(string userId, string friendEmail)
    {
        if (string.IsNullOrWhiteSpace(friendEmail))
            return false;

        var friend = await _repo.GetUserByEmailAsync(friendEmail.Trim().ToLowerInvariant());
        if (friend is null || friend.Id == userId)
            return false;

        return await _repo.AddFriendAsync(userId, friend.Id);
    }

    public async Task<bool> RemoveFriendAsync(string userId, string friendEmail)
    {
        if (string.IsNullOrWhiteSpace(friendEmail))
            return false;

        var friend = await _repo.GetUserByEmailAsync(friendEmail.Trim().ToLowerInvariant());
        if (friend is null)
            return false;

        return await _repo.RemoveFriendAsync(userId, friend.Id);
    }

    public async Task<bool> DeleteUserAccountAsync(string userId) => await _repo.DeleteUserAsync(userId);
}
