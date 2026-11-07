# Code Guideline

## Project Structure Overview

```
project-root/
  ├── i18n.config.json       # i18n manifest for supported locales and language metadata
  ├── public/
  │   └── locales/           # public/locales/{code}.json translation files
  ├── src/
  │   ├── components/        # All reusable UI components
  │   │   ├── ui/            # Prebuilt and custom UI components, grouped by function
  │   │   ├── kanban/        # Board surfaces: kanban-board, kanban-column, demand-card, lanes
  │   │   ├── app-sidebar.tsx    # Views + categories navigation rail
  │   │   ├── demand-dialog.tsx  # Create / edit / delete a demand
  │   │   └── route-guard.tsx    # Keeps /board behind the login page
  │   ├── hooks/             # Custom React hooks
  │   │   ├── use-auth.tsx       # AuthProvider + session state
  │   │   ├── use-database.ts    # Stored-document query + mutation helper
  │   │   ├── use-demands.ts     # Demand reads and writes
  │   │   └── use-categories.ts  # Category reads and writes
  │   ├── i18n/              # i18n runtime: config.ts (entry) + util.ts (helpers)
  │   ├── lib/               # Utility functions and libraries
  │   │   ├── local-db.ts        # Browser storage document (mirrors the DB schema)
  │   │   ├── auth.ts            # Register / login / logout, password hashing
  │   │   ├── seed.ts            # Demo account, starter categories, example demands
  │   │   ├── demands.ts         # Overdue, horizon suggestion, filters, deadline labels
  │   │   ├── category-colors.ts # Category dot classes
  │   │   └── validation.ts      # Shared email / link patterns
  │   ├── pages/             # Application pages (each page in its own subdirectory)
  │   │   ├── board/             # index.tsx (board) + BoardHeader.tsx
  │   │   └── login/             # index.tsx + LoginForm.tsx + RegisterForm.tsx
  │   ├── types/doapp.ts     # Schema types: users, categories_doapp, list_doapp
  │   ├── App.tsx            # Main app component, sets up route providers
  │   ├── router.tsx         # Router config, sets up routing
  │   ├── main.tsx           # Entry point for the React app
  │   └── index.css          # Global styles
  ├── package.json           # Project metadata and scripts
  ├── tailwind.config.ts     # Tailwind CSS configuration
  └── ...                    # Other config and lock files
```

> Backend-handoff temporary files (`scripts/`, `i18n.scan.json`, `reports/i18n/`, `docs/i18n-*.md`) are kept in the repo only until backend integration of i18n statistics/scan/auto-translate is complete. They are owned by the backend long-term and will be removed once integration lands. Treat them as read-only handoff copies — do not extend them.

## Directory Responsibilities

