# My Bookshelf

A digital bookshelf for avid readers. Three screens tell one story:

**What do I have? → What should I read? → What am I reading?**

The value the app is built around is **clarity** — a reader should always know what they own,
what is waiting, and what to pick up next.

## The three screens

| Screen | Route | Its job |
| --- | --- | --- |
| My Books | `/` | Show the whole collection as a visual shelf, grouped by reading status, with one prominent way out of "what next?" |
| Choose What to Read | `/choose` | Cut the Want to Read shelf down to three books and say *why* each one suits the reader today |
| Reading Progress | `/reading` | Keep progress and status up to date after a book is chosen, against a yearly goal |

## Tech stack

- **Backend** — ASP.NET Core MVC (.NET 10). Models, controllers and services under `server/`.
  Data lives in a JSON file behind `IBookshelfRepository`, so it can be swapped for a database
  without touching the controllers.
- **Frontend** — React 19 + TypeScript, built with Vite, under `client/`.
- Book covers are drawn in CSS from each book's colour palette, so nothing depends on
  external image hosting.

## Running it

You need the [.NET 10 SDK](https://dotnet.microsoft.com/download) and
[Node.js 20+](https://nodejs.org).

### Day-to-day development (two terminals, hot reload)

```bash
# Terminal 1 — API on http://localhost:5229
cd server
dotnet run

# Terminal 2 — UI on http://localhost:5173
cd client
npm install     # first time only
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` through to the .NET app,
so there is nothing else to configure.

### Running it as one app

```bash
cd client && npm run build   # outputs to server/wwwroot/app
cd ../server && dotnet run
```

Open **http://localhost:5229**. The MVC app shell (`Views/Home/Index.cshtml`) reads Vite's
manifest and serves the built bundle, so React routes like `/choose` work as direct links.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/shelf` | Shelves, collection counts and goal progress — everything My Books needs |
| `GET` | `/api/recommendations?mood=&count=` | A shortlist with a reason for each pick. `mood` is `AnyMood`, `ShortRead`, `Familiar` or `Surprise` |
| `GET` | `/api/books?status=` | All books, or one shelf |
| `PUT` | `/api/books/{id}/progress` | Record a page number; the book moves shelves automatically when it crosses 0 or the last page |
| `PUT` | `/api/books/{id}/status` | Move a book between shelves, optionally with a 1-5 rating |
| `POST` | `/api/books/{id}/skip` | "Save for later" — keeps the book but stops suggesting it for 12 hours |
| `POST` | `/api/books` | Add a book |
| `PUT` | `/api/shelf/goal` | Change the yearly reading goal |
| `POST` | `/api/shelf/reset` | Restore the starting collection |

## Where things live

```
server/
  Controllers/     BooksController, ShelfController, RecommendationsController, HomeController
  Models/          Book, ReadingStatus, ShelfOverview, Recommendation, request models
  Services/        Repository, bookshelf rules, the recommendation engine, Vite manifest reader
  Data/SeedData    The starting collection
  Views/Home/      The app shell that hands the page to React
client/src/
  pages/           One file per screen
  components/      BookCover, BookDetailDialog, AppHeader
  state/           The shared collection every screen reads from
  api/             Typed client for the endpoints above
```

## Resetting the demo data

Progress is saved to `server/App_Data/bookshelf.json`. Delete that file, or
`POST /api/shelf/reset`, to get the starting collection back.
