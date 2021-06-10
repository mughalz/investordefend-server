/**
 * This module provides an email functionality.
 *
 * @category Helpers
 *
 * @module EmailHelper
 */

import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import { join } from 'path';

import config from '../config';

const transporter: hbs.HbsTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const options: hbs.NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    layoutsDir: join(__dirname, '../templates'),
    extname: '.hbs',
    defaultLayout: 'false',
  },
  extName: '.hbs',
  viewPath: join(__dirname, '../templates/'),
};

transporter.use('compile', hbs(options));

/**
 * Send an email.
 *
 * @param to  The recipient's email address.
 * @param from  The sender's email address.
 * @param subject  The email subject.
 * @param template  The template to use for the email.
 * @param context  The email context.
 * @param attachments  An array of files to attach to the email.
 */
export default function sendMail({
  to,
  from = config.email.from,
  subject,
  template,
  context,
  attachments = [],
}: {
  to: string;
  from?: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
  attachments?: unknown[];
}): void {
  transporter.sendMail(
    {
      to,
      from,
      subject,
      template,
      context,
      attachments,
    },
    (error) => {
      if (error) console.error(error);
      else console.debug('Email sent successfully!');
    },
  );
}
