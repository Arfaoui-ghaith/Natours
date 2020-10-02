const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.fullName = user.name;
    this.url = url;
    this.from = 'ghaith.arfaoui@myrepair.com.tn';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.Email_host,
      port: process.env.Email_port,
      auth: {
        user: process.env.Email_username,
        pass: process.env.Email_password,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        fullName: this.fullName,
        url: this.url,
        subject,
      }
    );
    // 2) Defineemail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: this.subject,
      text: htmlToText.fromString(html),
      html,
    };

    // 3) Create transport and send emails

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token valid for only 10 minutes'
    );
  }
};
