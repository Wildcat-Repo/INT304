# Employee Form

A small React app for INT304 (Web Design and Development). It collects employee details through a form and saves them to the browser's local storage, so the data stays after the page is refreshed or the browser is closed.

Bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

- Form with **Name**, **Email**, **Title**, and **Department** fields, with each label linked to its input.
- **Draft saving:** the form saves its contents as you type, under the localStorage key `current_employee`, so a refresh doesn't lose your input.
- **Employee list:** each Submit adds the employee to an array saved under the localStorage key `employees`.
- Saved data that is missing or invalid is ignored, and the app starts with empty values instead of crashing.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

## Viewing the saved data

Open the browser's developer tools and find Local Storage for `http://localhost:3000`:

- **Chrome:** Inspect → **Application** tab → Storage → Local Storage
- **Firefox:** Inspect → **Storage** tab → Local Storage
- **Safari:** turn on the Develop menu (Settings → Advanced), then Inspect → **Storage** tab → Local Storage

Look for the `employees` and `current_employee` keys.

## Project structure

```
src/
├── App.js                       # Holds the employees array; addEmployee and saveData
├── App.test.js                  # Tests that submitted employees are saved
└── Components/
    ├── EmployeeForm.js          # Form fields, draft saving, submit handling
    ├── EmployeeForm.css         # Form styles
    └── EmployeeForm.test.js     # Tests for rendering, typing, restoring and submitting
```

## Scripts

| Command         | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `npm start`     | Runs the development server at <http://localhost:3000>.      |
| `npm test`      | Runs the tests in watch mode.                                |
| `npm run build` | Builds an optimized production version into `build/`.       |

To run the tests once, without watch mode:

```bash
CI=true npm test
```

## Known limitations

- The form isn't cleared after Submit, so clicking Submit twice saves the same employee twice.
- The app doesn't display saved employees yet; you can see them only in the browser's developer tools.
- The draft in `current_employee` is never cleared, so the last entry stays in the form.
