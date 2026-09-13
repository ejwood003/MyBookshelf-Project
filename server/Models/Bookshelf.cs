namespace MyBookshelf.Server.Models;

/// <summary>
/// Everything that gets persisted for a reader: their books and their goal.
/// </summary>
public class Bookshelf
{
    public string ReaderName { get; set; } = "Reader";

    public ReadingGoal Goal { get; set; } = new();

    public List<Book> Books { get; set; } = new();
}
