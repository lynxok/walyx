import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export async function sendOTPEmail(email: string, otpCode: string) {
  console.log(`[OTP VERIFICATION] code for ${email} is: ${otpCode}`);

  if (!resendApiKey) {
    console.log(`[Resend API Key Missing] Resend is NOT configured. Please copy the code above to test.`);
    return { success: true, logged: true };
  }

  try {
    const resend = new Resend(resendApiKey);
    const data = await resend.emails.send({
      from: "Venta de Viandas <onboarding@resend.dev>",
      to: email,
      subject: "Tu código de verificación OTP",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 8px;">
          <h2 style="color: #f59e0b;">Verifica tu cuenta</h2>
          <p>Tu código de seguridad de 6 dígitos es:</p>
          <div style="background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 20px 0; color: #18181b;">
            ${otpCode}
          </div>
          <p style="font-size: 14px; color: #71717a;">Este código expirará en 15 minutos.</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return { success: false, error };
  }
}
