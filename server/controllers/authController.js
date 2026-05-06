exports.register = async (req, res) => {
  let { name, email, password, role = 'patient', phone = '', specialization = [] } = req.body;

  const validRoles = ['patient', 'practitioner', 'admin'];
  if (!validRoles.includes(role)) {
    role = 'patient';
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ success: false, message: 'An account with this email already exists', code: 409 });

  const user = await User.create({ name, email, password, role, phone, specialization });

  if (role === 'patient') await Patient.create({ userId: user._id, name, age: user.age, gender: user.gender });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefresh(user, refreshToken);

  res.cookie('refreshToken', refreshToken, cookieOptions()).status(201).json(authPayload(user, accessToken));
};