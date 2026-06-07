using System;

namespace backend.Core.Entities;

public class SharedTodo
{
    public int Id { get; set; }
    public int TodoItemId { get; set; }
    public string SharedWithUserId { get; set; } = string.Empty;
    public string SharedByUserId { get; set; } = string.Empty;
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

    public TodoItem? TodoItem { get; set; }
    public TodoUser? SharedWithUser { get; set; }
}
