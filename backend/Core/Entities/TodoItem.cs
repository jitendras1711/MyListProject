using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Core.Entities;

public class TodoItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public int? ParentId { get; set; }
    public string UserId { get; set; } = string.Empty;

    [NotMapped]
    public int SharedCount { get; set; }

    [NotMapped]
    public bool IsOwnedByCurrentUser { get; set; }

    [NotMapped]
    public bool IsSharedWithMe { get; set; }

    [NotMapped]
    public string? CreatedByName { get; set; }}