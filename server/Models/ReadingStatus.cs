namespace MyBookshelf.Server.Models;

/// <summary>
/// The three shelves a book can live on. The order matches the order the
/// shelves are presented on the My Books screen.
/// </summary>
public enum ReadingStatus
{
    CurrentlyReading = 0,
    WantToRead = 1,
    Finished = 2
}
