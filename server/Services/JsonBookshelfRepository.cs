using System.Text.Json;
using System.Text.Json.Serialization;
using MyBookshelf.Server.Data;
using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Services;

/// <summary>
/// Keeps the collection in memory and mirrors it to a JSON file so progress
/// survives a restart. Registered as a singleton; every public member takes the lock.
/// </summary>
public class JsonBookshelfRepository : IBookshelfRepository
{
    private static readonly JsonSerializerOptions FileOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly string _filePath;
    private readonly ILogger<JsonBookshelfRepository> _logger;
    private readonly object _gate = new();
    private Bookshelf _bookshelf;

    public JsonBookshelfRepository(IWebHostEnvironment environment, ILogger<JsonBookshelfRepository> logger)
    {
        _logger = logger;
        var dataDirectory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dataDirectory);
        _filePath = Path.Combine(dataDirectory, "bookshelf.json");
        _bookshelf = Load();
    }

    public Bookshelf GetBookshelf()
    {
        lock (_gate)
        {
            return _bookshelf;
        }
    }

    public IReadOnlyList<Book> GetBooks()
    {
        lock (_gate)
        {
            return _bookshelf.Books.ToList();
        }
    }

    public Book? GetBook(string id)
    {
        lock (_gate)
        {
            return _bookshelf.Books.FirstOrDefault(b => b.Id == id);
        }
    }

    public Book Add(Book book)
    {
        lock (_gate)
        {
            _bookshelf.Books.Add(book);
            Save();
            return book;
        }
    }

    public Book? Update(string id, Action<Book> mutate)
    {
        lock (_gate)
        {
            var book = _bookshelf.Books.FirstOrDefault(b => b.Id == id);
            if (book is null)
                return null;

            mutate(book);
            Save();
            return book;
        }
    }

    public bool Remove(string id)
    {
        lock (_gate)
        {
            var removed = _bookshelf.Books.RemoveAll(b => b.Id == id) > 0;
            if (removed)
                Save();

            return removed;
        }
    }

    public ReadingGoal UpdateGoal(int targetBooks)
    {
        lock (_gate)
        {
            _bookshelf.Goal.TargetBooks = targetBooks;
            _bookshelf.Goal.Year = DateTime.Today.Year;
            Save();
            return _bookshelf.Goal;
        }
    }

    public Bookshelf Reset()
    {
        lock (_gate)
        {
            _bookshelf = SeedData.CreateBookshelf();
            Save();
            return _bookshelf;
        }
    }

    private Bookshelf Load()
    {
        if (File.Exists(_filePath))
        {
            try
            {
                var json = File.ReadAllText(_filePath);
                var stored = JsonSerializer.Deserialize<Bookshelf>(json, FileOptions);
                if (stored is { Books.Count: > 0 })
                    return stored;
            }
            catch (Exception ex) when (ex is JsonException or IOException)
            {
                // A corrupt or unreadable file should not stop the app from starting;
                // fall through and rebuild the starting collection instead.
                _logger.LogWarning(ex, "Could not read {Path}; restoring the starting collection.", _filePath);
            }
        }

        var seeded = SeedData.CreateBookshelf();
        _bookshelf = seeded;
        Save();
        return seeded;
    }

    /// <summary>Writes via a temp file so an interrupted save cannot leave a half-written shelf.</summary>
    private void Save()
    {
        try
        {
            var tempPath = _filePath + ".tmp";
            File.WriteAllText(tempPath, JsonSerializer.Serialize(_bookshelf, FileOptions));
            File.Move(tempPath, _filePath, overwrite: true);
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "Could not save the bookshelf to {Path}.", _filePath);
        }
    }
}
