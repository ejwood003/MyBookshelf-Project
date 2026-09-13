using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Services;

/// <summary>
/// The reading rules of the app: what moving a book between shelves means,
/// and how the collection is summarised for the My Books screen.
/// </summary>
public interface IBookshelfService
{
    ShelfOverview GetOverview();

    IReadOnlyList<Book> GetBooks(ReadingStatus? status);

    Book? GetBook(string id);

    Book AddBook(AddBookRequest request);

    /// <summary>Records a new page number, moving the book between shelves when it crosses a boundary.</summary>
    Book? UpdateProgress(string id, int currentPage);

    Book? SetStatus(string id, ReadingStatus status, int? rating);

    /// <summary>"Save for later": keeps the book on Want to Read but stops suggesting it for now.</summary>
    Book? SkipForNow(string id);

    bool RemoveBook(string id);

    GoalProgress GetGoalProgress();

    GoalProgress SetGoal(int targetBooks);
}
