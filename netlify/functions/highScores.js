import fs from "fs";
import path from "path";

const dataDir = path.resolve("data");
const filePath = path.join(dataDir, "highscores.json");

export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  // Ensure folders/files exist
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ levels: {}, totals: [] }, null, 2));
  }

  // Load existing data
  let data = { levels: {}, totals: [] };
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    data = JSON.parse(raw || "{}");
    if (!data.levels) data.levels = {};
    if (!data.totals) data.totals = [];
  } catch (err) {
    console.error("Error reading highscores:", err);
  }

  // === GET: return all ===
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    };
  }

  // === POST: add a new level score ===
  try {
    const { initials, score, level } = JSON.parse(event.body || "{}");

    if (!initials || typeof score !== "number" || !level) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing initials, score, or level" }),
      };
    }

    const formattedInitials = initials.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (formattedInitials.length !== 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Initials must be 3 alphanumeric characters" }),
      };
    }

    // --- Update level board ---
    if (!data.levels[level]) data.levels[level] = [];

    // Replace previous score for same initials if exists (keep best)
    const existing = data.levels[level].find((p) => p.initials === formattedInitials);
    if (existing) {
      existing.score = Math.max(existing.score, score);
      existing.date = new Date().toISOString();
    } else {
      data.levels[level].push({
        initials: formattedInitials,
        score,
        date: new Date().toISOString(),
      });
    }

    // Sort and keep top 10 for that level
    data.levels[level].sort((a, b) => b.score - a.score);
    data.levels[level] = data.levels[level].slice(0, 10);

    // --- Recalculate total scores across all levels ---
    const totalsMap = {};

    for (const lvl of Object.keys(data.levels)) {
      for (const entry of data.levels[lvl]) {
        if (!totalsMap[entry.initials]) totalsMap[entry.initials] = 0;
        totalsMap[entry.initials] += entry.score;
      }
    }

    data.totals = Object.entries(totalsMap)
      .map(([initials, score]) => ({
        initials,
        score,
        date: new Date().toISOString(),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Save file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    console.log(
      `✅ ${formattedInitials} scored ${score} on ${level}. Recalculated totals updated.`
    );

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("Error processing POST:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: err.message }),
    };
  }
}
