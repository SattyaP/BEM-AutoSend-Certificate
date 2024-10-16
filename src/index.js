const { readFileSync } = require('fs');
const nodemailer = require('nodemailer');
const { join } = require('path');
const xlsx = require('xlsx');

const createTransporter = auth =>
    nodemailer.createTransport({
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: auth.username,
            pass: auth.password
        }
    });

const sendEmail = (transporter, mailOptions, log) =>
    new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                log(`[ERROR] Error sending email to ${mailOptions.to}: ❌`, error);
                return reject(error);
            }
            log(`[INFO] Email sent to ${mailOptions.to}: OK ✅`);
            resolve();
        });
    });

const startProcess = async (log, progress, data) => {
    try {
        const workbook = xlsx.readFile(data._data);
        const lengthOfPages = workbook.SheetNames.length;
        const composeEmail = JSON.parse(readFileSync(data.composeEmail, 'utf-8'));
        const pathCertificate = data.pathCertificate;
        let totalEmails = 0;
        let emailsSent = 0;

        for (let i = 0; i < lengthOfPages; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            const groupData = xlsx.utils.sheet_to_json(sheet);
            totalEmails += groupData.length;
        }

        for (let i = 0; i < lengthOfPages; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            const groupData = xlsx.utils.sheet_to_json(sheet);

            const emailPromises = groupData.map(async recipient => {
                const { NAMA: name, EMAIL: email, NRP: nrp } = recipient;

                const mailOptions = {
                    from: composeEmail.auth.username,
                    to: email,
                    subject: data.subject,
                    html: data.body.replace(/\[NAMA_PESERTA\]/g, name),
                    attachments: pathCertificate
                        ? [
                              {
                                  filename: `${name} Sertifikat Peserta PKKMB.pdf`,
                                  path: join(pathCertificate, `${nrp.toString().trim()}.pdf`)
                              }
                          ]
                        : []
                };

                log(`[INFO] Preparing to send email to: ${email}`);

                try {
                    await sendEmail(createTransporter(composeEmail.auth), mailOptions, log);
                    emailsSent++;
                    progress((emailsSent / totalEmails) * 100);
                } catch (error) {
                    log(`[ERROR] Failed to send email to: ${email}`);
                }
            });

            await Promise.all(emailPromises);
        }
    } catch (error) {
        log('[ERROR] Error in startProcess: ', error);
        throw error;
    }
};

module.exports = { startProcess };
