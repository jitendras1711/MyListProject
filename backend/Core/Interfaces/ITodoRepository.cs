using backend.Core.Entities;

namespace backend.Core.Interfaces;

public interface ITodoRepository
{
    Task<List<TodoItem>> GetForUserAsync(string userId, int? parentId);
    Task<TodoItem?> GetByIdAsync(int id, string userId);
    Task<bool> HasAccessToTaskAsync(int taskId, string userId);
    Task<TodoItem> AddAsync(TodoItem item);
    Task<TodoItem?> UpdateAsync(int id, string title, string userId);
    Task<TodoItem?> ToggleCompleteAsync(int id, string userId);
    Task<bool> DeleteAsync(int id, string userId);

    Task<List<TodoItem>> GetDescendantItemsAsync(int rootId);
    Task<bool> AddSharedTodosAsync(IEnumerable<int> todoIds, string sharedWithUserId, string sharedByUserId);

    Task<TodoUser?> GetUserByEmailAsync(string email);
    Task<TodoUser?> GetUserByIdAsync(string userId);
    Task<TodoUser> AddOrUpdateUserAsync(TodoUser user);
    Task<SharedTodo?> GetSharedTodoAsync(int todoId, string sharedWithUserId);
    Task<bool> AddSharedTodoAsync(int todoId, string sharedWithUserId, string sharedByUserId);
    Task<List<TodoUser>> GetSharedUsersAsync(int todoId, string excludeUserId);

    Task<List<TodoUser>> SearchUsersAsync(string query, string currentUserId);
    Task<List<TodoUser>> GetFriendsAsync(string userId);
    Task<bool> AddFriendAsync(string userId, string friendId);
    Task<bool> RemoveFriendAsync(string userId, string friendId);
    Task<bool> DeleteUserAsync(string userId);
}
