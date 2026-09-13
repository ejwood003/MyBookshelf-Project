namespace MyBookshelf.Server.Models;

/// <summary>
/// The lens the reader is using to pick their next book on the Choose What to Read screen.
/// </summary>
public enum PickerMood
{
    /// <summary>A balanced mix — the default when the reader has no particular preference.</summary>
    AnyMood = 0,

    /// <summary>Short books that fit in the time the reader actually has.</summary>
    ShortRead = 1,

    /// <summary>More of what they already know they love.</summary>
    Familiar = 2,

    /// <summary>Something outside their usual shelves.</summary>
    Surprise = 3
}

/// <summary>
/// One candidate book plus the reason it is being suggested. The reason is the whole
/// point of the screen: a bare shelf cannot tell you why a book suits you today.
/// </summary>
public class Recommendation
{
    public Book Book { get; set; } = new();

    /// <summary>Short headline shown on the card, e.g. "Finishes in an evening".</summary>
    public string ReasonHeadline { get; set; } = string.Empty;

    /// <summary>A full sentence explaining the match in the reader's own terms.</summary>
    public string ReasonDetail { get; set; } = string.Empty;

    /// <summary>Human phrasing of the time commitment, e.g. "about 5 hours".</summary>
    public string TimeEstimate { get; set; } = string.Empty;
}

public class RecommendationSet
{
    public PickerMood Mood { get; set; }

    /// <summary>A sentence framing the whole set, shown above the cards.</summary>
    public string Prompt { get; set; } = string.Empty;

    public List<Recommendation> Picks { get; set; } = new();

    /// <summary>How many unread books exist in total, so the reader knows what is not shown.</summary>
    public int WantToReadCount { get; set; }
}
