const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { configureExternalDns } = require('../config/mongoDns');

const EMAIL_RETRY_COOLDOWN_MS = 10 * 60 * 1000;
const SMS_RETRY_COOLDOWN_MS = 10 * 60 * 1000;
let emailDisabledUntil = 0;
let lastEmailWarning = '';
let smsDisabledUntil = 0;
let lastSmsWarning = '';

function emailConfig() {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS;
  if (process.env.EMAIL_ENABLED === 'false') return null;
  return user && pass ? { user, pass } : null;
}

function emailTransport() {
  const config = emailConfig();
  if (!config) return null;
  configureExternalDns('email notifications', 'EMAIL_DNS_SERVERS');
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: config,
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 5000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 5000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 8000),
    dnsTimeout: Number(process.env.EMAIL_DNS_TIMEOUT_MS || 5000),
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailInCooldown() {
  return Date.now() < emailDisabledUntil;
}

function rememberEmailFailure(error) {
  const message = error?.message || 'Unknown email error';
  emailDisabledUntil = Date.now() + EMAIL_RETRY_COOLDOWN_MS;
  if (message !== lastEmailWarning) {
    lastEmailWarning = message;
    console.warn(`Email notification failed: ${message}. Email delivery paused for 10 minutes; in-app notifications still work.`);
  }
}

function smsConfig() {
  const sid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE || process.env.TWILIO_FROM_PHONE;
  if (process.env.SMS_ENABLED === 'false') return null;
  return sid && token && phone ? { sid, token, phone } : null;
}

function smsInCooldown() {
  return Date.now() < smsDisabledUntil;
}

function rememberSmsFailure(error) {
  const message = error?.message || 'Unknown SMS error';
  smsDisabledUntil = Date.now() + SMS_RETRY_COOLDOWN_MS;
  if (message !== lastSmsWarning) {
    lastSmsWarning = message;
    console.warn(`SMS notification failed: ${message}. SMS delivery paused for 10 minutes; in-app notifications still work.`);
  }
}

async function sendNotification({ userId, therapyId = null, title, message, type = 'system', channels = ['in-app'] }) {
  const user = await User.findById(userId);
  if (!user) return null;
  const notification = await Notification.create({ userId, therapyId, title, message, type, channels });

  const transport = emailTransport();
  if (channels.includes('email') && transport && user.email && !emailInCooldown()) {
    const config = emailConfig();
    await transport.sendMail({
      from: config.user,
      to: user.email,
      subject: `AyurSutra: ${title}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><p>With care,<br/>AyurSutra</p></div>`,
    }).catch(rememberEmailFailure);
  }

  const sms = smsConfig();
  if (channels.includes('sms') && sms && user.phone && !smsInCooldown()) {
    const client = twilio(sms.sid, sms.token);
    await client.messages.create({ from: sms.phone, to: user.phone, body: `${title}: ${message}` }).catch(rememberSmsFailure);
  }
  return notification;
}

async function notifyAppointmentBooked({ userId, appointment }) {
  const date = new Date(appointment.scheduledDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return sendNotification({
    userId,
    title: 'Appointment booked',
    message: `${appointment.therapyType} at ${appointment.centerName || 'AyurSutra center'} is booked for ${date} at ${appointment.scheduledTime}.`,
    type: 'reminder',
    channels: ['in-app', 'email'],
  });
}

async function notifyAppointmentCancelled({ userId, appointment }) {
  return sendNotification({
    userId,
    title: 'Appointment cancelled',
    message: `${appointment.therapyType} at ${appointment.centerName || 'AyurSutra center'} has been cancelled.`,
    type: 'system',
    channels: ['in-app', 'email'],
  });
}

async function notifyTherapySessionReminder({ userId, appointment, reminderType }) {
  const when = reminderType === 'pre24h' ? 'tomorrow' : 'soon';
  const arrival = reminderType === 'pre15m' ? 'Please arrive 15 minutes early.' : 'Please arrive 15 minutes early and follow your pre-care instructions.';
  return sendNotification({
    userId,
    title: 'Therapy session reminder',
    message: `Your ${appointment.therapyType} therapy is scheduled ${when} at ${appointment.scheduledTime}. ${arrival}`,
    type: 'reminder',
    channels: ['in-app', 'sms'],
  });
}

module.exports = {
  sendNotification,
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyTherapySessionReminder,
};
