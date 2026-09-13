using Microsoft.AspNetCore.Mvc;
using MyBookshelf.Server.Models;
using MyBookshelf.Server.Services;

namespace MyBookshelf.Server.Controllers;

/// <summary>
/// The whole-collection view that the My Books screen is built from.
/// </summary>
[ApiController]
[Route("api/shelf")]
[Produces("application/json")]
public class ShelfController : ControllerBase
{
    private readonly IBookshelfService _bookshelf;
    private readonly IBookshelfRepository _repository;

    public ShelfController(IBookshelfService bookshelf, IBookshelfRepository repository)
    {
        _bookshelf = bookshelf;
        _repository = repository;
    }

    /// <summary>Shelves, counts and goal progress in one request.</summary>
    [HttpGet]
    public ActionResult<ShelfOverview> GetOverview() => Ok(_bookshelf.GetOverview());

    [HttpGet("goal")]
    public ActionResult<GoalProgress> GetGoal() => Ok(_bookshelf.GetGoalProgress());

    [HttpPut("goal")]
    public ActionResult<GoalProgress> SetGoal([FromBody] UpdateGoalRequest request)
        => Ok(_bookshelf.SetGoal(request.TargetBooks));

    /// <summary>Restores the starting collection. Handy when demoing the three screens.</summary>
    [HttpPost("reset")]
    public ActionResult<ShelfOverview> Reset()
    {
        _repository.Reset();
        return Ok(_bookshelf.GetOverview());
    }
}
