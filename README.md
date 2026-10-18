# Math Practice

A child-friendly web app for practicing addition, subtraction, multiplication, and division. Progress stays in the browser. There is no account, no backend, and no tracking.

## Run locally

The app lives in `math-practice-app`.

```bash
cd math-practice-app
npm install
npm run dev
```

Then open the URL Vite prints, usually `http://localhost:5173/`.

### Other commands

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm run preview` serves the production build locally so you can check routes such as `/statistics` after a refresh.

## How to use the app

1. Open **Start Practice**.
2. Choose one or more operations, a difficulty, and a session length.
3. Pick an answer, flip the card, and mark whether you got it right.
4. Review saved mistakes from the session summary or setup screen.
5. Open **Statistics** to see totals, accuracy, and recent sessions.

Clearing this browser's site data erases progress.

## Deploy

The production build is a static Vite app. Hosts such as Netlify need a single-page-app fallback so routes like `/statistics` still load after a refresh.

From this repository root, Netlify uses `netlify.toml`:

- Base directory: `math-practice-app`
- Build command: `npm run build`
- Publish directory: `dist`
- Redirect: missing paths serve `index.html`

A current Netlify preview is at [https://melodious-halva-425d6f.netlify.app/](https://melodious-halva-425d6f.netlify.app/). Anonymous Drop sites ask for the visitor password `My-Drop-Site`. After `npx netlify-cli login`, claim the site and turn that password off so the app is fully public.
