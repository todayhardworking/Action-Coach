# Coding Guidelines (Stepvia)

These lightweight rules keep the project consistent and easy to maintain.

## 1. Code Style
- Use TypeScript for all files.
- Use consistent naming:
  - Components: PascalCase
  - Functions/variables: camelCase
  - Folders: lowercase
- Keep components small and focused.
- Prefer clarity over cleverness.

## 2. React & Next.js Rules
- Use the App Router (`app/` directory).
- Client logic goes in **client components**.
- API calls and secure logic go in **API routes** or server utilities.
- Avoid heavy logic inside components.

## 3. API Development
- All API routes go in `app/api/...`.
- Always return JSON.
- Validate input before processing.
- Protect secrets: never expose API keys to the client.

## 4. Error Handling
- Return meaningful messages but avoid leaking system internals.
- Use:
  - 200 for success
  - 400 for invalid input
  - 500 for unexpected errors

## 5. Git & PR Rules
- Each PR should do **one focused thing**.
- Title must state the feature clearly.
- Include a short summary of what changed.
