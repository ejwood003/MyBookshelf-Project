namespace MyBookshelf.Server.Models;

/// <summary>
/// Everything the My Books screen needs in a single response: the shelves themselves
/// plus the counts that tell the reader what they own at a glance.
/// </summary>
public class ShelfOverview
{
    public string ReaderName { get; set; } = "Reader";

    public List<Shelf> Shelves { get; set; } = new();

    public CollectionSummary Summary { get; set; } = new();

    public GoalProgress Goal { get; set; } = new();
}

public class Shelf
{
    public ReadingStatus Status { get; set; }

    /// <summary>Reader-facing shelf name, e.g. "Currently Reading".</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>A plain sentence explaining what belongs on this shelf.</summary>
    public string Caption { get; set; } = string.Empty;

    public List<Book> Books { get; set; } = new();
}

public class CollectionSummary
{
    public int TotalBooks { get; set; }

    public int CurrentlyReading { get; set; }

    public int WantToRead { get; set; }

    public int Finished { get; set; }

    /// <summary>Pages left across every book the reader has started.</summary>
    public int PagesInProgress { get; set; }
}

public class GoalProgress
{
    public int Year { get; set; }

    public int TargetBooks { get; set; }

    public int BooksFinished { get; set; }

    public int PercentComplete =>
        TargetBooks <= 0 ? 0 : Math.Clamp((int)Math.Round(BooksFinished * 100.0 / TargetBooks), 0, 100);

    public int BooksRemaining => Math.Max(TargetBooks - BooksFinished, 0);
}
