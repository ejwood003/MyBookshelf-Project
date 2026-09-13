using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Services;

/// <summary>
/// Turns a Want to Read shelf into a short, explained shortlist.
///
/// A shelf can only show a reader what they own. The job here is to narrow that down to a
/// handful of books and say, in plain language, why each one is worth starting today.
/// </summary>
public class RecommendationService : IRecommendationService
{
    /// <summary>How long a "save for later" keeps a book out of the running.</summary>
    private static readonly TimeSpan SkipCooldown = TimeSpan.FromHours(12);

    private readonly IBookshelfRepository _repository;

    public RecommendationService(IBookshelfRepository repository) => _repository = repository;

    public RecommendationSet GetRecommendations(PickerMood mood, int count = 3)
    {
        var books = _repository.GetBooks();
        var unread = books.Where(b => b.Status == ReadingStatus.WantToRead).ToList();

        var result = new RecommendationSet
        {
            Mood = mood,
            Prompt = PromptFor(mood),
            WantToReadCount = unread.Count
        };

        if (unread.Count == 0)
        {
            result.Prompt = "There's nothing on your Want to Read shelf yet. Add a book and we'll help you start it.";
            return result;
        }

        var taste = BuildTasteProfile(books);
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(DateTime.Today);

        // Books the reader just passed on drop to the bottom rather than disappearing,
        // so a short shelf still fills all three slots.
        var scored = unread
            .Select(book => new
            {
                Book = book,
                Score = Score(book, mood, taste, today) - SkipPenalty(book, now)
            })
            .OrderByDescending(entry => entry.Score)
            .Take(count)
            .ToList();

        // Reasons are assigned in score order, and each one is used at most once per set.
        // Three cards that all say "by an author you loved" would not help anyone choose.
        var usedReasons = new HashSet<string>();
        result.Picks = scored
            .Select(entry => BuildRecommendation(entry.Book, mood, taste, today, usedReasons))
            .ToList();

        return result;
    }

    // ---------------------------------------------------------------- scoring

    private static double Score(Book book, PickerMood mood, TasteProfile taste, DateOnly today)
    {
        // A small jitter keeps "Show me another set" from returning an identical list
        // when several books score the same.
        var jitter = Random.Shared.NextDouble() * 4;
        var daysWaiting = today.DayNumber - book.DateAdded.DayNumber;

        return mood switch
        {
            // Shorter is better, with a firm preference for anything under ~250 pages.
            PickerMood.ShortRead => 400 - book.PageCount + jitter,

            // Reward authors the reader has already enjoyed, then familiar genres.
            PickerMood.Familiar =>
                (taste.LovedBookByAuthor.ContainsKey(book.Author) ? 60 : 0)
                + taste.FinishedByGenre.GetValueOrDefault(book.Genre) * 18
                + jitter,

            // Reward the genres the reader has spent the least time in.
            PickerMood.Surprise =>
                60 - taste.FinishedByGenre.GetValueOrDefault(book.Genre) * 20
                + (taste.LovedBookByAuthor.ContainsKey(book.Author) ? -15 : 10)
                + jitter,

            // Balanced: books that have waited a while, are a comfortable length,
            // and lean towards genres the reader tends to rate highly.
            _ => Math.Min(daysWaiting / 6.0, 40)
                 + LengthComfort(book.PageCount)
                 + taste.FinishedByGenre.GetValueOrDefault(book.Genre) * 6
                 + jitter
        };
    }

    /// <summary>Peaks around 300 pages — long enough to sink into, short enough to finish.</summary>
    private static double LengthComfort(int pageCount) =>
        Math.Max(0, 30 - Math.Abs(pageCount - 300) / 10.0);

    private static double SkipPenalty(Book book, DateTime now) =>
        book.LastSkippedAt is { } skipped && now - skipped < SkipCooldown ? 1000 : 0;

    // ---------------------------------------------------------------- reasons

    private static Recommendation BuildRecommendation(
        Book book, PickerMood mood, TasteProfile taste, DateOnly today, HashSet<string> usedReasons)
    {
        var candidates = BuildReasons(book, mood, taste, today);

        // Take the strongest reason that hasn't already been used in this set; the last
        // candidate is always book-specific, so there is guaranteed to be something left.
        var reason = candidates.FirstOrDefault(c => !usedReasons.Contains(c.Key)) ?? candidates[^1];
        usedReasons.Add(reason.Key);

        return new Recommendation
        {
            Book = book,
            ReasonHeadline = reason.Headline,
            ReasonDetail = reason.Detail,
            TimeEstimate = DescribeDuration(book.MinutesRemaining)
        };
    }

    private record Reason(string Key, string Headline, string Detail);

