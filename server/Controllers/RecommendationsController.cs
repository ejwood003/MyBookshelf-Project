using Microsoft.AspNetCore.Mvc;
using MyBookshelf.Server.Models;
using MyBookshelf.Server.Services;

namespace MyBookshelf.Server.Controllers;

/// <summary>
/// Powers the Choose What to Read screen.
/// </summary>
[ApiController]
[Route("api/recommendations")]
[Produces("application/json")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendations;

    public RecommendationsController(IRecommendationService recommendations)
        => _recommendations = recommendations;

    /// <summary>
    /// A shortlist of books from the reader's own collection, each with the reason it was chosen.
    /// </summary>
    /// <param name="mood">The lens to pick through: any mood, a short read, something familiar, or a surprise.</param>
    /// <param name="count">How many books to shortlist. Three keeps the choice easy.</param>
    [HttpGet]
    public ActionResult<RecommendationSet> GetRecommendations(
        [FromQuery] PickerMood mood = PickerMood.AnyMood,
        [FromQuery] int count = 3)
        => Ok(_recommendations.GetRecommendations(mood, Math.Clamp(count, 1, 12)));
}
