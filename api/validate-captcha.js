export default async function handler(req, res) {

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
    const reasons = data?.riskAnalysis?.reasons ?? [];

    const threshold = 0.5;

    if (score >= threshold) {
      return res.status(200).json({
        success: true,
        score,
        reasons
      });
    }

    return res.status(200).json({
      success: false,
      score,
      reasons,
      message: "Interação suspeita, possível bot."
    });

  } catch (error) {

    console.error("Erro captcha:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao validar captcha"
    });

  }

}