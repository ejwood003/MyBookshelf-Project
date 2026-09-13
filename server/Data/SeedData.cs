using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Data;

/// <summary>
/// The starting collection a new reader sees. Dates are relative to today so the
/// shelf never looks stale, and the mix spans several genres so the
/// Choose What to Read screen has something interesting to work with.
/// </summary>
public static class SeedData
{
    public static Bookshelf CreateBookshelf()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        DateOnly DaysAgo(int days) => today.AddDays(-days);

        return new Bookshelf
        {
            ReaderName = "Ethan",
            Goal = new ReadingGoal { Year = today.Year, TargetBooks = 20 },
            Books = new List<Book>
            {
                // ---------- Currently reading ----------
                new()
                {
                    Id = "overstory",
                    Title = "The Overstory",
                    Author = "Richard Powers",
                    Genre = "Literary Fiction",
                    PageCount = 502,
                    Status = ReadingStatus.CurrentlyReading,
                    CurrentPage = 214,
                    Blurb = "Nine strangers are drawn together by the trees that outlive them.",
                    Moods = new List<string> { "sweeping", "thought-provoking" },
                    CoverPalette = "moss",
                    DateAdded = DaysAgo(96),
                    DateStarted = DaysAgo(31)
                },
                new()
                {
                    Id = "sweetgrass",
                    Title = "Braiding Sweetgrass",
                    Author = "Robin Wall Kimmerer",
                    Genre = "Nature Writing",
                    PageCount = 390,
                    Status = ReadingStatus.CurrentlyReading,
                    CurrentPage = 88,
                    Blurb = "A botanist braids together Indigenous wisdom and plant science.",
                    Moods = new List<string> { "quiet", "hopeful" },
                    CoverPalette = "sage",
                    DateAdded = DaysAgo(140),
                    DateStarted = DaysAgo(12)
                },

                // ---------- Want to read ----------
                new()
                {
                    Id = "piranesi",
                    Title = "Piranesi",
                    Author = "Susanna Clarke",
                    Genre = "Fantasy",
                    PageCount = 245,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A man keeps careful notes on the endless halls of the House he lives in.",
                    Moods = new List<string> { "quiet", "twisty" },
                    CoverPalette = "indigo",
                    DateAdded = DaysAgo(58)
                },
                new()
                {
                    Id = "remains-day",
                    Title = "The Remains of the Day",
                    Author = "Kazuo Ishiguro",
                    Genre = "Literary Fiction",
                    PageCount = 258,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "An English butler retraces a lifetime of small, careful choices.",
                    Moods = new List<string> { "quiet", "tender" },
                    CoverPalette = "sand",
                    DateAdded = DaysAgo(210)
                },
                new()
                {
                    Id = "klara",
                    Title = "Klara and the Sun",
                    Author = "Kazuo Ishiguro",
                    Genre = "Science Fiction",
                    PageCount = 303,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "An artificial friend watches the family she hopes will choose her.",
                    Moods = new List<string> { "tender", "thought-provoking" },
                    CoverPalette = "amber",
                    DateAdded = DaysAgo(44)
                },
                new()
                {
                    Id = "tomorrow",
                    Title = "Tomorrow, and Tomorrow, and Tomorrow",
                    Author = "Gabrielle Zevin",
                    Genre = "Contemporary Fiction",
                    PageCount = 401,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "Two friends spend thirty years building games and missing each other.",
                    Moods = new List<string> { "immersive", "tender" },
                    CoverPalette = "teal",
                    DateAdded = DaysAgo(27)
                },
                new()
                {
                    Id = "thursday-club",
                    Title = "The Thursday Murder Club",
                    Author = "Richard Osman",
                    Genre = "Mystery",
                    PageCount = 382,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "Four retirees meet weekly to solve cold cases, then get a warm one.",
                    Moods = new List<string> { "funny", "twisty" },
                    CoverPalette = "rust",
                    DateAdded = DaysAgo(19)
                },
                new()
                {
                    Id = "gentleman-moscow",
                    Title = "A Gentleman in Moscow",
                    Author = "Amor Towles",
                    Genre = "Historical Fiction",
                    PageCount = 462,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A count is sentenced to house arrest in a grand hotel for thirty years.",
                    Moods = new List<string> { "cozy", "sweeping" },
                    CoverPalette = "plum",
                    DateAdded = DaysAgo(163)
                },
                new()
                {
                    Id = "sea-tranquility",
                    Title = "Sea of Tranquility",
                    Author = "Emily St. John Mandel",
                    Genre = "Science Fiction",
                    PageCount = 255,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A strange note of music repeats across five centuries.",
                    Moods = new List<string> { "quiet", "twisty" },
                    CoverPalette = "slate",
                    DateAdded = DaysAgo(9)
                },
                new()
                {
                    Id = "educated",
                    Title = "Educated",
                    Author = "Tara Westover",
                    Genre = "Memoir",
                    PageCount = 334,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A woman raised off the grid in Idaho teaches herself all the way to Cambridge.",
                    Moods = new List<string> { "unsettling", "thought-provoking" },
                    CoverPalette = "clay",
                    DateAdded = DaysAgo(122)
                },
                new()
                {
                    Id = "convenience-store",
                    Title = "Convenience Store Woman",
                    Author = "Sayaka Murata",
                    Genre = "Literary Fiction",
                    PageCount = 163,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "Keiko has worked the same shop for eighteen years and would like everyone to stop asking why.",
                    Moods = new List<string> { "funny", "unsettling" },
                    CoverPalette = "ink",
                    DateAdded = DaysAgo(73)
                },
                new()
                {
                    Id = "thinking-systems",
                    Title = "Thinking in Systems",
                    Author = "Donella H. Meadows",
                    Genre = "Nonfiction",
                    PageCount = 240,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A primer on why complicated problems push back when you poke them.",
                    Moods = new List<string> { "brainy", "thought-provoking" },
                    CoverPalette = "cocoa",
                    DateAdded = DaysAgo(35)
                },
                new()
                {
                    Id = "cerulean-sea",
                    Title = "The House in the Cerulean Sea",
                    Author = "TJ Klune",
                    Genre = "Fantasy",
                    PageCount = 396,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A by-the-book caseworker is sent to inspect an orphanage of magical children.",
                    Moods = new List<string> { "cozy", "hopeful" },
                    CoverPalette = "teal",
                    DateAdded = DaysAgo(51)
                },
                new()
                {
                    Id = "hobbit",
                    Title = "The Hobbit",
                    Author = "J.R.R. Tolkien",
                    Genre = "Fantasy",
                    PageCount = 310,
                    Status = ReadingStatus.WantToRead,
                    Blurb = "A comfortable hobbit is talked into an extremely uncomfortable adventure.",
                    Moods = new List<string> { "adventurous", "cozy" },
                    CoverPalette = "moss",
                    DateAdded = DaysAgo(365)
                },

                // ---------- Finished ----------
                new()
                {
                    Id = "hail-mary",
                    Title = "Project Hail Mary",
                    Author = "Andy Weir",
                    Genre = "Science Fiction",
                    PageCount = 476,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 476,
                    Rating = 5,
                    Blurb = "A lone astronaut wakes with amnesia and one chance to save the sun.",
                    Moods = new List<string> { "adventurous", "brainy" },
                    CoverPalette = "amber",
                    DateAdded = DaysAgo(260),
                    DateStarted = DaysAgo(78),
                    DateFinished = DaysAgo(64)
                },
                new()
                {
                    Id = "circe",
                    Title = "Circe",
                    Author = "Madeline Miller",
                    Genre = "Mythology",
                    PageCount = 393,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 393,
                    Rating = 5,
                    Blurb = "The witch of Aiaia tells her own version of the myth.",
                    Moods = new List<string> { "sweeping", "immersive" },
                    CoverPalette = "plum",
                    DateAdded = DaysAgo(300),
                    DateStarted = DaysAgo(118),
                    DateFinished = DaysAgo(99)
                },
                new()
                {
                    Id = "station-eleven",
                    Title = "Station Eleven",
                    Author = "Emily St. John Mandel",
                    Genre = "Science Fiction",
                    PageCount = 333,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 333,
                    Rating = 5,
                    Blurb = "A travelling symphony keeps Shakespeare alive after the world ends.",
                    Moods = new List<string> { "quiet", "hopeful" },
                    CoverPalette = "slate",
                    DateAdded = DaysAgo(330),
                    DateStarted = DaysAgo(155),
                    DateFinished = DaysAgo(139)
                },
                new()
                {
                    Id = "night-circus",
                    Title = "The Night Circus",
                    Author = "Erin Morgenstern",
                    Genre = "Fantasy",
                    PageCount = 387,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 387,
                    Rating = 4,
                    Blurb = "Two magicians are bound to a duel staged inside a circus that opens at nightfall.",
                    Moods = new List<string> { "immersive", "cozy" },
                    CoverPalette = "ink",
                    DateAdded = DaysAgo(280),
                    DateStarted = DaysAgo(196),
                    DateFinished = DaysAgo(175)
                },
                new()
                {
                    Id = "never-let-me-go",
                    Title = "Never Let Me Go",
                    Author = "Kazuo Ishiguro",
                    Genre = "Literary Fiction",
                    PageCount = 288,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 288,
                    Rating = 5,
                    Blurb = "Three friends slowly understand what their boarding school was for.",
                    Moods = new List<string> { "quiet", "unsettling" },
                    CoverPalette = "sand",
                    DateAdded = DaysAgo(240),
                    DateStarted = DaysAgo(228),
                    DateFinished = DaysAgo(214)
                },
                new()
                {
                    Id = "anxious-people",
                    Title = "Anxious People",
                    Author = "Fredrik Backman",
                    Genre = "Contemporary Fiction",
                    PageCount = 342,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 342,
                    Rating = 4,
                    Blurb = "A failed bank robbery turns into the world's most forgiving hostage situation.",
                    Moods = new List<string> { "funny", "tender" },
                    CoverPalette = "rust",
                    DateAdded = DaysAgo(190),
                    DateStarted = DaysAgo(44),
                    DateFinished = DaysAgo(33)
                },
                new()
                {
                    Id = "midnight-library",
                    Title = "The Midnight Library",
                    Author = "Matt Haig",
                    Genre = "Contemporary Fiction",
                    PageCount = 288,
                    Status = ReadingStatus.Finished,
                    CurrentPage = 288,
                    Rating = 3,
                    Blurb = "Between life and death is a library of every life you didn't live.",
                    Moods = new List<string> { "hopeful", "thought-provoking" },
                    CoverPalette = "indigo",
                    DateAdded = DaysAgo(150),
                    DateStarted = DaysAgo(21),
                    DateFinished = DaysAgo(14)
                }
            }
        };
    }
}
