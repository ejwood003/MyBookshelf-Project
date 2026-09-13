using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Services;

public class BookshelfService : IBookshelfService
{
    private readonly IBookshelfRepository _repository;

    public BookshelfService(IBookshelfRepository repository) => _repository = repository;

    public ShelfOverview GetOverview()
    {
        var bookshelf = _repository.GetBookshelf();
        var books = _repository.GetBooks();

        return new ShelfOverview
        {
            ReaderName = bookshelf.ReaderName,
            Shelves = new List<Shelf>
            {
                BuildShelf(books, ReadingStatus.CurrentlyReading, "Currently Reading", "Open right now — pick up where you left off."),
                BuildShelf(books, ReadingStatus.WantToRead, "Want to Read", "Bought, borrowed, and waiting for their turn."),
                BuildShelf(books, ReadingStatus.Finished, "Finished", "Read and shelved. Your year so far.")
            },
            Summary = new CollectionSummary
            {
                TotalBooks = books.Count,
                CurrentlyReading = books.Count(b => b.Status == ReadingStatus.CurrentlyReading),
                WantToRead = books.Count(b => b.Status == ReadingStatus.WantToRead),
                Finished = books.Count(b => b.Status == ReadingStatus.Finished),
                PagesInProgress = books.Where(b => b.Status == ReadingStatus.CurrentlyReading).Sum(b => b.PagesRemaining)
            },
            Goal = GetGoalProgress()
        };
    }

    public IReadOnlyList<Book> GetBooks(ReadingStatus? status)
    {
        var books = _repository.GetBooks();
        var filtered = status is null ? books : books.Where(b => b.Status == status.Value).ToList();
        return Order(filtered);
    }

    public Book? GetBook(string id) => _repository.GetBook(id);

    public Book AddBook(AddBookRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var book = new Book
        {
            Title = request.Title.Trim(),
            Author = request.Author.Trim(),
            Genre = string.IsNullOrWhiteSpace(request.Genre) ? "Unsorted" : request.Genre.Trim(),
            PageCount = request.PageCount,
            Status = request.Status,
            Blurb = request.Blurb.Trim(),
            DateAdded = today,
            CoverPalette = PickPalette(request.Title)
        };

        ApplyStatusRules(book, request.Status, rating: null, today);
        return _repository.Add(book);
    }

    public Book? UpdateProgress(string id, int currentPage)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        return _repository.Update(id, book =>
        {
            book.CurrentPage = Math.Clamp(currentPage, 0, book.PageCount);

            // The page number itself decides which shelf the book belongs on, so the
            // reader never has to update a status and a page count separately.
            if (book.CurrentPage >= book.PageCount && book.PageCount > 0)
                ApplyStatusRules(book, ReadingStatus.Finished, book.Rating, today);
            else if (book.CurrentPage > 0)
                ApplyStatusRules(book, ReadingStatus.CurrentlyReading, book.Rating, today);
            else if (book.Status == ReadingStatus.Finished)
                ApplyStatusRules(book, ReadingStatus.CurrentlyReading, book.Rating, today);
        });
    }

    public Book? SetStatus(string id, ReadingStatus status, int? rating)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        return _repository.Update(id, book => ApplyStatusRules(book, status, rating, today));
    }

    public Book? SkipForNow(string id) =>
        _repository.Update(id, book => book.LastSkippedAt = DateTime.UtcNow);

    public bool RemoveBook(string id) => _repository.Remove(id);

    public GoalProgress GetGoalProgress()
    {
        var bookshelf = _repository.GetBookshelf();
        var year = bookshelf.Goal.Year;

        return new GoalProgress
        {
            Year = year,
            TargetBooks = bookshelf.Goal.TargetBooks,
            BooksFinished = bookshelf.Books.Count(b =>
                b.Status == ReadingStatus.Finished && b.DateFinished?.Year == year)
        };
    }

    public GoalProgress SetGoal(int targetBooks)
    {
        _repository.UpdateGoal(targetBooks);
        return GetGoalProgress();
    }

    /// <summary>
    /// Keeps a book's dates, page count and status consistent with each other. Every
    /// shelf change goes through here so the three screens can never disagree.
    /// </summary>
    private static void ApplyStatusRules(Book book, ReadingStatus status, int? rating, DateOnly today)
    {
        switch (status)
        {
            case ReadingStatus.WantToRead:
                book.CurrentPage = 0;
                book.DateStarted = null;
                book.DateFinished = null;
                break;

            case ReadingStatus.CurrentlyReading:
                // Re-reading a finished book starts the progress bar over.
                if (book.Status == ReadingStatus.Finished || book.CurrentPage >= book.PageCount)
                    book.CurrentPage = 0;

                book.DateStarted ??= today;
                book.DateFinished = null;
                book.LastSkippedAt = null;
                break;

            case ReadingStatus.Finished:
                book.CurrentPage = book.PageCount;
                book.DateStarted ??= today;
                book.DateFinished = today;
                book.LastSkippedAt = null;
                if (rating is not null)
                    book.Rating = rating;
                break;
        }

        book.Status = status;
    }

    /// <summary>Within a shelf, show the most relevant books first.</summary>
    private static List<Book> Order(IEnumerable<Book> books) =>
        books
            .OrderByDescending(b => b.Status == ReadingStatus.Finished ? b.DateFinished : null)
            .ThenByDescending(b => b.Status == ReadingStatus.CurrentlyReading ? b.ProgressPercent : 0)
            .ThenByDescending(b => b.DateAdded)
            .ThenBy(b => b.Title)
            .ToList();

    private static List<Book> BuildShelfBooks(IEnumerable<Book> books, ReadingStatus status) =>
        Order(books.Where(b => b.Status == status));

    private static Shelf BuildShelf(IEnumerable<Book> books, ReadingStatus status, string label, string caption) =>
        new()
        {
            Status = status,
            Label = label,
            Caption = caption,
            Books = BuildShelfBooks(books, status)
        };

    private static readonly string[] Palettes =
        { "clay", "sage", "indigo", "plum", "amber", "teal", "rust", "slate", "moss", "cocoa", "sand", "ink" };

    /// <summary>Derives a stable cover colour from the title so a new book looks at home on the shelf.</summary>
    private static string PickPalette(string title)
    {
        var hash = title.Aggregate(7, (current, c) => unchecked(current * 31 + c));
        return Palettes[Math.Abs(hash) % Palettes.Length];
    }
}
