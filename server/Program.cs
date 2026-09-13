using System.Text.Json.Serialization;
using MyBookshelf.Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        // Send enums as names ("CurrentlyReading") so the React code reads like the domain.
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// The bookshelf is a single reader's collection held in one JSON file, so the
// repository is a singleton and everything above it is stateless.
builder.Services.AddSingleton<IBookshelfRepository, JsonBookshelfRepository>();
builder.Services.AddSingleton<IViteAssetProvider, ViteAssetProvider>();
builder.Services.AddScoped<IBookshelfService, BookshelfService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();

const string ViteDevServer = "ViteDevServer";
builder.Services.AddCors(options =>
{
    // Only used while the Vite dev server is serving the UI on its own port.
    options.AddPolicy(ViteDevServer, policy => policy
        .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors(ViteDevServer);
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// An unknown /api path is a mistake, not a page — answer it as one rather than
// letting it fall through to the HTML shell below.
app.Map("/api/{**rest}", () => Results.NotFound());

// Deep links like /choose and /reading are React routes; hand them to the app shell.
app.MapFallbackToController("Index", "Home");

app.Run();
