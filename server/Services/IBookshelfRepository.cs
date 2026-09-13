using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Services;

/// <summary>
/// Storage for the reader's collection. Kept behind an interface so the JSON file
/// can be swapped for a real database without touching the controllers.
/// </summary>
public interface IBookshelfRepository
{
    Bookshelf GetBookshelf();

    IReadOnlyList<Book> GetBooks();

    Book? GetBook(string id);

    Book Add(Book book);

    /// <summary>Applies <paramref name="mutate"/> to the stored book and saves. Returns null if the id is unknown.</summary>
    Book? Update(string id, Action<Book> mutate);

    bool Remove(string id);

    ReadingGoal UpdateGoal(int targetBooks);

    /// <summary>Throws away all changes and restores the demo collection.</summary>
    Bookshelf Reset();
}
