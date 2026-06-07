namespace backend.Models
{
    public class TodoItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }

        public int? ParentId { get; set; } // Null if it's a top-level task
                                           //public List<TodoItem> SubTasks { get; set; } = new();

        // New: Link task to the Google SubjectId
        public string UserId { get; set; } = string.Empty;

        // Future: For the sharing feature
        // public List<string> CollaboratorIds { get; set; } = new();
        public TodoItem() { }
    }
}
