using System.ComponentModel.DataAnnotations;

namespace MyBookshelf.Server.Models;

public class UpdateProgressRequest
{
    [Range(0, int.MaxValue, ErrorMessage = "Page number cannot be negative.")]
    public int CurrentPage { get; set; }
}

public class UpdateStatusRequest
{
    [Required]
    public ReadingStatus Status { get; set; }

    /// <summary>Optional 1-5 star rating, accepted when a book is being marked finished.</summary>
    [Range(1, 5)]
    public int? Rating { get; set; }
}

public class AddBookRequest
{
    [Required(ErrorMessage = "A book needs a title.")]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "A book needs an author.")]
    [StringLength(120)]
    public string Author { get; set; } = string.Empty;

    [StringLength(60)]
    public string Genre { get; set; } = "Unsorted";

    [Range(1, 10000, ErrorMessage = "Page count must be between 1 and 10,000.")]
    public int PageCount { get; set; } = 300;

    public ReadingStatus Status { get; set; } = ReadingStatus.WantToRead;

    [StringLength(500)]
    public string Blurb { get; set; } = string.Empty;
}

public class UpdateGoalRequest
{
    [Range(1, 500, ErrorMessage = "Pick a goal between 1 and 500 books.")]
    public int TargetBooks { get; set; }
}
