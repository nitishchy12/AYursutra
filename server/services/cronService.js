const cron = require('node-cron');
const Therapy = require('../models/Therapy');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { sendNotification, notifyTherapySessionReminder } = require('./notificationService');

function appointmentStartDate(appointment) {
  const date = new Date(appointment.scheduledDate);
  const match = String(appointment.scheduledTime || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return date;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function sendAppointmentReminders(now) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60000);
  const appointments = await Appointment.find({
    status: { $in: ['pending', 'confirmed'] },
    scheduledDate: { $gte: dayStart, $lte: windowEnd },
  });

  for (const appointment of appointments) {
    const scheduled = appointmentStartDate(appointment);
    const minutesUntil = (scheduled - now) / 60000;

    if (minutesUntil <= 1440 && minutesUntil > 1430 && !appointment.reminderFlags.pre24h) {
      await notifyTherapySessionReminder({ userId: appointment.patient, appointment, reminderType: 'pre24h' });
      appointment.reminderFlags.pre24h = true;
    }

    if (minutesUntil <= 15 && minutesUntil > 0 && !appointment.reminderFlags.pre15m) {
      await notifyTherapySessionReminder({ userId: appointment.patient, appointment, reminderType: 'pre15m' });
      appointment.reminderFlags.pre15m = true;
    }

    await appointment.save();
  }
}

function startNotificationJobs() {
  cron.schedule('*/10 * * * *', async () => {
    const now = new Date();
    await sendAppointmentReminders(now);
    const therapies = await Therapy.find({ status: { $in: ['scheduled', 'completed'] } }).populate('patientId');
    for (const therapy of therapies) {
      const scheduled = new Date(therapy.scheduledDate);
      const patient = therapy.patientId;
      if (!patient) continue;
      const userId = patient.userId;
      const minutesUntil = (scheduled - now) / 60000;
      const minutesAfter = (now - scheduled) / 60000;
      const base = `${therapy.therapyType} on ${scheduled.toLocaleString()}`;
      if (minutesUntil <= 1440 && minutesUntil > 1430 && !therapy.notificationFlags.pre24h) {
        await sendNotification({ userId, therapyId: therapy._id, title: 'Pre-procedure care', message: `${base}: follow your preparation instructions and keep meals light.`, type: 'pre-care', channels: ['in-app', 'email'] });
        therapy.notificationFlags.pre24h = true;
      }
      if (minutesUntil <= 120 && minutesUntil > 110 && !therapy.notificationFlags.pre2h) {
        await sendNotification({ userId, therapyId: therapy._id, title: 'Therapy reminder', message: `${base}: your session starts soon.`, type: 'reminder', channels: ['in-app', 'email'] });
        therapy.notificationFlags.pre2h = true;
      }
      if (minutesAfter >= 60 && minutesAfter < 70 && !therapy.notificationFlags.post1h) {
        await sendNotification({ userId, therapyId: therapy._id, title: 'Post-procedure care', message: `${base}: rest, hydrate, and follow your post-care instructions.`, type: 'post-care', channels: ['in-app', 'email'] });
        therapy.notificationFlags.post1h = true;
      }
      if (minutesAfter >= 10080 && minutesAfter < 10090 && !therapy.notificationFlags.follow7d) {
        await sendNotification({ userId, therapyId: therapy._id, title: 'Follow-up feedback', message: `Please share how you are feeling after ${therapy.therapyType}.`, type: 'feedback', channels: ['in-app', 'email'] });
        therapy.notificationFlags.follow7d = true;
      }
      await therapy.save();
    }
  });
}

module.exports = { startNotificationJobs, sendAppointmentReminders, appointmentStartDate };
