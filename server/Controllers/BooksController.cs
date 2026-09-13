using Microsoft.AspNetCore.Mvc;
using MyBookshelf.Server.Models;
using MyBookshelf.Server.Services;

namespace MyBookshelf.Server.Controllers;

/// <summary>
/// The reader's collection: what they own and which shelf each book sits on.
/// </summary>
[ApiController]
[Route("api/books")]
[Produces("application/json")]
public class BooksController : ControllerBase
{
    private readonly IBookshelfService _bookshelf;

    public BooksController(IBookshelfService bookshelf) => _bookshelf = bookshelf;

    /// <summary>Every book, or just one shelf when <paramref name="status"/> is supplied.</summary>
    [HttpGet]
    public ActionResult<IReadOnlyList<Book>> GetBooks([FromQuery] ReadingStatus? status)
        => Ok(_bookshelf.GetBooks(status));

    [HttpGet("{id}")]
    public ActionResult<Book> GetBook(string id)
    {
        var book = _bookshelf.GetBook(id);
        return book is null ? NotFound(Problem($"No book with id '{id}'.")) : Ok(book);
    }

    [HttpPost]
    public ActionResult<Book> AddBook([FromBody] AddBookRequest request)
    {
        var book = _bookshelf.AddBook(request);
        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
    }

    /// <summary>
    /// Records how far the reader has got. Crossing zero or the last page moves the
    /// book to the right shelf automatically.
    /// </summary>
    [HttpPut("{id}/progress")]
    public ActionResult<Book> UpdateProgress(string id, [FromBody] UpdateProgressRequest request)
    {
        var book = _bookshelf.UpdateProgress(id, request.CurrentPage);
        return book is null ? NotFound(Problem($"No book with id '{id}'.")) : Ok(book);
    }

    /// <summary>Moves a book between shelves, optionally rating it on the way to Finished.</summary>
    [HttpPut("{id}/status")]
    public ActionResult<Book> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
    {
        var book = _bookshelf.SetStatus(id, request.Status, request.Rating);
        return book is null ? NotFound(Problem($"No book with id '{id}'.")) : Ok(book);
    }

    /// <summary>"Save for later" — the book stays on the shelf but stops being suggested for now.</summary>
    [HttpPost("{id}/skip")]
    public ActionResult<Book> SkipForNow(string id)
    {
        var book = _bookshelf.SkipForNow(id);
        return book is null ? NotFound(Problem($"No book with id '{id}'.")) : Ok(book);
    }

    [HttpDelete("{id}")]
    public IActionResult RemoveBook(string id)
        => _bookshelf.RemoveBook(id) ? NoContent() : NotFound(Problem($"No book with id '{id}'."));
}
