using MyBookshelf.Server.Models;

namespace MyBookshelf.Server.Services;

public interface IRecommendationService
{
    /// <summary>
    /// Picks a small set of unread books and explains why each one suits the reader today.
    /// </summary>
    RecommendationSet GetRecommendations(PickerMood mood, int count = 3);
}
