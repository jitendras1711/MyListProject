using System;

namespace backend.Core.Entities;

public class UserFriend
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FriendId { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public TodoUser? User { get; set; }
    public TodoUser? Friend { get; set; }
}