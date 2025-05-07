import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import { envConfig } from "@/config/env.config";
import { generateOtpToken } from "../tokens/otpTokens";
import SMTPPool from "nodemailer/lib/smtp-pool";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "पहिलो उद्धार",
    link: "https://firstresq.com",
    logo: "https://firstresq.com/logo.png",
  },
});

export const sendOTPEmail = async (
  email: string,
  otpToken: string
): Promise<boolean> => {
  try {
    const emailContent = {
      body: {
        name: "User",
        intro: "Welcome to पहिलो उद्धार !",
        action: {
          instructions:
            "To complete your verification, please use the following OTP code:",
          button: {
            color: "#22BC66",
            text: otpToken,
            link: "#",
          },
        },
        outro:
          "This OTP will expire in 10 minutes. If you did not request this, please ignore this email.",
      },
    };

    const emailBody = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    const transportOptions: SMTPPool.Options = {
      service: "gmail",
      pool: true,
      auth: {
        user: envConfig.google_mail,
        pass: envConfig.google_pass,
      },
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const info = await transporter.sendMail({
      from: envConfig.google_mail,
      to: email,
      subject: "Your FirstResQ Verification OTP",
      html: emailBody,
      text: emailText,
    });

    console.log("Email sent:", info.messageId, info);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendOTP = async (email: string): Promise<string | null> => {
  const otpToken = generateOtpToken(email);

  try {
    const emailSent = await sendOTPEmail(email, otpToken);

    if (!emailSent) {
      throw new Error("Error sending OTP email");
    }
    console.log("Sending OTP Successful", otpToken);
    return otpToken;
  } catch (error: any) {
    console.log("Error Sending OTP", error);
    throw new Error("Error Sending OTP. Please try again later");
  }
};
