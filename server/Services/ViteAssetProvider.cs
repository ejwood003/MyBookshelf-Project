using System.Text.Json;

namespace MyBookshelf.Server.Services;

/// <summary>The hashed files Vite produced for one entry point.</summary>
public record ViteAssets(string ScriptPath, IReadOnlyList<string> StylePaths);

/// <summary>
/// Lets the MVC layout reference the React bundle without hard-coding Vite's content hashes.
/// </summary>
public interface IViteAssetProvider
{
    /// <summary>Returns null when the client has not been built yet.</summary>
    ViteAssets? GetAssets(string entry = "index.html");
}

public class ViteAssetProvider : IViteAssetProvider
{
    private const string BasePath = "/app";

    private readonly string _manifestPath;
    private readonly bool _cacheManifest;
    private ViteAssets? _cached;
    private string? _cachedEntry;

    public ViteAssetProvider(IWebHostEnvironment environment)
    {
        _manifestPath = Path.Combine(environment.WebRootPath, "app", ".vite", "manifest.json");
        _cacheManifest = !environment.IsDevelopment();
    }

    public ViteAssets? GetAssets(string entry = "index.html")
    {
        if (_cacheManifest && _cached is not null && _cachedEntry == entry)
            return _cached;

        if (!File.Exists(_manifestPath))
            return null;

        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(_manifestPath));
            if (!document.RootElement.TryGetProperty(entry, out var chunk))
                return null;

            var script = chunk.GetProperty("file").GetString();
            if (script is null)
                return null;

            var styles = chunk.TryGetProperty("css", out var css)
                ? css.EnumerateArray().Select(s => $"{BasePath}/{s.GetString()}").ToList()
                : new List<string>();

            var assets = new ViteAssets($"{BasePath}/{script}", styles);
            _cached = assets;
            _cachedEntry = entry;
            return assets;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