- **public/**: Static files served directly. Place images, icons, and robots.txt here.
- **public/locales/**: Translation files, one per language (`{code}.json`). Flat dotted keys (e.g. `home.hero.title`); the `fallbackLng` file is the structural source of truth.
- **i18n.config.json**: The lightweight i18n manifest for fallback language, language labels, browser detection aliases, and document direction. Single source of truth for the language list.
- **src/components/**: All UI components.  
  - **ui/**: Contains atomic and composite UI components.  
  - *Group related components into subdirectories if they share a domain or feature (e.g., `form/`, `charts/`).*
  - **kanban/**: Board-specific surfaces (board, lane, card, lane metadata). `lanes.ts` holds the lane definitions and their class strings; keep class strings complete so Tailwind can scan them.
- **src/hooks/**: Custom React hooks. Each file should export a single hook focused on one responsibility.
  - `use-auth.tsx` is the only file here that also exports a component (`AuthProvider`), because the context and its hooks belong together. `App.tsx` wraps the router in it.
  - `use-database.ts` is the shared read/mutate layer over `src/lib/local-db.ts`; feature hooks (`use-demands`, `use-categories`) build on it.
- **src/i18n/**: Two files only.
  - `config.ts` is the runtime entry: imports the manifest via `util.ts`, initializes i18next (HTTP backend, language detector, react binding), syncs `<html lang/dir>`, and re-exports the helpers. Importing this file for its side effect boots i18next.
  - `util.ts` holds pure helpers parsed from the manifest: `fallbackLng`, `supportedLngs`, `languageOptions`, `normalizeLanguage`, `getLanguageDirection`, plus types.
  - Components use the official `useTranslation()` from `react-i18next` directly; there is no project-specific `useT` wrapper.
- **src/lib/**: Utility functions and libraries that are not React components or hooks.
  - `local-db.ts` owns the browser-storage document (key `doapp.db.v1`), safe parsing, id sequencing, and the session key; every read/write of app data goes through it.
  - `demands.ts` owns the derived rules: overdue detection, horizon suggestion from the deadline, deadline labels, and board filtering.
  - `auth.ts` and `seed.ts` own sign-in/sign-out and the one-time demo seed. `validation.ts` holds the shared email/link patterns.
- **src/types/doapp.ts**: Schema types mirroring the `appdb` tables (`users`, `categories_doapp`, `list_doapp`) plus the `horizon` column that drives the four views. Keep column names identical to the database so a real backend can replace `local-db.ts` without UI changes.
- **src/pages/**: All route-level pages.  
  - *Each page should have its own subdirectory if it contains more than a single file or has related logic/components.*
  - `board/` holds the board route (`index.tsx`) and its header; `login/` holds the auth route with its two forms. `Index.tsx` only redirects based on the session.
- **src/App.tsx**: Sets up global providers.
- **src/router.tsx**: Sets up routing.
- **src/main.tsx**: Application entry point.

**Important:**
Whenever a new module (such as a component, hook, or utility) or a new page is added or removed, this document **must be updated immediately** to reflect the changes. Keeping this documentation up to date ensures that all collaborators have a clear understanding of the current project structure and its intended organization.

## How to Add New Code

### 1. Adding a New Page

- **Create a subdirectory under `src/pages/` for each new page.**
  - Example: For a "Dashboard" page, create `src/pages/dashboard/`.
- **Place the main page component as `index.tsx` inside the subdirectory.**
- **Add any page-specific components or logic in the same subdirectory.**
- **Register the new route in `src/router.tsx and generate a semantic name.**
  - Example:
    ```tsx
    import Dashboard from "./pages/dashboard";
    // ...
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <Dashboard />
    }
    ```

### 2. Adding a New Component

- **If you are adding a group of related components, create a subdirectory (e.g., `form/`, `charts/`).**
- **If the component is only used by a specific page, place it in that page's subdirectory under `src/pages/`.**
- **Each component should be focused on a single responsibility.**
- **Small files (< 100 lines) are encouraged for a single component.**

### 3. Adding a New Hook

- **Create a new file in `src/hooks/` named after the hook (e.g., `use-feature.ts`).**
- **Each file should export only one hook.**
- **Hooks should be as small and focused as possible.**

### 4. Adding Utilities

- **Add utility functions to `src/lib/`.**
- **Group related utilities in the same file or subdirectory if needed.**

### 5. Adding or Updating Languages

- **Language metadata must go through `i18n.config.json`.**
- **Do not hardcode supported languages, labels, browser detection aliases, or RTL direction lists in `src/i18n/*.ts`.**
- **Locale content lives in `public/locales/{code}.json`** as flat dotted-key JSON; the `fallbackLng` file owns the canonical key set.
- **Runtime code reads the manifest only through `src/i18n/util.ts`.** Adding or removing a language means editing `i18n.config.json` plus the matching `public/locales/{code}.json`; nothing in `src/i18n/` needs to change.
- **Translations are read with the official `useTranslation()` from `react-i18next`.** No custom hook, no cast at call sites.

## Coding Best Practices

- **One module, one responsibility:**  
  Each file (component, hook, utility) should do one thing only.
- **High cohesion, low coupling:**  
  Keep related logic together and avoid unnecessary dependencies between modules.
- **Naming conventions:**  
  - Use `PascalCase` for components and page directories.
  - Use `camelCase` for hooks and utility functions.
  - Name page subdirectories and files after their route or feature.
- **Component structure:**  
  - Keep components small and focused.
  - Extract subcomponents if a component grows too large.
- **Page structure:**  
  - Place all logic, hooks, and components specific to a page in its subdirectory.
  - Only share code via `components/`, `hooks/`, or `lib/` if it is truly reusable.
- **Documentation:**  
  - Add comments for complex logic.
  - Document the purpose of each module at the top of the file if not obvious.

## Example: Adding a New "Profile" Page

1. **Create a directory:**  
   `src/pages/profile/`
2. **Add the main page component:**  
   `src/pages/profile/index.tsx`
3. **Add page-specific components:**  
   `src/pages/profile/ProfileHeader.tsx`, `src/pages/profile/ProfileDetails.tsx`
4. **Register the route in `App.tsx`:**
   ```tsx
   import Profile from "./pages/profile";
   // ...
   <Route path="/profile" element={<Profile />} />
   ```
5. **If you need a reusable button, add it to `src/components/ui/button.tsx`.**
