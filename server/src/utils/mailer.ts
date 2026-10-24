import nodemailer from "nodemailer/lib/nodemailer";
import { env } from "../config/env";
import path from "path";
import { readFile } from "fs/promises";
import Handlebars from "handlebars";

const TEMPLATE_DIR = path.join(__dirname, "../../views/emails");

export const transporter = nodemailer.createTransport({
    host:env.smtpHost,
    port: env.smtpPort,
    secure:false,
    auth: {
        user: env.smtpUser,
        pass: env.smtpPass
    }
});

export const sendMail = async (to:string, subject:string, templateName: string, context: Record<string, unknown>) => {
    const source = await readFile(path.join(TEMPLATE_DIR, `${templateName}.hbs`), "utf-8");
    const html = Handlebars.compile(source)(context);
    await transporter.sendMail({
        from: `"Chistix" <${env.smtpUser}>`,
        to,
        subject,
        html
    });
};