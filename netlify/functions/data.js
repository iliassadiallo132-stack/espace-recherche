exports.handler = async (event) => {
  const BIN_ID = process.env.JSONBIN_ID;
  const MASTER_KEY = process.env.JSONBIN_KEY;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
  const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  const headers = { "Content-Type": "application/json" };

  if (!BIN_ID || !MASTER_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Configuration manquante : JSONBIN_ID et/ou JSONBIN_KEY ne sont pas définis dans Netlify.",
      }),
    };
  }

  if (event.httpMethod === "GET") {
    try {
      const res = await fetch(`${BASE_URL}/latest`, {
        headers: { "X-Master-Key": MASTER_KEY },
      });
      if (!res.ok) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: "Erreur lors de la lecture des données." }),
        };
      }
      const json = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(json.record) };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Erreur serveur : " + err.message }),
      };
    }
  }

  if (event.httpMethod === "POST") {
    const providedSecret = event.headers["x-admin-secret"] || "";
    if (ADMIN_SECRET && providedSecret !== ADMIN_SECRET) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Code admin incorrect." }),
      };
    }

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Données invalides." }),
      };
    }

    try {
      const res = await fetch(BASE_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: "Erreur lors de l'enregistrement." }),
        };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Erreur serveur : " + err.message }),
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Méthode non autorisée." }) };
};
