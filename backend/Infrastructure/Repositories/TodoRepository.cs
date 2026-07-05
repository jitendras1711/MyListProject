using backend.Core.Entities;
using backend.Core.Interfaces;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Repositories;

public class TodoRepository : ITodoRepository
{
    private readonly AppDbContext _db;

    public TodoRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<TodoItem>> GetForUserAsync(string userId, int? parentId)
    {
        var sharedItemIds = _db.SharedTodos
            .Where(s => s.SharedWithUserId == userId)
            .Select(s => s.TodoItemId);

        var itemsQuery = _db.Items
            .Where(i => i.ParentId == parentId && (i.UserId == userId || sharedItemIds.Contains(i.Id)))
            .OrderByDescending(i => i.Id);

        return await itemsQuery
            .Select(i => new TodoItem
            {
                Id = i.Id,
                Title = i.Title,
                IsCompleted = i.IsCompleted,
                ParentId = i.ParentId,
                UserId = i.UserId,
                SharedCount = _db.SharedTodos.Count(s => s.TodoItemId == i.Id),
                IsOwnedByCurrentUser = i.UserId == userId,
                IsSharedWithMe = i.UserId != userId && sharedItemIds.Contains(i.Id),
                CreatedByName = _db.Users.Where(u => u.Id == i.UserId).Select(u => u.Name).FirstOrDefault(),
            })
            .ToListAsync();
    }

    public async Task<TodoItem?> GetByIdAsync(int id, string userId)
    {
        return await _db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    }