    /// <summary>
    /// Every true thing worth saying about this book, strongest first. A reason the reader
    /// recognises as accurate is what makes the shortlist trustworthy.
    /// </summary>
    private static List<Reason> BuildReasons(Book book, PickerMood mood, TasteProfile taste, DateOnly today)
    {
        var duration = DescribeDuration(book.MinutesRemaining);
        var daysWaiting = today.DayNumber - book.DateAdded.DayNumber;
        var genreLower = book.Genre.ToLowerInvariant();
        var finishedInGenre = taste.FinishedByGenre.GetValueOrDefault(book.Genre);
        var reasons = new List<Reason>();

        if (mood == PickerMood.Surprise)
        {
            reasons.Add(finishedInGenre == 0
                ? new Reason($"genre-new:{book.Genre}", "A genre you haven't tried",
                    $"Nothing in {book.Genre} has made it off your shelf yet. This one is {duration}.")
                : new Reason($"genre-light:{book.Genre}", "A change of pace",
                    $"You've only finished {finishedInGenre} {genreLower} book{(finishedInGenre == 1 ? "" : "s")}, so this would be a shift."));
        }
        else if (taste.LovedBookByAuthor.TryGetValue(book.Author, out var loved))
        {
            reasons.Add(new Reason($"author:{book.Author}", "By an author you loved",
                $"You gave {loved.Title} {Stars(loved.Rating)}, and this is {book.Author} again."));
        }

        if (mood == PickerMood.ShortRead)
        {
            // The headline is pitched at the actual length so three short books don't
            // all come back saying exactly the same thing.
            var headline = book.PageCount switch
            {
                < 200 => "An evening or two",
                < 280 => "Finishes quickly",
                _ => "Shorter than most of your shelf"
            };

            reasons.Add(new Reason($"short:{book.Id}", headline,
                $"{book.PageCount} pages, {duration} — one of the quickest things waiting on your shelf."));
        }

        if (taste.TopGenre is { } topGenre && book.Genre == topGenre)
        {
            reasons.Add(new Reason("top-genre", "Your most-read genre",
                $"{book.Genre} is what you finish most — {taste.FinishedByGenre[topGenre]} of them so far."));
        }

        if (finishedInGenre == 0 && mood != PickerMood.Surprise)
        {
            reasons.Add(new Reason($"genre-new:{book.Genre}", "A corner of the shelf you haven't read",
                $"You own it but haven't finished any {genreLower} yet."));
        }

        if (daysWaiting >= 90)
        {
            reasons.Add(new Reason("waiting", "Waiting the longest",
                $"It's been on your shelf since {book.DateAdded:MMMM yyyy}. {duration.StartWithCapital()} would clear it."));
        }

        if (book.PageCount <= 260)
        {
            reasons.Add(new Reason("short-generic", "A short one",
                $"{book.PageCount} pages, {duration} — easy to actually finish this week."));
        }

        if (book.Moods.Count > 0)
        {
            reasons.Add(new Reason($"mood:{book.Moods[0]}", $"Something {book.Moods[0]}",
                $"You shelved this one as {string.Join(" and ", book.Moods)}. {duration.StartWithCapital()}."));
        }

        // Always last, and always unique, so the list can never come up empty.
        reasons.Add(new Reason($"default:{book.Id}", "Ready when you are",
            $"{book.PageCount} pages of {genreLower}, {duration}."));

        return reasons;
    }

    private static string PromptFor(PickerMood mood) => mood switch
    {
        PickerMood.ShortRead => "Books you could realistically finish soon.",
        PickerMood.Familiar => "More of what you already know you love.",
        PickerMood.Surprise => "Something different from your usual shelves.",
        _ => "Three books from your shelf, narrowed down for you."
    };

    // ---------------------------------------------------------------- helpers

    private static string Stars(int? rating) =>
        rating is null ? "a good review" : $"{rating} star{(rating == 1 ? "" : "s")}";

    /// <summary>Turns minutes into something a reader can weigh against their evening.</summary>
    private static string DescribeDuration(int minutes)
    {
        if (minutes < 60)
            return "under an hour";

        var halves = Math.Round(minutes / 30.0) / 2;
        var whole = (int)Math.Floor(halves);
        var hasHalf = halves - whole >= 0.5;

        if (whole == 0)
            return "about half an hour";

        return hasHalf ? $"about {whole}\u00bd hours" : $"about {whole} hour{(whole == 1 ? "" : "s")}";
    }

    private static TasteProfile BuildTasteProfile(IReadOnlyList<Book> books)
    {
        var finished = books.Where(b => b.Status == ReadingStatus.Finished).ToList();

        var finishedByGenre = finished
            .GroupBy(b => b.Genre)
            .ToDictionary(g => g.Key, g => g.Count());

        // For each author, remember the single book the reader rated highest (4+ stars).
        var lovedByAuthor = finished
            .Where(b => b.Rating >= 4)
            .GroupBy(b => b.Author)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(b => b.Rating).First());

        var topGenre = finishedByGenre
            .OrderByDescending(pair => pair.Value)
            .Select(pair => pair.Key)
            .FirstOrDefault();

        return new TasteProfile(finishedByGenre, lovedByAuthor, topGenre);
    }

    private record TasteProfile(
        Dictionary<string, int> FinishedByGenre,
        Dictionary<string, Book> LovedBookByAuthor,
        string? TopGenre);
}

internal static class StringCasing
{
    public static string StartWithCapital(this string value) =>
        string.IsNullOrEmpty(value) ? value : char.ToUpperInvariant(value[0]) + value[1..];
}
