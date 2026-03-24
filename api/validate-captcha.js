export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://icdigitalexperience.com.br");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // resposta para preflight (necessário para fetch do navegador)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token não enviado"
    });
  }

  try {

    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.PROJECT_ID}/assessments?key=${process.env.GOOGLE_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: {
          token,
          siteKey: process.env.RECAPTCHA_SITE_KEY,
          expectedAction: "submit"
        }
      })
    });

    const data = await response.json();

    const score = data?.riskAnalysis?.score ?? 0;

    if (score >= 0.5) {
      return res.status(200).json({
        success: true,
        score
      });
    }

    return res.status(200).json({
      success: false,
      score,
      message: "Interação suspeita"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}