    public async Task<TodoItem> AddAsync(TodoItem item)
    {
        _db.Items.Add(item);
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<TodoItem?> UpdateAsync(int id, string title, string userId)
    {
        var item = await GetByIdAsync(id, userId);
        if (item is null || item.UserId != userId) return null;

        item.Title = title;
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<TodoItem?> ToggleCompleteAsync(int id, string userId)
    {
        var item = await GetByIdAsync(id, userId);
        if (item is null) return null;

        item.IsCompleted = !item.IsCompleted;
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<bool> DeleteAsync(int id, string userId)
    {
        var item = await GetByIdAsync(id, userId);
        if (item is null) return false;

        _db.Items.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<TodoItem>> GetDescendantItemsAsync(int rootId)
    {
        var descendants = new List<TodoItem>();
        var stack = new Stack<int>();
        stack.Push(rootId);

        while (stack.Count > 0)
        {
            var currentId = stack.Pop();
            var children = await _db.Items.Where(i => i.ParentId == currentId).ToListAsync();
            if (children.Count == 0) continue;

            descendants.AddRange(children);
            foreach (var child in children)
            {
                stack.Push(child.Id);
            }
        }

        return descendants;
    }

    public async Task<bool> AddSharedTodosAsync(IEnumerable<int> todoIds, string sharedWithUserId, string sharedByUserId)
    {
        var ids = todoIds.Distinct().ToList();
        var existingSharedIds = await _db.SharedTodos
            .Where(s => ids.Contains(s.TodoItemId) && s.SharedWithUserId == sharedWithUserId)
            .Select(s => s.TodoItemId)
            .ToListAsync();

        var newShares = ids
            .Where(id => !existingSharedIds.Contains(id))
            .Select(id => new SharedTodo
            {
                TodoItemId = id,
                SharedWithUserId = sharedWithUserId,
                SharedByUserId = sharedByUserId,
                SharedAt = DateTime.UtcNow,
            })
            .ToList();

        if (newShares.Count > 0)
        {
            _db.SharedTodos.AddRange(newShares);
            await _db.SaveChangesAsync();
        }

        return true;
    }

    public async Task<TodoUser?> GetUserByEmailAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
    }

    public async Task<TodoUser?> GetUserByIdAsync(string userId)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<TodoUser> AddOrUpdateUserAsync(TodoUser user)
    {
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
        if (existing is null)
        {
            _db.Users.Add(user);
        }
        else
        {
            existing.Email = user.Email;
            existing.Name = user.Name;
        }

        await _db.SaveChangesAsync();
        return existing ?? user;
    }

    public async Task<SharedTodo?> GetSharedTodoAsync(int todoId, string sharedWithUserId)
    {
        return await _db.SharedTodos.FirstOrDefaultAsync(s => s.TodoItemId == todoId && s.SharedWithUserId == sharedWithUserId);
    }

    public async Task<bool> AddSharedTodoAsync(int todoId, string sharedWithUserId, string sharedByUserId)
    {
        var existing = await GetSharedTodoAsync(todoId, sharedWithUserId);
        if (existing is not null)
            return true;

        var shared = new SharedTodo
        {
            TodoItemId = todoId,
            SharedWithUserId = sharedWithUserId,
            SharedByUserId = sharedByUserId,
            SharedAt = DateTime.UtcNow,
        };

        _db.SharedTodos.Add(shared);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<TodoUser>> GetSharedUsersAsync(int todoId, string excludeUserId)
    {
        // Get the task owner
        var task = await _db.Items
            .Where(i => i.Id == todoId)
            .Select(i => new { i.UserId })
            .FirstOrDefaultAsync();

        if (task == null)
            return new List<TodoUser>();

        var owner = await _db.Users.FirstOrDefaultAsync(u => u.Id == task.UserId);
        if (owner == null)
            return new List<TodoUser>();

        var users = new List<TodoUser>();

        // Add owner if not the current user
        if (task.UserId != excludeUserId)
        {
            users.Add(owner);
        }

        // Add shared users (excluding the current user)
        var sharedUsers = await _db.SharedTodos
            .Where(s => s.TodoItemId == todoId && s.SharedWithUserId != excludeUserId)
            .Select(s => s.SharedWithUser!)
            .ToListAsync();

        users.AddRange(sharedUsers);
        return users;
    }

    public async Task<bool> HasAccessToTaskAsync(int taskId, string userId)
    {
        // Check if user owns the task
        var ownedTask = await _db.Items.FirstOrDefaultAsync(i => i.Id == taskId && i.UserId == userId);
        if (ownedTask is not null)
            return true;

        // Check if task is shared with the user
        var sharedTask = await _db.SharedTodos.FirstOrDefaultAsync(s => s.TodoItemId == taskId && s.SharedWithUserId == userId);
        return sharedTask is not null;
    }

    public async Task<List<TodoUser>> SearchUsersAsync(string query, string currentUserId)
    {
        var normalizedQuery = query.Trim().ToLowerInvariant();
        return await _db.Users
            .Where(u => u.Id != currentUserId && u.Email.ToLower().Contains(normalizedQuery))
            .ToListAsync();
    }

    public async Task<List<TodoUser>> GetFriendsAsync(string userId)
    {
        return await _db.UserFriends
            .Where(uf => uf.UserId == userId)
            .Select(uf => uf.Friend!)
            .ToListAsync();
    }

    public async Task<bool> AddFriendAsync(string userId, string friendId)
    {
        if (userId == friendId) return false;

        var existing = await _db.UserFriends
            .FirstOrDefaultAsync(uf => uf.UserId == userId && uf.FriendId == friendId);
        if (existing is not null) return true;

        var friend = new UserFriend
        {
            UserId = userId,
            FriendId = friendId,
            AddedAt = DateTime.UtcNow,
        };

        _db.UserFriends.Add(friend);

        var reciprocal = new UserFriend
        {
            UserId = friendId,
            FriendId = userId,
            AddedAt = DateTime.UtcNow,
        };

        _db.UserFriends.Add(reciprocal);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveFriendAsync(string userId, string friendId)
    {
        var friend = await _db.UserFriends
            .FirstOrDefaultAsync(uf => uf.UserId == userId && uf.FriendId == friendId);
        if (friend is null) return false;

        _db.UserFriends.Remove(friend);

        var reciprocal = await _db.UserFriends
            .FirstOrDefaultAsync(uf => uf.UserId == friendId && uf.FriendId == userId);
        if (reciprocal is not null)
        {
            _db.UserFriends.Remove(reciprocal);
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        // Due to cascade delete settings in EF Core (if configured), 
        // removing the user should remove their items, friends, and shares.
        _db.Users.Remove(user);
        
        await _db.SaveChangesAsync();
        return true;
    }
}
