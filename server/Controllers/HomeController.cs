using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MyBookshelf.Server.Models;
using MyBookshelf.Server.Services;

namespace MyBookshelf.Server.Controllers;

/// <summary>
/// Serves the app shell. React takes over from here and talks to the API controllers.
/// </summary>
public class HomeController : Controller
{
    private readonly IViteAssetProvider _vite;
    private readonly IWebHostEnvironment _environment;

    public HomeController(IViteAssetProvider vite, IWebHostEnvironment environment)
    {
        _vite = vite;
        _environment = environment;
    }

    public IActionResult Index() => View(new AppShellViewModel
    {
        Assets = _vite.GetAssets(),
        IsDevelopment = _environment.IsDevelopment()
    });

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() =>
        View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
