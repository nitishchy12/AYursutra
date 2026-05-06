const Patient = require('../models/Patient');

async function getPatientForUser(userId) {
  return Patient.findOne({ userId, deletedAt: null });
}

async function getOrCreatePatientForUser(user) {
  let patient = await getPatientForUser(user._id);
  if (patient) return patient;

  const prakriti = user.dosha === 'Tridosha' ? 'Tridoshic' : user.dosha;
  patient = await Patient.create({
    userId: user._id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    prakriti,
    prakritiScores: user.doshaScores,
  });

  return patient;
}

module.exports = { getPatientForUser, getOrCreatePatientForUser };
