# Responsible Robotics / Attribution Studio

A dependency-free browser prototype for recording a robotics incident and distributing responsibility across contributing sources.

## Run

From this folder, start the backend server:

```powershell
npm start
```

Open http://localhost:3000. The backend serves the app and provides `GET` and `POST` `/api/assessment` endpoints for a saved assessment.

The app runs entirely in the browser. Use **Export assessment** to download the current case as JSON.

## Test cases

Open `tests.html` directly in a browser. The test page runs browser-based checks for the default attribution, editable source weights, and add/remove behavior.
