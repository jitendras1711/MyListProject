using System.Collections.Generic;

namespace backend.Core.Entities;

public class TodoUser
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }

    public ICollection<SharedTodo> SharedTodos { get; set; } = new List<SharedTodo>();
    public ICollection<UserFriend> Friends { get; set; } = new List<UserFriend>();
    public ICollection<UserFriend> FriendOf { get; set; } = new List<UserFriend>();
}
