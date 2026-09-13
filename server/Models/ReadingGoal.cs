namespace MyBookshelf.Server.Models;

/// <summary>
/// How many books the reader wants to finish in a given year.
/// </summary>
public class ReadingGoal
{
    public int Year { get; set; } = DateTime.Now.Year;

    public int TargetBooks { get; set; } = 24;
}
