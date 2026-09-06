import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n  Sidekick API (Simulation Mode) running on http://localhost:${PORT}\n`);
});
