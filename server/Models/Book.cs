using System.Text.Json.Serialization;

namespace MyBookshelf.Server.Models;

/// <summary>
/// A single book in the reader's personal collection.
/// </summary>
public class Book
{
    /// <summary>Average minutes an unhurried reader spends on one page.</summary>
    public const double MinutesPerPage = 1.2;

    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string Genre { get; set; } = string.Empty;

    public int PageCount { get; set; }

    public ReadingStatus Status { get; set; } = ReadingStatus.WantToRead;

    /// <summary>How far into the book the reader is. Always 0 for unstarted books.</summary>
    public int CurrentPage { get; set; }

    /// <summary>One or two sentences to help the reader remember why they bought it.</summary>
    public string Blurb { get; set; } = string.Empty;

    /// <summary>Short descriptors ("cozy", "twisty") used to match a book to the reader's mood.</summary>
    public List<string> Moods { get; set; } = new();

    /// <summary>Name of the colour theme the front end uses to render the cover.</summary>
    public string CoverPalette { get; set; } = "clay";

    public DateOnly DateAdded { get; set; }

    public DateOnly? DateStarted { get; set; }

    public DateOnly? DateFinished { get; set; }

    /// <summary>1-5 stars, only set once a book is finished.</summary>
    public int? Rating { get; set; }

    /// <summary>
    /// Set when the reader chooses "Save for later" on the Choose What to Read screen so the
    /// same book is not offered again straight away.
    /// </summary>
    public DateTime? LastSkippedAt { get; set; }

    [JsonInclude]
    public int ProgressPercent =>
        PageCount <= 0 ? 0 : Math.Clamp((int)Math.Round(CurrentPage * 100.0 / PageCount), 0, 100);

    [JsonInclude]
    public int PagesRemaining => Math.Max(PageCount - CurrentPage, 0);

    /// <summary>Estimated time left, used to answer "do I have time for this book?".</summary>
    [JsonInclude]
    public int MinutesRemaining => (int)Math.Round(PagesRemaining * MinutesPerPage);
}
