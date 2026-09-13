using MyBookshelf.Server.Services;

namespace MyBookshelf.Server.Models;

/// <summary>
/// What the MVC app shell needs in order to hand the page over to React.
/// </summary>
public class AppShellViewModel
{
    /// <summary>Null when the React client has not been built into wwwroot/app yet.</summary>
    public ViteAssets? Assets { get; init; }

    public bool IsDevelopment { get; init; }

    public string DevServerUrl { get; init; } = "http://localhost:5173";
}
